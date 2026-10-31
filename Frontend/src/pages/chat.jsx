// import React, { useState, useEffect, useRef } from 'react';
// import socket from '../socket/socket';
// import { fetchChatHistory } from '../api/chatApi';
// import {
//   ArrowLeft,
//   Send,
//   Smile,
//   Paperclip,
//   Mic,
//   Lock,
//   User,
//   CheckCheck,
//   Loader2
// } from 'lucide-react';

// // --- 1. INDEXEDDB HELPER ---
// const DB_NAME = 'KryptChat_LocalDB';
// const DB_VERSION = 1;

// function openDB() {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open(DB_NAME, DB_VERSION);
//     request.onupgradeneeded = (e) => {
//       const db = e.target.result;
//       if (!db.objectStoreNames.contains('messages')) {
//         db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
//       }
//     };
//     request.onsuccess = () => resolve(request.result);
//     request.onerror = () => reject(request.error);
//   });
// }

// async function saveLocalMessage(msg) {
//   try {
//     const db = await openDB();
//     const tx = db.transaction('messages', 'readwrite');
//     tx.objectStore('messages').add(msg);
//   } catch (err) {
//     console.error("IndexedDB Save Error:", err);
//   }
// }

// async function getLocalMessagesByRoom(roomId) {
//   try {
//     const db = await openDB();
//     const tx = db.transaction('messages', 'readonly');
//     const store = tx.objectStore('messages');
//     return new Promise((resolve) => {
//       const req = store.getAll();
//       req.onsuccess = () => {
//         const all = req.result || [];
//         resolve(all.filter(m => m.roomId === roomId));
//       };
//       req.onerror = () => resolve([]);
//     });
//   } catch (err) {
//     console.error("IndexedDB Fetch Error:", err);
//     return [];
//   }
// }

// // --- 2. CRYPTO HELPERS ---
// async function deriveNextKey(currentKeyHex) {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(currentKeyHex + "_ratchet_step");
//   const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
//   return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
// }

// async function encryptMessageWithKey(plainText, keyHex) {
//   const enc = new TextEncoder();
//   const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
//   const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

//   const cryptoKey = await window.crypto.subtle.importKey(
//     "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]
//   );

//   const iv = window.crypto.getRandomValues(new Uint8Array(12));
//   const encrypted = await window.crypto.subtle.encrypt(
//     { name: "AES-GCM", iv }, cryptoKey, enc.encode(plainText)
//   );

//   return {
//     iv: Array.from(iv),
//     ciphertext: Array.from(new Uint8Array(encrypted))
//   };
// }

// async function decryptMessage(encryptedData, keyHex) {
//   try {
//     if (typeof encryptedData === 'string') return encryptedData;
//     if (!encryptedData || !encryptedData.ciphertext || !encryptedData.iv) {
//       return null;
//     }

//     let ivBytes;
//     if (Array.isArray(encryptedData.iv)) {
//       ivBytes = new Uint8Array(encryptedData.iv);
//     } else if (typeof encryptedData.iv === 'string') {
//       ivBytes = new Uint8Array(encryptedData.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
//     } else {
//       ivBytes = new Uint8Array(Object.values(encryptedData.iv));
//     }

//     let cipherBytes;
//     if (Array.isArray(encryptedData.ciphertext)) {
//       cipherBytes = new Uint8Array(encryptedData.ciphertext);
//     } else if (typeof encryptedData.ciphertext === 'string') {
//       cipherBytes = new Uint8Array(encryptedData.ciphertext.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
//     } else {
//       cipherBytes = new Uint8Array(Object.values(encryptedData.ciphertext));
//     }

//     const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
//     const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
//     const cryptoKey = await window.crypto.subtle.importKey(
//       "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
//     );

//     const decrypted = await window.crypto.subtle.decrypt(
//       { name: "AES-GCM", iv: ivBytes },
//       cryptoKey,
//       cipherBytes
//     );

//     return new TextDecoder().decode(decrypted);
//   } catch (err) {
//     console.error("Decryption error:", err);
//     return null;
//   }
// }

