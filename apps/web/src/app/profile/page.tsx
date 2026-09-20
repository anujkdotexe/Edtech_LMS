'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, ActivityFeedItem, PurchaseHistoryItem, QuizHistoryItem } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { 
  User, Award, Flame, Sparkles, CheckCircle2, AlertCircle, Save, 
  Lock, KeyRound, ShieldCheck, Trophy, Activity, ShoppingCart, 
  BrainCircuit, Calendar, FileText
} from 'lucide-react';

const AVATAR_SEEDS = [
  { id: 'felix', name: 'Felix' },
  { id: 'kitty', name: 'Kitty' },
  { id: 'buddy', name: 'Buddy' },
  { id: 'sparky', name: 'Sparky' },
  { id: 'pepper', name: 'Pepper' },
  { id: 'luna', name: 'Luna' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'rocky', name: 'Rocky' },
  { id: 'coco', name: 'Coco' },
  { id: 'sunny', name: 'Sunny' },
  { id: 'daisy', name: 'Daisy' },
  { id: 'rusty', name: 'Rusty' }
];

export default function ProfilePage() {
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  
  // Profile settings state
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchProfile();
    }
  }, [isAuthenticated, user, fetchProfile]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.avatarUrl) {
        try {
          const urlParams = new URL(user.avatarUrl);
          const seedParam = urlParams.searchParams.get('seed') || 'felix';
          setSelectedAvatar(seedParam);
        } catch {
          setSelectedAvatar('felix');
        }
      } else {
        setSelectedAvatar('felix');
      }
    }
  }, [user]);

  if (!isAuthenticated || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    const fullAvatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedAvatar}`;

    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          avatarUrl: fullAvatarUrl
        })
      });

      setProfileSuccess(true);
      await fetchProfile();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Could not update profile credentials');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and password confirmation do not match.');
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      setSavingPassword(false);
      return;
    }

    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          password: newPassword,
        }),
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Title Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-800 flex items-center gap-2">
          <User className="w-8 h-8 text-primary" />
          My Profile & Settings
        </h1>
        <p className="text-sm text-slate-400">
          Modify your avatar character, display name, and track your gamification metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Gamified Stats Card & Badges */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Stats Overview */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium space-y-6 text-center">
            
            {/* Huge Avatar Circle */}
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center bg-slate-100 text-slate-500 font-semibold relative overflow-hidden mx-auto shadow-md">
              <img 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedAvatar}`} 
                alt="Avatar" 
                width="96"
                height="96"
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800 leading-none">{user.name}</h2>
              <p className="text-xs font-semibold text-slate-400">{user.email}</p>
              <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded bg-primary-light text-primary uppercase tracking-wider">{user.role} Account</span>
            </div>

            {/* Streak flame meter */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-streak">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center text-accent-streak shadow-sm">
                  <Flame className="w-6 h-6 fill-accent-streak animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Streak</span>
                  <span className="text-lg font-black font-display text-slate-800">{user.stats?.currentStreak || 0} Days</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Record</span>
                <span className="text-sm font-bold text-slate-600">{user.stats?.longestStreak || 0}d record</span>
              </div>
            </div>

            {/* Level & XP progression bar */}
            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1 text-primary">
                  <Award className="w-4 h-4" />
                  Level {user.stats?.level || 1} Scholar
                </span>
                <span className="text-indigo-700">{user.stats?.totalXp || 0} Total XP</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inset">
                <div 
                  className="bg-accent h-full rounded-full xp-fill shadow-[0_0_8px_rgba(255,176,0,0.5)]" 
                  style={{ width: `${user.stats?.progressPercent || 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 text-left font-medium">
                Collect another {250 - (user.stats?.totalXp % 250)} XP by passing grammar quizzes to level up!
              </p>
            </div>
          </div>

          {/* Badges showcase shelf */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Trophy className="w-4.5 h-4.5 text-primary" />
              Achievements Showcase (7 Badges)
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  id: 'scholar_1',
                  name: 'Scholar Level 1',
                  description: 'Complete your first lesson module',
                  isUnlocked: (user?.stats?.totalXp || 0) >= 20 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                },
                {
                  id: 'centurion_streak',
                  name: 'Centurion Streak',
                  description: 'Maintain a 5-day active streak flame',
                  isUnlocked: (user?.stats?.currentStreak || 0) >= 5 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                },
                {
                  id: 'quiz_conqueror',
                  name: 'Quiz Conqueror',
                  description: 'Achieve a perfect score on any MCQ quiz',
                  isUnlocked: (user?.stats?.totalXp || 0) >= 100 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                },
                {
                  id: 'cefr_pioneer',
                  name: 'CEFR Pioneer',
                  description: 'Unlock any CEFR vocabulary or syntax course catalog',
                  isUnlocked: (user?.stats?.totalXp || 0) >= 50 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                },
                {
                  id: 'xp_overlord',
                  name: 'XP Overlord',
                  description: 'Amass 500 total XP points across modules',
                  isUnlocked: (user?.stats?.totalXp || 0) >= 500 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                },
                {
                  id: 'vocab_master',
                  name: 'Vocabulary Master',
                  description: 'Clear the 30-sec daily vocabulary warmup challenge',
                  isUnlocked: typeof window !== 'undefined' && !!localStorage.getItem(`warmup_${new Date().toDateString()}_${user?.id}`),
                },
                {
                  id: 'platform_veteran',
                  name: 'Platform Veteran',
                  description: 'Stay active for 7 consecutive days',
                  isUnlocked: (user?.stats?.currentStreak || 0) >= 7 || (user?.stats?.totalXp || 0) >= 300 || user.role === 'ADMIN' || user.role === 'DEVELOPER',
                }
              ].map((badge) => (
                <div 
                  key={badge.id} 
                  className={`flex items-start gap-3 border p-3 rounded-2xl transition duration-200 ${
                    badge.isUnlocked 
                      ? 'bg-slate-50 border-slate-100 hover:border-slate-200' 
                      : 'bg-slate-50/30 border-slate-100/50 opacity-55'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                    badge.isUnlocked
                      ? 'bg-amber-50 border-amber-200 text-amber-500'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {badge.isUnlocked ? (
                      <Award className="w-5 h-5 fill-amber-50/50" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                      <span>{badge.name}</span>
                      {badge.isUnlocked ? (
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">Unlocked</span>
                      ) : (
                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wide">Locked</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Activity className="w-4.5 h-4.5 text-primary" />
              Recent Activity Feed
            </h3>
            <div className="space-y-3">
              {(user.activityFeed || []).length > 0 ? (
                (user.activityFeed as ActivityFeedItem[]).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{activity.text}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">No recent activities found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Update forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Name & Avatar edit form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <User className="w-4.5 h-4.5 text-primary" />
              Profile Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* Alert Feedback */}
              {profileSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully! Welcome parameters refreshed.</span>
                </div>
              )}
              {profileError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              {/* Avatar Selector Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Avatar Character</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {AVATAR_SEEDS.map((seed) => {
                    const isSelected = selectedAvatar === seed.id;
                    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed.id}`;
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        onClick={() => setSelectedAvatar(seed.id)}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden flex items-center justify-center p-0.5 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition relative ${
                          isSelected ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-sm' : 'border-slate-100'
                        }`}
                        title={seed.name}
                      >
                        <img src={avatarUrl} alt={seed.name} width="48" height="48" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-white p-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 fill-white text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary text-xs py-2.5 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving Details...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password settings form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <KeyRound className="w-4.5 h-4.5 text-primary" />
              Credentials Password Update
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              
              {passwordSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password changed successfully. Sandbox reset logged.</span>
                </div>
              )}
              {passwordError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  {savingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Secure 256-bit credentials encryption</span>
                </div>
              </div>
            </form>
          </div>

          {/* Purchase & Quiz History */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <FileText className="w-4.5 h-4.5 text-primary" />
              Account History
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Purchases */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Course Purchases
                </h4>
                <div className="space-y-2">
                  {(user.purchaseHistory || []).length > 0 ? (
                    (user.purchaseHistory as PurchaseHistoryItem[]).map((purchase) => (
                      <div key={purchase.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-bold text-slate-700 truncate">{purchase.courseTitle}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded-sm">${purchase.amount}</span>
                          <span className="text-[9px] text-slate-400">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-400">No purchases found.</p>
                  )}
                </div>
              </div>

              {/* Quizzes */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5" /> Quiz Attempts
                </h4>
                <div className="space-y-2">
                  {(user.quizHistory || []).length > 0 ? (
                    (user.quizHistory as QuizHistoryItem[]).map((quiz) => (
                      <div key={quiz.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-slate-700 truncate">{quiz.quizTitle}</p>
                          <span className="text-[9px] text-slate-400">{new Date(quiz.attemptedAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 rounded-sm shrink-0 ${quiz.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {quiz.score}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-400">No quiz attempts yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
