const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: true }
);

viewSchema.index({ postId: 1, userId: 1 }, { unique: true });
viewSchema.index({ userId: 1, postId: 1 });

module.exports = mongoose.model("View", viewSchema);
