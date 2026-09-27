const mongoose = require("mongoose");
const { CATEGORIES } = require("../config/constants");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    caption: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      index: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["image", "video"]
    },
    thumbnailUrl: {
      type: String
    },
    originalFilename: {
      type: String
    },
    mimeType: {
      type: String
    },
    sizeBytes: {
      type: Number
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true
    },
    bannedAt: {
      type: Date
    },
    banReason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

postSchema.index({ isBanned: 1, createdAt: -1 });
postSchema.index({ isBanned: 1, category: 1, createdAt: -1 });
postSchema.index({ isBanned: 1, userId: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ caption: "text", category: "text" });

module.exports = mongoose.model("Post", postSchema);
