const { Server } = require("socket.io");

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("join_post", (postId) => {
      socket.join(`post_${postId}`);
    });

    socket.on("leave_post", (postId) => {
      socket.leave(`post_${postId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitPostUpdated = (data) => {
  if (io) {
    io.emit("post_updated", data);
    io.to(`post_${data.postId}`).emit("post_updated", data);
  }
};

const emitNewComment = (postId, comment) => {
  if (io) {
    io.emit("new_comment", { postId, comment });
    io.to(`post_${postId}`).emit("new_comment", { postId, comment });
  }
};

const emitNotification = (recipientId, notification) => {
  if (io) {
    io.emit("new_notification", { recipientId, notification });
  }
};

module.exports = {
  initSocket,
  emitPostUpdated,
  emitNewComment,
  emitNotification
};
