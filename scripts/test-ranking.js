const assert = require("assert");
const { calculatePostScore, comparePosts, calculateContestRankings } = require("../admin-service/src/services/rankingEngine");

console.log("==================================================");
console.log("🧪 Running Ranking Engine Automated Test Suite...");
console.log("==================================================");

// Test 1: Post Score Formula Calculation
console.log("--> Test 1: Score Formula (Likes*1 + Comments*3 + Views*0.2)");
const score = calculatePostScore(10, 5, 50); // 10*1 + 5*3 + 50*0.2 = 10 + 15 + 10 = 35.0
assert.strictEqual(score, 35.0, "Score calculation formula mismatch");
console.log("   ✅ Passed: Score = 35.0");

// Test 2: Tie-Breaker Precedence Order
console.log("--> Test 2: Tie-Breaker Precedence (Comments > Views > Timestamp)");
const postA = { score: 50.0, commentCount: 10, viewCount: 20, createdAt: "2026-09-17T10:00:00Z" };
const postB = { score: 50.0, commentCount: 5, viewCount: 45, createdAt: "2026-09-17T09:00:00Z" };
assert.ok(comparePosts(postA, postB) < 0, "Post A with more comments should beat Post B");
console.log("   ✅ Passed: Post with more comments wins tie-break.");

// Test 3: Non-Chhattisgarh Exclusion & Prize Cascade
console.log("--> Test 3: 33-Prize Priority Allocation & Residency Exclusion");
const mockContestData = {
  users: [
    { id: "u1", name: "Alpha (Chhattisgarh)", email: "alpha@cg.com", residency: "Chhattisgarh" },
    { id: "u2", name: "Epsilon (Delhi)", email: "epsilon@delhi.com", residency: "Delhi" },
    { id: "u3", name: "Zeta (Gaming CG)", email: "zeta@cg.com", residency: "Chhattisgarh" }
  ],
  posts: [
    { id: "p1", userId: "u1", userName: "Alpha", userEmail: "alpha@cg.com", category: "Tech", score: 100, commentCount: 10, viewCount: 50, createdAt: "2026-09-17T10:00:00Z" },
    { id: "p2", userId: "u2", userName: "Epsilon", userEmail: "epsilon@delhi.com", category: "Tech", score: 200, commentCount: 20, viewCount: 100, createdAt: "2026-09-17T10:00:00Z" }, // Ineligible
    { id: "p3", userId: "u3", userName: "Zeta", userEmail: "zeta@cg.com", category: "Gaming", score: 40, commentCount: 2, viewCount: 10, createdAt: "2026-09-17T10:00:00Z" }
  ]
};

const result = calculateContestRankings(mockContestData, []);
const grandWinner = result.winners.find((w) => w.tier === "GRAND_PRIZE");

assert.strictEqual(grandWinner.userId, "u1", "Delhi user should be excluded from Grand Prize");
console.log("   ✅ Passed: Delhi resident excluded. Alpha won Grand Prize.");

// Test 4: KYC Failure Cascade
console.log("--> Test 4: KYC Failure Re-Allocation Cascade");
const cascadedResult = calculateContestRankings(mockContestData, ["u1"]);
const newGrandWinner = cascadedResult.winners.find((w) => w.tier === "GRAND_PRIZE");

assert.strictEqual(newGrandWinner.userId, "u3", "Grand Prize should cascade down to u3 after u1 fails KYC");
console.log("   ✅ Passed: Slot cascaded to Zeta after Alpha failed KYC.");

console.log("==================================================");
console.log("🎉 ALL RANKING ENGINE TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
