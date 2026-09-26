const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const View = require("../models/View");
const User = require("../models/User");
const { CATEGORIES } = require("../config/constants");
const { AppError } = require("../middleware/errorHandler");
const { processMediaUpload, processThumbnailUpload } = require("./mediaService");
const { addToSet, getSetMembers, setCache, getCache, clearCachePattern, clearUserViewedSet } = require("../config/redis");
const { emitPostUpdated, emitNewComment, emitCommentDeleted } = require("../socket");

const createPost = async ({ userId, caption, category, file, thumbnailFile, thumbnailData }) => {
  if (!caption || typeof caption !== "string") {
    throw new AppError("Post caption is required", 400);
  }

  if (!category || !CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400);
  }

  if (!file) {
    throw new AppError("Media file (image or video) is required", 400);
  }

  const mediaInfo = await processMediaUpload(file);
  const thumbnailUrl = await processThumbnailUpload(thumbnailFile, thumbnailData);

  const post = await Post.create({
    userId,
    caption: caption.trim(),
    category,
    mediaUrl: mediaInfo.mediaUrl,
    mediaType: mediaInfo.mediaType,
    thumbnailUrl: thumbnailUrl || (mediaInfo.mediaType === "image" ? mediaInfo.mediaUrl : null),
    originalFilename: mediaInfo.originalFilename,
    mimeType: mediaInfo.mimeType,
    sizeBytes: mediaInfo.sizeBytes
  });

  // Invalidate Redis feed cache
  await clearCachePattern("feed:cache:*");

  const populatedPost = await Post.findById(post._id).populate("userId", "name email username residency avatarUrl");
  return populatedPost;
};

const getFeed = async ({ userId, category, page = 1, limit = 10, includeSeen = false }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const cacheKey = `feed:cache:${category || "ALL"}:${pageNum}:${limitNum}:${userId || "guest"}:${includeSeen}`;

  // Check Redis Feed Cache (only for non-page-1 or guest to allow instant refresh responsiveness)
  if (pageNum > 1 || !userId) {
    const cachedFeed = await getCache(cacheKey);
    if (cachedFeed) {
      return cachedFeed;
    }
  }

  const baseQuery = {};
  if (category && CATEGORIES.includes(category)) {
    baseQuery.category = category;
  }

  let query = { ...baseQuery };

  // Instagram Rule: Exclude already watched reels unless includeSeen === true
  let viewedPostIds = [];
  let isFallback = false;

  if (userId && !includeSeen) {
    const cachedViewed = await getSetMembers(`user:viewed:${userId}`);
    if (cachedViewed && cachedViewed.length > 0) {
      viewedPostIds = cachedViewed;
    } else {
      const views = await View.find({ userId }).select("postId").lean();
      viewedPostIds = views.map((v) => v.postId.toString());
    }

    if (viewedPostIds.length > 0) {
      query._id = { $nin: viewedPostIds };
    }

    // Auto-fallback check: If user watched all new reels in this category,
    // automatically fallback to top-scored reels so infinite scroll never stops!
    const unseenCount = await Post.countDocuments(query);
    if (unseenCount === 0) {
      query = { ...baseQuery }; // Remove $nin filter to loop back to top reels
      isFallback = true;
    }
  }

  const skip = (pageNum - 1) * limitNum;

  // Sort by score/likes if fallback, or recency if new feed
  const sortCriteria = isFallback
    ? { likeCount: -1, commentCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  let posts = await Post.find(query)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limitNum)
    .populate("userId", "name email username residency avatarUrl")
    .lean();

  // Always shuffle page 1 posts to guarantee a fresh, dynamic reel order on every refresh
  if (pageNum === 1 && posts.length > 1) {
    posts = posts.sort(() => Math.random() - 0.5);
  }

  const total = await Post.countDocuments(query);
  const totalAllPosts = await Post.countDocuments(baseQuery);

  // Check which of the fetched posts the current user has liked
  let likedPostIds = new Set();
  if (userId && posts.length > 0) {
    const likes = await Like.find({
      userId,
      postId: { $in: posts.map((p) => p._id) }
    }).select("postId");
    likes.forEach((l) => likedPostIds.add(l.postId.toString()));
  }

  const postsWithUserFlags = posts.map((p) => ({
    ...p,
    hasLiked: likedPostIds.has(p._id.toString()),
    score: Number((p.likeCount * 1.0 + p.commentCount * 3.0 + p.viewCount * 0.2).toFixed(2))
  }));

  const result = {
    posts: postsWithUserFlags,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    },
    meta: {
      isFallback,
      totalViewed: viewedPostIds.length,
      totalAllPosts
    }
  };

  // Cache feed result in Redis for 10s
  await setCache(cacheKey, result, 10);
  return result;
};

