const fs = require("fs");
const path = require("path");

const userServiceNodeModules = path.join(__dirname, "../user-service/node_modules");
if (fs.existsSync(userServiceNodeModules)) {
  module.paths.unshift(userServiceNodeModules);
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.SEED_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/creator_contest_user_db";

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

// 30 Distinct Accounts
const ACCOUNTS = [
  // Admin & Standard Demo Users
  { name: "Admin User", email: "admin@gmail.com", username: "admin", role: "admin", residency: "Chhattisgarh" },
  { name: "Demo User", email: "user@gmail.com", username: "demo_user", role: "user", residency: "Chhattisgarh" },

  // Chhattisgarh Contest Eligible Creators (24)
  { name: "Aarav Sharma", email: "aarav@creator.com", username: "aarav", residency: "Chhattisgarh" },
  { name: "Ananya Patel", email: "ananya@creator.com", username: "ananya", residency: "Chhattisgarh" },
  { name: "Rohan Verma", email: "rohan@creator.com", username: "rohan", residency: "Chhattisgarh" },
  { name: "Priya Singh", email: "priya@creator.com", username: "priya", residency: "Chhattisgarh" },
  { name: "Vikram Malhotra", email: "vikram@creator.com", username: "vikram", residency: "Chhattisgarh" },
  { name: "Neha Gupta", email: "neha@creator.com", username: "neha", residency: "Chhattisgarh" },
  { name: "Karan Johar", email: "karan@creator.com", username: "karan", residency: "Chhattisgarh" },
  { name: "Sneha Reddy", email: "sneha@creator.com", username: "sneha", residency: "Chhattisgarh" },
  { name: "Amitabh Kumar", email: "amitabh@creator.com", username: "amitabh", residency: "Chhattisgarh" },
  { name: "Deepika Padukone", email: "deepika@creator.com", username: "deepika", residency: "Chhattisgarh" },
  { name: "Ranbir Kapoor", email: "ranbir@creator.com", username: "ranbir", residency: "Chhattisgarh" },
  { name: "Alia Bhatt", email: "alia@creator.com", username: "alia", residency: "Chhattisgarh" },
  { name: "Varun Dhawan", email: "varun@creator.com", username: "varun", residency: "Chhattisgarh" },
  { name: "Kriti Sanon", email: "kriti@creator.com", username: "kriti", residency: "Chhattisgarh" },
  { name: "Siddharth Malhotra", email: "siddharth@creator.com", username: "siddharth", residency: "Chhattisgarh" },
  { name: "Kiara Advani", email: "kiara@creator.com", username: "kiara", residency: "Chhattisgarh" },
  { name: "Ayushmann Khurrana", email: "ayushmann@creator.com", username: "ayushmann", residency: "Chhattisgarh" },
  { name: "Bhumi Pednekar", email: "bhumi@creator.com", username: "bhumi", residency: "Chhattisgarh" },
  { name: "Rajkummar Rao", email: "rajkummar@creator.com", username: "rajkummar", residency: "Chhattisgarh" },
  { name: "Shraddha Kapoor", email: "shraddha@creator.com", username: "shraddha", residency: "Chhattisgarh" },
  { name: "Vicky Kaushal", email: "vicky@creator.com", username: "vicky", residency: "Chhattisgarh" },
  { name: "Katrina Kaif", email: "katrina@creator.com", username: "katrina", residency: "Chhattisgarh" },
  { name: "Kartik Aaryan", email: "kartik@creator.com", username: "kartik", residency: "Chhattisgarh" },
  { name: "Rashmika Mandanna", email: "rashmika@creator.com", username: "rashmika", residency: "Chhattisgarh" },
  { name: "Tiger Shroff", email: "tiger@creator.com", username: "tiger", residency: "Chhattisgarh" },

  // Non-Chhattisgarh Ineligible Creators (5)
  { name: "Delhi Creator", email: "delhi_pro@creator.com", username: "delhi_pro", residency: "Delhi" },
  { name: "Mumbai Fitness Star", email: "mumbai_pro@creator.com", username: "mumbai_pro", residency: "Maharashtra" },
  { name: "Bangalore Techie", email: "bangalore_tech@creator.com", username: "bangalore_tech", residency: "Karnataka" },
  { name: "Kolkata Artist", email: "kolkata_art@creator.com", username: "kolkata_art", residency: "Other State" },
  { name: "Punjab Music Producer", email: "punjab_fit@creator.com", username: "punjab_fit", residency: "Other State" }
];

const seedDatabase = async () => {
  try {
    console.log("==================================================");
    console.log("🚀 Starting Seeding with 139 Real Video Reels & 30 Accounts");
    console.log("==================================================");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB:", MONGODB_URI);

    // 1. Copy & Sanitize Real Video Reels from video_reels_100plus / video_reels to uploads
    const sourceDir = fs.existsSync(path.join(__dirname, "../video_reels_100plus"))
      ? path.join(__dirname, "../video_reels_100plus")
      : fs.existsSync(path.join(__dirname, "../video_reels"))
      ? path.join(__dirname, "../video_reels")
      : path.join(__dirname, "../video_reels_100plus");

    const targetDir = fs.existsSync(path.join(__dirname, "../uploads"))
      ? path.join(__dirname, "../uploads")
      : path.join(__dirname, "../user-service/uploads");

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cloudinary = require("cloudinary").v2;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }

    let reelFiles = [];
    if (fs.existsSync(sourceDir)) {
      const sourceFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".mp4"));
      console.log(`📁 Found ${sourceFiles.length} real video reels in ${path.basename(sourceDir)}.`);

      sourceFiles.forEach((file, index) => {
        const cleanName = `reel_${String(index + 1).padStart(3, "0")}.mp4`;
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(targetDir, cleanName);

        if (!fs.existsSync(destPath) || fs.statSync(destPath).size !== fs.statSync(srcPath).size) {
          fs.copyFileSync(srcPath, destPath);
        }
        reelFiles.push(`/uploads/${cleanName}`);
      });
      console.log(`✅ Synced ${reelFiles.length} video reels to local uploads folder.`);
    }

    if (reelFiles.length === 0 && fs.existsSync(targetDir)) {
      const uploadFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith(".mp4"));
      if (uploadFiles.length > 0) {
        uploadFiles.forEach((file) => reelFiles.push(`/uploads/${file}`));
        console.log(`✅ Found ${reelFiles.length} existing video reel files in user-service/uploads.`);
      }
    }

    if (reelFiles.length === 0) {
      console.warn("⚠️ No video reels found! Using fallback sample video URLs.");
      reelFiles = Array.from({ length: 30 }, (_, i) => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`);
    }

    // 2. Clear Existing MongoDB Collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Like.deleteMany({});
    await Comment.deleteMany({});
    await View.deleteMany({});
    console.log("✅ Cleared existing MongoDB collections.");

    // 3. Create Users with Hashed Passwords
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("password123", salt);
    const adminPasswordHash = await bcrypt.hash("admin", salt);
    const demoUserPasswordHash = await bcrypt.hash("user", salt);

    const userDocs = await User.create(
      ACCOUNTS.map((acc, index) => ({
        name: acc.name,
        email: acc.email,
        username: acc.username || acc.email.split("@")[0],
        passwordHash:
          acc.email === "admin@gmail.com"
            ? adminPasswordHash
            : acc.email === "user@gmail.com"
            ? demoUserPasswordHash
            : defaultPasswordHash,
        residency: acc.residency,
        role: acc.role || "user",
        kycDetails: acc.role === "admin" ? null : {
          aadharNumber: `1234 5678 ${String(1000 + index).slice(0, 4)}`,
          aadharMobile: `98765432${String(10 + index).slice(0, 2)}`,
          dob: "1997-08-15",
          aadharImage: `/uploads/reel_${String((index % 10) + 1).padStart(3, "0")}.mp4`,
          status: acc.email === "vikram@creator.com" ? "PENDING" : "PASSED",
          submittedAt: new Date()
        }
      }))
    );

    const userMap = {};
    userDocs.forEach((u) => {
      userMap[u.email] = u;
    });

    console.log(`✅ Created ${userDocs.length} User Accounts (Password for all: 'password123' / admin: 'admin').`);

    // 4. Generate 4-Week Date Offsets
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const WEEK_MS = 7 * DAY_MS;

    const getWeekDate = (weekNum, dayInWeek = 1) => {
      // weekNum: 1, 2, 3, 4
      const daysAgo = (4 - weekNum) * 7 + (7 - dayInWeek);
      return new Date(now.getTime() - daysAgo * DAY_MS);
    };

    const postsToInsert = [];
    let reelIndex = 0;

    const getNextReel = () => {
      const url = reelFiles[reelIndex % reelFiles.length];
      reelIndex++;
      return url;
    };

    // --- SCENARIO 1: Grand Prize Winner (Aarav Sharma) ---
    // Aarav posts a viral Tech reel in Week 3 with top single post score
    postsToInsert.push({
      userId: userMap["aarav@creator.com"]._id,
      caption: "🚀 AI Superintelligence Revolution 2026! #Tech #AI #Future",
      category: "Tech",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 450,
      commentCount: 90,
      viewCount: 1500, // Score = 450*1 + 90*3 + 1500*0.2 = 450 + 270 + 300 = 1020.0
      createdAt: getWeekDate(3, 4)
    });

    // --- SCENARIO 2: Multi-Category Leader (Ananya Patel) ---
    // Ananya has top posts in BOTH Tech (Score 800) and Fashion (Score 750).
    // Her strongest is Tech, so Fashion cascades down!
    postsToInsert.push({
      userId: userMap["ananya@creator.com"]._id,
      caption: "💻 Quantum Computing Breakthrough Demo #Tech",
      category: "Tech",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 350,
      commentCount: 70,
      viewCount: 1200, // Score = 350 + 210 + 240 = 800.0
      createdAt: getWeekDate(2, 3)
    });
    postsToInsert.push({
      userId: userMap["ananya@creator.com"]._id,
      caption: "👗 Cyberpunk Streetwear Collection 2026 #Fashion",
      category: "Fashion",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 320,
      commentCount: 60,
      viewCount: 1250, // Score = 320 + 180 + 250 = 750.0 (Cascades!)
      createdAt: getWeekDate(3, 2)
    });

    // --- SCENARIO 3: Consistency Winners (Rohan & Priya) ---
    // Rohan & Priya post 3+ videos EVERY SINGLE WEEK (W1, W2, W3, W4)
    for (let w = 1; w <= 4; w++) {
      for (let p = 1; p <= 3; p++) {
        postsToInsert.push({
          userId: userMap["rohan@creator.com"]._id,
          caption: `Rohan Consistency Food Vlog W${w} Reel #${p}`,
          category: "Food",
          mediaUrl: getNextReel(),
          mediaType: "video",
          likeCount: 60 + w * 10 + p * 2,
          commentCount: 12 + w,
          viewCount: 300 + w * 50,
          createdAt: getWeekDate(w, p * 2)
        });

        postsToInsert.push({
          userId: userMap["priya@creator.com"]._id,
          caption: `Priya Travel Diary W${w} Reel #${p}`,
          category: "Travel",
          mediaUrl: getNextReel(),
          mediaType: "video",
          likeCount: 50 + w * 8 + p * 2,
          commentCount: 10 + w,
          viewCount: 250 + w * 40,
          createdAt: getWeekDate(w, p * 2)
        });
      }
    }

    // --- SCENARIO 4: Consistency Near-Miss (Vikram) ---
    // Vikram posts 3 videos in W1, W2, W4, but ONLY 2 videos in W3 (Misses consistency!)
    for (const w of [1, 2, 4]) {
      for (let p = 1; p <= 3; p++) {
        postsToInsert.push({
          userId: userMap["vikram@creator.com"]._id,
          caption: `Vikram Fitness Motivation W${w} Reel #${p}`,
          category: "Fitness",
          mediaUrl: getNextReel(),
          mediaType: "video",
          likeCount: 80,
          commentCount: 15,
          viewCount: 400,
          createdAt: getWeekDate(w, p * 2)
        });
      }
    }
    // Only 2 posts in Week 3
    postsToInsert.push({
      userId: userMap["vikram@creator.com"]._id,
      caption: "Vikram Fitness Motivation W3 Reel #1",
      category: "Fitness",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 80,
      commentCount: 15,
      viewCount: 400,
      createdAt: getWeekDate(3, 1)
    });
    postsToInsert.push({
      userId: userMap["vikram@creator.com"]._id,
      caption: "Vikram Fitness Motivation W3 Reel #2",
      category: "Fitness",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 80,
      commentCount: 15,
      viewCount: 400,
      createdAt: getWeekDate(3, 3)
    });

    // --- SCENARIO 5: Tie Score Break (Neha vs Karan) ---
    // Both Neha & Karan have Score = 150.0 in Art category, but Neha has MORE comments!
    // Neha: 60 Likes, 20 Comments (60), 150 Views (30) = 150.0
    // Karan: 90 Likes, 10 Comments (30), 150 Views (30) = 150.0
    postsToInsert.push({
      userId: userMap["neha@creator.com"]._id,
      caption: "🎨 Neha Digital Sculpture Art (20 Comments Tie Winner)",
      category: "Art",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 60,
      commentCount: 20,
      viewCount: 150,
      createdAt: getWeekDate(2, 2)
    });
    postsToInsert.push({
      userId: userMap["karan@creator.com"]._id,
      caption: "🎨 Karan Oil Painting Masterpiece (10 Comments Tie RunnerUp)",
      category: "Art",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 90,
      commentCount: 10,
      viewCount: 150,
      createdAt: getWeekDate(2, 4)
    });

    // --- SCENARIO 6: Ineligible Non-Chhattisgarh Top Post (Delhi Pro) ---
    // Delhi Pro has a massive post (Score = 1200.0), but residency = "Delhi" -> INELIGIBLE!
    postsToInsert.push({
      userId: userMap["delhi_pro@creator.com"]._id,
      caption: "🔥 Delhi Pro Viral Stunt (Ineligible for Prizes - Delhi Residency)",
      category: "Entertainment",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 500,
      commentCount: 100,
      viewCount: 2000, // Score = 500 + 300 + 400 = 1200.0
      createdAt: getWeekDate(4, 1)
    });

    // --- SCENARIO 7: Exhausted Category (Education) ---
    // Only 1 Chhattisgarh creator (Amitabh) posts in Education category -> 2nd place left unawarded
    postsToInsert.push({
      userId: userMap["amitabh@creator.com"]._id,
      caption: "📚 Master Mathematics in 60 Seconds #Education",
      category: "Education",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 120,
      commentCount: 25,
      viewCount: 500, // Score = 120 + 75 + 100 = 295.0
      createdAt: getWeekDate(1, 5)
    });

    // --- SCENARIO 8: Gaming Category (Sneha Reddy) ---
    postsToInsert.push({
      userId: userMap["sneha@creator.com"]._id,
      caption: "🎮 Esports World Final Clutch Play #Gaming",
      category: "Gaming",
      mediaUrl: getNextReel(),
      mediaType: "video",
      likeCount: 220,
      commentCount: 40,
      viewCount: 800, // Score = 220 + 120 + 160 = 500.0
      createdAt: getWeekDate(3, 5)
    });

    // --- Fill Remaining Creators Across 4 Weeks & 10 Categories ---
    const remainingCreators = [
      "deepika@creator.com",
      "ranbir@creator.com",
      "alia@creator.com",
      "varun@creator.com",
      "kriti@creator.com",
      "siddharth@creator.com",
      "kiara@creator.com",
      "ayushmann@creator.com",
      "bhumi@creator.com",
      "rajkummar@creator.com",
      "shraddha@creator.com",
      "vicky@creator.com",
      "katrina@creator.com",
      "kartik@creator.com",
      "rashmika@creator.com",
      "tiger@creator.com",
      "mumbai_pro@creator.com",
      "bangalore_tech@creator.com",
      "kolkata_art@creator.com",
      "punjab_fit@creator.com"
    ];

    remainingCreators.forEach((email, creatorIndex) => {
      const userObj = userMap[email];
      if (!userObj) return;

      // Create 2 to 4 reels per creator spread across 4 weeks
      for (let w = 1; w <= 4; w++) {
        const cat = CATEGORIES[(creatorIndex + w) % CATEGORIES.length];
        const likes = Math.floor(Math.random() * 80) + 15;
        const comments = Math.floor(Math.random() * 15) + 2;
        const views = Math.floor(Math.random() * 300) + 50;

        postsToInsert.push({
          userId: userObj._id,
          caption: `${userObj.name} - ${cat} Reel W${w}`,
          category: cat,
          mediaUrl: getNextReel(),
          mediaType: "video",
          likeCount: likes,
          commentCount: comments,
          viewCount: views,
          createdAt: getWeekDate(w, (creatorIndex % 5) + 1)
        });
      }
    });

    // 5. Bulk Insert Posts
    const createdPosts = await Post.insertMany(postsToInsert);
    console.log(`✅ Seeded ${createdPosts.length} Video Posts with real .mp4 video reel media.`);

    // 6. Bulk Insert Realistic Comments for Every Video Reel
    const SAMPLE_COMMENTS = [
      "This is absolute fire! 🔥🔥",
      "Amazing editing and content bro! 👏",
      "Best reel in this category hands down 🙌",
      "Super smooth moves, love this audio 🎵",
      "Which camera or phone did you use to film this?",
      "This deserves 1M views minimum! 🚀",
      "So inspiring! Keep creating more contents like this.",
      "Hahaha this is so funny 😭😂",
      "Chhattisgarh creators represent! ❤️",
      "Incredible quality! Loved the breakdown.",
      "Mind = Blown 💥💥",
      "Saved this to rewatch later! ✨",
      "Can you make a part 2 of this reel please?",
      "Too good!🔥 Following your profile!"
    ];

    const commentsToInsert = [];
    const allUsers = userDocs;

    for (const p of createdPosts) {
      // Pick 3 to 6 random commenters per post (unique per post)
      const shuffledUsers = [...allUsers]
        .filter(u => u._id.toString() !== p.userId.toString())
        .sort(() => 0.5 - Math.random());
      
      const count = Math.min(shuffledUsers.length, Math.floor(Math.random() * 5) + 3);
      for (let i = 0; i < count; i++) {
        commentsToInsert.push({
          postId: p._id,
          userId: shuffledUsers[i]._id,
          text: SAMPLE_COMMENTS[(i + new Date(p.createdAt).getTime()) % SAMPLE_COMMENTS.length],
          createdAt: new Date(new Date(p.createdAt).getTime() + (i + 1) * 3600000)
        });
      }

      // Update post commentCount
      await Post.updateOne({ _id: p._id }, { commentCount: count });
    }

    if (commentsToInsert.length > 0) {
      await Comment.insertMany(commentsToInsert);
      console.log(`✅ Seeded ${commentsToInsert.length} Realistic Comments across ${createdPosts.length} reels.`);
    }

    console.log("==================================================");
    console.log("🎉 Seeding Completed Successfully!");
    console.log("==================================================");

    process.exit(0);
  } catch (error) {
    console.error("💥 Seed Database Error:", error);
    process.exit(1);
  }
};

seedDatabase();
