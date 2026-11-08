// import { saveChatMessage, getRoomId } from "../controller/messageController.js";
// import redisClient from "../config/redis.js";
// import Message from "../models/message.js";

// export const handleChatSocket = (io) => {
//   const onlineUsers = new Map();

//   io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // 1. User register karega
//     socket.on("register_user", async (email) => {
//       try {
//         if (!email) return;
//         socket.userEmail = email;
//         socket.join(email);
//         onlineUsers.set(email, socket.id);
//         console.log(`👤 User registered and joined email room: ${email}`);
//       } catch (err) {
//         console.error("Error in register_user:", err);
//       }
//     });

//     // 2. Room join karne par queue check hogi aur pending messages bheje jayenge
//     socket.on("join_roomId", async (roomId) => {
//       try {
//         if (!roomId || !socket.userEmail) return;
//         socket.join(roomId);
//         console.log(`👉 [JOIN_ROOM] Socket ${socket.id} joined room ID: ${roomId} for user: ${socket.userEmail}`);

//         const queueKey = `offline_msgs:${roomId}:${socket.userEmail}`;
//         const pendingMessages = await redisClient.lRange(queueKey, 0, -1);

//         if (pendingMessages && pendingMessages.length > 0) {
//           const parsedMessages = pendingMessages.map((msg) => JSON.parse(msg));
          
//           // Frontend ko queued messages bhej do
//           socket.emit("queued_messages", parsedMessages);
//           console.log(`📦 Sent ${parsedMessages.length} queued messages for Room: ${roomId} to User: ${socket.userEmail}`);

//           // Queue clear kar do taaki dobara duplicate na aaye
//           await redisClient.del(queueKey);
//           console.log(`🗑️ Cleared queue for key: ${queueKey}`);
//         }
//       } catch (err) {
//         console.error("Error joining room and fetching queue:", err);
//       }
//     });

//     // 3. Message bhejne ka logic (Live vs Queue Management)
//     socket.on("send_message", async (data) => {
//       try {
//         const { sender, receiver, message } = data;
        
//         if (!sender || !receiver || !message) {
//           socket.emit("error_message", { message: "Invalid message payload." });
//           return;
//         }

//         const roomId = getRoomId(sender, receiver);
//         console.log(`💬 [SEND_MESSAGE] Sender: ${sender} | Receiver: ${receiver} | Room ID: ${roomId}`);

//         // Database mein permanent save karo
//         const result = await saveChatMessage({
//           sender,
//           receiver,
//           message,
//           roomId,
//         });

//         if (result.success) {
//           const messagePayload = { 
//             ...data, 
//             roomId, 
//             createdAt: result.data?.createdAt || new Date() 
//           };

//           const receiverSocketId = onlineUsers.get(receiver);
//           const room = io.sockets.adapter.rooms.get(roomId);
          
//           // Check karo ki receiver online hai AUR usi specific room ke andar present hai
//           const isReceiverInThisRoom = receiverSocketId && room && room.has(receiverSocketId);

//           if (isReceiverInThisRoom) {
//             // Agar receiver room mein active hai, toh turant live bhej do
//             io.to(roomId).emit("receive_msg", messagePayload);
//             console.log(`✅ Live message delivered to room: ${roomId}`);
//           } else {
//             // Agar receiver offline hai ya doosri chat mein busy hai, toh Redis queue me daal do
//             const queueKey = `offline_msgs:${roomId}:${receiver}`;
//             await redisClient.rPush(queueKey, JSON.stringify(messagePayload));
//             console.log(`⏳ Receiver not in room. Saved to Redis queue: ${queueKey}`);
//           }
//         } else {
//           console.error("Controller save failed:", result.error);
//           socket.emit("error_message", { message: result.error || "Failed to save message." });
//         }
//       } catch (err) {
//         console.error("Error in send_message:", err);
//         socket.emit("error_message", { message: "Internal server error." });
//       }
//     });

//     // 4. Seen status update
//     socket.on("mark_messages_seen", async ({ roomId, userId }) => {
//       try {
//         if (!roomId || !userId) return;

//         await Message.updateMany(
//           { roomId, sender: { $ne: userId }, seen: false },
//           { $set: { seen: true } }
//         );

//         io.to(roomId).emit("messages_seen", { roomId, readerId: userId });
//       } catch (err) {
//         console.error("Error marking messages as seen:", err);
//       }
//     });

//     // 5. Disconnect handling
//     socket.on("disconnect", () => {
//       try {
//         for (let [email, sId] of onlineUsers.entries()) {
//           if (sId === socket.id) {
//             onlineUsers.delete(email);
//             break;
//           }
//         }
//       } catch (err) {
//         console.error("Error in disconnect handler:", err);
//       }
//     });
//   });
// };
import { saveChatMessage, getRoomId } from "../controller/messageController.js";
import redisClient from "../config/redis.js";
import Message from "../models/message.js";