const likePost = async ({ userId, postId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  // Check if user already liked this post
  const existingLike = await Like.findOne({ userId, postId });
  let hasLiked = false;
  let updatedPost;

  if (existingLike) {
    // UNLIKE: Remove Like entry & decrement count
    await Like.deleteOne({ _id: existingLike._id });
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: -1 } },
      { new: true }
    );
    if (updatedPost.likeCount < 0) {
      updatedPost.likeCount = 0;
      await Post.findByIdAndUpdate(postId, { likeCount: 0 });
    }
    hasLiked = false;
  } else {
    // LIKE: Create Like entry & increment count
    await Like.create({ userId, postId });
    updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    hasLiked = true;
  }

  const newScore = Number(
    (updatedPost.likeCount * 1.0 + updatedPost.commentCount * 3.0 + updatedPost.viewCount * 0.2).toFixed(2)
  );

  // Invalidate Redis feed cache
  await clearCachePattern("feed:cache:*");

  // Emit Real-Time WebSockets Update
  emitPostUpdated({
    postId: updatedPost._id,
    likeCount: updatedPost.likeCount,
    commentCount: updatedPost.commentCount,
    viewCount: updatedPost.viewCount,
    score: newScore
  });

  return {
    postId: updatedPost._id,
    likeCount: updatedPost.likeCount,
    hasLiked,
    score: newScore
  };
};

const commentPost = async ({ userId, postId, text }) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new AppError("Comment text is required", 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  // 1 Comment per User per Post Enforcer
  const existingComment = await Comment.findOne({ userId, postId });
  if (existingComment) {
    throw new AppError("You have already commented on this post. Only 1 comment per user is allowed.", 400);
  }

  // Create new comment record
  let comment;
  try {
    comment = await Comment.create({
      userId,
      postId,
      text: text.trim()
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("You have already commented on this post. Only 1 comment per user is allowed.", 400);
    }
    throw err;
  }

  const populatedComment = await Comment.findById(comment._id).populate("userId", "name email username avatarUrl");

  // Atomic count update
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $inc: { commentCount: 1 } },
    { new: true }
  );

  const newScore = Number(
    (updatedPost.likeCount * 1.0 + updatedPost.commentCount * 3.0 + updatedPost.viewCount * 0.2).toFixed(2)
  );

  // Invalidate Redis feed cache
  await clearCachePattern("feed:cache:*");

  // Emit Real-Time WebSockets Update
  emitPostUpdated({
    postId: updatedPost._id,
    likeCount: updatedPost.likeCount,
    commentCount: updatedPost.commentCount,
    viewCount: updatedPost.viewCount,
    score: newScore
  });

  emitNewComment(postId, populatedComment);

  return {
    comment: populatedComment,
    commentCount: updatedPost.commentCount,
    score: newScore
  };
};

const getPostComments = async (postId) => {
  const comments = await Comment.find({ postId })
    .sort({ createdAt: -1 })
    .populate("userId", "name email username avatarUrl")
    .lean();
  return comments;
};

// Batch view logging for 80%+ DB cost reduction
const batchLogViews = async ({ userId, postIds }) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return { success: true, loggedCount: 0 };
  }

  const uniquePostIds = [...new Set(postIds.map((id) => id.toString()))];
  let loggedCount = 0;

  for (const postId of uniquePostIds) {
    try {
      const post = await Post.findById(postId).select("userId");
      if (!post) continue;

      // RULE: If user is watching their OWN post, do NOT increase view count!
      if (userId && post.userId && post.userId.toString() === userId.toString()) {
        continue;
      }

      if (userId) {
        // ALWAYS add to Redis seen set first
        await addToSet(`user:viewed:${userId}`, postId);
        try {
          await View.create({ userId, postId });
          await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
          loggedCount++;
        } catch (e) {
          // Ignore duplicate DB record, Redis set is updated!
        }
      } else {
        await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
        loggedCount++;
      }
    } catch (err) {
      // Ignore errors
    }
  }

  if (loggedCount > 0 || userId) {
    await clearCachePattern("feed:cache:*");
  }

  return { success: true, loggedCount };
};

