
// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import axiosClient from '../utils/axiosClient.js';
// import { useNavigate, useLocation } from 'react-router-dom'; // 👈 useLocation import kiya
// import ChatPage from './chat.jsx';
// import {
//   MessageSquareCode,
//   User,
//   CheckCheck,
//   Lock,
//   Sparkles,
//   Settings
// } from 'lucide-react';

// export default function ChatAppLayout() {
//   const [chatList, setChatList] = useState([]);
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const currentUser = useSelector((state) => state.auth.user);
//   const currentUserId = currentUser?._id || currentUser;
//   const navigate = useNavigate();
//   const location = useLocation(); // 👈 location hook initialize kiya

//   useEffect(() => {
//     const fetchChatList = async () => {
//       try {
//         const res = await axiosClient.get('/messages/chat-list');
//         setChatList(res.data.chats || []);
//       } catch (err) {
//         console.error("Chat list error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChatList();
//   }, []);

//   // 👉 Yeh useEffect MakeRoom se aane wale naye user ko catch karega
//   useEffect(() => {
//     if (location.state?.newChatUser) {
//       const newUser = location.state.newChatUser;

//       setChatList((prev) => {
//         const exists = prev.some((chat) => chat._id === newUser._id);
//         return exists ? prev : [newUser, ...prev];
//       });

//       setSelectedChat(newUser); // Automatically chat open kar dega right pane mein
//     }
//   }, [location.state]);

//   const formatTime = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   return (
//     <div className="w-full h-screen overflow-hidden bg-[#090d16] text-slate-100 flex font-sans select-none">

//       {/* ================= LEFT SIDEBAR (LIST PAGE) ================= */}
//       <div className={`w-full sm:w-80 md:w-96 lg:w-[420px] bg-[#0e1626]/90 backdrop-blur-xl border-r border-slate-800/80 h-full flex flex-col shrink-0 shadow-2xl ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>

//         {/* Header */}
//         <div className="p-4 bg-[#0e1626] border-b border-slate-800/80 flex items-center justify-between shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/25">
//               <div className="w-full h-full bg-[#0b111e] rounded-2xl flex items-center justify-center">
//                 <MessageSquareCode className="w-5 h-5 text-emerald-400" />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-white font-bold text-lg tracking-wide flex items-center gap-1.5">
//                 Krypt<span className="text-emerald-400">Chat</span>
//                 <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
//               </h1>
//               <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
//                 {currentUser?.firstname ? `Active: ${currentUser.firstname}` : 'Online'}
//               </p>
//             </div>
//           </div>

//           <button className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition">
//             <Settings className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Start Conversation Button */}
//         <div className="p-3 bg-[#0e1626] border-b border-slate-800/50 shrink-0">
//           <button
//             onClick={() => navigate('/makeroom')}
//             className="w-full bg-[#151f32] hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 border border-slate-800/80 transition shadow-inner flex items-center justify-center gap-2 cursor-pointer"
//           >
//             Start new conversation
//           </button>
//         </div>

//         {/* Scrollable Chat List */}
//         <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
//           {loading ? (
//             <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
//               <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
//               <span className="text-xs font-medium">Syncing chats...</span>
//             </div>
//           ) : chatList.length > 0 ? (
//             chatList.map((chat) => {
//               const isSelected = selectedChat?._id === chat._id;
//               return (
//                 <div
//                   key={chat._id}
//                   onClick={() => setSelectedChat(chat)}
//                   className={`group flex items-center gap-3.5 px-3.5 py-3 cursor-pointer rounded-2xl transition-all duration-200 relative ${isSelected
//                       ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-950/40'
//                       : 'hover:bg-slate-800/40 border border-transparent'
//                     }`}
//                 >
//                   <div className="relative shrink-0">
//                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-500/30 shadow-md">
//                       {chat.firstname ? chat.firstname[0].toUpperCase() : <User className="w-5 h-5" />}
//                     </div>
//                     <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex justify-between items-baseline mb-1">
//                       <h4 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
//                         {chat.firstname}
//                       </h4>
//                       <span className="text-[11px] text-slate-500 shrink-0 ml-2 font-medium">
//                         {formatTime(chat.updatedAt)}
//                       </span>
//                     </div>

