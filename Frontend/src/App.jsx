import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../authSlice.js'; // Apne path ke hisab se check kar lein
import ChatPage from './pages/chat';
import Login from './pages/login';
import Signup from './pages/signup';
import MakeRoom from './pages/makeRoom';
import ChatSidebar from './pages/list';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // App load/refresh hote hi session/cookie verify karega
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/makeroom" element={<MakeRoom />} />
        <Route path="/list" element={<ChatSidebar />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}