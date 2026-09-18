const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "internal-secret-token-creator-contest";

const getContestData = async (req, res, next) => {
  try {
    const authHeader = req.headers["x-internal-secret"];
    if (authHeader !== INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid internal secret key" });
    }

    // Fetch all users with residency and kycDetails
    const users = await User.find({}).select("name email residency kycDetails createdAt").lean();
    const userMap = new Map();
    users.forEach((u) => userMap.set(u._id.toString(), u));

    // Fetch all posts with populated user details
    const posts = await Post.find({})
      .sort({ createdAt: 1 })
      .populate("userId", "name email residency avatarUrl")
      .lean();

    const formattedPosts = posts.map((p) => {
      const user = p.userId || {};
      const score = Number((p.likeCount * 1.0 + p.commentCount * 3.0 + p.viewCount * 0.2).toFixed(2));
      return {
        id: p._id.toString(),
        userId: user._id ? user._id.toString() : p.userId.toString(),
        userName: user.name || "Unknown",
        userEmail: user.email || "unknown@contest.com",
        residency: user.residency || "Other",
        caption: p.caption,
        category: p.category,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        viewCount: p.viewCount,
        score,
        createdAt: p.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      count: formattedPosts.length,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        residency: u.residency,
        kycDetails: u.kycDetails || null,
        createdAt: u.createdAt
      })),
      posts: formattedPosts
    });
  } catch (error) {
    next(error);
  }
};

const updateUserKycStatus = async (req, res, next) => {
  try {
    const authHeader = req.headers["x-internal-secret"];
    if (authHeader !== INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid internal secret key" });
    }

    const { userId, status, reason } = req.body;
    const isObjId = mongoose.Types.ObjectId.isValid(userId);
    const user = await User.findOne({
      $or: [...(isObjId ? [{ _id: userId }] : []), { email: userId }]
    });

    if (user) {
      if (!user.kycDetails) user.kycDetails = {};
      user.kycDetails.status = status;
      if (reason) user.kycDetails.rejectionReason = reason;
      await user.save();
    }

    return res.status(200).json({ success: true, message: `User KYC updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContestData,
  updateUserKycStatus
};
