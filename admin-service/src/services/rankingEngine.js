const { CATEGORIES } = require("../config/constants");

/**
 * Calculates single post score according to the formula:
 * Score = (Likes * 1) + (Comments * 3) + (Views * 0.2)
 */
const calculatePostScore = (likes = 0, comments = 0, views = 0) => {
  return Number((likes * 1.0 + comments * 3.0 + views * 0.2).toFixed(2));
};

/**
 * Sort function implementing the strict tie-breaker order:
 * Score (desc) -> Comments (desc) -> Views (desc) -> Earliest Timestamp (asc)
 */
const comparePosts = (a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.commentCount !== a.commentCount) {
    return b.commentCount - a.commentCount;
  }
  if (b.viewCount !== a.viewCount) {
    return b.viewCount - a.viewCount;
  }
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

/**
 * Group posts into 4 contest weeks based on post timestamps
 */
const groupPostsByWeek = (posts) => {
  if (!posts || posts.length === 0) return {};

  const timestamps = posts.map((p) => new Date(p.createdAt).getTime());
  const minTime = Math.min(...timestamps);
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const userWeekMap = {};

  posts.forEach((post) => {
    const postTime = new Date(post.createdAt).getTime();
    let weekIndex = Math.floor((postTime - minTime) / WEEK_MS);
    if (weekIndex > 3) weekIndex = 3; // Clamp to week 4

    const userId = post.userId;
    if (!userWeekMap[userId]) {
      userWeekMap[userId] = { 0: [], 1: [], 2: [], 3: [] };
    }
    userWeekMap[userId][weekIndex].push(post);
  });

  return userWeekMap;
};

/**
 * Main Ranking & 33-Prize Priority Allocation Cascade Engine
 */
