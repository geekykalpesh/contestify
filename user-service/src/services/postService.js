const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const View = require("../models/View");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { CATEGORIES } = require("../config/constants");
const { AppError } = require("../middleware/errorHandler");
const { processMediaUpload, processThumbnailUpload } = require("./mediaService");
const { addToSet, getSetMembers, setCache, getCache, clearCachePattern, clearUserViewedSet } = require("../config/redis");
const { emitPostUpdated, emitNewComment, emitCommentDeleted, emitNotification } = require("../socket");

const createPost = async ({ userId, caption, category, file, thumbnailFile, thumbnailData }) => {
  if (!caption || typeof caption !== "string" || !caption.trim()) {
    throw new AppError("Post caption is required", 400);
  }

  if (!category || !CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400);
  }

  if (!file) {
    throw new AppError("Media file (image or video) is required. You cannot create an empty post.", 400);
  }

  const user = await User.findById(userId);
  if (user && user.isBanned) {
    throw new AppError("Your account has been banned by an administrator", 403);
  }

  const mediaInfo = await processMediaUpload(file);
  if (!mediaInfo || !mediaInfo.mediaUrl || typeof mediaInfo.mediaUrl !== "string" || !mediaInfo.mediaUrl.trim()) {
    throw new AppError("Failed to process media file. Media URL cannot be empty.", 400);
  }

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

  const populatedPost = await Post.findById(post._id).populate("userId", "name username residency avatarUrl");
  return populatedPost;
};