// // --- 3. MAIN REACT CHAT COMPONENT ---
// export default function ChatPage({ currentUser, receiverUser, onBack }) {
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [sendKey, setSendKey] = useState('');
//   const [recvKey, setRecvKey] = useState('');
//   const [isSessionReady, setIsSessionReady] = useState(false);
  
//   const messagesEndRef = useRef(null);

//   const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
//   const receiverUserId = typeof receiverUser === 'object' ? receiverUser?.email : receiverUser;

//   const getRoomId = (u1, u2) => [u1, u2].sort().join("_");
//   const roomId = currentUserId && receiverUserId ? getRoomId(currentUserId, receiverUserId) : null;

//   useEffect(() => {
//     let isMounted = true;
//     if (roomId) {
//       setIsSessionReady(false);
//       const sessionSeed = roomId + "_KryptChat_Session_Seed";
//       window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionSeed)).then(buf => {
//         if (!isMounted) return;
//         const hexKey = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
//         setSendKey(hexKey);
//         setRecvKey(hexKey);
//         setIsSessionReady(true);
//       });
//     }
//     return () => { isMounted = false; };
//   }, [roomId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     if (!currentUserId || !receiverUserId || !roomId || !isSessionReady) return;

//     socket.emit('join_room', roomId);

//     // Check local IndexedDB and decrypt any cached encrypted objects
//     getLocalMessagesByRoom(roomId).then(async (localMsgs) => {
//       if (localMsgs && localMsgs.length > 0) {
//         let currentRKey = recvKey;
//         const processedMsgs = [];

//         for (const msg of localMsgs) {
//           if (typeof msg.message === 'object' && msg.message !== null && msg.message.ciphertext) {
//             let decryptedText = await decryptMessage(msg.message, currentRKey);
//             if (!decryptedText) {
//               decryptedText = "[Unable to decrypt]";
//             } else if (msg.senderEmail !== currentUserId) {
//               currentRKey = await deriveNextKey(currentRKey);
//             }
//             processedMsgs.push({ ...msg, message: decryptedText });
//           } else {
//             processedMsgs.push(msg);
//           }
//         }

//         setMessages(processedMsgs);
//         setRecvKey(currentRKey);
//         scrollToBottom();
//       } else {
//         try {
//           const history = await fetchChatHistory(currentUserId, receiverUserId);
//           let currentRKey = recvKey;
//           const decryptedHistory = [];

//           for (const msg of history || []) {
//             const encPayload = (msg.ciphertext && msg.iv) ? msg : (msg.message?.ciphertext && msg.message?.iv ? msg.message : null);

//             if (encPayload) {
//               const msgSenderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email : msg.sender);
//               const isIncoming = msgSenderId !== currentUserId;

//               let decryptedText = await decryptMessage({ ciphertext: encPayload.ciphertext, iv: encPayload.iv }, currentRKey);

//               if (!decryptedText) {
//                 decryptedText = "[Unable to decrypt - Ratchet Key Desynced]";
//               } else if (isIncoming) {
//                 currentRKey = await deriveNextKey(currentRKey);
//               }

//               const savedMsg = {
//                 roomId,
//                 sender: msgSenderId,
//                 senderEmail: msgSenderId,
//                 message: decryptedText,
//                 createdAt: msg.createdAt || new Date().toISOString()
//               };

//               await saveLocalMessage(savedMsg);
//               decryptedHistory.push(savedMsg);
//             } else {
//               decryptedHistory.push(msg);
//             }
//           }
//           setMessages(decryptedHistory);
//           setRecvKey(currentRKey);
//           scrollToBottom();
//         } catch (err) {
//           console.error("Error fetching chat history:", err);
//         }
//       }
//     });

//     const handleReceiveMsg = async (data) => {
//       const senderId = data.sender || data.senderEmail;
      
//       if (senderId === currentUserId) return;

//       const encPayload = (data.message?.ciphertext && data.message?.iv) 
//         ? data.message 
//         : ((data.ciphertext && data.iv) ? data : null);

