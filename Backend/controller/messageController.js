
// import Message from '../models/message.js';
// import User from "../models/user.js";

// // 1. Room ID generate karne ka standard tareeka (Alphabetical sorting of emails)
// export const getRoomId = (email1, email2) => {
//     console.log("--- getRoomId Debug ---");
//     console.log("Email 1:", email1);
//     console.log("Email 2:", email2);
    
//     const roomId = [email1, email2].sort().join("_");
    
//     console.log("Generated Room ID:", roomId);
//     console.log("------------------------");
    
//     return roomId; 
// };

// // 2. Message Save karne ka Controller Function
// export const saveChatMessage = async (data) => {
//   try {
//     const { sender, receiver, message, roomId } = data;

//     // Yahan check karein ki message object ke andar iv aur ciphertext aa rahe hain
//     // Agar aapka schema 'senderEmail' aur 'recipientEmail' maang raha hai, toh mapping karein:
//     const newMessage = await Message.create({
//       senderEmail: sender,       // Mapping sender -> senderEmail
//       recipientEmail: receiver,  // Mapping receiver -> recipientEmail
//       roomId: roomId,
//       iv: message?.iv ? Buffer.from(message.iv) : '', // Array ko buffer ya string jaisa schema chahe
//       ciphertext: message?.ciphertext ? Buffer.from(message.ciphertext) : '',
//       header: message?.header || { dummy: true }, // Agar header zaroori hai toh default object
//     });

//     return { success: true, data: newMessage };
//   } catch (error) {
//     console.error("Save Chat Error:", error);
//     return { success: false, error: error.message };
//   }
// };

// // 3. Chat History fetch karne ka Controller (Email-based)
// export const getChatHistory = async (req, res) => {
//   try {
//     const { user1, user2 } = req.params;
//     const roomId = getRoomId(user1, user2);

//     // Emails store hain, isliye populate ki zaroorat nahi hai
//     const messages = await Message.find({ room: roomId })
//       .sort({ createdAt: 1 });

//     return res.status(200).json({
//       success: true,
//       count: messages.length,
//       messages
//     });
//   } catch (error) {
//     console.error("Error fetching chat history:", error);
//     return res.status(500).json({ success: false, error: "Server Error" });
//   }
// };

// // 4. Messages ko "Seen" mark karne ke liye Controller (Email-based)
// export const markAsSeen = async (req, res) => {
//   try {
//     const { senderId, receiverId } = req.body; // Yahan senderId/receiverId emails ho sakti hain
//     const roomId = getRoomId(senderId, receiverId);

//     await Message.updateMany(
//       { room: roomId, receiver: receiverId, seen: false },
//       { $set: { seen: true } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Messages marked as seen"
//     });
//   } catch (error) {
//     console.error("Error updating seen status:", error);
//     return res.status(500).json({ success: false, error: "Server Error" });
//   }
// };

// // 5. Chat List fetch karne ka Controller (Email-based & Safe)
// export const getChatList = async (req, res) => {
//   try {
//     const currentUserEmail = req.user?.email; 

//     if (!currentUserEmail) {
//       return res.status(401).json({ success: false, message: "Unauthorized user email not found" });
//     }

//     const messages = await Message.find({
//       $or: [
//         { sender: currentUserEmail },
//         { receiver: currentUserEmail }
//       ]
//     })
//     .sort({ createdAt: -1 });

//     const chatMap = new Map();

//     for (const msg of messages) {
//       // Safety check: Agar sender ya receiver missing ho toh skip karein
//       if (!msg.sender || !msg.receiver) continue;

//       // Handle both string emails or populated objects safely
//       const senderStr = typeof msg.sender === 'string' ? msg.sender : msg.sender.email;
//       const receiverStr = typeof msg.receiver === 'string' ? msg.receiver : msg.receiver.email;

//       if (!senderStr || !receiverStr) continue;

//       const otherUserEmail = senderStr.toLowerCase() === currentUserEmail.toLowerCase() 
//         ? receiverStr 
//         : senderStr;

//       if (!chatMap.has(otherUserEmail)) {
//         const userDoc = await User.findOne({ email: otherUserEmail });

