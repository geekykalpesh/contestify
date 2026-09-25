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
    const users = await User.find({}).select("name email username residency kycDetails createdAt").lean();
    const userMap = new Map();
    users.forEach((u) => userMap.set(u._id.toString(), u));

    // Fetch all posts with populated user details
    const posts = await Post.find({})
      .sort({ createdAt: 1 })
      .populate("userId", "name email username residency avatarUrl")
      .lean();

    const formattedPosts = posts.map((p) => {
      const user = p.userId || {};
      const score = Number((p.likeCount * 1.0 + p.commentCount * 3.0 + p.viewCount * 0.2).toFixed(2));
      return {
        id: p._id.toString(),
        userId: user._id ? user._id.toString() : (p.userId ? p.userId.toString() : ""),
        userName: user.name || "Unknown",
        username: user.username || user.email?.split("@")[0] || (user.name ? user.name.toLowerCase().replace(/\s+/g, "_") : "unknown"),
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
        username: u.username || u.email?.split("@")[0] || (u.name ? u.name.toLowerCase().replace(/\s+/g, "_") : "unknown"),
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

/**
 * High-performance paginated & indexed user search endpoint for millions of records
 */
const getPaginatedUsers = async (req, res, next) => {
  try {
    const authHeader = req.headers["x-internal-secret"];
    if (authHeader !== INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid internal secret key" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, residency, kycStatus, role, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const query = {};

    // Search filter across name, email, username or Mongo ObjectId
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        query.$or = [{ _id: search.trim() }, { name: searchRegex }, { email: searchRegex }, { username: searchRegex }];
      } else {
        query.$or = [{ name: searchRegex }, { email: searchRegex }, { username: searchRegex }];
      }
    }

    // Residency filter
    if (residency && residency !== "ALL") {
      if (residency === "Chhattisgarh") {
        query.residency = "Chhattisgarh";
      } else if (residency === "NON_CG" || residency === "Other") {
        query.residency = { $ne: "Chhattisgarh" };
      }
    }

    // KYC status filter
    if (kycStatus && kycStatus !== "ALL") {
      query["kycDetails.status"] = kycStatus;
    }

    // Role filter
    if (role && role !== "ALL") {
      query.role = role;
    }

    const sortOptions = {};
    const orderNum = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") sortOptions.name = orderNum;
    else if (sortBy === "email") sortOptions.email = orderNum;
    else if (sortBy === "residency") sortOptions.residency = orderNum;
    else if (sortBy === "kycStatus") sortOptions["kycDetails.status"] = orderNum;
    else sortOptions.createdAt = orderNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select("name email username residency avatarUrl role kycDetails dob createdAt")
        .lean(),
      User.countDocuments(query)
    ]);

    // Fetch user engagement aggregates for these paginated users in batch
    const userIds = users.map((u) => u._id);
    const postAggregates = await Post.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: "$commentCount" },
          totalViews: { $sum: "$viewCount" },
          maxScore: {
            $max: {
              $add: [
                { $multiply: ["$likeCount", 1] },
                { $multiply: ["$commentCount", 3] },
                { $multiply: ["$viewCount", 0.2] }
              ]
            }
          }
        }
      }
    ]);

    const postStatsMap = new Map();
    postAggregates.forEach((stat) => {
      postStatsMap.set(stat._id.toString(), stat);
    });

    const enrichedUsers = users.map((u) => {
      const stats = postStatsMap.get(u._id.toString()) || {};
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        username: u.username || "",
        residency: u.residency || "Other",
        avatarUrl: u.avatarUrl || "",
        role: u.role || "user",
        kycDetails: u.kycDetails || null,
        createdAt: u.createdAt,
        totalPosts: stats.totalPosts || 0,
        totalLikes: stats.totalLikes || 0,
        totalComments: stats.totalComments || 0,
        totalViews: stats.totalViews || 0,
        maxScore: stats.maxScore ? Number(stats.maxScore.toFixed(2)) : 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * System-wide user statistics aggregation endpoint
 */
const getUserStats = async (req, res, next) => {
  try {
    const authHeader = req.headers["x-internal-secret"];
    if (authHeader !== INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid internal secret key" });
    }

    const [userFacets, totalPosts] = await Promise.all([
      User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: "count" }],
            totalCgEligible: [{ $match: { residency: "Chhattisgarh" } }, { $count: "count" }],
            totalOutsideCg: [{ $match: { residency: { $ne: "Chhattisgarh" } } }, { $count: "count" }],
            kycPending: [{ $match: { "kycDetails.status": "PENDING" } }, { $count: "count" }],
            kycPassed: [{ $match: { "kycDetails.status": "PASSED" } }, { $count: "count" }],
            kycFailed: [{ $match: { "kycDetails.status": "FAILED" } }, { $count: "count" }],
            kycNotSubmitted: [{ $match: { $or: [{ "kycDetails.status": "NOT_SUBMITTED" }, { kycDetails: { $exists: false } }] } }, { $count: "count" }]
          }
        }
      ]),
      Post.countDocuments({})
    ]);

    const facets = userFacets[0] || {};
    const totalUsers = facets.totalUsers[0]?.count || 0;
    const totalCgEligible = facets.totalCgEligible[0]?.count || 0;
    const totalOutsideCg = facets.totalOutsideCg[0]?.count || 0;
    const kycPending = facets.kycPending[0]?.count || 0;
    const kycPassed = facets.kycPassed[0]?.count || 0;
    const kycFailed = facets.kycFailed[0]?.count || 0;
    const kycNotSubmitted = facets.kycNotSubmitted[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCgEligible,
        totalOutsideCg,
        kycPending,
        kycPassed,
        kycFailed,
        kycNotSubmitted,
        totalPosts
      }
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

const bulkUpdateUserKyc = async (req, res, next) => {
  try {
    const authHeader = req.headers["x-internal-secret"];
    if (authHeader !== INTERNAL_SECRET) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid internal secret key" });
    }

    const { userIds = [], status, reason } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "No userIds provided for bulk update" });
    }

    const validObjectIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    await User.updateMany(
      {
        $or: [
          ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
          { email: { $in: userIds } }
        ]
      },
      {
        $set: {
          "kycDetails.status": status,
          "kycDetails.rejectionReason": reason || `Bulk KYC set to ${status}`
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully bulk updated ${userIds.length} users KYC to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContestData,
  getPaginatedUsers,
  getUserStats,
  updateUserKycStatus,
  bulkUpdateUserKyc
};
