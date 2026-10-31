import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquareCode, UserCheck, ArrowRight, Lock } from 'lucide-react';

export default function MakeRoom() {
  const [receiverEmail, setReceiverEmail] = useState('');
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);
  const currentEmail = currentUser?.email;

  const handleStartChat = (e) => {
    e.preventDefault();
    
    if (!currentEmail) {
      alert("Logged-in user email not found! Please login again.");
      return;
    }

    const trimmedReceiver = receiverEmail.trim().toLowerCase();

    if (trimmedReceiver && currentEmail !== trimmedReceiver) {
      const sortedEmails = [currentEmail.toLowerCase(), trimmedReceiver].sort();
      const roomId = `${sortedEmails[0]}_${sortedEmails[1]}`;

      // 👉 Yahan '/chat' ki jagah apne main chat layout ka route dein (jaise '/' ya '/chats')
      // Sath mein receiver ki details object format mein bhej rahe hain taaki list mein show ho sake
      navigate('/list', { 
        state: { 
          newChatUser: {
            _id: trimmedReceiver, // Ya receiver ka ID agar backend se milta hai
            firstname: trimmedReceiver.split('@')[0], // Email ka pehla part name ke taur par
            email: trimmedReceiver
          },
          roomId: roomId 
        } 
      });
    } else {
      alert("Please enter a valid receiver email different from your own!");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-100 select-none px-4">
      <form onSubmit={handleStartChat} className="bg-[#0e1626]/90 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6">
        
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20 mb-3">
            <div className="w-full h-full bg-[#0b111e] rounded-2xl flex items-center justify-center">
              <MessageSquareCode className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Krypt<span className="text-emerald-400">Chat</span> Connect
          </h2>
          <p className="text-xs text-slate-400 mt-1">Start a secure chat with your peer</p>
        </div>

        <div className="bg-[#151f32] p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Logged in as</span>
            <span className="text-sm font-medium text-slate-200">{currentEmail || 'Loading user...'}</span>
          </div>
          <Lock className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Friend's Email (Receiver)
          </label>
          <div className="relative flex items-center">
            <UserCheck className="absolute left-3.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="email"
              placeholder="friend@example.com"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              className="w-full bg-[#151f32] text-slate-200 text-sm rounded-xl pl-10 pr-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800/80 transition shadow-inner"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group text-sm"
        >
          <span>Start Encrypted Chat</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

      </form>
    </div>
  );
}