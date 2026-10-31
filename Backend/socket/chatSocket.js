import { saveChatMessage, getRoomId } from '../controller/messageController.js'; 
import Message from '../models/message.js'; // Database se pending messages nikalne ke liye

export const handleChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('user connected', socket.id);

        // 1. User online aate hi apna email register karega (Room join karega)
        socket.on('register_user', async (email) => {
            if (!email) return;
            socket.join(email); // User ki email ka individual room
            console.log(`User registered and joined email room: ${email}`);

            try {
                // Offline/Unread messages find karo jo is receiver ke liye queued the
                const pendingMessages = await Message.find({ 
                    receiver: email, 
                    seen: false 
                }).sort({ createdAt: 1 });

                if (pendingMessages.length > 0) {
                    socket.emit('queued_messages', pendingMessages);
                    console.log(`Sent ${pendingMessages.length} queued messages to ${email}`);
                }
            } catch (err) {
                console.error("Error fetching queued messages:", err);
            }
        });

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log('user joined the room', roomId);
        });

        socket.on('send_message', async (data) => {
            const { sender, receiver, message } = data;
            const roomId = getRoomId(sender, receiver);

            const result = await saveChatMessage({ sender, receiver, message });

            if (result.success) {
                socket.to(data.roomId).emit('receive_msg', data);
            } else {
                console.error("Controller save failed:", result.error);
                socket.emit('error_message', { message: result.error });
            }
        });

        socket.on('disconnect', () => {
            console.log('user disconnected', socket.id);
        });
    });
};