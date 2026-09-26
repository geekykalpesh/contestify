const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { authenticateToken, optionalAuthenticateToken } = require("../middleware/authMiddleware");
const { uploadSingleMedia, uploadPostMedia, validateFileSize } = require("../middleware/uploadMiddleware");
const rateLimit = require("express-rate-limit");

// Anti-Spam: Max 5 posts per hour per IP
const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,
  message: { success: false, message: "Upload limit reached. Please wait an hour before posting again." }
});

// Anti-Spam: Max 20 comments per hour per IP
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20,
  message: { success: false, message: "Comment limit reached. Take a break!" }
});

router.get("/feed", optionalAuthenticateToken, postController.getFeed);
router.get("/search", postController.globalSearch);
router.get("/user/:userId", optionalAuthenticateToken, postController.getUserProfile);
router.get("/my-posts", authenticateToken, postController.getMyPosts);
router.post(
  "/",
  authenticateToken,
  postCreationLimiter,
  uploadPostMedia,
  validateFileSize,
  postController.createPost
);
router.post("/:id/like", authenticateToken, postController.likePost);
router.post("/:id/comment", authenticateToken, commentLimiter, postController.commentPost);
router.delete("/comments/:commentId", authenticateToken, postController.deleteComment);
router.get("/:id/comments", postController.getPostComments);
router.post("/batch-view", optionalAuthenticateToken, postController.batchLogViews);
router.post("/reset-seen", authenticateToken, postController.resetSeenReels);
router.get("/stream/:filename", postController.streamVideo);

module.exports = router;