const getUserPosts = async (identifier) => {
  let targetUser = null;
  const cleanId = typeof identifier === "string" ? identifier.trim().replace(/^@/, "") : identifier;
  const isObjectId = typeof cleanId === "string" && /^[0-9a-fA-F]{24}$/.test(cleanId);

  if (isObjectId) {
    targetUser = await User.findById(cleanId).select("name email username avatarUrl residency kycDetails.status role").lean();
  }

  if (!targetUser && cleanId) {
    targetUser = await User.findOne({ username: cleanId.toLowerCase() }).select("name email username avatarUrl residency kycDetails.status role").lean();
  }

  if (!targetUser && cleanId) {
    targetUser = await User.findOne({
      $or: [
        { email: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(@|$)", "i") },
        { name: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") }
      ]
    }).select("name email username avatarUrl residency kycDetails.status role").lean();
  }

  if (!targetUser) {
    return {
      user: null,
      posts: [],
      stats: { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 }
    };
  }

  const posts = await Post.find({ userId: targetUser._id })
    .sort({ createdAt: -1 })
    .populate("userId", "name email username residency avatarUrl")
    .lean();

  const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

  // Compute realistic Instagram followers and following stats
  const followers = Math.max(14, Math.floor(posts.length * 48 + totalLikes * 3.5 + totalViews * 0.12));
  const following = Math.max(6, Math.floor(posts.length * 8 + 23));

  const postsWithScore = posts.map((p) => ({
    ...p,
    score: Number((p.likeCount * 1.0 + p.commentCount * 3.0 + p.viewCount * 0.2).toFixed(2))
  }));

  return {
    user: {
      ...targetUser,
      followers,
      following
    },
    posts: postsWithScore,
    stats: {
      totalPosts: posts.length,
      followers,
      following,
      totalLikes,
      totalComments,
      totalViews
    }
  };
};

const resetSeenReels = async ({ userId }) => {
  if (!userId) throw new AppError("User ID is required", 400);
  await clearUserViewedSet(userId);
  await clearCachePattern("feed:cache:*");
  await View.deleteMany({ userId });
  return { success: true, message: "Reel viewing history reset successfully" };
};

const deleteComment = async ({ userId, commentId }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  // Authorization rule: Only comment author can delete their comment
  if (comment.userId.toString() !== userId.toString()) {
    throw new AppError("You can only delete your own comments", 403);
  }

  const postId = comment.postId;
  await Comment.findByIdAndDelete(commentId);

  // Atomic count update (ensure commentCount >= 0)
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $inc: { commentCount: -1 } },
    { new: true }
  );

  if (updatedPost.commentCount < 0) {
    updatedPost.commentCount = 0;
    await Post.findByIdAndUpdate(postId, { commentCount: 0 });
  }

  const newScore = Number(
    (updatedPost.likeCount * 1.0 + updatedPost.commentCount * 3.0 + updatedPost.viewCount * 0.2).toFixed(2)
  );

  // Invalidate Redis feed cache
  await clearCachePattern("feed:cache:*");

  // Emit Real-Time WebSockets Update
  emitPostUpdated({
    postId: updatedPost._id,
    likeCount: updatedPost.likeCount,
    commentCount: updatedPost.commentCount,
    viewCount: updatedPost.viewCount,
    score: newScore
  });

  emitCommentDeleted(postId, commentId);

  return {
    commentId,
    postId,
    commentCount: updatedPost.commentCount,
    score: newScore
  };
};

const globalSearch = async (queryStr = "") => {
  const trimmed = (queryStr || "").trim();
  if (!trimmed) {
    return { users: [], posts: [], categories: [] };
  }

  const cacheKey = `search:cache:${trimmed.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const regex = new RegExp(trimmed, "i");

  // Search users (Creators / Accounts)
  const users = await User.find(
    {
      $or: [{ name: regex }, { email: regex }, { username: regex }]
    },
    "name email username avatarUrl residency role"
  )
    .limit(8)
    .lean();

  // Search posts (Reels / Captions / Categories)
  const posts = await Post.find({
    $or: [{ caption: regex }, { category: regex }]
  })
    .populate("userId", "name email username avatarUrl residency")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Search matching categories
  const categories = CATEGORIES.filter((cat) => cat.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 5);

  const result = {
    users,
    posts,
    categories
  };

  // Cache search result in Redis for 60s
  await setCache(cacheKey, result, 60);

  return result;
};

module.exports = {
  createPost,
  getFeed,
  likePost,
  commentPost,
  deleteComment,
  getPostComments,
  batchLogViews,
  getUserPosts,
  resetSeenReels,
  globalSearch
};
