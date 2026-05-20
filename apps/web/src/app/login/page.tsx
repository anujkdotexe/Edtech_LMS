'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, Mail, Lock, User, UserPlus, LogIn, Check, Zap } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=felix',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=kitty',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=buddy',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=sparky',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=pepper',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=luna',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=shadow',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=rocky',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=coco',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=sunny',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=daisy',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=rusty'
];


export default function LoginPage() {
  const router = useRouter();
  const { login, signup, error, clearError } = useAuthStore();
  
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormError(null);
    setForgotSuccess(null);
    clearError();
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setSubmitting(true);
    setFormError(null);
    setForgotSuccess(null);
    try {
      await login({ email: quickEmail, password: 'password123' });
      router.push('/');
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in with quick credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setFormError(null);
    setForgotSuccess(null);
    try {
      // Simulate Google OAuth
      await login({ email: 'student@lms.local', password: 'password123' });
      router.push('/');
    } catch (err: any) {
      setFormError(err.message || 'Google OAuth authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setFormError(null);
    setForgotSuccess(null);
    if (!email) {
      setFormError('Please input your email address above first to dispatch a reset link.');
      return;
    }
    setForgotSuccess(`A sandbox reset passcode link has been dispatched to ${email}! Check simulated inbox logs.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setForgotSuccess(null);

    if (!email || !password || (isSignUp && !name)) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup({ name, email, password, avatarUrl: selectedAvatar });
      } else {
        await login({ email, password });
      }
      router.push('/');
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-6 px-4">
      
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center rounded-2xl text-3xl font-black shadow-lg mb-3 animate-bounce">
          <Zap className="w-8 h-8 fill-white text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-slate-800 to-secondary bg-clip-text text-transparent">
          Antigravity LMS Gamified
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Unlock levels, complete streaks, and master languages through immersive gamification!
        </p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-premium p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Decorative corner blur */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full filter blur-xl"></div>

        {/* Card Header & Toggles */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-display text-slate-800">
            {isSignUp ? 'Create your Account' : 'Welcome Back'}
          </h2>
          <button 
            type="button"
            onClick={toggleMode}
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline"
          >
            {isSignUp ? (
              <>
                <LogIn className="w-3.5 h-3.5" /> Sign In Instead
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" /> Create an Account
              </>
            )}
          </button>
        </div>

        {/* Google OAuth One-Click Logins */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full mb-5 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 border border-slate-250 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2.5 active:scale-[0.98] text-xs"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.44 7.5l3.86 3C6.23 7.67 8.89 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.5c-.25-.74-.39-1.52-.39-2.33s.14-1.59.39-2.33L1.44 6.84C.52 8.65 0 10.68 0 12.8s.52 4.15 1.44 5.96l3.86-2.96z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.51 1.18-4.2 1.18-3.11 0-5.77-2.63-6.7-5.46L1.44 15.8C3.37 19.65 7.35 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Separator lines */}
        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <span className="relative bg-white px-3.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or continue with email credentials</span>
        </div>

        {/* Error / Success message displays */}
        {(formError || error) && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-705 p-3.5 rounded-xl mb-5 text-xs font-semibold">
            <span>{formError || error}</span>
          </div>
        )}

        {forgotSuccess && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-755 p-3.5 rounded-xl mb-5 text-xs font-semibold">
            <span>{forgotSuccess}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  id="name-input"
                  placeholder="e.g. Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email-input" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="email" 
                id="email-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password-input" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Security Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:text-primary-hover font-bold hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="password" 
                id="password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* Dynamic Avatar Selectors in Signup Mode */}
          {isSignUp && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Select Custom Character Avatar</label>
              <div className="grid grid-cols-6 gap-3">
                {AVATAR_OPTIONS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`aspect-square rounded-full border-2 overflow-hidden hover:scale-105 active:scale-95 transition relative ${selectedAvatar === url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Avatar option ${i+1}`} className="w-full h-full object-cover" />
                    {selectedAvatar === url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : isSignUp ? (
              <>
                <Sparkles className="w-4.5 h-4.5" /> Initialize Account
              </>
            ) : (
              <>
                <LogIn className="w-4.5 h-4.5" /> Start Learning
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <span className="relative bg-white px-3.5 text-slate-400 text-xs font-bold uppercase tracking-wider">Quick Accounts (Seed Users)</span>
        </div>

        {/* Seed logs and quick developer shortcuts */}
        <div className="grid grid-cols-3 gap-2.5">
          <button 
            type="button"
            onClick={() => handleQuickLogin('student@lms.local')}
            disabled={submitting}
            className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-primary/5 p-2 rounded-xl text-center group transition"
          >
            <span className="text-xs font-extrabold text-slate-700 leading-tight group-hover:text-primary">Student</span>
            <span className="text-[9px] text-slate-400">student@lms.local</span>
          </button>

          <button 
            type="button"
            onClick={() => handleQuickLogin('admin@lms.local')}
            disabled={submitting}
            className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 hover:border-sky-500/30 hover:bg-sky-50 p-2 rounded-xl text-center group transition"
          >
            <span className="text-xs font-extrabold text-slate-700 leading-tight group-hover:text-sky-600">Admin</span>
            <span className="text-[9px] text-slate-400">admin@lms.local</span>
          </button>

          <button 
            type="button"
            onClick={() => handleQuickLogin('developer@lms.local')}
            disabled={submitting}
            className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 hover:border-amber-500/30 hover:bg-amber-50 p-2 rounded-xl text-center group transition"
          >
            <span className="text-xs font-extrabold text-slate-700 leading-tight group-hover:text-amber-600">Developer</span>
            <span className="text-[9px] text-slate-400">developer@lms.local</span>
          </button>
        </div>

      </div>
    </div>
  );
}
