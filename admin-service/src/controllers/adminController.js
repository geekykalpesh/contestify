const { PrismaClient } = require("@prisma/client");
const { fetchContestDataFromUserService } = require("../services/userServiceClient");
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

module.exports = {
  getRankings,
  getWinners,
  updateKycStatus
};
