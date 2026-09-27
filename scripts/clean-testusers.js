const path = require("path");
const fs = require("fs");

const userServiceNodeModules = path.join(__dirname, "../user-service/node_modules");
if (fs.existsSync(userServiceNodeModules)) {
  module.paths.unshift(userServiceNodeModules);
}

const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../user-service/.env") });

const userModelPath = fs.existsSync(path.join(__dirname, "../user-service/src/models/User.js"))
  ? path.join(__dirname, "../user-service/src/models/User.js")
  : path.join(__dirname, "../src/models/User.js");

const modelsDir = path.dirname(userModelPath);
const User = require(path.join(modelsDir, "User.js"));
const Post = require(path.join(modelsDir, "Post.js"));
const Like = require(path.join(modelsDir, "Like.js"));
const Comment = require(path.join(modelsDir, "Comment.js"));
const View = require(path.join(modelsDir, "View.js"));
const Notification = require(path.join(modelsDir, "Notification.js"));

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.SEED_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/creator_contest_user_db";

const cleanTestUsers = async () => {
  try {
    console.log("==================================================");
    console.log("🧹 Cleaning Up All Test Users & Test Artifacts");
    console.log("==================================================");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB:", MONGODB_URI);

    // 1. Find all test user accounts
    const testUsers = await User.find({
      $or: [
        { username: /^testuser/i },
        { email: /testuser/i },
        { email: /@example\.com$/i },
        { name: /^Audit Test/i }
      ]
    }).lean();

    const testUserIds = testUsers.map((u) => u._id);
    console.log(`🔍 Found ${testUsers.length} test user accounts to delete.`);

    // 2. Find test posts
    const testPosts = await Post.find({
      $or: [
        { userId: { $in: testUserIds } },
        { caption: /Audit test/i }
      ]
    }).lean();

    const testPostIds = testPosts.map((p) => p._id);
    console.log(`🔍 Found ${testPosts.length} test posts to delete.`);

    // 3. Delete dependent records
    if (testUserIds.length > 0 || testPostIds.length > 0) {
      const likesDeleted = await Like.deleteMany({
        $or: [
          { userId: { $in: testUserIds } },
          { postId: { $in: testPostIds } }
        ]
      });
      console.log(`🗑️ Deleted ${likesDeleted.deletedCount} test likes.`);

      const commentsDeleted = await Comment.deleteMany({
        $or: [
          { userId: { $in: testUserIds } },
          { postId: { $in: testPostIds } }
        ]
      });
      console.log(`🗑️ Deleted ${commentsDeleted.deletedCount} test comments.`);

      const viewsDeleted = await View.deleteMany({
        $or: [
          { userId: { $in: testUserIds } },
          { postId: { $in: testPostIds } }
        ]
      });
      console.log(`🗑️ Deleted ${viewsDeleted.deletedCount} test views.`);

      const notifsDeleted = await Notification.deleteMany({
        $or: [
          { recipientId: { $in: testUserIds } },
          { senderId: { $in: testUserIds } },
          { postId: { $in: testPostIds } }
        ]
      });
      console.log(`🗑️ Deleted ${notifsDeleted.deletedCount} test notifications.`);

      const postsDeleted = await Post.deleteMany({
        _id: { $in: testPostIds }
      });
      console.log(`🗑️ Deleted ${postsDeleted.deletedCount} test posts.`);

      const usersDeleted = await User.deleteMany({
        _id: { $in: testUserIds }
      });
      console.log(`🗑️ Deleted ${usersDeleted.deletedCount} test user accounts.`);
    } else {
      console.log("✨ No test users or test posts found. Database is clean!");
    }

    console.log("==================================================");
    console.log("🎉 Test User Cleanup Completed Successfully!");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("💥 Cleanup Error:", err);
    process.exit(1);
  }
};

cleanTestUsers();
