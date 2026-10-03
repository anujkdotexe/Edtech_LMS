'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, ActivityFeedItem, PurchaseHistoryItem, QuizHistoryItem } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { 
  User, Award, Flame, Sparkles, CheckCircle2, AlertCircle, Save, 
  Lock, KeyRound, ShieldCheck, Trophy, Activity, ShoppingCart, 
  BrainCircuit, Calendar, FileText, Receipt, Printer, X
} from 'lucide-react';
import { BadgeGrid } from '../../components/gamification/BadgeGrid';
import { Avatar } from '../../components/ui/Avatar';
import { LOCAL_AVATAR_PRESETS, generateLocalAvatarSvg } from '../../lib/avatar';



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

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseHistoryItem | null>(null);

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
          if (user.avatarUrl.includes('seed=')) {
            const urlParams = new URL(user.avatarUrl);
            const seedParam = urlParams.searchParams.get('seed') || 'felix';
            setSelectedAvatar(seedParam);
          } else {
            setSelectedAvatar('felix');
          }
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

    const fullAvatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(selectedAvatar)}`;

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
          currentPassword,
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
            <div className="mx-auto flex justify-center">
              <Avatar 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(selectedAvatar)}`}
                seed={selectedAvatar}
                name={user.name} 
                size="xl" 
                className="w-24 h-24 text-2xl border-4 border-primary/20 shadow-md" 
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
                Collect another {Math.max(0, (user.stats?.xpNeededForNextLevel ?? 250) - (user.stats?.xpInLevel ?? 0))} XP to level up!
              </p>
            </div>
          </div>

          {/* Badges showcase shelf */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Trophy className="w-4.5 h-4.5 text-primary" />
              Achievements Showcase
            </h3>
            
            <BadgeGrid unlockedBadges={user.badges || []} />
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
                  className="w-full px-4 py-2.5 min-h-[44px] text-base sm:text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              {/* Avatar Selector Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Avatar Character</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {LOCAL_AVATAR_PRESETS.map((seed) => {
                    const isSelected = selectedAvatar === seed.id;
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        onClick={() => setSelectedAvatar(seed.id)}
                        className={`min-w-[44px] min-h-[44px] w-14 h-14 rounded-xl border-2 overflow-hidden flex items-center justify-center p-1 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition relative ${
                          isSelected ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-sm' : 'border-slate-100'
                        }`}
                        title={seed.name}
                      >
                        <Avatar src={seed.url} seed={seed.id} name={seed.name} size="sm" className="w-full h-full rounded-lg" />
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white p-0.5 shadow">
                            <CheckCircle2 className="w-3 h-3 fill-white text-primary" />
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
                  className="btn-primary min-h-[44px] text-xs py-2.5 px-5 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 active:scale-95"
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
                    className="w-full px-4 py-2.5 min-h-[44px] text-base sm:text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] text-base sm:text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] text-base sm:text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
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
                  <ShoppingCart className="w-3.5 h-3.5" /> Order History &amp; Receipts
                </h4>
                <div className="space-y-2.5">
                  {(user.purchaseHistory || []).length > 0 ? (
                    (user.purchaseHistory as PurchaseHistoryItem[]).map((purchase) => (
                      <div key={purchase.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-200 transition">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{purchase.courseTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              ₹{Number(purchase.amount).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                              Paid
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedReceipt(purchase)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No purchases found.</p>
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
                    <p className="text-xs text-slate-400">No quiz attempts yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Invoice & Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-6">
            <button
              onClick={() => setSelectedReceipt(null)}
              aria-label="Close receipt"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                  Tax Invoice &bull; Paid
                </span>
                <h3 className="font-display font-black text-xl text-slate-900 mt-2">
                  Payment Receipt
                </h3>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-700">
                  INV-{selectedReceipt.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedReceipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Billed To</span>
                <span className="font-extrabold text-slate-800 block truncate">{user.name}</span>
                <span className="text-slate-500 text-[11px] block truncate">{user.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Method</span>
                <span className="font-extrabold text-slate-800 block">Razorpay PG</span>
                <span className="text-emerald-700 text-[11px] font-bold block">Status: SUCCESS</span>
              </div>
            </div>

            {/* Item Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {selectedReceipt.courseTitle}
                      <span className="block text-[10px] text-slate-400 font-normal">Full Lifetime Curriculum Access</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{Number(selectedReceipt.amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td className="py-2.5 px-4 text-slate-600">Taxes &amp; Fees (GST Included)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">₹0.00</td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td className="py-3 px-4 text-sm font-black text-slate-900">Total Paid</td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-black text-emerald-700">
                      ₹{Number(selectedReceipt.amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Official Antigravity LMS Digital Invoice
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
