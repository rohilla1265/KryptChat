// import { useState, useEffect, useRef, useCallback } from 'react';
// import socket from '../socket/socket';
// import { fetchChatHistory } from '../api/chatApi';
// import { saveLocalMessage, getLocalMessagesByRoom } from '../utils/db';
// import { 
//   deriveSessionKey, 
//   deriveNextKey, 
//   encryptMessageWithKey, 
//   decryptWithKeyRing 
// } from '../utils/crypto';

// export function useChatRoom(currentUser, receiverUser) {
//   const [messages, setMessages] = useState([]);
//   const [isSessionReady, setIsSessionReady] = useState(false);
  
//   const sendKeyRef = useRef('');
//   const recvKeyRingRef = useRef([]);

//   const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
//   const receiverUserId = typeof receiverUser === 'object' ? receiverUser?.email : receiverUser;

//   const getRoomId = (u1, u2) => [u1, u2].sort().join("_");
//   const roomId = currentUserId && receiverUserId ? getRoomId(currentUserId, receiverUserId) : null;

//   // 1. Initialize E2EE Session Key
//   useEffect(() => {
//     let isMounted = true;
//     if (roomId) {
//       setIsSessionReady(false);
//       const sessionSeed = `${roomId}_KryptChat_Session_Seed`;
//       deriveSessionKey(sessionSeed).then((hexKey) => {
//         if (!isMounted) return;
//         sendKeyRef.current = hexKey;
//         recvKeyRingRef.current = [hexKey];
//         setIsSessionReady(true);
//       });
//     }
//     return () => { isMounted = false; };
//   }, [roomId]);

//   // 2. Setup Socket Subscriptions and Message History Fetching
//   useEffect(() => {
//     if (!currentUserId || !receiverUserId || !roomId || !isSessionReady) return;

//     socket.emit('register_user', currentUserId);
//     socket.emit('join_roomId', roomId);
//     socket.emit('mark_messages_seen', { roomId, userId: currentUserId });

//     // Internal helper to decrypt and update ratchet
//     const processIncomingPayload = async (encPayload) => {
//       if (!encPayload) return null;
//       const decryptedText = await decryptWithKeyRing(
//         { ciphertext: encPayload.ciphertext, iv: encPayload.iv }, 
//         recvKeyRingRef.current
//       );

//       if (decryptedText) {
//         const latestKey = recvKeyRingRef.current[recvKeyRingRef.current.length - 1];
//         const nextKey = await deriveNextKey(latestKey);
//         recvKeyRingRef.current.push(nextKey);
//         if (recvKeyRingRef.current.length > 3) { // 👈 4 ki jagah 3 karo
//           recvKeyRingRef.current.shift();
//         }
//         return decryptedText;
//       }
//       return "[Unable to decrypt - Key mismatch]";
//     };

//     // Load History / DB Cache
//     getLocalMessagesByRoom(roomId).then(async (localMsgs) => {
//       if (localMsgs && localMsgs.length > 0) {
//         setMessages(localMsgs);
//       } else {
//         try {
//           const history = await fetchChatHistory(currentUserId, receiverUserId);
//           const decryptedHistory = [];

//           for (const msg of history || []) {
//             const encPayload = (msg.ciphertext && msg.iv) 
//               ? msg 
//               : (msg.message?.ciphertext && msg.message?.iv ? msg.message : null);

//             if (encPayload) {
//               const msgSenderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email : msg.sender);
//               const decryptedText = await processIncomingPayload(encPayload);

//               const savedMsg = {
//                 roomId,
//                 sender: msgSenderId,
//                 senderEmail: msgSenderId,
//                 message: decryptedText || "[Unable to decrypt]",
//                 seen: msg.seen || false,
//                 createdAt: msg.createdAt || new Date().toISOString()
//               };

//               await saveLocalMessage(savedMsg);
//               decryptedHistory.push(savedMsg);
//             } else {
//               decryptedHistory.push(msg);
//             }
//           }
//           setMessages(decryptedHistory);
//         } catch (err) {
//           console.error("Error fetching chat history:", err);
//         }
//       }
//     });

