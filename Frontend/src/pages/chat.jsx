import React, { useState, useEffect, useRef } from 'react';
import { useChatRoom } from '../hooks/useChatRoom';
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

export default function ChatPage({ currentUser, receiverUser, onBack }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const { messages, isSessionReady, sendMessage, currentUserId } = useChatRoom(
    currentUser, 
    receiverUser
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (text) {
      await sendMessage(text);
      setInputText('');
    }
  };

  // 👉 Check karein ki agar receiverUser object hai toh uska firstname lein, warna chat-partner dikhayein
const getDisplayName = () => {
    if (!receiverUser) return 'Chat Partner';
    
    // Agar receiverUser ek object hai aur uske paas firstname hai
    if (typeof receiverUser === 'object') {
      return receiverUser.firstname || receiverUser.name || 'Chat Partner';
    }
    
    // Agar receiverUser galti se sirf email string aayi hai, toh 'Chat Partner' dikhayein taaki mail id na dikhe
    return 'Chat Partner';
  };

  const displayName = getDisplayName();

  return (
    <div className="flex flex-col h-full w-full bg-[#0b111e]">
      {/* Header */}
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

      {/* Message Stream */}
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
                    {displayName}
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

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-[#0e1626] border-t border-slate-800/80 flex items-center gap-2 shrink-0">
        <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Smile className="w-5 h-5" /></button>
        <button type="button" className="p-2.5 text-slate-400 hover:text-white rounded-xl transition"><Paperclip className="w-5 h-5" /></button>
        
        <input
          type="text"
          placeholder={isSessionReady ? "Type a secure message..." : "Establishing E2EE session..."}
          disabled={!isSessionReady}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#151f32] text-slate-200 text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800/80 transition disabled:opacity-50"
        />

        {!isSessionReady ? (
          <button type="button" disabled className="p-2.5 bg-slate-800 text-slate-500 rounded-xl">
            <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-400" />
          </button>
        ) : inputText.trim() ? (
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