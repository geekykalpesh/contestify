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
    }
  },
  { timestamps: true }
);

postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