//     // Real-Time Socket Handlers
//     const handleReceiveMsg = async (data) => {
//       const senderId = data.sender || data.senderEmail;
//       if (senderId === currentUserId) return;

//       const encPayload = (data.message?.ciphertext && data.message?.iv) 
//         ? data.message 
//         : ((data.ciphertext && data.iv) ? data : null);

//       let decryptedText = typeof data.message === 'string' ? data.message : "[Unable to decrypt]";
//       if (encPayload) {
//         decryptedText = await processIncomingPayload(encPayload);
//       }

//       const incomingPlainMsg = {
//         roomId,
//         sender: senderId,
//         senderEmail: senderId,
//         message: decryptedText,
//         seen: true,
//         createdAt: data.createdAt || new Date().toISOString()
//       };

//       await saveLocalMessage(incomingPlainMsg);
//       setMessages((prev) => [...prev, incomingPlainMsg]);
//       socket.emit('mark_messages_seen', { roomId, userId: currentUserId });
//     };

//     const handleQueuedMessages = async (pendingMsgs) => {
//       for (const msg of pendingMsgs) {
//         const encPayload = (msg.message?.ciphertext && msg.message?.iv) 
//           ? msg.message 
//           : ((msg.ciphertext && msg.iv) ? msg : null);

//         let decryptedText = typeof msg.message === 'string' ? msg.message : "[Unable to decrypt]";
//         if (encPayload) {
//           decryptedText = await processIncomingPayload(encPayload);
//         }

//         const formattedMsg = {
//           roomId: msg.roomId || roomId,
//           sender: msg.sender || msg.senderEmail,
//           senderEmail: msg.sender || msg.senderEmail,
//           message: decryptedText,
//           seen: msg.seen || false,
//           createdAt: msg.createdAt || new Date().toISOString()
//         };

//         // 🟢 Duplicate Check: Agar message pehle se state mein hai, toh skip karo (Ratchet bachane ke liye)
//         setMessages((prev) => {
//           const exists = prev.some(
//             (m) => m.createdAt === formattedMsg.createdAt && m.sender === formattedMsg.sender
//           );
//           if (exists) return prev;

//           saveLocalMessage(formattedMsg);
//           return [...prev, formattedMsg];
//         });
//       }
//       socket.emit('mark_messages_seen', { roomId, userId: currentUserId });
//     };

//     const handleMessagesSeen = ({ readerId }) => {
//       if (readerId !== currentUserId) {
//         setMessages((prev) => prev.map(msg => ({ ...msg, seen: true })));
//       }
//     };

//     socket.on('receive_msg', handleReceiveMsg);
//     socket.on('queued_messages', handleQueuedMessages);
//     socket.on('messages_seen', handleMessagesSeen);

//     return () => {
//       socket.off('receive_msg', handleReceiveMsg);
//       socket.off('queued_messages', handleQueuedMessages);
//       socket.off('messages_seen', handleMessagesSeen);
//     };
//   }, [roomId, isSessionReady, currentUserId, receiverUserId]);

//   // Outbound Dispatcher
//   const sendMessage = useCallback(async (plainText) => {
//     if (!plainText || !isSessionReady || !sendKeyRef.current) return;

//     const encryptedPayload = await encryptMessageWithKey(plainText, sendKeyRef.current);
//     const createdAt = new Date().toISOString();

//     const payload = {
//       sender: currentUserId,
//       receiver: receiverUserId,
//       roomId,
//       message: encryptedPayload,
//       createdAt
//     };

//     socket.emit('send_message', payload);

//     const sentPlainMsg = {
//       roomId,
//       sender: currentUserId,
//       senderEmail: currentUserId,
//       receiver: receiverUserId,
//       message: plainText,
//       createdAt
//     };

//     await saveLocalMessage(sentPlainMsg);
//     setMessages((prev) => [...prev, sentPlainMsg]);

//     sendKeyRef.current = await deriveNextKey(sendKeyRef.current);
//   }, [isSessionReady, currentUserId, receiverUserId, roomId]);

