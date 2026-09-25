const postService = require("../services/postService");
const { streamLocalVideo } = require("../services/mediaService");

const createPost = async (req, res, next) => {
  try {
    const { caption, category, thumbnailData } = req.body;
    const file = req.file || (req.files && req.files.media && req.files.media[0]);
    const thumbnailFile = req.files && req.files.thumbnail && req.files.thumbnail[0];

    const post = await postService.createPost({
      userId: req.user._id,
      caption,
      category,
      file,
      thumbnailFile,
      thumbnailData
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post
    });
  } catch (error) {
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const { category, page, limit, includeSeen } = req.query;
    const userId = req.user ? req.user._id : null;

    const result = await postService.getFeed({
      userId,
      category,
      page,
      limit,
      includeSeen: includeSeen === "true"
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await postService.likePost({
      userId: req.user._id,
      postId: id
    });

    return res.status(200).json({
      success: true,
      message: "Post liked",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const commentPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const result = await postService.commentPost({
      userId: req.user._id,
      postId: id,
      text
    });

    return res.status(201).json({
      success: true,
      message: "Comment added",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await postService.getPostComments(id);

    return res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

const batchLogViews = async (req, res, next) => {
  try {
    const { postIds } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await postService.batchLogViews({
      userId,
      postIds
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const streamVideo = async (req, res, next) => {
  try {
    const { filename } = req.params;
    streamLocalVideo(req, res, filename);
  } catch (error) {
    next(error);
  }
};

const getMyPosts = async (req, res, next) => {
  try {
    const result = await postService.getUserPosts(req.user._id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const resetSeenReels = async (req, res, next) => {
  try {
    const result = await postService.resetSeenReels({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const result = await postService.deleteComment({
      userId: req.user._id,
      commentId
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    const result = await postService.globalSearch(q || "");
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await postService.getUserPosts(userId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  likePost,
  commentPost,
  deleteComment,
  getPostComments,
  batchLogViews,
  streamVideo,
  getMyPosts,
  resetSeenReels,
  globalSearch,
  getUserProfile
};
