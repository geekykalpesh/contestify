const { PrismaClient } = require("@prisma/client");
const {
  fetchContestDataFromUserService,
  fetchPaginatedUsersFromUserService,
  fetchUserStatsFromUserService,
  bulkUpdateUsersKycInUserService
} = require("../services/userServiceClient");
const { calculateContestRankings } = require("../services/rankingEngine");

// Instantiates Prisma client gracefully
let prisma;
try {
  prisma = new PrismaClient();
} catch (err) {
  console.warn("[Admin Service] Prisma initialization warning:", err.message);
}

const syncUserKycToUserService = async (userId, status, reason) => {
  try {
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "internal-secret-token-creator-contest";
    await fetch(`${USER_SERVICE_URL}/api/internal/user-kyc-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET
      },
      body: JSON.stringify({ userId, status, reason })
    });
  } catch (e) {
    console.warn("[Admin Service] Sync user KYC notice:", e.message);
  }
};

const getRankings = async (req, res, next) => {
  try {
    const contestData = await fetchContestDataFromUserService();

    let disqualifiedUserIds = [];
    (contestData.users || []).forEach((u) => {
      if (u.kycDetails?.status === "FAILED") {
        if (u.id) disqualifiedUserIds.push(u.id);
        if (u.email) disqualifiedUserIds.push(u.email);
      }
    });

    if (prisma) {
      try {
        const failedWinners = await prisma.winner.findMany({
          where: { kycStatus: "FAILED" },
          select: { userId: true, userEmail: true }
        });
        failedWinners.forEach((w) => {
          if (w.userId) disqualifiedUserIds.push(w.userId);
          if (w.userEmail) disqualifiedUserIds.push(w.userEmail);
        });
      } catch (e) {}
    }

    const calculated = calculateContestRankings(contestData, disqualifiedUserIds);
    return res.status(200).json({
      success: true,
      data: {
        summary: calculated.summary,
        rankings: calculated.rankings
      }
    });
  } catch (error) {
    next(error);
  }
};

const getWinners = async (req, res, next) => {
  try {
    const contestData = await fetchContestDataFromUserService();

    let disqualifiedUserIds = [];
    let storedWinnersMap = new Map();

    // Collect failed KYC users from user-service MongoDB
    (contestData.users || []).forEach((u) => {
      if (u.kycDetails?.status === "FAILED") {
        if (u.id) disqualifiedUserIds.push(u.id);
        if (u.email) disqualifiedUserIds.push(u.email);
      }
    });

    // Collect failed KYC users from Postgres DB
    if (prisma) {
      try {
        const dbWinners = await prisma.winner.findMany({
          include: { auditLogs: true },
          orderBy: { priorityIndex: "asc" }
        });

        dbWinners.forEach((w) => {
          if (w.userId) storedWinnersMap.set(w.userId, w);
          if (w.userEmail) storedWinnersMap.set(w.userEmail, w);
          if (w.kycStatus === "FAILED") {
            if (w.userId) disqualifiedUserIds.push(w.userId);
            if (w.userEmail) disqualifiedUserIds.push(w.userEmail);
          }
        });
      } catch (e) {}
    }

    const calculated = calculateContestRankings(contestData, disqualifiedUserIds);

    const userMap = new Map();
    (contestData.users || []).forEach((u) => userMap.set(u.id, u));

    const mergedWinners = calculated.winners.map((w) => {
      const stored = storedWinnersMap.get(w.userId) || storedWinnersMap.get(w.userEmail);
      const userObj = userMap.get(w.userId) || {};
      const userKyc = userObj.kycDetails || {};

      let effectiveStatus = "PENDING";
      if (stored) {
        effectiveStatus = stored.kycStatus;
      } else if (userKyc.status && userKyc.status !== "NOT_SUBMITTED") {
        effectiveStatus = userKyc.status;
      }

      return {
        ...w,
        id: stored ? stored.id : `temp-${w.priorityIndex}`,
        kycStatus: effectiveStatus,
        kycDetails: userKyc,
        disqualifiedReason: stored ? stored.disqualifiedReason : (userKyc.rejectionReason || null),
        auditLogs: stored ? stored.auditLogs : []
      };
    });

    const enrichedParticipants = calculated.allParticipants.map((p) => {
      const userObj = userMap.get(p.userId) || {};
      const stored = storedWinnersMap.get(p.userId) || storedWinnersMap.get(p.userEmail);
      return {
        ...p,
        kycStatus: stored ? stored.kycStatus : (userObj.kycDetails?.status || "NOT_SUBMITTED"),
        kycDetails: userObj.kycDetails || null
      };
    });

    let kycAuditLogs = [];
    if (prisma) {
      try {
        kycAuditLogs = await prisma.kycAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 50
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: calculated.summary,
        winners: mergedWinners,
        weeklyActivity: calculated.weeklyActivity,
        allParticipants: enrichedParticipants,
        kycAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Server-side paginated & indexed participants directory for millions of users
 */
const getParticipantsPaginated = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, residency, kycStatus, role, sortBy, sortOrder } = req.query;

    const data = await fetchPaginatedUsersFromUserService({
      page,
      limit,
      search,
      residency,
      kycStatus,
      role,
      sortBy,
      sortOrder
    });

    let storedWinnersMap = new Map();
    if (prisma) {
      try {
        const dbWinners = await prisma.winner.findMany({});
        dbWinners.forEach((w) => {
          if (w.userId) storedWinnersMap.set(w.userId, w);
          if (w.userEmail) storedWinnersMap.set(w.userEmail, w);
        });
      } catch (e) {}
    }

    const enrichedUsers = data.users.map((u) => {
      const stored = storedWinnersMap.get(u.id) || storedWinnersMap.get(u.email);
      const isCG = u.residency === "Chhattisgarh";
      const status = stored ? stored.kycStatus : (u.kycDetails?.status || "NOT_SUBMITTED");

      return {
        ...u,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        isEligible: isCG && status !== "FAILED",
        isDisqualified: status === "FAILED",
        kycStatus: status,
        prizeTier: stored ? stored.tier : null
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: data.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aggregated analytics stats for millions of users
 */
const getAdminStats = async (req, res, next) => {
  try {
    const stats = await fetchUserStatsFromUserService();

    let prizesAllocated = 0;
    let disqualifiedCount = stats.kycFailed || 0;

    if (prisma) {
      try {
        prizesAllocated = await prisma.winner.count({
          where: { userId: { not: "UNAWARDED" } }
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        prizesAllocated,
        disqualifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateKycStatus = async (req, res, next) => {
  try {
    const { winnerId } = req.params;
    const { status, notes } = req.body;

    if (!["PENDING", "PASSED", "FAILED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid KYC status. Must be PENDING, PASSED, or FAILED" });
    }

    const contestData = await fetchContestDataFromUserService();

    // 1. Sync to user-service MongoDB model
    await syncUserKycToUserService(winnerId, status, notes);

    // 2. Fetch disqualified list from MongoDB and Postgres
    let disqualifiedUserIds = [];
    (contestData.users || []).forEach((u) => {
      if (u.kycDetails?.status === "FAILED") {
        if (u.id) disqualifiedUserIds.push(u.id);
        if (u.email) disqualifiedUserIds.push(u.email);
      }
    });

    if (prisma) {
      try {
        const failedWinners = await prisma.winner.findMany({
          where: { kycStatus: "FAILED" }
        });
        failedWinners.forEach((w) => {
          if (w.userId) disqualifiedUserIds.push(w.userId);
          if (w.userEmail) disqualifiedUserIds.push(w.userEmail);
        });
      } catch (e) {}
    }

    const targetUser = (contestData.users || []).find((u) => u.id === winnerId || u.email === winnerId || u.id === winnerId?.toString());

    if (status === "FAILED") {
      disqualifiedUserIds.push(winnerId);
      if (targetUser) {
        disqualifiedUserIds.push(targetUser.id);
        disqualifiedUserIds.push(targetUser.email);
      }
    }
    if (status === "PASSED") {
      const targetId = targetUser ? targetUser.id : winnerId;
      const targetEmail = targetUser ? targetUser.email : winnerId;
      disqualifiedUserIds = disqualifiedUserIds.filter((id) => id !== winnerId && id !== targetId && id !== targetEmail);
    }

    // Re-calculate cascade rankings with newly disqualified / updated user
    const recalculated = calculateContestRankings(contestData, disqualifiedUserIds);
    const targetWinner = recalculated.winners.find((w) => w.userId === winnerId || w.userEmail === winnerId);

    // 3. Persist / Upsert in Postgres via Prisma
    let dbUpdatedWinner = null;
    if (prisma) {
      try {
        const existing = await prisma.winner.findFirst({
          where: { OR: [{ id: winnerId }, { userId: winnerId }, { userEmail: winnerId }] }
        });

        const userIdVal = targetUser ? targetUser.id : (targetWinner ? targetWinner.userId : winnerId);
        const emailVal = targetUser ? targetUser.email : (targetWinner ? targetWinner.userEmail : winnerId);
        const nameVal = targetUser ? targetUser.name : (targetWinner ? targetWinner.userName : "User");
        const tierVal = targetWinner ? targetWinner.tier : "DISQUALIFIED";
        const priorityVal = targetWinner ? targetWinner.priorityIndex : 99;
        const scoreVal = targetWinner ? targetWinner.score : 0;

        if (existing) {
          dbUpdatedWinner = await prisma.winner.update({
            where: { id: existing.id },
            data: {
              kycStatus: status,
              disqualifiedReason: status === "FAILED" ? (notes || "KYC verification failed") : null
            }
          });

          await prisma.kycAuditLog.create({
            data: {
              winnerId: existing.id,
              userId: existing.userId,
              userEmail: existing.userEmail,
              previousStatus: existing.kycStatus,
              newStatus: status,
              notes: notes || `KYC status changed to ${status}`
            }
          });
        } else {
          dbUpdatedWinner = await prisma.winner.create({
            data: {
              userId: userIdVal,
              userName: nameVal,
              userEmail: emailVal,
              tier: tierVal,
              priorityIndex: priorityVal,
              score: scoreVal,
              kycStatus: status,
              disqualifiedReason: status === "FAILED" ? (notes || "KYC verification failed") : null
            }
          });

          await prisma.kycAuditLog.create({
            data: {
              winnerId: dbUpdatedWinner.id,
              userId: userIdVal,
              userEmail: emailVal,
              previousStatus: "PENDING",
              newStatus: status,
              notes: notes || `KYC status changed to ${status}`
            }
          });
        }
      } catch (err) {
        console.warn("[Admin Service] Prisma persist notice:", err.message);
      }
    }

    let kycAuditLogs = [];
    if (prisma) {
      try {
        kycAuditLogs = await prisma.kycAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 50
        });
      } catch (e) {}
    }

    const userMap = new Map();
    (contestData.users || []).forEach((u) => userMap.set(u.id, u));

    let storedWinnersMap = new Map();
    if (prisma) {
      try {
        const allDb = await prisma.winner.findMany();
        allDb.forEach((w) => {
          if (w.userId) storedWinnersMap.set(w.userId, w);
          if (w.userEmail) storedWinnersMap.set(w.userEmail, w);
        });
      } catch (e) {}
    }

    const mergedRecalculatedWinners = recalculated.winners.map((w) => {
      const stored = storedWinnersMap.get(w.userId) || storedWinnersMap.get(w.userEmail);
      const userObj = userMap.get(w.userId) || {};
      const userKyc = userObj.kycDetails || {};

      let effectiveStatus = "PENDING";
      if (stored) {
        effectiveStatus = stored.kycStatus;
      } else if (userKyc.status && userKyc.status !== "NOT_SUBMITTED") {
        effectiveStatus = userKyc.status;
      }

      return {
        ...w,
        id: stored ? stored.id : `temp-${w.priorityIndex}`,
        kycStatus: effectiveStatus,
        kycDetails: userKyc,
        disqualifiedReason: stored ? stored.disqualifiedReason : null
      };
    });

    const enrichedParticipants = recalculated.allParticipants.map((p) => {
      const userObj = userMap.get(p.userId) || {};
      const stored = storedWinnersMap.get(p.userId) || storedWinnersMap.get(p.userEmail);
      return {
        ...p,
        kycStatus: stored ? stored.kycStatus : (userObj.kycDetails?.status || "NOT_SUBMITTED"),
        kycDetails: userObj.kycDetails || null
      };
    });

    return res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}. Cascade recalculated successfully.`,
      data: {
        targetWinnerId: winnerId,
        updatedStatus: status,
        updatedWinner: dbUpdatedWinner,
        recalculatedSummary: recalculated.summary,
        recalculatedWinners: mergedRecalculatedWinners,
        weeklyActivity: recalculated.weeklyActivity,
        allParticipants: enrichedParticipants,
        kycAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk KYC Update across multiple user IDs
 */
const bulkUpdateKycStatus = async (req, res, next) => {
  try {
    const { userIds = [], status, notes } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "No userIds provided" });
    }
    if (!["PENDING", "PASSED", "FAILED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be PENDING, PASSED, or FAILED" });
    }

    // 1. Sync bulk to MongoDB
    await bulkUpdateUsersKycInUserService(userIds, status, notes || `Bulk KYC update to ${status}`);

    // 2. Persist in Postgres Prisma
    if (prisma) {
      try {
        for (const uid of userIds) {
          const existing = await prisma.winner.findFirst({
            where: { OR: [{ id: uid }, { userId: uid }, { userEmail: uid }] }
          });
          if (existing) {
            await prisma.winner.update({
              where: { id: existing.id },
              data: {
                kycStatus: status,
                disqualifiedReason: status === "FAILED" ? (notes || "Bulk KYC rejected") : null
              }
            });
            await prisma.kycAuditLog.create({
              data: {
                winnerId: existing.id,
                userId: existing.userId,
                userEmail: existing.userEmail,
                previousStatus: existing.kycStatus,
                newStatus: status,
                notes: notes || `Bulk KYC action: ${status}`
              }
            });
          }
        }
      } catch (e) {
        console.warn("[Admin Service] Bulk Prisma update notice:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk KYC action completed for ${userIds.length} users.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CSV Export endpoint for downloading filtered participants
 */
const exportParticipantsCsv = async (req, res, next) => {
  try {
    const contestData = await fetchContestDataFromUserService();
    const users = contestData.users || [];
    const posts = contestData.posts || [];

    const headers = ["User ID", "Name", "Email", "Residency", "KYC Status", "Total Posts", "Total Likes", "Total Comments", "Total Views", "Max Score"];
    const rows = users.map((u) => {
      const userPosts = posts.filter((p) => p.userId === u.id);
      const totalLikes = userPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
      const totalComments = userPosts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
      const totalViews = userPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const maxScore = userPosts.length > 0 ? Math.max(...userPosts.map((p) => p.score)) : 0;

      return [
        `"${u.id}"`,
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.residency || "Other"}"`,
        `"${u.kycDetails?.status || "NOT_SUBMITTED"}"`,
        userPosts.length,
        totalLikes,
        totalComments,
        totalViews,
        maxScore.toFixed(2)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=contestify_participants_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRankings,
  getWinners,
  getParticipantsPaginated,
  getAdminStats,
  updateKycStatus,
  bulkUpdateKycStatus,
  exportParticipantsCsv
};