//         chatMap.set(otherUserEmail, {
//           _id: otherUserEmail,
//           firstname: userDoc?.firstname || otherUserEmail.split('@')[0],
//           email: otherUserEmail,
//           lastMessage: msg.message,
//           updatedAt: msg.createdAt,
//         });
//       }
//     }

//     const chatList = Array.from(chatMap.values());

//     return res.status(200).json({
//       success: true,
//       chats: chatList,
//     });
//   } catch (error) {
//     console.error("Chat list error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Chat list fetch karne mein error aayi: " + error.message,
//     });
//   }
// };
import Message from '../models/message.js';
import User from "../models/user.js";

// Room ID generate karne ka standard tareeka
export const getRoomId = (email1, email2) => {
    return [email1.trim().toLowerCase(), email2.trim().toLowerCase()].sort().join("_"); 
};

// Message Save karne ka Controller Function
export const saveChatMessage = async (data) => {
  try {
    const { sender, receiver, message } = data;

    const senderVal = sender || data.senderEmail;
    const recipientVal = receiver || data.recipientEmail;

    if (!senderVal || !recipientVal || !message) {
      return { success: false, error: "Sender, recipient, and message are required" };
    }

    // Buffer ko properly check karke string ya buffer convert karein schema ke mutabiq
    const newMessage = await Message.create({
      senderEmail: senderVal,       
      recipientEmail: recipientVal, 
      iv: message?.iv ? (Array.isArray(message.iv) ? Buffer.from(message.iv).toString('hex') : message.iv) : '', 
      ciphertext: message?.ciphertext ? (Array.isArray(message.ciphertext) ? Buffer.from(message.ciphertext).toString('hex') : message.ciphertext) : '',
      header: message?.header || { dummy: true },
    });

    return { success: true, data: newMessage };
  } catch (error) {
    console.error("Save Chat Error:", error);
    return { success: false, error: error.message };
  }
};

// Chat History fetch karne ka Controller (Sender aur Recipient ke base par)
export const getChatHistory = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    
    // Dono users ke beech ke saare messages nikal lo (chahe kisi ne bhi bheje ho)
    const messages = await Message.find({
      $or: [
        { senderEmail: user1, recipientEmail: user2 },
        { senderEmail: user2, recipientEmail: user1 }
      ]
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Chat List fetch karne ka Controller
export const getChatList = async (req, res) => {
  try {
    const currentUserEmail = req.user?.email; 

    if (!currentUserEmail) {
      return res.status(401).json({ success: false, message: "Unauthorized user email not found" });
    }

    const messages = await Message.find({
      $or: [
        { senderEmail: currentUserEmail },
        { recipientEmail: currentUserEmail }
      ]
    })
    .sort({ createdAt: -1 });

    const chatMap = new Map();

    for (const msg of messages) {
      const senderStr = msg.senderEmail;
      const receiverStr = msg.recipientEmail;

      if (!senderStr || !receiverStr) continue;

      const otherUserEmail = senderStr.toLowerCase() === currentUserEmail.toLowerCase() 
        ? receiverStr 
        : senderStr;

      if (!chatMap.has(otherUserEmail)) {
        const userDoc = await User.findOne({ email: otherUserEmail });

        chatMap.set(otherUserEmail, {
          _id: otherUserEmail,
          firstname: userDoc?.firstname || otherUserEmail.split('@')[0],
          email: otherUserEmail,
          lastMessage: msg.ciphertext ? "[Encrypted Message]" : msg.message,
          updatedAt: msg.createdAt,
        });
      }
    }

    const chatList = Array.from(chatMap.values());

    return res.status(200).json({
      success: true,
      chats: chatList,
    });
  } catch (error) {
    console.error("Chat list error:", error);
    return res.status(500).json({
      success: false,
      message: "Chat list fetch karne mein error aayi: " + error.message,
    });
  }
};
export const markAsSeen = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body; // Yahan senderId/receiverId emails ho sakti hain
    const roomId = getRoomId(senderId, receiverId);

    await Message.updateMany(
      { room: roomId, receiver: receiverId, seen: false },
      { $set: { seen: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as seen"
    });
  } catch (error) {
    console.error("Error updating seen status:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};
