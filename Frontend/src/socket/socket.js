import { io } from 'socket.io-client';

// Environment ke hisaab se URL automatically switch ho jayega
const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://kryptchatbackend.onrender.com'; // 👈 Aapka live Render backend URL

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true, // 👈 Cookies (authentication) bhejne ke liye
  transports: ['websocket', 'polling']
});

export default socket;