import express from 'express';
import { getChatHistory, markAsSeen,getChatList } from '../controller/messageController.js';
import userMiddleware from '../middlewere/userMiddlewere.js';
const messageRouter = express.Router();

// Route: Do users ke beech ki chat history nikalne ke liye
// URL test: GET http://localhost:5000/api/messages/history/userA_id/userB_id
messageRouter.get('/history/:user1/:user2',userMiddleware, getChatHistory);

// Route: Messages ko seen mark karne ke liye
// URL test: POST http://localhost:5000/api/messages/seen
messageRouter.post('/seen', markAsSeen);
messageRouter.get("/chat-list",userMiddleware, getChatList);

export default messageRouter;