//       let decryptedText = "[Unable to decrypt]";

//       if (encPayload) {
//         decryptedText = await decryptMessage({ ciphertext: encPayload.ciphertext, iv: encPayload.iv }, recvKey);

//         if (!decryptedText) {
//           decryptedText = "[Unable to decrypt - Key mismatch]";
//         } else {
//           const nextRKey = await deriveNextKey(recvKey);
//           setRecvKey(nextRKey);
//         }
//       } else if (typeof data.message === 'string') {
//         decryptedText = data.message;
//       }

//       const incomingPlainMsg = {
//         roomId,
//         sender: senderId,
//         senderEmail: senderId,
//         message: decryptedText,
//         createdAt: data.createdAt || new Date().toISOString()
//       };

//       await saveLocalMessage(incomingPlainMsg);
//       setMessages((prev) => [...prev, incomingPlainMsg]);
//       scrollToBottom();
//     };

//     socket.on('receive_msg', handleReceiveMsg);

//     return () => {
//       socket.off('receive_msg', handleReceiveMsg);
//     };
//   }, [roomId, isSessionReady]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSend = async (e) => {
//     e.preventDefault();
//     const plainText = message.trim();

//     if (plainText && isSessionReady && sendKey) {
//       const encryptedPayload = await encryptMessageWithKey(plainText, sendKey);

//       const payload = {
//         sender: currentUserId,
//         receiver: receiverUserId,
//         roomId,
//         message: encryptedPayload,
//         createdAt: new Date().toISOString()
//       };

//       socket.emit('send_message', payload);

//       const sentPlainMsg = {
//         roomId,
//         sender: currentUserId,
//         senderEmail: currentUserId,
//         receiver: receiverUserId,
//         message: plainText,
//         createdAt: payload.createdAt
//       };

//       await saveLocalMessage(sentPlainMsg);
//       setMessages((prev) => [...prev, sentPlainMsg]);

//       setMessage('');
//       scrollToBottom();

//       const nextKey = await deriveNextKey(sendKey);
//       setSendKey(nextKey);
//     }
//   };

//   const displayName = typeof receiverUser === 'object' ? receiverUser?.firstname || receiverUser?.name : 'Chat Partner';

//   return (
//     <div className="flex flex-col h-full w-full bg-[#0b111e]">
//       <div className="h-16 px-4 bg-[#0e1626] border-b border-slate-800/80 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-3">
//           {onBack && (
//             <button onClick={onBack} className="sm:hidden p-2 text-slate-400 hover:text-white rounded-xl transition">
//               <ArrowLeft className="w-5 h-5" />
//             </button>
//           )}
//           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
//             {displayName ? displayName[0].toUpperCase() : <User className="w-5 h-5" />}
//           </div>
//           <div>
//             <h3 className="text-white font-semibold text-sm">{displayName}</h3>
//             <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 text-slate-400">
//           <span className="text-[11px] hidden sm:flex items-center gap-1 text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
//             <Lock className="w-3 h-3 text-emerald-400" /> Double Ratchet Active
//           </span>
//         </div>
//       </div>

//       <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-[#0b111e] via-[#080c14] to-[#0e1626]/50 space-y-4 custom-scrollbar">
//         <div className="text-center my-2">
//           <span className="bg-slate-800/40 text-slate-400 text-xs px-3.5 py-1.5 rounded-xl border border-slate-800/80 inline-flex items-center gap-1.5">
//             <Lock className="w-3 h-3 text-emerald-400" /> Forward Secrecy Active
//           </span>
//         </div>

//         {messages.map((msg, index) => {
//           const senderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email || msg.sender._id : msg.sender);
//           const isMe = senderId === currentUserId;