//   return {
//     messages,
//     isSessionReady,
//     sendMessage,
//     currentUserId
//   };
// }
import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket/socket';
import { fetchChatHistory } from '../api/chatApi';
import { saveLocalMessage, getLocalMessagesByRoom } from '../utils/db';
import { 
  deriveSessionKey, 
  deriveNextKey, 
  encryptMessageWithKey, 
  decryptWithKeyRing 
} from '../utils/crypto';

export function useChatRoom(currentUser, receiverUser) {
  const [messages, setMessages] = useState([]);
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  const sendKeyRef = useRef('');
  const recvKeyRingRef = useRef([]);

  const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
  const receiverUserId = typeof receiverUser === 'object' ? receiverUser?.email : receiverUser;

  const getRoomId = (u1, u2) => [u1, u2].sort().join("_");
  const roomId = currentUserId && receiverUserId ? getRoomId(currentUserId, receiverUserId) : null;

  // 1. Initialize E2EE Session Key
  useEffect(() => {
    let isMounted = true;
    if (roomId) {
      setIsSessionReady(false);
      const sessionSeed = `${roomId}_KryptChat_Session_Seed`;
      deriveSessionKey(sessionSeed).then((hexKey) => {
        if (!isMounted) return;
        sendKeyRef.current = hexKey;
        recvKeyRingRef.current = [hexKey];
        setIsSessionReady(true);
      });
    }
    return () => { isMounted = false; };
  }, [roomId]);

  // 2. Setup Socket Subscriptions and Message History Fetching
  useEffect(() => {
    if (!currentUserId || !receiverUserId || !roomId || !isSessionReady) return;

    socket.emit('register_user', currentUserId);
    socket.emit('join_roomId', roomId);
    socket.emit('mark_messages_seen', { roomId, userId: currentUserId });

    // Internal helper to decrypt and update ratchet
    // Internal helper to decrypt safely
    const processIncomingPayload = async (encPayload, isHistory = false) => {
      if (!encPayload) return null;
      
      const decryptedText = await decryptWithKeyRing(
        { ciphertext: encPayload.ciphertext, iv: encPayload.iv }, 
        recvKeyRingRef.current
      );

      if (decryptedText) {
        // 🟢 Agar yeh history ka message hai, toh ratchet ko aage mat badhao (shift mat karo) 
        // taaki live/queued messages ke liye keys safe rahein!
        if (!isHistory) {
          const latestKey = recvKeyRingRef.current[recvKeyRingRef.current.length - 1];
          const nextKey = await deriveNextKey(latestKey);
          recvKeyRingRef.current.push(nextKey);
          if (recvKeyRingRef.current.length > 20) { // Limit ko bada rakhein
            recvKeyRingRef.current.shift();
          }
        }
        return decryptedText;
      }
      return "[Unable to decrypt - Key mismatch]";
    };

    // Load History / DB Cache
    getLocalMessagesByRoom(roomId).then(async (localMsgs) => {
      if (localMsgs && localMsgs.length > 0) {
        setMessages(localMsgs);
      } else {
        try {
          const history = await fetchChatHistory(currentUserId, receiverUserId);
          const decryptedHistory = [];

          for (const msg of history || []) {
            const encPayload = (msg.ciphertext && msg.iv) 
              ? msg 
              : (msg.message?.ciphertext && msg.message?.iv ? msg.message : null);

            if (encPayload) {
              const msgSenderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email : msg.sender);
              const decryptedText = await processIncomingPayload(encPayload,true);

              const savedMsg = {
                roomId,
                sender: msgSenderId,
                senderEmail: msgSenderId,
                message: decryptedText || "[Unable to decrypt]",
                seen: msg.seen || false,
                createdAt: msg.createdAt || new Date().toISOString()
              };

              await saveLocalMessage(savedMsg);
              decryptedHistory.push(savedMsg);
            } else {
              decryptedHistory.push(msg);
            }
          }
          setMessages(decryptedHistory);
        } catch (err) {
          console.error("Error fetching chat history:", err);
        }
      }
    });

    // Real-Time Socket Handlers
    const handleReceiveMsg = async (data) => {
      // 🛑 Strict Guard: Ignore messages belonging to any other chat room
      if (data.roomId && data.roomId !== roomId) return;

      const senderId = data.sender || data.senderEmail;
      if (senderId === currentUserId) return;

      const encPayload = (data.message?.ciphertext && data.message?.iv) 
        ? data.message 
        : ((data.ciphertext && data.iv) ? data : null);

      let decryptedText = typeof data.message === 'string' ? data.message : "[Unable to decrypt]";
      if (encPayload) {
        decryptedText = await processIncomingPayload(encPayload);
      }

      const incomingPlainMsg = {
        roomId,
        sender: senderId,
        senderEmail: senderId,
        message: decryptedText,
        seen: true,
        createdAt: data.createdAt || new Date().toISOString()
      };

      await saveLocalMessage(incomingPlainMsg);
      setMessages((prev) => [...prev, incomingPlainMsg]);
      socket.emit('mark_messages_seen', { roomId, userId: currentUserId });
    };

    const handleQueuedMessages = async (pendingMsgs) => {
      for (const msg of pendingMsgs) {
        // 🛑 Strict Guard: Process only queue items matching the active room
        if (msg.roomId && msg.roomId !== roomId) continue;

        const encPayload = (msg.message?.ciphertext && msg.message?.iv) 
          ? msg.message 
          : ((msg.ciphertext && msg.iv) ? msg : null);

        let decryptedText = typeof msg.message === 'string' ? msg.message : "[Unable to decrypt]";
        if (encPayload) {
          decryptedText = await processIncomingPayload(encPayload);
        }

        const formattedMsg = {
          roomId: msg.roomId || roomId,
          sender: msg.sender || msg.senderEmail,
          senderEmail: msg.sender || msg.senderEmail,
          message: decryptedText,
          seen: msg.seen || false,
          createdAt: msg.createdAt || new Date().toISOString()
        };

        // 🟢 Duplicate Check: Agar message pehle se state mein hai, toh skip karo
        setMessages((prev) => {
          const exists = prev.some(
            (m) => m.createdAt === formattedMsg.createdAt && m.sender === formattedMsg.sender
          );
          if (exists) return prev;

          saveLocalMessage(formattedMsg);
          return [...prev, formattedMsg];
        });
      }
      socket.emit('mark_messages_seen', { roomId, userId: currentUserId });
    };

    const handleMessagesSeen = ({ readerId }) => {
      if (readerId !== currentUserId) {
        setMessages((prev) => prev.map(msg => ({ ...msg, seen: true })));
      }
    };

    socket.on('receive_msg', handleReceiveMsg);
    socket.on('queued_messages', handleQueuedMessages);
    socket.on('messages_seen', handleMessagesSeen);

    return () => {
      socket.off('receive_msg', handleReceiveMsg);
      socket.off('queued_messages', handleQueuedMessages);
      socket.off('messages_seen', handleMessagesSeen);
    };
  }, [roomId, isSessionReady, currentUserId, receiverUserId]);

  // Outbound Dispatcher
  const sendMessage = useCallback(async (plainText) => {
    if (!plainText || !isSessionReady || !sendKeyRef.current) return;

    const encryptedPayload = await encryptMessageWithKey(plainText, sendKeyRef.current);
    const createdAt = new Date().toISOString();

    const payload = {
      sender: currentUserId,
      receiver: receiverUserId,
      roomId,
      message: encryptedPayload,
      createdAt
    };

    socket.emit('send_message', payload);

    const sentPlainMsg = {
      roomId,
      sender: currentUserId,
      senderEmail: currentUserId,
      receiver: receiverUserId,
      message: plainText,
      createdAt
    };

    await saveLocalMessage(sentPlainMsg);
    setMessages((prev) => [...prev, sentPlainMsg]);

    sendKeyRef.current = await deriveNextKey(sendKeyRef.current);
  }, [isSessionReady, currentUserId, receiverUserId, roomId]);

  return {
    messages,
    isSessionReady,
    sendMessage,
    currentUserId
  };
}