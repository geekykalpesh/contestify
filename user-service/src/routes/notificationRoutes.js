const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, notificationController.getNotifications);
router.post("/mark-read", authenticateToken, notificationController.markRead);
router.get("/unread-count", authenticateToken, notificationController.getUnreadCount);
router.delete("/clear-all", authenticateToken, notificationController.clearAllNotifications);
router.delete("/:notificationId", authenticateToken, notificationController.deleteNotification);

module.exports = router;
