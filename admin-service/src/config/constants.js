const CATEGORIES = [
  "Tech",
  "Art",
  "Music",
  "Gaming",
  "Fitness",
  "Food",
  "Travel",
  "Fashion",
  "Education",
  "Entertainment"
];

// Priority Order Specification for 33 Prizes
const PRIZE_TIERS = {
  GRAND_PRIZE: { name: "Grand Prize", count: 1, priority: 1 },
  CONSISTENCY_1ST: { name: "Consistency 1st", count: 1, priority: 2 },
  CONSISTENCY_2ND: { name: "Consistency 2nd", count: 1, priority: 3 },
  TOP_PERFORMER: { name: "Top Performer", count: 10, priority: 4 },
  CATEGORY_1ST: { name: "Category 1st", count: 10, priority: 5 },
  CATEGORY_2ND: { name: "Category 2nd", count: 10, priority: 6 }
};

module.exports = {
  CATEGORIES,
  PRIZE_TIERS
};
