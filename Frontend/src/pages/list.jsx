import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // 👈 useDispatch import kiya
import axiosClient from '../utils/axiosClient.js';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatPage from './chat.jsx';
import { 
  MessageSquareCode, 
  User, 
  CheckCheck, 
  Lock, 
  Sparkles, 
  Settings,
  LogOut,
  UserCircle,
  X
} from 'lucide-react';

export default function ChatAppLayout() {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 👉 Settings dropdown aur Profile Modal ke liye states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = typeof currentUser === 'object' ? currentUser?.email : currentUser;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const menuRef = useRef(null);

  // Click outside to close settings menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // 👉 Logout Handler Function
  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout'); // Backend logout route call
      // Agar redux mein clear credentials action hai toh dispatch karein, warna seedha navigate
      navigate('/'); // Login ya landing page par redirect
    } catch (err) {
      console.error("Logout error:", err);
      navigate('/');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#090d16] text-slate-100 flex font-sans select-none relative">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <div className={`w-full sm:w-80 md:w-96 lg:w-[420px] bg-[#0e1626]/90 backdrop-blur-xl border-r border-slate-800/80 h-full flex flex-col shrink-0 shadow-2xl ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 bg-[#0e1626] border-b border-slate-800/80 flex items-center justify-between shrink-0 relative">
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

          {/* Settings Icon & Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#151f32] border border-slate-700/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-white transition text-left cursor-pointer"
                >
                  <UserCircle className="w-4 h-4 text-indigo-400" />
                  <span>Profile</span>
                </button>

                <div className="h-[1px] bg-slate-700/50 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Start Conversation Button */}
        <div className="p-3 bg-[#0e1626] border-b border-slate-800/50 shrink-0">
          <button
            onClick={() => navigate('/makeroom')} 
            className="w-full bg-[#151f32] hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 border border-slate-800/80 transition shadow-inner flex items-center justify-center gap-2 cursor-pointer"
          >
            Start new conversation
          </button>
        </div>

        {/* Scrollable Chat List */}
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

      {/* ================= RIGHT SIDEBAR ================= */}
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

      {/* ================= PROFILE MODAL ================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0e1626] border border-slate-700/80 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[2px] shadow-lg">
                <div className="w-full h-full bg-[#0b111e] rounded-full flex items-center justify-center text-2xl font-bold text-emerald-400">
                  {currentUser?.firstname ? currentUser.firstname[0].toUpperCase() : <User className="w-8 h-8" />}
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">{currentUser?.firstname || 'Krypt User'}</h2>
              <p className="text-xs font-mono text-emerald-400">Secure Messaging Account</p>
            </div>

            <div className="space-y-3 bg-[#151f32] p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">First Name:</span>
                <span className="text-slate-200 font-medium">{currentUser?.firstname || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Email Address:</span>
                <span className="text-slate-200 font-medium">{currentUser?.email || currentUserId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Role / Status:</span>
                <span className="text-emerald-400 font-medium">{currentUser?.role || 'Online'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer text-sm"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
}