//                     <div className="flex justify-between items-center">
//                       <p className="text-xs text-slate-400 truncate pr-2 flex items-center gap-1.5 font-normal">
//                         <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
//                         {typeof chat.lastMessage === 'object'
//                           ? '[Encrypted Message]'
//                           : (chat.lastMessage || 'Start a conversation')}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <div className="text-center py-24 text-slate-500 text-xs px-4">
//               <MessageSquareCode className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
//               No conversations found
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ================= RIGHT SIDEBAR (CHAT PAGE INTEGRATION) ================= */}
//       <div className={`flex-1 h-full bg-[#0b111e] flex-col relative overflow-hidden ${selectedChat ? 'flex' : 'hidden sm:flex'}`}>
//         {selectedChat ? (
//           <ChatPage
//             currentUser={currentUserId}
//             receiverUser={selectedChat}
//             onBack={() => setSelectedChat(null)}
//           />
//         ) : (
//           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0b111e] via-[#0e1626] to-[#0b111e]">
//             <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-950">
//               <MessageSquareCode className="w-10 h-10 text-indigo-400" />
//             </div>

//             <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
//               Welcome to Krypt<span className="text-emerald-400">Chat</span>
//             </h2>

//             <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
//               Select a conversation from the sidebar to start chatting securely with lightning-fast real-time messaging.
//             </p>

//             <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-800/80 shadow-sm">
//               <Lock className="w-3.5 h-3.5 text-emerald-400" />
//               <span>Secured with modern encryption protocol</span>
//             </div>
//           </div>
//         )}
//       </div>

//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient.js';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatPage from './chat.jsx';
import { 
  MessageSquareCode, 
  User, 
  CheckCheck, 
  Lock, 
  Sparkles, 
  Settings 
} from 'lucide-react';

export default function ChatAppLayout() {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = useSelector((state) => state.auth.user);

// 🔥 Yahan ensure karo ki agar object hai toh email lo, warna agar string email hi hai toh wo lo
const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const res = await axiosClient.get('/messages/chat-list');
        setChatList(res.data.chats || []);
      } catch (err) {
        console.error("Chat list error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatList();
  }, []);

  useEffect(() => {
    if (location.state?.newChatUser) {
      const newUser = location.state.newChatUser;
      setChatList((prev) => {
        const exists = prev.some((chat) => chat._id === newUser._id);
        return exists ? prev : [newUser, ...prev];
      });
      setSelectedChat(newUser);
    }
  }, [location.state]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#090d16] text-slate-100 flex font-sans select-none">
      
      <div className={`w-full sm:w-80 md:w-96 lg:w-[420px] bg-[#0e1626]/90 backdrop-blur-xl border-r border-slate-800/80 h-full flex flex-col shrink-0 shadow-2xl ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        
        <div className="p-4 bg-[#0e1626] border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0b111e] rounded-2xl flex items-center justify-center">
                <MessageSquareCode className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide flex items-center gap-1.5">
                Krypt<span className="text-emerald-400">Chat</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              </h1>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {currentUser?.firstname ? `Active: ${currentUser.firstname}` : 'Online'}
              </p>
            </div>
          </div>

          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-[#0e1626] border-b border-slate-800/50 shrink-0">
          <button
            onClick={() => navigate('/makeroom')} 
            className="w-full bg-[#151f32] hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 border border-slate-800/80 transition shadow-inner flex items-center justify-center gap-2 cursor-pointer"
          >
            Start new conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Syncing chats...</span>
            </div>
          ) : chatList.length > 0 ? (
            chatList.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`group flex items-center gap-3.5 px-3.5 py-3 cursor-pointer rounded-2xl transition-all duration-200 relative ${
                    isSelected 
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-950/40' 
                      : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-500/30 shadow-md">
                      {chat.firstname ? chat.firstname[0].toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {chat.firstname}
                      </h4>
                      <span className="text-[11px] text-slate-500 shrink-0 ml-2 font-medium">
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-400 truncate pr-2 flex items-center gap-1.5 font-normal">
                        <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {typeof chat.lastMessage === 'object' 
                          ? '[Encrypted Message]' 
                          : (chat.lastMessage || 'Start a conversation')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs px-4">
              <MessageSquareCode className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
              No conversations found
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 h-full bg-[#0b111e] flex-col relative overflow-hidden ${selectedChat ? 'flex' : 'hidden sm:flex'}`}>
        {selectedChat ? (
          <ChatPage 
            currentUser={currentUserId} 
            receiverUser={selectedChat} 
            onBack={() => setSelectedChat(null)} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0b111e] via-[#0e1626] to-[#0b111e]">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-950">
              <MessageSquareCode className="w-10 h-10 text-indigo-400" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              Welcome to Krypt<span className="text-emerald-400">Chat</span>
            </h2>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
              Select a conversation from the sidebar to start chatting securely with lightning-fast real-time messaging.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-800/80 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secured with modern encryption protocol</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}