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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    kycDetails: {
      aadharNumber: { type: String, default: "" },
      aadharMobile: { type: String, default: "" },
      dob: { type: String, default: "" },
      aadharImage: { type: String, default: "" },
      status: {
        type: String,
        enum: ["NOT_SUBMITTED", "PENDING", "PASSED", "FAILED"],
        default: "NOT_SUBMITTED"
      },
      rejectionReason: { type: String, default: "" },
      submittedAt: { type: Date }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
