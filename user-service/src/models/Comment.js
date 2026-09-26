const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Comment", commentSchema);