const calculateContestRankings = (contestData, disqualifiedUserIds = []) => {
  const { users = [], posts = [] } = contestData || {};
  const disqSet = new Set(disqualifiedUserIds.filter(Boolean).map((id) => id.toString().trim().toLowerCase()));

  // Step 1: Filter eligible users (Chhattisgarh residents & not disqualified)
  const eligibleUserIds = new Set(
    users
      .filter((u) => {
        const uid = u.id?.toString().trim().toLowerCase();
        const uemail = u.email?.toString().trim().toLowerCase();
        const isDisq = (uid && disqSet.has(uid)) || (uemail && disqSet.has(uemail));
        return u.residency === "Chhattisgarh" && !isDisq;
      })
      .map((u) => u.id)
  );

  const eligiblePosts = posts.filter((p) => eligibleUserIds.has(p.userId));

  // Step 2: Calculate Global Ranking (Best post per creator)
  const userBestPostMap = new Map();
  eligiblePosts.forEach((post) => {
    const userId = post.userId;
    if (!userBestPostMap.has(userId)) {
      userBestPostMap.set(userId, post);
    } else {
      const currentBest = userBestPostMap.get(userId);
      if (comparePosts(post, currentBest) < 0) {
        userBestPostMap.set(userId, post);
      }
    }
  });

  const globalRankings = Array.from(userBestPostMap.values()).sort(comparePosts);

  // Step 3: Calculate Per-Category Rankings
  const categoryRankings = {};
  CATEGORIES.forEach((cat) => {
    const catPosts = eligiblePosts.filter((p) => p.category === cat);
    const catBestMap = new Map();

    catPosts.forEach((post) => {
      const userId = post.userId;
      if (!catBestMap.has(userId)) {
        catBestMap.set(userId, post);
      } else {
        const currentBest = catBestMap.get(userId);
        if (comparePosts(post, currentBest) < 0) {
          catBestMap.set(userId, post);
        }
      }
    });

    categoryRankings[cat] = Array.from(catBestMap.values()).sort(comparePosts);
  });

  // Step 4: Calculate Consistency Rankings
  // Must have 3+ posts in ALL 4 weeks; score = sum of top-3 posts per week (12 posts total)
  const userWeekMap = groupPostsByWeek(eligiblePosts);
  const consistencyRankings = [];

  Object.keys(userWeekMap).forEach((userId) => {
    const weeks = userWeekMap[userId];
    const hasConsistency =
      weeks[0].length >= 3 &&
      weeks[1].length >= 3 &&
      weeks[2].length >= 3 &&
      weeks[3].length >= 3;

    if (hasConsistency) {
      let totalConsistencyScore = 0;
      let totalComments = 0;
      let totalViews = 0;
      let earliestPostTime = Infinity;

      for (let w = 0; w < 4; w++) {
        const top3WeekPosts = [...weeks[w]].sort(comparePosts).slice(0, 3);
        top3WeekPosts.forEach((p) => {
          totalConsistencyScore += p.score;
          totalComments += p.commentCount;
          totalViews += p.viewCount;
          const t = new Date(p.createdAt).getTime();
          if (t < earliestPostTime) earliestPostTime = t;
        });
      }

      const sampleUser = users.find((u) => u.id === userId) || {};

      consistencyRankings.push({
        userId,
        userName: sampleUser.name || "Unknown",
        userEmail: sampleUser.email || "unknown@contest.com",
        score: Number(totalConsistencyScore.toFixed(2)),
        commentCount: totalComments,
        viewCount: totalViews,
        createdAt: new Date(earliestPostTime).toISOString()
      });
    }
  });

  consistencyRankings.sort(comparePosts);

  // Step 5: Allocate 33 Prizes strictly in priority order (1 prize per person max)
  const winners = [];
  const awardedUserIds = new Set();
  let priorityCounter = 1;

  // Tier 1: Grand Prize (1)
  if (globalRankings.length > 0) {
    const gpPost = globalRankings[0];
    winners.push({
      tier: "GRAND_PRIZE",
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId: gpPost.userId,
      userEmail: gpPost.userEmail,
      userName: gpPost.userName,
      postId: gpPost.id,
      postCaption: gpPost.caption,
      postCategory: gpPost.category,
      score: gpPost.score
    });
    awardedUserIds.add(gpPost.userId);
  }

  // Tier 2: Consistency 1st (1)
  const eligConsistency1 = consistencyRankings.filter((c) => !awardedUserIds.has(c.userId));
  if (eligConsistency1.length > 0) {
    const c1 = eligConsistency1[0];
    winners.push({
      tier: "CONSISTENCY_1ST",
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId: c1.userId,
      userEmail: c1.userEmail,
      userName: c1.userName,
      postId: null,
      postCaption: "Top 3 posts/week across 4 weeks",
      postCategory: null,
      score: c1.score
    });
    awardedUserIds.add(c1.userId);
  }

  // Tier 3: Consistency 2nd (1)
  const eligConsistency2 = consistencyRankings.filter((c) => !awardedUserIds.has(c.userId));
  if (eligConsistency2.length > 0) {
    const c2 = eligConsistency2[0];
    winners.push({
      tier: "CONSISTENCY_2ND",
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId: c2.userId,
      userEmail: c2.userEmail,
      userName: c2.userName,
      postId: null,
      postCaption: "Top 3 posts/week across 4 weeks",
      postCategory: null,
      score: c2.score
    });
    awardedUserIds.add(c2.userId);
  }

  // Tier 4: Top Performers (10 distinct creators)
  const topPerformersEligible = globalRankings.filter((p) => !awardedUserIds.has(p.userId));
  const top10Performers = topPerformersEligible.slice(0, 10);
  top10Performers.forEach((tp, idx) => {
    winners.push({
      tier: `TOP_PERFORMER_${idx + 1}`,
      tierCategory: null,
      priorityIndex: priorityCounter++,
      userId: tp.userId,
      userEmail: tp.userEmail,
      userName: tp.userName,
      postId: tp.id,
      postCaption: tp.caption,
      postCategory: tp.category,
      score: tp.score
    });
    awardedUserIds.add(tp.userId);
  });

  // Tier 5: Category 1st (10, 1 per category)
  // Handle multi-category leader cascading: If a user tops multiple categories,
  // award them to their strongest category (highest scoring post) and cascade lower category slots down.
  const cat1stAssignments = {};

  CATEGORIES.forEach((cat) => {
    const catList = (categoryRankings[cat] || []).filter((p) => !awardedUserIds.has(p.userId));
    if (catList.length > 0) {
      cat1stAssignments[cat] = catList;
    }
  });

  // Resolve multi-category tops
  const cat1stWinners = {};
  let changed = true;
  while (changed) {
    changed = false;
    // Map userId -> array of categories they currently top
    const userTopCats = {};
    CATEGORIES.forEach((cat) => {
      const candidates = cat1stAssignments[cat];
      if (candidates && candidates.length > 0) {
        const topUser = candidates[0].userId;
        if (!userTopCats[topUser]) userTopCats[topUser] = [];
        userTopCats[topUser].push({ category: cat, post: candidates[0] });
      }
    });

    Object.keys(userTopCats).forEach((userId) => {
      const tops = userTopCats[userId];
      if (tops.length > 1) {
        // Sort user's top categories by post score descending
        tops.sort((a, b) => comparePosts(a.post, b.post));
        const bestCat = tops[0].category;

        // Keep strongest category for user, drop from other category candidates
        tops.slice(1).forEach((weaker) => {
          cat1stAssignments[weaker.category] = cat1stAssignments[weaker.category].slice(1);
          changed = true;
        });
      }
    });
  }

  // Finalize Category 1st winners
  CATEGORIES.forEach((cat) => {
    const candidates = cat1stAssignments[cat] || [];
    if (candidates.length > 0) {
      const cat1Winner = candidates[0];
      winners.push({
        tier: "CATEGORY_1ST",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: cat1Winner.userId,
        userEmail: cat1Winner.userEmail,
        userName: cat1Winner.userName,
        postId: cat1Winner.id,
        postCaption: cat1Winner.caption,
        postCategory: cat,
        score: cat1Winner.score
      });
      awardedUserIds.add(cat1Winner.userId);
    } else {
      winners.push({
        tier: "CATEGORY_1ST",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: "UNAWARDED",
        userEmail: "unawarded@contest.com",
        userName: "Unawarded Category",
        postId: null,
        postCaption: "No eligible creator available",
        postCategory: cat,
        score: 0
      });
    }
  });

  // Tier 6: Category 2nd (10, 1 per category)
  // Exhausted category rule: If no eligible creator remains for 2nd place, leave unawarded (no backfilling)
  CATEGORIES.forEach((cat) => {
    const catList = (categoryRankings[cat] || []).filter((p) => !awardedUserIds.has(p.userId));
    if (catList.length > 0) {
      const cat2Winner = catList[0];
      winners.push({
        tier: "CATEGORY_2ND",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: cat2Winner.userId,
        userEmail: cat2Winner.userEmail,
        userName: cat2Winner.userName,
        postId: cat2Winner.id,
        postCaption: cat2Winner.caption,
        postCategory: cat,
        score: cat2Winner.score
      });
      awardedUserIds.add(cat2Winner.userId);
    } else {
      // Exhausted Category Rule: Leave unawarded
      winners.push({
        tier: "CATEGORY_2ND",
        tierCategory: cat,
        priorityIndex: priorityCounter++,
        userId: "UNAWARDED",
        userEmail: "unawarded@contest.com",
        userName: "Unawarded Category",
        postId: null,
        postCaption: "No eligible 2nd place creator available",
        postCategory: cat,
        score: 0
      });
    }
  });

  // Step 6: Calculate Detailed Weekly Activity Matrix for all creators
  const allUserWeekMap = groupPostsByWeek(posts);
  const weeklyActivity = users.map((u) => {
    const weeks = allUserWeekMap[u.id] || { 0: [], 1: [], 2: [], 3: [] };
    const w0Count = weeks[0].length;
    const w1Count = weeks[1].length;
    const w2Count = weeks[2].length;
    const w3Count = weeks[3].length;
    const totalPosts = w0Count + w1Count + w2Count + w3Count;

    const w0MaxScore = weeks[0].length > 0 ? Math.max(...weeks[0].map((p) => p.score)) : 0;
    const w1MaxScore = weeks[1].length > 0 ? Math.max(...weeks[1].map((p) => p.score)) : 0;
    const w2MaxScore = weeks[2].length > 0 ? Math.max(...weeks[2].map((p) => p.score)) : 0;
    const w3MaxScore = weeks[3].length > 0 ? Math.max(...weeks[3].map((p) => p.score)) : 0;

    const isConsistencyEligible = w0Count >= 3 && w1Count >= 3 && w2Count >= 3 && w3Count >= 3;
    const isChhattisgarh = u.residency === "Chhattisgarh";

    let consistencyScore = 0;
    if (isConsistencyEligible && isChhattisgarh && !disqSet.has(u.id)) {
      for (let w = 0; w < 4; w++) {
        const top3 = [...weeks[w]].sort(comparePosts).slice(0, 3);
        top3.forEach((p) => {
          consistencyScore += p.score;
        });
      }
    }

    const userPostsList = posts.filter((p) => p.userId === u.id);

    return {
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      residency: u.residency,
      isChhattisgarh,
      isDisqualified: disqSet.has(u.id),
      week1Count: w0Count,
      week2Count: w1Count,
      week3Count: w2Count,
      week4Count: w3Count,
      week1MaxScore: Number(w0MaxScore.toFixed(2)),
      week2MaxScore: Number(w1MaxScore.toFixed(2)),
      week3MaxScore: Number(w2MaxScore.toFixed(2)),
      week4MaxScore: Number(w3MaxScore.toFixed(2)),
      week1Posts: weeks[0],
      week2Posts: weeks[1],
      week3Posts: weeks[2],
      week4Posts: weeks[3],
      totalPosts,
      isConsistencyEligible,
      consistencyScore: Number(consistencyScore.toFixed(2)),
      allPosts: userPostsList
    };
  });

  // Step 7: Calculate All Participants Overview
  const allParticipants = users.map((u) => {
    const userPosts = posts.filter((p) => p.userId === u.id);
    const totalLikes = userPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
    const totalComments = userPosts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
    const totalViews = userPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const maxScore = userPosts.length > 0 ? Math.max(...userPosts.map((p) => p.score)) : 0;
    const prizeWon = winners.find((w) => w.userId === u.id);
    const activityObj = weeklyActivity.find((a) => a.userId === u.id) || {};

    return {
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      residency: u.residency,
      isEligible: u.residency === "Chhattisgarh" && !disqSet.has(u.id),
      isDisqualified: disqSet.has(u.id),
      totalPosts: userPosts.length,
      totalLikes,
      totalComments,
      totalViews,
      maxScore: Number(maxScore.toFixed(2)),
      consistencyScore: activityObj.consistencyScore || 0,
      isConsistencyEligible: activityObj.isConsistencyEligible || false,
      prizeTier: prizeWon ? prizeWon.tier : null,
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
      totalEligibleUsers: eligibleUserIds.size,
      totalEligiblePosts: eligiblePosts.length,
      disqualifiedCount: disqSet.size,
      prizesAwarded: winners.filter((w) => w.userId !== "UNAWARDED").length,
      unawardedCount: winners.filter((w) => w.userId === "UNAWARDED").length
    },
    rankings: {
      global: globalRankings,
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
