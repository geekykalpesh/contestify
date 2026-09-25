const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    residency: {
      type: String,
      required: true,
      default: "Chhattisgarh",
      index: true
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    dob: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true
    },
    kycDetails: {
      aadharNumber: { type: String, default: "" },
      aadharMobile: { type: String, default: "" },
      dob: { type: String, default: "" },
      aadharImage: { type: String, default: "" },
      status: {
        type: String,
        enum: ["NOT_SUBMITTED", "PENDING", "PASSED", "FAILED"],
        default: "NOT_SUBMITTED",
        index: true
      },
      rejectionReason: { type: String, default: "" },
      submittedAt: { type: Date }
    }
  },
  { timestamps: true }
);

// High-Scale Indexes for Millions of Users
userSchema.index({ name: "text", email: "text", username: "text" });
userSchema.index({ "kycDetails.status": 1, residency: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ residency: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