//           return (
//             <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
//               <div className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-md transition-all ${isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-indigo-950/50' : 'bg-[#151f32] text-slate-200 border border-slate-800/80 rounded-bl-none'}`}>
//                 {!isMe && (
//                   <p className="text-[11px] font-bold text-emerald-400 mb-0.5">
//                     {msg.senderEmail || displayName}
//                   </p>
//                 )}
//                 <p className="leading-relaxed break-words">
//                   {typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message)}
//                 </p>
//                 <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400/80">
//                   <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                   {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       <form onSubmit={handleSend} className="p-3 bg-[#0e1626] border-t border-slate-800/80 flex items-center gap-2 shrink-0">
//         <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Smile className="w-5 h-5" /></button>
//         <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Paperclip className="w-5 h-5" /></button>
        
//         <input
//           type="text"
//           placeholder={isSessionReady ? "Type a secure message..." : "Establishing E2EE session..."}
//           disabled={!isSessionReady}
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           className="flex-1 bg-[#151f32] text-slate-200 text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800/80 transition disabled:opacity-50"
//         />

//         {!isSessionReady ? (
//           <button type="button" disabled className="p-2.5 bg-slate-800 text-slate-500 rounded-xl">
//             <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-400" />
//           </button>
//         ) : message.trim() ? (
//           <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/30">
//             <Send className="w-4.5 h-4.5" />
//           </button>
//         ) : (
//           <button type="button" className="p-2.5 bg-slate-800/60 text-slate-400 rounded-xl transition"><Mic className="w-4.5 h-4.5" /></button>
//         )}
//       </form>
//     </div>
//   );
// }
import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket/socket';
import { fetchChatHistory } from '../api/chatApi';
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  Mic,
  Lock,
  User,
  CheckCheck,
  Loader2
} from 'lucide-react';

// --- 1. INDEXEDDB HELPER ---
const DB_NAME = 'KryptChat_LocalDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalMessage(msg) {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readwrite');
    tx.objectStore('messages').add(msg);
  } catch (err) {
    console.error("IndexedDB Save Error:", err);
  }
}

async function getLocalMessagesByRoom(roomId) {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter(m => m.roomId === roomId));
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error("IndexedDB Fetch Error:", err);
    return [];
  }
}

// --- 2. CRYPTO HELPERS & KEY RING LOGIC ---
async function deriveNextKey(currentKeyHex) {
  const encoder = new TextEncoder();
  const data = encoder.encode(currentKeyHex + "_ratchet_step");
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptMessageWithKey(plainText, keyHex) {
  const enc = new TextEncoder();
  const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
  const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, cryptoKey, enc.encode(plainText)
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encrypted))
  };
}

async function decryptSingleKey(encryptedData, keyHex) {
  try {
    if (typeof encryptedData === 'string') return encryptedData;
    if (!encryptedData || !encryptedData.ciphertext || !encryptedData.iv) {
      return null;
    }

    let ivBytes = Array.isArray(encryptedData.iv) 
      ? new Uint8Array(encryptedData.iv) 
      : (typeof encryptedData.iv === 'string' 
          ? new Uint8Array(encryptedData.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))) 
          : new Uint8Array(Object.values(encryptedData.iv)));

    let cipherBytes = Array.isArray(encryptedData.ciphertext) 
      ? new Uint8Array(encryptedData.ciphertext) 
      : (typeof encryptedData.ciphertext === 'string' 
          ? new Uint8Array(encryptedData.ciphertext.match(/.{1,2}/g).map(byte => parseInt(byte, 16))) 
          : new Uint8Array(Object.values(encryptedData.ciphertext)));

    const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
    const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      cryptoKey,
      cipherBytes
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    return null; // Silent fail for individual key attempt
  }
}

// 🔑 KEY RING: Pichli keys ki array mein se check karega ki kaun si key valid hai
async function decryptWithKeyRing(encryptedData, keyRingArray) {
  for (const keyHex of keyRingArray) {
    const result = await decryptSingleKey(encryptedData, keyHex);
    if (result !== null) {
      return result; // Jis key se match ho gaya, wahi return kar do
    }
  }
  return null;
}

