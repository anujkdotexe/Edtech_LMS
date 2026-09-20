'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { Sparkles, Mail, Lock, User, UserPlus, LogIn, Check, Zap, AlertCircle } from 'lucide-react';

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
  const { login, signup, googleLogin, error, clearError } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormError(null);
    clearError();
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await login({ email: quickEmail, password: 'password123' });
      router.push('/');
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in with quick credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleEmail('');
    setGoogleName('');
    setFormError(null);
    setShowGoogleModal(true);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) {
      alert('Please fill out all Google credentials fields');
      return;
    }
    setSubmitting(true);
    try {
      await googleLogin({
        email: googleEmail,
        name: googleName,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(googleName)}`,
      });
      setShowGoogleModal(false);
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Google OAuth failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleQuickSelect = async (quickEmail: string, quickName: string) => {
    setSubmitting(true);
    try {
      await googleLogin({
        email: quickEmail,
        name: quickName,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(quickName)}`,
      });
      setShowGoogleModal(false);
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Google OAuth failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotPasswordMsg('');
    setLoading(true);
    try {
      const data = await apiFetch<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setForgotPasswordMsg(data.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || (!isSignUp && !password) || (isSignUp && !name)) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup({ name, email, password, avatarUrl: selectedAvatar });
        router.push('/');
      } else {
        await login({ email, password });
        // Check if admin forced a password reset — redirect immediately
        const { user } = useAuthStore.getState();
        if (user?.forcePasswordReset) {
          router.push('/reset-password?forced=true');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium subtle background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-sky-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] mx-auto space-y-6 z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-slate-100 rounded-2xl shadow-premium mb-2 transition-transform hover:scale-105 duration-300">
            <Zap className="w-8 h-8 fill-primary text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">
            Antigravity LMS
          </h1>
          <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
            Unleash language mastery through immersive, gamified course modules.
          </p>
        </div>

        {/* Premium Authentication Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-premium p-8 relative overflow-hidden transition-all duration-300">
          
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>

          {/* Form Header */}
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {isSignUp ? 'Sign up to initialize your learning metrics.' : 'Sign in to access your modules & streaks.'}
            </p>
          </div>

          {/* Google OAuth One-Click Logins */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2.5 active:scale-[0.98] text-xs font-sans"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          {/* Elegant Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest font-sans">or login with email</span>
          </div>

          {/* Errors Display Panel */}
          {(formError || error || errorMsg) && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-xs font-semibold flex items-center gap-2 animate-[shake_0.3s_ease]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError || error || errorMsg}</span>
            </div>
          )}

          {/* Form Interface */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label htmlFor="name-input" className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-sans pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    id="name-input"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium font-sans"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email-input" className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-sans pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  id="email-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium font-sans"
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password-input" className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest font-sans">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setForgotPasswordMode(true); setErrorMsg(''); setForgotPasswordMsg(''); }}
                    className="text-[10px] font-bold text-primary hover:underline font-sans"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    id="password-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium font-sans"
                    required
                  />
                </div>
              </div>
            )}

            {/* Dynamic Avatar Grid on Register Onboarding */}
            {isSignUp && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-sans pl-1 block">Choose Character Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.slice(0, 6).map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`aspect-square rounded-full border-2 overflow-hidden hover:scale-105 active:scale-95 transition relative ${selectedAvatar === url ? 'border-primary ring-2 ring-primary/15' : 'border-slate-100 opacity-80 hover:opacity-100'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Avatar seed ${i+1}`} width="48" height="48" className="w-full h-full object-cover" />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
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
              className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-xl shadow-md shadow-primary/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] text-xs font-sans mt-2"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : isSignUp ? (
                <>
                  <Sparkles className="w-4 h-4" /> Initialize Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Start Learning
                </>
              )}
            </button>
          </form>

          {/* Seamless Mode Switcher */}
          <div className="mt-5 text-center text-xs font-medium text-slate-400 font-sans border-t border-slate-100 pt-4 flex justify-between items-center">
            <span>{isSignUp ? 'Already a student?' : 'New student learner?'}</span>
            <button 
              type="button"
              onClick={toggleMode}
              className="text-primary hover:text-primary-hover font-extrabold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>

        </div>

        {/* Quick Dev Accounts Section (Beautifully styled as minimal badges) */}
        <div className="space-y-2">
          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/50"></div></div>
            <span className="relative bg-slate-50 px-3 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest font-sans">Quick Sandbox Sessions</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => handleQuickLogin('student@lms.local')}
              disabled={submitting}
              className="h-10 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-500/20 text-slate-650 hover:text-amber-600 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] font-sans text-[11px] font-extrabold"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Student</span>
            </button>
            <button 
              type="button"
              onClick={() => handleQuickLogin('admin@lms.local')}
              disabled={submitting}
              className="h-10 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-500/20 text-slate-650 hover:text-emerald-600 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] font-sans text-[11px] font-extrabold"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Admin</span>
            </button>
            <button 
              type="button"
              onClick={() => handleQuickLogin('developer@lms.local')}
              disabled={submitting}
              className="h-10 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-500/20 text-slate-650 hover:text-purple-600 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] font-sans text-[11px] font-extrabold"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Dev Shell</span>
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-premium space-y-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 font-display">Reset Password</h3>
              <p className="text-xs text-slate-400 font-medium">Enter your email address to obtain a recovery link.</p>
            </div>
            
            {forgotPasswordMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold p-3 rounded-xl">
                {forgotPasswordMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-sans focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium"
              />
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button type="button" onClick={() => setForgotPasswordMode(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={loading} className="bg-primary text-white px-5 py-2 rounded-xl font-bold shadow-md shadow-primary/10 hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition">
                  {loading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Identity Simulator Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-premium space-y-6 relative overflow-hidden text-slate-800">
            {/* Corner decoration glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider font-bold text-primary uppercase bg-primary-light px-2.5 py-1 rounded-md">
                Google SSO Sandbox
              </span>
              <h3 className="font-extrabold text-xl text-slate-900 font-display pt-1">Google Identity Selector</h3>
              <p className="text-xs text-slate-400 font-medium">Select an existing verified identity or create a custom simulation node.</p>
            </div>

            {/* Quick account choosers */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Choose Quick Account</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleQuickSelect('student@lms.local', 'Default Student')}
                  className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-primary/20 rounded-xl transition text-left text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">D</div>
                  <div className="truncate">
                    <p className="text-slate-800 truncate">Default Student</p>
                    <p className="text-[9px] text-slate-400 truncate">student@lms.local</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleQuickSelect('newgoogle@lms.local', 'Google Merged Account')}
                  className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-primary/20 rounded-xl transition text-left text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">G</div>
                  <div className="truncate">
                    <p className="text-slate-800 truncate">New Google Acc</p>
                    <p className="text-[9px] text-slate-400 truncate">newgoogle@lms.local</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Elegant Divider */}
            <div className="relative text-center my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-150"></div></div>
              <span className="relative bg-white px-3 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest font-sans">Or Custom credentials</span>
            </div>

            {/* Custom inputs */}
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="E.g., Jane Doe"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-sans focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">Google Email Address</label>
                <input 
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="jane.doe@gmail.com"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-sans focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button type="button" onClick={() => setShowGoogleModal(false)} className="px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary/10 hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition">
                  {submitting ? 'Simulating SSO...' : 'Google Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
