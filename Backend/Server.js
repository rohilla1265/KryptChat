
// const app = express();
// app.use(cookieParser());

// connectDB();

// // 2. Middlewares
// app.use(express.json());
// app.use(
//   cors({
//     origin: 'http://localhost:5173', 
//     credentials: true,              
//   })
// );

// // 3. API Routes
// app.use('/api/auth', authRouter);
// app.use('/api/messages', messageRouter);
// // 4. Server & Socket Initialization
// const server = createServer(app);
// const io = new Server(server, {
//     cors:{
//     origin: 'http://localhost:5173', 
//     credentials: true,                
//   }
// });

// // 5. Plug-in Socket Logic
// handleChatSocket(io);

// // 6. Server Listen
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

import { configDotenv } from 'dotenv';
configDotenv(); // 👈 1. Sabse pehle env variables load karo

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import authRouter from './routes/authRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { handleChatSocket } from './socket/chatSocket.js'; 

const app = express();

// 2. CORS ko sabse upar rakho taaki credentials/cookies properly allow ho sakein
app.use(
  cors({
    origin: 'https://kryptchat-0k6b.onrender.com',
    credentials: true,
  })
);

// 3. Baaki middlewares
app.use(express.json());
app.use(cookieParser());

// 4. Database Connection
connectDB();

// 5. API Routes
app.use('/api/auth', authRouter);
app.use('/api/messages', messageRouter);

// 6. Server & Socket Initialization
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: 'https://kryptchat-0k6b.onrender.com',
      credentials: true,                
    }
});

// 7. Socket Logic
handleChatSocket(io);

// 8. Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));