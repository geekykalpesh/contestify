import { io } from "socket.io-client";
import { USER_SERVICE_URL } from "../config";

const SOCKET_URL = USER_SERVICE_URL;

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