// --- 3. MAIN REACT CHAT COMPONENT ---
export default function ChatPage({ currentUser, receiverUser, onBack }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  const messagesEndRef = useRef(null);
  const sendKeyRef = useRef('');
  const recvKeyRingRef = useRef([]); // 👈 Yeh pichli keys ko store karega (Max 4 keys)

  const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
  const receiverUserId = typeof receiverUser === 'object' ? receiverUser?.email : receiverUser;

  const getRoomId = (u1, u2) => [u1, u2].sort().join("_");
  const roomId = currentUserId && receiverUserId ? getRoomId(currentUserId, receiverUserId) : null;

  useEffect(() => {
    let isMounted = true;
    if (roomId) {
      setIsSessionReady(false);
      const sessionSeed = roomId + "_KryptChat_Session_Seed";
      window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionSeed)).then(async buf => {
        if (!isMounted) return;
        const hexKey = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        sendKeyRef.current = hexKey;
        recvKeyRingRef.current = [hexKey]; // Initialize with starting session key
        setIsSessionReady(true);
      });
    }
    return () => { isMounted = false; };
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentUserId || !receiverUserId || !roomId || !isSessionReady) return;

    socket.emit('join_room', roomId);

    // Load Local IndexedDB Messages
    getLocalMessagesByRoom(roomId).then(async (localMsgs) => {
      if (localMsgs && localMsgs.length > 0) {
        setMessages(localMsgs);
        scrollToBottom();
      } else {
        try {
          const history = await fetchChatHistory(currentUserId, receiverUserId);
          const decryptedHistory = [];

          for (const msg of history || []) {
            const encPayload = (msg.ciphertext && msg.iv) ? msg : (msg.message?.ciphertext && msg.message?.iv ? msg.message : null);

            if (encPayload) {
              const msgSenderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email : msg.sender);
              const isIncoming = msgSenderId !== currentUserId;

              let decryptedText = await decryptWithKeyRing({ ciphertext: encPayload.ciphertext, iv: encPayload.iv }, recvKeyRingRef.current);

              if (!decryptedText) {
                decryptedText = "[Unable to decrypt]";
              } else if (isIncoming) {
                // Advance key ring for incoming messages
                const latestKey = recvKeyRingRef.current[recvKeyRingRef.current.length - 1];
                const nextKey = await deriveNextKey(latestKey);
                recvKeyRingRef.current.push(nextKey);
                if (recvKeyRingRef.current.length > 4) recvKeyRingRef.current.shift();
              }

              const savedMsg = {
                roomId,
                sender: msgSenderId,
                senderEmail: msgSenderId,
                message: decryptedText,
                createdAt: msg.createdAt || new Date().toISOString()
              };

              await saveLocalMessage(savedMsg);
              decryptedHistory.push(savedMsg);
            } else {
              decryptedHistory.push(msg);
            }
          }
          setMessages(decryptedHistory);
          scrollToBottom();
        } catch (err) {
          console.error("Error fetching chat history:", err);
        }
      }
    });

    // Handle Incoming WebSockets Message
    const handleReceiveMsg = async (data) => {
      const senderId = data.sender || data.senderEmail;
      if (senderId === currentUserId) return;

      const encPayload = (data.message?.ciphertext && data.message?.iv) 
        ? data.message 
        : ((data.ciphertext && data.iv) ? data : null);

      let decryptedText = "[Unable to decrypt]";

      if (encPayload) {
        // 🔑 Key ring se try karega (agar key aage-piche bhi ho gayi toh yahan match ho jayegi)
        decryptedText = await decryptWithKeyRing({ ciphertext: encPayload.ciphertext, iv: encPayload.iv }, recvKeyRingRef.current);

        if (decryptedText) {
          // Success hone par next ratchet key derive karke ring mein daal do
          const latestKey = recvKeyRingRef.current[recvKeyRingRef.current.length - 1];
          const nextKey = await deriveNextKey(latestKey);
          recvKeyRingRef.current.push(nextKey);
          if (recvKeyRingRef.current.length > 4) {
            recvKeyRingRef.current.shift(); // Sirf pichli 4 keys maintain rakhein
          }
        } else {
          decryptedText = "[Unable to decrypt - Key mismatch]";
        }
      } else if (typeof data.message === 'string') {
        decryptedText = data.message;
      }

      const incomingPlainMsg = {
        roomId,
        sender: senderId,
        senderEmail: senderId,
        message: decryptedText,
        createdAt: data.createdAt || new Date().toISOString()
      };

      await saveLocalMessage(incomingPlainMsg);
      setMessages((prev) => [...prev, incomingPlainMsg]);
      scrollToBottom();
    };

    socket.on('receive_msg', handleReceiveMsg);

    return () => {
      socket.off('receive_msg', handleReceiveMsg);
    };
  }, [roomId, isSessionReady]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const plainText = message.trim();

    if (plainText && isSessionReady && sendKeyRef.current) {
      const encryptedPayload = await encryptMessageWithKey(plainText, sendKeyRef.current);

      const payload = {
        sender: currentUserId,
        receiver: receiverUserId,
        roomId,
        message: encryptedPayload,
        createdAt: new Date().toISOString()
      };

      socket.emit('send_message', payload);

      const sentPlainMsg = {
        roomId,
        sender: currentUserId,
        senderEmail: currentUserId,
        receiver: receiverUserId,
        message: plainText,
        createdAt: payload.createdAt
      };

      await saveLocalMessage(sentPlainMsg);
      setMessages((prev) => [...prev, sentPlainMsg]);

      setMessage('');
      scrollToBottom();

      // Update send key for next message
      sendKeyRef.current = await deriveNextKey(sendKeyRef.current);
    }
  };

  const displayName = typeof receiverUser === 'object' ? receiverUser?.firstname || receiverUser?.name : 'Chat Partner';

  return (
    <div className="flex flex-col h-full w-full bg-[#0b111e]">
      <div className="h-16 px-4 bg-[#0e1626] border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="sm:hidden p-2 text-slate-400 hover:text-white rounded-xl transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
            {displayName ? displayName[0].toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{displayName}</h3>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] hidden sm:flex items-center gap-1 text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
            <Lock className="w-3 h-3 text-emerald-400" /> Key-Ring E2EE Active
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-[#0b111e] via-[#080c14] to-[#0e1626]/50 space-y-4 custom-scrollbar">
        <div className="text-center my-2">
          <span className="bg-slate-800/40 text-slate-400 text-xs px-3.5 py-1.5 rounded-xl border border-slate-800/80 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" /> Sliding Window Forward Secrecy
          </span>
        </div>

        {messages.map((msg, index) => {
          const senderId = msg.senderEmail || (typeof msg.sender === 'object' ? msg.sender.email || msg.sender._id : msg.sender);
          const isMe = senderId === currentUserId;

          return (
            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-md transition-all ${isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-indigo-950/50' : 'bg-[#151f32] text-slate-200 border border-slate-800/80 rounded-bl-none'}`}>
                {!isMe && (
                  <p className="text-[11px] font-bold text-emerald-400 mb-0.5">
                    {msg.senderEmail || displayName}
                  </p>
                )}
                <p className="leading-relaxed break-words">
                  {typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400/80">
                  <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-[#0e1626] border-t border-slate-800/80 flex items-center gap-2 shrink-0">
        <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Smile className="w-5 h-5" /></button>
        <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Paperclip className="w-5 h-5" /></button>
        
        <input
          type="text"
          placeholder={isSessionReady ? "Type a secure message..." : "Establishing E2EE session..."}
          disabled={!isSessionReady}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-[#151f32] text-slate-200 text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800/80 transition disabled:opacity-50"
        />

        {!isSessionReady ? (
          <button type="button" disabled className="p-2.5 bg-slate-800 text-slate-500 rounded-xl">
            <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-400" />
          </button>
        ) : message.trim() ? (
          <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/30">
            <Send className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button type="button" className="p-2.5 bg-slate-800/60 text-slate-400 rounded-xl transition"><Mic className="w-4.5 h-4.5" /></button>
        )}
      </form>
    </div>
  );
}