const { CATEGORIES } = require("../config/constants");

/**
 * Calculates single post score according to the formula:
 * Score = (Likes × 1) + (Comments × 3) + (Views × 0.2)
 * All inputs coerced to safe integers before arithmetic.
 */
const calculatePostScore = (likes = 0, comments = 0, views = 0) => {
  const l = Math.max(0, parseInt(likes, 10) || 0);
  const c = Math.max(0, parseInt(comments, 10) || 0);
  const v = Math.max(0, parseInt(views, 10) || 0);
  return Number((l * 1.0 + c * 3.0 + v * 0.2).toFixed(2));
};

/**
 * Safe max over an array — uses reduce() to avoid stack overflow
 * that occurs with Math.max(...largeArray) on millions of elements.
 */
const safeMax = (arr, getter) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((best, item) => {
    const val = getter(item);
    return val > best ? val : best;
  }, -Infinity);
};

/**
 * Safe min over an array — uses reduce() for the same reason.
 */
const safeMin = (arr, getter) => {
  if (!arr || arr.length === 0) return Infinity;
  return arr.reduce((best, item) => {
    const val = getter(item);
    return val < best ? val : best;
  }, Infinity);
};

/**
 * Sort function implementing the strict tie-breaker order:
 * Score (desc) → Comments (desc) → Views (desc) → Earliest Timestamp (asc)
 */
