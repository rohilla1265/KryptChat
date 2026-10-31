import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux'; // 👈 Added
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../utils/validateSchema';
import axiosClient from '../utils/axiosClient';
import { setCredentials } from '../../authSlice.js'; // 👈 Added
import { Shield, Mail, Lock, User, Terminal, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

export default function Signup() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // 👈 Initialized

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/register', data);
      
      // 👉 Signup ke baad user data Redux store mein save karein
      dispatch(setCredentials(response.data.user));

      navigate('/list');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="relative z-10 bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md space-y-7 ring-1 ring-white/10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-4 h-4" />
            <span>KRYPT_SECURE_v2.0</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ONLINE
          </span>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Create KryptID</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Initialize your secure messaging persona</p>
          </div>
        </div>

        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl font-medium flex items-center gap-2.5 shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">First Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. Alex"
                {...register('firstname')}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/90 border ${
                  errors.firstname ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {errors.firstname && <p className="text-rose-400 text-[11px] font-mono pl-1">{errors.firstname.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="alex@krypt.io"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/90 border ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {errors.email && <p className="text-rose-400 text-[11px] font-mono pl-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Key (Password)</label>
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
            {errors.password && <p className="text-rose-400 text-[11px] font-mono pl-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 tracking-wide group"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono text-xs">
                <Loader2 className="animate-spin h-4 w-4 text-slate-950" />
                ENCRYPTING & GENERATING...
              </span>
            ) : (
              <>
                <span>INITIALIZE IDENTITY</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-800/80">
          Already have an account?{' '}
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 font-semibold transition hover:underline">
            Access Terminal
          </Link>
        </div>
      </div>
    </div>
  );
}