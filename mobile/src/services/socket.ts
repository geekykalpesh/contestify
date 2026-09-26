import { io } from 'socket.io-client';
import { USER_SERVICE_URL } from '../config';

export const socket = io(USER_SERVICE_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect_error', (err) => {
  // Silently swallow connection errors to prevent native Expo Go crashes
});
