import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true
});

socket.on("connect", () => {
  console.log("[Socket.io Client] Connected to server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("[Socket.io Client] Disconnected from server");
});
