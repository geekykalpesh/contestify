const Notification = require("../models/Notification");
const User = require("../models/User");
const Post = require("../models/Post");
const AppError = require("../middleware/errorHandler").AppError;

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("senderId", "name username avatarUrl email")
      .populate("postId", "caption thumbnailUrl mediaUrl mediaType")
      .lean();

    // Auto-seed realistic sample notifications if user has 0 notifications
    if (notifications.length === 0) {
      const otherUsers = await User.find({ _id: { $ne: userId } }).limit(4).lean();
      const samplePosts = await Post.find().limit(2).lean();

      if (otherUsers.length > 0) {
        const sampleSeedData = [
          {
            recipientId: userId,
            senderId: otherUsers[0]?._id,
            type: "LIKE",
            postId: samplePosts[0]?._id,
            message: "liked your video reel",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
          },
          {
            recipientId: userId,
            senderId: otherUsers[1]?._id || otherUsers[0]?._id,
            type: "COMMENT",
            postId: samplePosts[0]?._id,
            message: 'commented: "Incredible content brother! 🔥"',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
          },
          {
            recipientId: userId,
            senderId: otherUsers[2]?._id || otherUsers[0]?._id,
            type: "FOLLOW",
            message: "started following your profile",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
          },
          {
            recipientId: userId,
            senderId: otherUsers[3]?._id || otherUsers[0]?._id,
            type: "CONTEST_RANK",
            message: "🎉 Contest Alert: Your reel has entered Top 10 in Chhattisgarh Leaderboard!",
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 360) // 6 hours ago
          }
        ];

        await Notification.insertMany(sampleSeedData);

        notifications = await Notification.find({ recipientId: userId })
          .sort({ createdAt: -1 })
          .limit(30)
          .populate("senderId", "name username avatarUrl email")
          .populate("postId", "caption thumbnailUrl mediaUrl mediaType")
          .lean();
      }
    }

    const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, recipientId: userId }, { $set: { read: true } });
    } else {
      await Notification.updateMany({ recipientId: userId, read: false }, { $set: { read: true } });
    }

    const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });
    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  getUnreadCount
};
