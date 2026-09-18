const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { authenticateToken, optionalAuthenticateToken } = require("../middleware/authMiddleware");
const { uploadSingleMedia, validateFileSize } = require("../middleware/uploadMiddleware");

router.get("/feed", optionalAuthenticateToken, postController.getFeed);
router.get("/my-posts", authenticateToken, postController.getMyPosts);
router.post(
  "/",
  authenticateToken,
  uploadSingleMedia,
  validateFileSize,
  postController.createPost
);
router.post("/:id/like", authenticateToken, postController.likePost);
router.post("/:id/comment", authenticateToken, postController.commentPost);
router.delete("/comments/:commentId", authenticateToken, postController.deleteComment);
router.get("/:id/comments", postController.getPostComments);
router.post("/batch-view", optionalAuthenticateToken, postController.batchLogViews);
router.post("/reset-seen", authenticateToken, postController.resetSeenReels);
router.get("/stream/:filename", postController.streamVideo);

module.exports = router;
