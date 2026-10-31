import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../utils/validateSchema';
import axiosClient from '../utils/axiosClient';
import { setCredentials } from '../../authSlice.js'; 
import { Shield, Mail, Lock, Terminal, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

export default function Login() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);

    try {
      // Backend se login request bheji
      const response = await axiosClient.post('/auth/login', data);

      // 1. Redux store mein user data save kar diya
      dispatch(setCredentials(response.data.user));

      // 2. Makeroom ya chat page par navigate kar diya
      navigate('/list');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Access Denied: Invalid Credentials';
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Background Decorative Grid & Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Main Card Container */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md space-y-7 ring-1 ring-white/10">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-4 h-4" />
            <span>KRYPT_AUTH_v2.0</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SECURE
          </span>
        </div>

        {/* Heading & Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">KryptChat Console</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">End-to-End Encrypted Tunnel Login</p>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl font-medium flex items-center gap-2.5 shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Encrypted Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="user@krypt.io"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/90 border ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {errors.email && (
              <p className="text-rose-400 text-[11px] font-mono pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Security Key (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/90 border ${
                  errors.password ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {errors.password && (
              <p className="text-rose-400 text-[11px] font-mono pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 tracking-wide group"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono text-xs">
                <Loader2 className="animate-spin h-4 w-4 text-slate-950" />
                DECRYPTING CREDENTIALS...
              </span>
            ) : (
              <>
                <span>ESTABLISH SESSION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-800/80">
          Need a new identity?{' '}
          <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition hover:underline">
            Generate KryptID
          </Link>
        </div>

      </div>
    </div>
  );
}