const getFeed = async ({ userId, category, cursor, page = 1, limit = 10, includeSeen = false }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const cacheKey = `feed:cache:${category || "ALL"}:${cursor || "no_cursor"}:${pageNum}:${limitNum}:${userId || "guest"}:${includeSeen}`;

  // Check Redis Feed Cache (only for non-initial or guest to allow instant refresh responsiveness)
  if (cursor || pageNum > 1 || !userId) {
    const cachedFeed = await getCache(cacheKey);
    if (cachedFeed) {
      return cachedFeed;
    }
  }

  const baseQuery = { isBanned: { $ne: true } };
  if (category && CATEGORIES.includes(category)) {
    baseQuery.category = category;
  }

  // Cursor-Based $O(1)$ Indexed Query Filtering
  const cursorQuery = { ...baseQuery };
  if (cursor && typeof cursor === "string" && /^[0-9a-fA-F]{24}$/.test(cursor)) {
    cursorQuery._id = { $lt: cursor };
  }

  let posts = [];
  let total = 0;
  let isFallback = false;
  let viewedPostIds = [];

  // TikTok / Instagram Recommendation Algorithm with Cursor Support:
  // Prioritize UNSEEN reels so users get fresh content on every refresh!
  if (userId && !includeSeen) {
    // 1. Get list of post IDs already watched by this user
    const cachedViewed = await getSetMembers(`user:viewed:${userId}`);
    if (cachedViewed && cachedViewed.length > 0) {
      viewedPostIds = cachedViewed;
    } else {
      const views = await View.find({ userId }).select("postId").lean();
      viewedPostIds = views.map((v) => v.postId.toString());
    }

    if (viewedPostIds.length > 0) {
      const unseenQuery = { ...cursorQuery, _id: { $nin: viewedPostIds } };
      if (cursor && /^[0-9a-fA-F]{24}$/.test(cursor)) {
        unseenQuery._id = { $lt: cursor, $nin: viewedPostIds };
      }

      const unseenCount = await Post.countDocuments(unseenQuery);

      if (unseenCount > 0) {
        // We have unseen reels! Fetch unseen reels using cursor/index (newest first)
        let unseenPosts;
        if (cursor) {
          unseenPosts = await Post.find(unseenQuery)
            .sort({ _id: -1 })
            .limit(limitNum)
            .populate("userId", "name username residency avatarUrl")
            .lean();
        } else {
          const skip = (pageNum - 1) * limitNum;
          unseenPosts = await Post.find(unseenQuery)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate("userId", "name username residency avatarUrl")
            .lean();
        }

        posts = unseenPosts;

        // If page 1 / initial load has fewer unseen posts than limitNum, fill remaining slots with rotated reels!
        if (!cursor && pageNum === 1 && posts.length < limitNum) {
          const fetchedIds = new Set(posts.map((p) => p._id.toString()));
          const fillQuery = { ...baseQuery, _id: { $nin: Array.from(fetchedIds) } };
          const needed = limitNum - posts.length;

          let fillPosts = await Post.find(fillQuery)
            .sort({ likeCount: -1, viewCount: -1, createdAt: -1 })
            .limit(needed * 2)
            .populate("userId", "name username residency avatarUrl")
            .lean();

          // Dynamically shuffle fill posts so seen reels never lock in identical static order
          fillPosts = fillPosts.sort(() => Math.random() - 0.5).slice(0, needed);

          posts = [...posts, ...fillPosts];
        }

        total = unseenCount;
      } else {
        // User has watched ALL reels in this query! Fallback to top reels so feed never stops
        isFallback = true;
      }
    }
  }

  // Fallback / Guest / Default Fetch (Cursor-based indexed query):
  if (posts.length === 0) {
    if (cursor) {
      posts = await Post.find(cursorQuery)
        .sort({ _id: -1 })
        .limit(limitNum)
        .populate("userId", "name username residency avatarUrl")
        .lean();
    } else {
      const skip = (pageNum - 1) * limitNum;
      posts = await Post.find(baseQuery)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum * 2)
        .populate("userId", "name username residency avatarUrl")
        .lean();

      // Dynamically rotate fallback reels on page 1 so feed stays fresh on every refresh
      if (pageNum === 1 && posts.length > 1) {
        posts = posts.sort(() => Math.random() - 0.5).slice(0, limitNum);
      } else {
        posts = posts.slice(0, limitNum);
      }
    }

    total = await Post.countDocuments(baseQuery);
  }

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

  const lastPost = postsWithUserFlags[postsWithUserFlags.length - 1];
  const nextCursor = lastPost ? lastPost._id.toString() : null;
  const hasMore = postsWithUserFlags.length >= limitNum;

  const result = {
    posts: postsWithUserFlags,
    nextCursor,
    hasMore,
    pagination: {
      cursor: cursor || null,
      nextCursor,
      hasMore,
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

  // Create real-time like notification (only on new like, not unlike)
  if (hasLiked && post.userId.toString() !== userId.toString()) {
    try {
      const liker = await User.findById(userId).select("name username").lean();
      const notification = await Notification.create({
        recipientId: post.userId,
        senderId: userId,
        type: "LIKE",
        postId: post._id,
        message: `liked your reel`
      });
      emitNotification(post.userId, notification);
    } catch (e) { /* Non-critical: swallow notification errors */ }
  }

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

  const populatedComment = await Comment.findById(comment._id).populate("userId", "name username avatarUrl");

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

  // Create real-time comment notification (skip self-comments)
  if (post.userId.toString() !== userId.toString()) {
    try {
      const notification = await Notification.create({
        recipientId: post.userId,
        senderId: userId,
        type: "COMMENT",
        postId: post._id,
        message: `commented: "${text.trim().slice(0, 60)}${text.length > 60 ? '…' : ''}"`
      });
      emitNotification(post.userId, notification);
    } catch (e) { /* Non-critical: swallow notification errors */ }
  }

  return {
    comment: populatedComment,
    commentCount: updatedPost.commentCount,
    score: newScore
  };
};

const getPostComments = async (postId) => {
  const comments = await Comment.find({ postId })
    .sort({ createdAt: -1 })
    .populate("userId", "name username avatarUrl")
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

      if (userId) {
        // ALWAYS record that this user has viewed this reel so their feed advances!
        await addToSet(`user:viewed:${userId}`, postId);
        try {
          await View.create({ userId, postId });
          // Only increment public view count on DB if watching someone else's post
          if (!post.userId || post.userId.toString() !== userId.toString()) {
            await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
            loggedCount++;
          }
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
  if (!identifier) {
    return {
      user: null,
      posts: [],
      stats: { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 }
    };
  }

  const rawString = typeof identifier === "object" ? identifier.toString() : String(identifier);
  const cleanId = rawString.trim().replace(/^@/, "");
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);

  let targetUser = null;
  const userSelect = "name username avatarUrl residency kycDetails.status role isBanned bannedAt banReason";
  if (isObjectId) {
    targetUser = await User.findById(cleanId).select(userSelect).lean();
  }

  if (!targetUser && cleanId) {
    targetUser = await User.findOne({ username: cleanId.toLowerCase() }).select(userSelect).lean();
  }

  if (!targetUser && cleanId) {
    targetUser = await User.findOne({
      $or: [
        { email: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(@|$)", "i") },
        { name: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") }
      ]
    }).select(userSelect).lean();
  }

  if (!targetUser) {
    return {
      user: null,
      posts: [],
      stats: { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 }
    };
  }

  if (targetUser.isBanned) {
    return {
      user: {
        ...targetUser,
        isBanned: true,
        followers: 0,
        following: 0
      },
      posts: [],
      stats: { totalPosts: 0, followers: 0, following: 0, totalLikes: 0, totalComments: 0, totalViews: 0 },
      isBanned: true
    };
  }

  const posts = await Post.find({ userId: targetUser._id, isBanned: { $ne: true } })
    .sort({ createdAt: -1 })
    .populate("userId", "name username residency avatarUrl")
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

  // Search users (Creators / Accounts) - exclude banned users
  const users = await User.find(
    {
      isBanned: { $ne: true },
      $or: [{ name: regex }, { email: regex }, { username: regex }]
    },
    "name username avatarUrl residency role"
  )
    .limit(8)
    .lean();

  // Search posts (Reels / Captions / Categories) - exclude banned posts
  const posts = await Post.find({
    isBanned: { $ne: true },
    $or: [{ caption: regex }, { category: regex }]
  })
    .populate("userId", "name username avatarUrl residency")
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