const comparePosts = (a, b) => {
  const scoreDiff = (b.score || 0) - (a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const commentDiff = (b.commentCount || 0) - (a.commentCount || 0);
  if (commentDiff !== 0) return commentDiff;

  const viewDiff = (b.viewCount || 0) - (a.viewCount || 0);
  if (viewDiff !== 0) return viewDiff;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

/**
 * Group posts into 4 contest weeks based on post timestamps.
 * Uses reduce() to find minTime — safe for millions of posts.
 */
const groupPostsByWeek = (posts) => {
  if (!posts || posts.length === 0) return {};

  // Safe minimum via reduce (no spread = no stack overflow for millions)
  const minTime = posts.reduce((min, p) => {
    const t = new Date(p.createdAt).getTime();
    return t < min ? t : min;
  }, Infinity);

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const userWeekMap = {};

  posts.forEach((post) => {
    const postTime = new Date(post.createdAt).getTime();
    // Clamp week index 0-3
    const weekIndex = Math.min(3, Math.max(0, Math.floor((postTime - minTime) / WEEK_MS)));

    const userId = post.userId;
    if (!userWeekMap[userId]) {
      userWeekMap[userId] = { 0: [], 1: [], 2: [], 3: [] };
    }
    userWeekMap[userId][weekIndex].push(post);
  });

  return userWeekMap;
};

/**
 * Main Ranking & 33-Prize Priority Allocation Cascade Engine.
 *
 * Accuracy guarantees:
 * - All numeric fields coerced to integers with Math.max(0, parseInt(...))
 * - safeMax/safeMin used everywhere (no spread on large arrays)
 * - O(n) lookups via Maps instead of O(n²) Array.find() loops
 * - Floating-point accumulated scores rounded ONCE at the end, not per-addition
 * - Disqualification set uses normalized lowercase strings for reliable matching
 */
const calculateContestRankings = (contestData, disqualifiedUserIds = []) => {
  const { users = [], posts = [] } = contestData || {};

  // Normalize disqualification set to lowercase strings for reliable matching
  const disqSet = new Set(
    disqualifiedUserIds
      .filter(Boolean)
      .map((id) => id.toString().trim().toLowerCase())
  );

  // ── Pre-build O(1) lookup Maps ──────────────────────────────────────────
  const userById = new Map();
  users.forEach((u) => {
    if (u.id) userById.set(u.id.toString(), u);
  });

  // ── Step 1: Filter eligible users ───────────────────────────────────────
  const eligibleUserIds = new Set();
  users.forEach((u) => {
    const uid   = (u.id    || "").toString().trim().toLowerCase();
    const email = (u.email || "").toString().trim().toLowerCase();
    const isDisq = (uid && disqSet.has(uid)) || (email && disqSet.has(email));
    if (u.residency === "Chhattisgarh" && !isDisq) {
      eligibleUserIds.add(u.id);
    }
  });

  // Ensure scores are recalculated from raw counts (source of truth)
  const eligiblePosts = posts
    .filter((p) => eligibleUserIds.has(p.userId))
    .map((p) => ({
      ...p,
      likeCount:    Math.max(0, parseInt(p.likeCount, 10)    || 0),
      commentCount: Math.max(0, parseInt(p.commentCount, 10) || 0),
      viewCount:    Math.max(0, parseInt(p.viewCount, 10)    || 0),
      score: calculatePostScore(p.likeCount, p.commentCount, p.viewCount)
    }));

  // ── Step 2: Global ranking — best post per creator ──────────────────────
  const userBestPostMap = new Map();

  eligiblePosts.forEach((post) => {
    const userId  = post.userId;
    const userObj = userById.get(userId) || {};
    const enrichedPost = {
      ...post,
      username: post.username
        || userObj.username
        || userObj.email?.split("@")[0]
        || post.userEmail?.split("@")[0]
        || (post.userName || "").toLowerCase().replace(/\s+/g, "_")
    };

    const current = userBestPostMap.get(userId);
    if (!current || comparePosts(enrichedPost, current) < 0) {
      userBestPostMap.set(userId, enrichedPost);
    }
  });

  const globalRankings = Array.from(userBestPostMap.values()).sort(comparePosts);

  // ── Step 3: Per-category rankings ───────────────────────────────────────
  const categoryRankings = {};

  CATEGORIES.forEach((cat) => {
    const catBestMap = new Map();

    eligiblePosts
      .filter((p) => p.category === cat)
      .forEach((post) => {
        const userId  = post.userId;
        const userObj = userById.get(userId) || {};
        const enrichedPost = {
          ...post,
          username: post.username
            || userObj.username
            || userObj.email?.split("@")[0]
            || post.userEmail?.split("@")[0]
            || (post.userName || "").toLowerCase().replace(/\s+/g, "_")
        };

        const current = catBestMap.get(userId);
        if (!current || comparePosts(enrichedPost, current) < 0) {
          catBestMap.set(userId, enrichedPost);
        }
      });

    categoryRankings[cat] = Array.from(catBestMap.values()).sort(comparePosts);
  });

  // ── Step 4: Consistency rankings ────────────────────────────────────────
  const userWeekMap = groupPostsByWeek(eligiblePosts);
  const consistencyRankings = [];

  Object.keys(userWeekMap).forEach((userId) => {
    const weeks = userWeekMap[userId];
    const hasConsistency =
      weeks[0].length >= 3 &&
      weeks[1].length >= 3 &&
      weeks[2].length >= 3 &&
      weeks[3].length >= 3;

    if (!hasConsistency) return;

    // Accumulate raw integer parts separately → round once at end
    // This avoids compounding floating-point rounding errors across 12 posts
    let totalLikesPart    = 0;
    let totalCommentsPart = 0;
    let totalViewsPart    = 0;
    let totalComments     = 0;
    let totalViews        = 0;
    let earliestPostTime  = Infinity;

    for (let w = 0; w < 4; w++) {
      const top3 = [...weeks[w]].sort(comparePosts).slice(0, 3);
      top3.forEach((p) => {
        totalLikesPart    += Math.max(0, parseInt(p.likeCount, 10)    || 0);
        totalCommentsPart += Math.max(0, parseInt(p.commentCount, 10) || 0);
        totalViewsPart    += Math.max(0, parseInt(p.viewCount, 10)    || 0);
        totalComments     += Math.max(0, parseInt(p.commentCount, 10) || 0);
        totalViews        += Math.max(0, parseInt(p.viewCount, 10)    || 0);
        const t = new Date(p.createdAt).getTime();
        if (t < earliestPostTime) earliestPostTime = t;
      });
    }

    // Single final rounding — not accumulated via p.score which may carry rounding error
    const totalConsistencyScore = Number(
      (totalLikesPart * 1.0 + totalCommentsPart * 3.0 + totalViewsPart * 0.2).toFixed(2)
    );

    const sampleUser = userById.get(userId) || {};
    const username =
      sampleUser.username ||
      sampleUser.email?.split("@")[0] ||
      (sampleUser.name ? sampleUser.name.toLowerCase().replace(/\s+/g, "_") : "unknown");

    consistencyRankings.push({
      userId,
      userName:  sampleUser.name  || "Unknown",
      username,
      userEmail: sampleUser.email || "unknown@contest.com",
      score:         totalConsistencyScore,
      commentCount:  totalComments,
      viewCount:     totalViews,
      createdAt: earliestPostTime === Infinity
        ? new Date().toISOString()
        : new Date(earliestPostTime).toISOString()
    });
  });

  consistencyRankings.sort(comparePosts);

  // ── Step 5: 33-Prize allocation (1 prize per person max) ────────────────
  const winners = [];
  const awardedUserIds = new Set();
  let priorityCounter = 1;

  const addWinner = (tier, tierCategory, post, overrideFields = {}) => {
    const userObj  = userById.get(post.userId) || {};
    const username = post.username
      || userObj.username
      || post.userEmail?.split("@")[0]
      || (post.userName || "").toLowerCase().replace(/\s+/g, "_");

    winners.push({
      tier,
      tierCategory,
      priorityIndex: priorityCounter++,
      userId:       post.userId,
      userEmail:    post.userEmail  || userObj.email || "",
      userName:     post.userName   || userObj.name  || "Unknown",
      username,
      postId:       post.id        || null,
      postCaption:  post.caption   || null,
      postCategory: post.category  || tierCategory || null,
      score:        post.score     || 0,
      ...overrideFields
    });
    awardedUserIds.add(post.userId);
  };

  // Tier 1: Grand Prize (1)
  if (globalRankings.length > 0) {
    addWinner("GRAND_PRIZE", null, globalRankings[0]);
  }

  // Tier 2 & 3: Consistency 1st and 2nd (1 each)
  const eligConsistency = consistencyRankings.filter((c) => !awardedUserIds.has(c.userId));

  if (eligConsistency.length > 0) {
    const c1 = eligConsistency[0];
    winners.push({
      tier: "CONSISTENCY_1ST",
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId:       c1.userId,
      userEmail:    c1.userEmail,
      userName:     c1.userName,
      username:     c1.username,
      postId:       null,
      postCaption:  "Top 3 posts/week across 4 weeks",
      postCategory: null,
      score:        c1.score
    });
    awardedUserIds.add(c1.userId);
  }

  const eligConsistency2 = consistencyRankings.filter((c) => !awardedUserIds.has(c.userId));
  if (eligConsistency2.length > 0) {
    const c2 = eligConsistency2[0];
    winners.push({
      tier: "CONSISTENCY_2ND",
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId:       c2.userId,
      userEmail:    c2.userEmail,
      userName:     c2.userName,
      username:     c2.username,
      postId:       null,
      postCaption:  "Top 3 posts/week across 4 weeks",
      postCategory: null,
      score:        c2.score
    });
    awardedUserIds.add(c2.userId);
  }

  // Tier 4: Top 10 Performers
  const topPerformers = globalRankings
    .filter((p) => !awardedUserIds.has(p.userId))
    .slice(0, 10);

  topPerformers.forEach((tp, idx) => {
    addWinner(`TOP_PERFORMER_${idx + 1}`, null, tp);
  });

  // Tier 5: Category 1st — resolve multi-category conflicts
  const cat1stAssignments = {};
  CATEGORIES.forEach((cat) => {
    const candidates = (categoryRankings[cat] || []).filter((p) => !awardedUserIds.has(p.userId));
    if (candidates.length > 0) cat1stAssignments[cat] = candidates;
  });

  // Iteratively resolve: if one user tops multiple categories, keep their best, bubble others down
  let changed = true;
  while (changed) {
    changed = false;
    const userTopCats = {};

    CATEGORIES.forEach((cat) => {
      const candidates = cat1stAssignments[cat];
      if (candidates && candidates.length > 0) {
        const topUserId = candidates[0].userId;
        if (!userTopCats[topUserId]) userTopCats[topUserId] = [];
        userTopCats[topUserId].push({ category: cat, post: candidates[0] });
      }
    });

    Object.values(userTopCats).forEach((tops) => {
      if (tops.length > 1) {
        // Keep the category where this user scores highest; remove them from others
        tops.sort((a, b) => comparePosts(a.post, b.post));
        tops.slice(1).forEach((weaker) => {
          cat1stAssignments[weaker.category] = cat1stAssignments[weaker.category].slice(1);
          changed = true;
        });
      }
    });
  }

  CATEGORIES.forEach((cat) => {
    const candidates = cat1stAssignments[cat] || [];
    if (candidates.length > 0) {
      addWinner("CATEGORY_1ST", cat, candidates[0]);
    } else {
      winners.push({
        tier: "CATEGORY_1ST",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: "UNAWARDED", userEmail: "unawarded@contest.com",
        userName: "Unawarded Category", username: "unawarded",
        postId: null, postCaption: "No eligible creator available",
        postCategory: cat, score: 0
      });
    }
  });

  // Tier 6: Category 2nd
  CATEGORIES.forEach((cat) => {
    const candidates = (categoryRankings[cat] || []).filter((p) => !awardedUserIds.has(p.userId));
    if (candidates.length > 0) {
      addWinner("CATEGORY_2ND", cat, candidates[0]);
    } else {
      winners.push({
        tier: "CATEGORY_2ND",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: "UNAWARDED", userEmail: "unawarded@contest.com",
        userName: "Unawarded Category", username: "unawarded",
        postId: null, postCaption: "No eligible 2nd place creator available",
        postCategory: cat, score: 0
      });
    }
  });

  // ── Step 6: Weekly Activity Matrix ─────────────────────────────────────
  // Pre-build userId → posts map to avoid O(n²) linear scans
  const allPostsByUser = new Map();
  posts.forEach((p) => {
    const enriched = {
      ...p,
      likeCount:    Math.max(0, parseInt(p.likeCount, 10)    || 0),
      commentCount: Math.max(0, parseInt(p.commentCount, 10) || 0),
      viewCount:    Math.max(0, parseInt(p.viewCount, 10)    || 0),
      score: calculatePostScore(p.likeCount, p.commentCount, p.viewCount)
    };
    if (!allPostsByUser.has(p.userId)) allPostsByUser.set(p.userId, []);
    allPostsByUser.get(p.userId).push(enriched);
  });

  const allUserWeekMap = groupPostsByWeek(posts);

  const weeklyActivity = users.map((u) => {
    const weeks = allUserWeekMap[u.id] || { 0: [], 1: [], 2: [], 3: [] };
    const w0Count = weeks[0].length;
    const w1Count = weeks[1].length;
    const w2Count = weeks[2].length;
    const w3Count = weeks[3].length;
    const totalPosts = w0Count + w1Count + w2Count + w3Count;

    // safeMax via reduce — no spread operator
    const w0MaxScore = safeMax(weeks[0], (p) => p.score || 0);
    const w1MaxScore = safeMax(weeks[1], (p) => p.score || 0);
    const w2MaxScore = safeMax(weeks[2], (p) => p.score || 0);
    const w3MaxScore = safeMax(weeks[3], (p) => p.score || 0);

    const isConsistencyEligible = w0Count >= 3 && w1Count >= 3 && w2Count >= 3 && w3Count >= 3;
    const isChhattisgarh = u.residency === "Chhattisgarh";
    const uid = (u.id || "").toString().trim().toLowerCase();
    const isDisq = disqSet.has(uid);

    // Consistency score: accumulate raw parts, round once
    let consistencyLikes = 0, consistencyComments = 0, consistencyViews = 0;
    if (isConsistencyEligible && isChhattisgarh && !isDisq) {
      for (let w = 0; w < 4; w++) {
        [...weeks[w]].sort(comparePosts).slice(0, 3).forEach((p) => {
          consistencyLikes    += Math.max(0, parseInt(p.likeCount, 10)    || 0);
          consistencyComments += Math.max(0, parseInt(p.commentCount, 10) || 0);
          consistencyViews    += Math.max(0, parseInt(p.viewCount, 10)    || 0);
        });
      }
    }
    const consistencyScore = Number(
      (consistencyLikes * 1.0 + consistencyComments * 3.0 + consistencyViews * 0.2).toFixed(2)
    );

    const userPostsList = allPostsByUser.get(u.id) || [];
    const username =
      u.username ||
      u.email?.split("@")[0] ||
      (u.name ? u.name.toLowerCase().replace(/\s+/g, "_") : "unknown");

    return {
      userId: u.id,
      userName: u.name,
      username,
      userEmail: u.email,
      residency: u.residency,
      isChhattisgarh,
      isDisqualified: isDisq,
      week1Count: w0Count, week2Count: w1Count, week3Count: w2Count, week4Count: w3Count,
      week1MaxScore: Number((w0MaxScore === -Infinity ? 0 : w0MaxScore).toFixed(2)),
      week2MaxScore: Number((w1MaxScore === -Infinity ? 0 : w1MaxScore).toFixed(2)),
      week3MaxScore: Number((w2MaxScore === -Infinity ? 0 : w2MaxScore).toFixed(2)),
      week4MaxScore: Number((w3MaxScore === -Infinity ? 0 : w3MaxScore).toFixed(2)),
      week1Posts: weeks[0], week2Posts: weeks[1], week3Posts: weeks[2], week4Posts: weeks[3],
      totalPosts,
      isConsistencyEligible,
      consistencyScore,
      allPosts: userPostsList
    };
  });

  // ── Step 7: All Participants Overview ──────────────────────────────────
  // Pre-build activity map for O(1) lookups
  const weeklyActivityMap = new Map();
  weeklyActivity.forEach((a) => weeklyActivityMap.set(a.userId, a));

  // Pre-build winner map for O(1) lookup
  const winnerByUserId = new Map();
  winners.forEach((w) => {
    if (w.userId !== "UNAWARDED") winnerByUserId.set(w.userId, w);
  });

  const allParticipants = users.map((u) => {
    const userPosts   = allPostsByUser.get(u.id) || [];
    const activityObj = weeklyActivityMap.get(u.id) || {};
    const prizeWon    = winnerByUserId.get(u.id);

    // Aggregate using reduce — O(n), no spread
    let totalLikes = 0, totalComments = 0, totalViews = 0;
    let maxScore = 0;

    userPosts.forEach((p) => {
      totalLikes    += Math.max(0, parseInt(p.likeCount, 10)    || 0);
      totalComments += Math.max(0, parseInt(p.commentCount, 10) || 0);
      totalViews    += Math.max(0, parseInt(p.viewCount, 10)    || 0);
      if ((p.score || 0) > maxScore) maxScore = p.score || 0;
    });

    const uid = (u.id || "").toString().trim().toLowerCase();
    const username =
      u.username ||
      u.email?.split("@")[0] ||
      (u.name ? u.name.toLowerCase().replace(/\s+/g, "_") : "unknown");

    return {
      userId:       u.id,
      userName:     u.name,
      username,
      userEmail:    u.email,
      residency:    u.residency,
      isEligible:   u.residency === "Chhattisgarh" && !disqSet.has(uid),
      isDisqualified: disqSet.has(uid),
      totalPosts:   userPosts.length,
      totalLikes,
      totalComments,
      totalViews,
      maxScore:          Number(maxScore.toFixed(2)),
      consistencyScore:  activityObj.consistencyScore  || 0,
      isConsistencyEligible: activityObj.isConsistencyEligible || false,
      prizeTier:     prizeWon ? prizeWon.tier         : null,
      prizeCategory: prizeWon ? prizeWon.tierCategory : null,
      userPosts,
      week1Posts: activityObj.week1Posts || [],
      week2Posts: activityObj.week2Posts || [],
      week3Posts: activityObj.week3Posts || [],
      week4Posts: activityObj.week4Posts || []
    };
  });

  return {
    summary: {
      totalEligibleUsers:  eligibleUserIds.size,
      totalEligiblePosts:  eligiblePosts.length,
      disqualifiedCount:   disqSet.size,
      prizesAwarded:       winners.filter((w) => w.userId !== "UNAWARDED").length,
      unawardedCount:      winners.filter((w) => w.userId === "UNAWARDED").length
    },
    rankings: {
      global:      globalRankings,
      perCategory: categoryRankings,
      consistency: consistencyRankings
    },
    weeklyActivity,
    allParticipants,
    winners
  };
};

module.exports = {
  calculatePostScore,
  comparePosts,
  calculateContestRankings
};
