const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index — automatically deletes expired docs from DB
    index: { expires: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
