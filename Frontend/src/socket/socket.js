import { io } from 'socket.io-client';

// Socket ko permanently autoConnect: true kar diya hai taaki automatic connection bane[cite: 13]
const socket = io('https://kryptchatbackend.onrender.com/', {
  autoConnect: true,
  withCredentials: true, // 👈 Cookies bhejne ke liye
  transports: ['websocket', 'polling']
});

export default socket;