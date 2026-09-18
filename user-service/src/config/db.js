const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || "mongodb://localhost:27017/creator_contest_user_db";
    const conn = await mongoose.connect(connStr);
    console.log(`[User Service] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[User Service] MongoDB Connection Error: ${error.message}`);
    // If running in development without local mongo, log warning instead of crashing
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