export const handleChatSocket = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. User register karega aur apna personal inbox/queue flush karega
    socket.on("register_user", async (email) => {
      try {
        if (!email) return;
        socket.userEmail = email;
        socket.join(email); // User ka personal room
        onlineUsers.set(email, socket.id);
        console.log(`👤 User registered and joined email room: ${email}`);

        // OPTIONAL AUTOMATIC FLUSH ON LOGIN:
        // Jaise hi user register/connect ho, uska global offline queue check karke bhej do
        const queueKey = `offline_msgs:${email}`;
        const pendingMessages = await redisClient.lRange(queueKey, 0, -1);

        if (pendingMessages && pendingMessages.length > 0) {
          const parsedMessages = pendingMessages.map((msg) => JSON.parse(msg));
          
          // Seedha user ke personal socket par bhej do (Frontend ise unread/chats list me handle karega)
          socket.emit("queued_messages", parsedMessages);
          console.log(`📦 Sent ${parsedMessages.length} queued messages to User: ${email}`);

          await redisClient.del(queueKey);
          console.log(`🗑️ Cleared global queue for key: ${queueKey}`);
        }
      } catch (err) {
        console.error("Error in register_user:", err);
      }
    });

    // 2. Room join karne par sirf room join hoga (Purana queue logic yahan se hata diya hai taaki mix na ho)
    socket.on("join_roomId", async (roomId) => {
      try {
        if (!roomId || !socket.userEmail) return;
        socket.join(roomId);
        console.log(`👉 [JOIN_ROOM] Socket ${socket.id} joined room ID: ${roomId} for user: ${socket.userEmail}`);
      } catch (err) {
        console.error("Error joining room:", err);
      }
    });

    // 3. Message bhejne ka logic (Live vs Global Queue Management)
    socket.on("send_message", async (data) => {
      try {
        const { sender, receiver, message } = data;
        
        if (!sender || !receiver || !message) {
          socket.emit("error_message", { message: "Invalid message payload." });
          return;
        }

        const roomId = getRoomId(sender, receiver);
        console.log(`💬 [SEND_MESSAGE] Sender: ${sender} | Receiver: ${receiver} | Room ID: ${roomId}`);

        // Database mein permanent save karo
        const result = await saveChatMessage({
          sender,
          receiver,
          message,
          roomId,
        });

        if (result.success) {
          const messagePayload = { 
            ...data, 
            roomId, 
            createdAt: result.data?.createdAt || new Date() 
          };

          const receiverSocketId = onlineUsers.get(receiver);
          const room = io.sockets.adapter.rooms.get(roomId);
          
          // Check karo ki receiver online hai AUR usi specific room ke andar present hai
          const isReceiverInThisRoom = receiverSocketId && room && room.has(receiverSocketId);

          if (isReceiverInThisRoom) {
            // ✅ Agar receiver usi chat room mein active hai, toh live bhej do
            io.to(roomId).emit("receive_msg", messagePayload);
            console.log(`✅ Live message delivered to active room: ${roomId}`);
          } else {
            // ❌ Agar receiver offline hai YA kisi doosri chat mein busy hai, 
            // toh uske PERSONAL Redis queue me daalo (Room me nahi!)
            const queueKey = `offline_msgs:${receiver}`;
            await redisClient.rPush(queueKey, JSON.stringify(messagePayload));
            console.log(`⏳ Receiver not active in room ${roomId}. Saved to User's Global Redis queue: ${queueKey}`);

            // OPTIONAL: Agar receiver online hai par doosri chat mein hai, 
            // toh use live event bhej do taaki uska sidebar/unread badge update ho sake (chat window me append mat karna frontend par)
            if (receiverSocketId) {
              io.to(receiver).emit("new_message_notification", messagePayload);
            }
          }
        } else {
          console.error("Controller save failed:", result.error);
          socket.emit("error_message", { message: result.error || "Failed to save message." });
        }
      } catch (err) {
        console.error("Error in send_message:", err);
        socket.emit("error_message", { message: "Internal server error." });
      }
    });

    // 4. Seen status update
    socket.on("mark_messages_seen", async ({ roomId, userId }) => {
      try {
        if (!roomId || !userId) return;

        await Message.updateMany(
          { roomId, sender: { $ne: userId }, seen: false },
          { $set: { seen: true } }
        );

        io.to(roomId).emit("messages_seen", { roomId, readerId: userId });
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    });

    // 5. Disconnect handling
    socket.on("disconnect", () => {
      try {
        for (let [email, sId] of onlineUsers.entries()) {
          if (sId === socket.id) {
            onlineUsers.delete(email);
            break;
          }
        }
      } catch (err) {
        console.error("Error in disconnect handler:", err);
      }
    });
  });
};