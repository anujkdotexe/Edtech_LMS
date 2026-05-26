'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import { 
  Flame, Award, BookOpen, Trophy, Sparkles, Lock, Unlock, 
  HelpCircle, ChevronRight, CheckCircle2, AlertCircle, ShoppingCart, Zap, X, Clock,
  Activity, Terminal, Settings, Users, DollarSign, Database, TrendingUp, LogOut, RefreshCw, BarChart2, Shield
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
}

interface Quiz {
  id: string;
  title: string;
  rules: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Student Widgets States
  const [dailyTip, setDailyTip] = useState('Practice for 15 minutes a day to maintain your streak!');
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingStudentWidgets, setLoadingStudentWidgets] = useState(true);
  
  // Daily Vocab Warmup State
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [warmupSelected, setWarmupSelected] = useState<string | null>(null);
  const [warmupAnswerChecked, setWarmupAnswerChecked] = useState(false);
  const [warmupTimeLeft, setWarmupTimeLeft] = useState(30);
  const [warmupFailed, setWarmupFailed] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isAuthenticated || warmupCompleted || warmupAnswerChecked || warmupFailed) return;
    
    const saved = localStorage.getItem(`warmup_${new Date().toDateString()}_${user?.id}`);
    if (saved) return; // already completed

    const timer = setInterval(() => {
      setWarmupTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setWarmupFailed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, warmupCompleted, warmupAnswerChecked, warmupFailed, user?.id]);

  // Purchase Modal State
  const [purchaseCourse, setPurchaseCourse] = useState<Course | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Admin Dashboard State
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Developer Dashboard State
  const [devHealth, setDevHealth] = useState<any>(null);
  const [devLogs, setDevLogs] = useState<any[]>([]);
  const [loadingDev, setLoadingDev] = useState(true);
  const [devError, setDevError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'STUDENT') {
        loadDashboardAssets();
        // Check if warmup completed today in localStorage
        const today = new Date().toDateString();
        const saved = localStorage.getItem(`warmup_${today}_${user?.id}`);
        if (saved) {
          setWarmupCompleted(true);
        }
      } else if (user?.role === 'ADMIN') {
        loadAdminDashboardData();
      } else if (user?.role === 'DEVELOPER') {
        loadDeveloperDashboardData();
      }
    }
  }, [isAuthenticated, user?.id, user?.role]);

  const loadDashboardAssets = async () => {
    setLoadingAssets(true);
    setLoadingStudentWidgets(true);
    try {
      const fetchedCourses = await apiFetch<Course[]>('/api/courses');
      const fetchedQuizzes = await apiFetch<Quiz[]>('/api/quizzes');
      setCourses(fetchedCourses);
      setQuizzes(fetchedQuizzes);

      // Fetch public settings for daily tip
      try {
        const publicSettings = await apiFetch<any>('/api/public/settings');
        if (publicSettings?.dailyTip) {
          setDailyTip(publicSettings.dailyTip);
        }
      } catch (err) {
        console.error('Failed to fetch public settings:', err);
      }

      // Fetch leaderboard for preview
      try {
        const leaderboardData = await apiFetch<any>('/api/leaderboard');
        if (leaderboardData?.leaderboard) {
          setLeaderboardList(leaderboardData.leaderboard);
        }
        if (leaderboardData?.currentUserRank !== undefined) {
          setUserRank(leaderboardData.currentUserRank);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard preview:', err);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingAssets(false);
      setLoadingStudentWidgets(false);
    }
  };

  const loadAdminDashboardData = async () => {
    setLoadingAdmin(true);
    setAdminError(null);
    try {
      const data = await apiFetch<any>('/api/admin/analytics/dashboard');
      setAdminData(data);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to load admin analytics');
    } finally {
      setLoadingAdmin(false);
    }
  };

  const loadDeveloperDashboardData = async () => {
    setLoadingDev(true);
    setDevError(null);
    try {
      const healthData = await apiFetch<any>('/api/dev/monitoring/health');
      const logsData = await apiFetch<any[]>('/api/dev/monitoring/logs');
      setDevHealth(healthData);
      setDevLogs(logsData);
    } catch (err: any) {
      setDevError(err.message || 'Failed to load developer diagnostics');
    } finally {
      setLoadingDev(false);
    }
  };

  // Time-based welcome message helper
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Daily Warmup selection handler
  const handleWarmupSelect = (option: string) => {
    if (warmupAnswerChecked || warmupFailed) return;
    setWarmupSelected(option);
  };

  const handleWarmupCheck = () => {
    if (!warmupSelected) return;
    setWarmupAnswerChecked(true);
    if (warmupSelected === 'B') {
      const today = new Date().toDateString();
      localStorage.setItem(`warmup_${today}_${user?.id}`, 'completed');
      setTimeout(() => {
        setWarmupCompleted(true);
        // Refresh profile stats to simulate the XP visual progress update
        fetchProfile();
      }, 1500);
    }
  };

  // Course Purchase Checkout Simulator
  const handleInitiatePurchase = (course: Course) => {
    setPurchaseCourse(course);
    setPurchaseStatus('IDLE');
    setPurchaseError(null);
  };

  const handleSimulateCheckout = async (status: 'SUCCESS' | 'FAILED') => {
    if (!purchaseCourse) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const response = await apiFetch<{ success: boolean; message: string }>(`/api/courses/${purchaseCourse.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ simulatedStatus: status }),
      });
      
      if (status === 'SUCCESS') {
        setPurchaseStatus('SUCCESS');
        setTimeout(async () => {
          setPurchaseCourse(null);
          await fetchProfile();
          await loadDashboardAssets();
        }, 1800);
      } else {
        setPurchaseStatus('FAILED');
        setPurchaseError('Simulated checkout failed. Card declined or user canceled transaction.');
      }
    } catch (err: any) {
      setPurchaseStatus('FAILED');
      setPurchaseError(err.message || 'Payment simulation error');
    } finally {
      setPurchasing(false);
    }
  };

  if (!isAuthenticated) return null;

  const renderStudentDashboard = () => {
    return (
      <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* 1. Time-sensitive Welcome Banner with Springy Sparkles */}
        <section className="bg-gradient-to-r from-primary via-[#4F46E5] to-secondary text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full filter blur-2xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>Welcome to Level {user?.stats?.level || 1} Journey</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
              {getGreeting()}, {user?.name}!
            </h2>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              Ready to unlock new achievements? Maintain your consecutive streak, conquer vocabulary quizzes, and master custom native syllabus files.
            </p>
          </div>
        </section>

        {/* Grid: 30sec Warmup vs. Streak & XP Progress Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 2. Interactive 30-Second Daily Vocab Warmup Widget */}
          <section className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent fill-accent" />
                  Daily Vocab Warmup
                </h3>
                <div className="flex items-center gap-2">
                  {!warmupCompleted && !warmupFailed && !warmupAnswerChecked && (
                    <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-md uppercase flex items-center gap-1 border ${
                      warmupTimeLeft <= 5 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <Clock className="w-3 h-3" /> 00:{warmupTimeLeft.toString().padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-[10px] font-bold tracking-wider text-primary bg-primary-light px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-primary text-primary" /> +10 XP Boost
                  </span>
                </div>
              </div>

              {warmupCompleted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-[scaleIn_0.3s_ease-out]">
                  <CheckCircle2 className="w-12 h-12 text-accent-success fill-emerald-50" />
                  <h4 className="font-bold text-slate-800 text-lg">Daily Warmup Cleared!</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Fantastic! You have unlocked your daily warmup boost. Come back tomorrow for another quick vocabulary challenge!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-500 text-sm">
                    What is the correct translation for the greeting: <strong className="text-slate-800 font-extrabold font-display">"Bonjour"</strong>?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'A', label: 'Goodbye' },
                      { key: 'B', label: 'Hello / Good day' },
                      { key: 'C', label: 'Please' },
                      { key: 'D', label: 'Thank you' },
                    ].map((opt) => {
                      const isSelected = warmupSelected === opt.key;
                      const isCorrect = opt.key === 'B';
                      
                      let btnStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700";
                      if (warmupFailed) {
                         btnStyle = isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-800 opacity-50" : "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                      } else if (isSelected) {
                        if (warmupAnswerChecked) {
                          btnStyle = isCorrect 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-red-50 border-red-500 text-red-800";
                        } else {
                          btnStyle = "bg-primary-light border-primary text-primary font-semibold";
                        }
                      } else if (warmupAnswerChecked && isCorrect) {
                        btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800";
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleWarmupSelect(opt.key)}
                          disabled={warmupAnswerChecked || warmupFailed}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition active:scale-[0.98] ${btnStyle}`}
                        >
                          <span className="font-bold mr-2 text-xs uppercase opacity-60">{opt.key})</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {!warmupCompleted && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  {warmupFailed ? (
                    <><AlertCircle className="w-4 h-4 text-red-500" /> Time's up! Try again tomorrow.</>
                  ) : warmupSelected ? (
                    'Answer selected'
                  ) : (
                    'Choose an answer before time runs out'
                  )}
                </span>
                {!warmupFailed && (
                  <button
                    onClick={handleWarmupCheck}
                    disabled={!warmupSelected || warmupAnswerChecked}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {warmupAnswerChecked && warmupSelected === 'B' ? 'Correct! Loading...' : warmupAnswerChecked ? 'Try again!' : 'Check Answer'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* 3. Streak & Progress Stats Shelf */}
          <section className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                <Flame className="w-5 h-5 text-accent-streak fill-accent-streak" />
                Streak & XP Milestones
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Streak</span>
                  <span className="text-2xl font-black font-display text-accent-streak flex items-center gap-1">
                    <Flame className="w-6 h-6 fill-accent-streak animate-bounce" />
                    {user?.stats?.currentStreak || 0} Days
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Record: {user?.stats?.longestStreak || 0} days</span>
                </div>
                <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100/50 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Experience</span>
                  <span className="text-2xl font-black font-display text-primary flex items-center gap-1">
                    <Award className="w-6 h-6 text-primary fill-primary-light" />
                    {user?.stats?.totalXp || 0} XP
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Next: {250 - (user?.stats?.totalXp || 0) % 250} XP to Lvl {(user?.stats?.level || 1) + 1}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Level Progress ({user?.stats?.progressPercent || 0}%)</span>
                <span>Level {user?.stats?.level || 1}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inset">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-full rounded-full xp-fill shadow-[0_0_8px_rgba(60,52,137,0.4)]" 
                  style={{ width: `${user?.stats?.progressPercent || 0}%` }}
                ></div>
              </div>
            </div>
          </section>

        </div>

        {/* 3.5. Student Role Upgrades: Daily Tip, Leaderboard Preview, Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Daily Tip Widget */}
          <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between hover:shadow-premium-hover transition duration-300 relative overflow-hidden group text-slate-800">
            {/* Soft decorative background glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Daily Tip & Wisdom
              </h3>
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 text-xs text-slate-650 leading-relaxed font-sans relative">
                <span className="text-2xl text-primary/30 font-serif absolute -top-1.5 -left-1">“</span>
                <p className="pl-4 italic">{dailyTip}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Updated daily by admins</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-350" />
            </div>
          </section>

          {/* Leaderboard Preview Widget */}
          <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between hover:shadow-premium-hover transition duration-300 relative overflow-hidden group text-slate-800">
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                <Trophy className="w-4 h-4 text-accent fill-accent" />
                Leaderboard Snapshot
              </h3>
              <div className="space-y-2">
                {loadingStudentWidgets ? (
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-100 rounded animate-pulse"></div>
                    <div className="h-6 bg-slate-100 rounded animate-pulse"></div>
                    <div className="h-6 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                ) : leaderboardList && leaderboardList.length > 0 ? (
                  leaderboardList.slice(0, 3).map((item: any, idx: number) => {
                    const isGold = idx === 0;
                    const isSilver = idx === 1;
                    const isBronze = idx === 2;
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-50 rounded-lg transition">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                            isGold ? 'bg-amber-100 border-amber-200 text-amber-700' : isSilver ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-amber-50 border-amber-100 text-amber-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-500 shrink-0">{item.totalXp} XP</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-slate-400 italic text-[11px]">No active students.</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Standings</span>
              <div className="bg-primary-light text-primary font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide border border-primary/10">
                Your Rank: #{userRank || '—'}
              </div>
            </div>
          </section>

          {/* Quick Links Widget */}
          <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between hover:shadow-premium-hover transition duration-300 relative overflow-hidden group text-slate-800">
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-100" />
                Fast Track Shortcuts
              </h3>
              <div className="space-y-2.5 pt-1">
                {/* Resume Course Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    const firstUnlocked = courses.find((c) => c.isUnlocked);
                    if (firstUnlocked) {
                      router.push(`/courses/${firstUnlocked.id}`);
                    } else {
                      router.push('/courses');
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-primary-light hover:text-primary text-slate-700 font-extrabold border border-slate-200/80 hover:border-primary/20 rounded-xl transition flex items-center justify-between text-xs text-left active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-primary" />
                    Resume Active Course
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Daily Quiz Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    if (quizzes && quizzes.length > 0) {
                      router.push(`/quizzes/${quizzes[0].id}`);
                    } else {
                      router.push('/quizzes');
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-amber-50/70 hover:text-amber-700 text-slate-700 font-extrabold border border-slate-200/80 hover:border-amber-500/20 rounded-xl transition flex items-center justify-between text-xs text-left active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-amber-500" />
                    Challenge Daily Quiz
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Conquer goals daily</span>
              <Flame className="w-3.5 h-3.5 text-accent-streak animate-pulse" />
            </div>
          </section>
        </div>

        {/* 4. Unlocked Badges Shelf (visual indicator maps) */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6">
          <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <Trophy className="w-5 h-5 text-accent fill-amber-50" />
            Earned Badges & Credentials Shelf
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'scholar_1', name: 'First Steps Scholar', description: 'Passed your first language quiz!' },
              { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day learning streak!' },
              { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5!' },
            ].map((badge) => {
              const unlockedObj = user?.badges?.find((b) => b.badgeId === badge.id);
              const isUnlocked = !!unlockedObj;

              return (
                <div 
                  key={badge.id}
                  className={`relative p-5 rounded-xl border flex gap-4 items-center transition duration-300 ${isUnlocked ? 'bg-amber-50/20 border-amber-100 shadow-gamified hover:border-amber-200' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${isUnlocked ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-200 border-slate-300 text-slate-400'}`}>
                    {isUnlocked ? (
                      <Trophy className="w-6 h-6 animate-pulse fill-amber-400 text-amber-600" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-extrabold leading-tight ${isUnlocked ? 'text-amber-900' : 'text-slate-500'}`}>
                      {badge.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-snug">{badge.description}</p>
                    {isUnlocked && unlockedObj && (
                      <span className="text-[9px] text-amber-500 font-bold tracking-wide uppercase">Unlocked {new Date(unlockedObj.unlockedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Grid: Course Catalog vs active Quizzes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 5. Language Syllabi Course Grid */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Decoupled Multilingual Course Syllabi
              </h3>
              <span className="text-xs font-semibold text-slate-400">Localized fallback catalog</span>
            </div>

            {loadingAssets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="shimmer h-44 rounded-2xl"></div>
                <div className="shimmer h-44 rounded-2xl"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium flex flex-col justify-between gap-5 hover:scale-[1.01] transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="bg-primary-light text-primary text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                          CEFR {course.cefrLevel}
                        </span>
                        {course.isPremium ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${course.isUnlocked ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                            {course.isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            Premium
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">
                            Free
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-display font-bold text-slate-800 text-lg leading-tight">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="font-black text-slate-800 font-display">
                        {course.isPremium && !course.isUnlocked ? `$${course.price}` : 'Accessible'}
                      </span>
                      
                      {course.isUnlocked ? (
                        <Link 
                          href={`/courses/${course.id}`}
                          className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1"
                        >
                          Enter Syllabus <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleInitiatePurchase(course)}
                          className="btn-accent text-xs py-2 px-4 inline-flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Unlock Course
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 6. Active Gamified MCQ Quiz catalog */}
          <section className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Gamified Quizzes
              </h3>
              <span className="text-xs font-semibold text-slate-400">Play & Earn XP</span>
            </div>

            {loadingAssets ? (
              <div className="space-y-4">
                <div className="shimmer h-24 rounded-2xl"></div>
                <div className="shimmer h-24 rounded-2xl"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="bg-white border border-slate-100 rounded-xl p-5 shadow-premium hover:border-slate-200 transition space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${quiz.difficulty === 'EASY' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : quiz.difficulty === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        {quiz.difficulty}
                      </span>
                      <span className="text-[10px] font-extrabold text-accent bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        +{quiz.pointValue} XP
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-display font-extrabold text-slate-800 text-sm leading-tight">
                        {quiz.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{quiz.rules}</p>
                    </div>

                    <Link 
                      href={`/quizzes/${quiz.id}`}
                      className="w-full text-center bg-slate-50 hover:bg-primary-light hover:text-primary text-slate-600 font-semibold py-2 rounded-lg text-xs transition block border border-slate-100 hover:border-primary/20"
                    >
                      Start Quiz Challenge
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* 7. PREMIUM PURCHASE MOCK CHECKOUT MODAL */}
        {purchaseCourse && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-6 animate-[scaleIn_0.3s_ease-out] relative">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    Simulated Sandbox Checkout
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-lg leading-tight">
                    Unlock {purchaseCourse.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setPurchaseCourse(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-50 transition flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              {purchaseStatus === 'SUCCESS' ? (
                <div className="text-center py-6 space-y-3 flex flex-col items-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 fill-emerald-50 animate-bounce" />
                  <h4 className="font-bold text-slate-800 text-lg">Transaction Approved!</h4>
                  <p className="text-xs text-slate-400">
                    Mock receipt generated successfully. The course syllabus and premium PDF files are now unlocked!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 flex justify-between items-center text-sm font-semibold text-slate-700">
                    <span>Standard Purchase Price</span>
                    <span className="font-black text-slate-800 font-display text-lg">${purchaseCourse.price}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-normal">
                    In order to adhere to absolute **zero cloud cost constraints**, we simulate a credit checkout webhook transaction locally. Select an action below to assert the sandbox routing:
                  </p>

                  {purchaseError && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{purchaseError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      onClick={() => handleSimulateCheckout('SUCCESS')}
                      disabled={purchasing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      Simulate Success
                    </button>

                    <button
                      onClick={() => handleSimulateCheckout('FAILED')}
                      disabled={purchasing}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      Simulate Failure
                    </button>
                  </div>
                </div>
              )}

              {purchaseStatus !== 'SUCCESS' && (
                <div className="text-center">
                  <button
                    onClick={() => setPurchaseCourse(null)}
                    disabled={purchasing}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    );
  };

  const renderAdminDashboard = () => {
    if (loadingAdmin) {
      return (
        <div className="space-y-8 animate-pulse">
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-64 bg-slate-100 rounded-2xl"></div>
            <div className="lg:col-span-5 h-64 bg-slate-100 rounded-2xl"></div>
          </div>
        </div>
      );
    }

    if (adminError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold">Admin Analytics Unavailable</h3>
          <p className="text-sm text-red-600 max-w-md mx-auto">{adminError}</p>
          <button onClick={loadAdminDashboardData} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition">
            Retry Connection
          </button>
        </div>
      );
    }

    const maxSignups = Math.max(...(adminData?.weeklySignups?.map((w: any) => w.count) || []), 1);

    return (
      <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-primary via-[#4F46E5] to-secondary text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
              <Shield className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>Executive Administrative Console</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
              {getGreeting()}, {user?.name}!
            </h2>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              Real-time processed revenue, course signups roster, dynamic gamification metrics, and instant database analytics lookup.
            </p>
          </div>
        </section>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Students</span>
              <span className="text-2xl font-black font-display text-slate-800">{adminData?.totalStudents || 0}</span>
            </div>
            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-2xl font-black font-display text-emerald-600">${adminData?.totalRevenue || 0}</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quiz Attempts</span>
              <span className="text-2xl font-black font-display text-amber-600">{adminData?.quizCompletions?.total || 0}</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Quiz Score</span>
              <span className="text-2xl font-black font-display text-violet-600">{adminData?.quizCompletions?.avgScore || 0}%</span>
            </div>
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts and leaders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Weekly Signups CSS chart */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Weekly Student Onboarding
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last 7 Days</span>
            </div>
            <div className="flex items-end justify-between h-48 pt-8 pb-2 px-2 border-b border-slate-100">
              {adminData?.weeklySignups?.map((w: any, idx: number) => {
                const pct = Math.max((w.count / maxSignups) * 100, 4);
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-8 bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all duration-300 group-hover:opacity-90 flex items-end justify-center" style={{ height: `${pct}%` }}>
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition shadow-sm z-10">
                        {w.count}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">{w.date}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
              <span>Total New Enrolled: {adminData?.weeklySignups?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}</span>
              <span>Live Database Aggregation</span>
            </div>
          </div>

          {/* Top Streak Leaders */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-premium p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Flame className="w-5 h-5 text-accent-streak fill-accent-streak" />
                Global Streak Leaders
              </h3>
              <div className="space-y-3">
                {adminData?.streakLeaders && adminData.streakLeaders.length > 0 ? (
                  adminData.streakLeaders.map((leader: any, idx: number) => (
                    <div key={leader.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 hover:border-slate-200 transition">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs font-bold text-slate-400 text-center">#{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center text-xs uppercase">
                          {leader.name ? leader.name[0] : 'S'}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-700 leading-none">{leader.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-none">Active student</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-accent-streak flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-accent-streak" />
                        {leader.streak || 0} Days
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No active student streaks recorded in DB.
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic leaderboard cache synced</span>
            </div>
          </div>
        </div>

        {/* Administrative Quick Actions Grid */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6">
          <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            Administrative Shortcuts & System Operations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/students" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-primary transition">Student CRM</h4>
                <p className="text-xs text-slate-400 mt-0.5">Suspend users, reset passwords, bulk CSV import/export.</p>
              </div>
            </Link>

            <Link href="/admin/courses" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-600 transition">Course Catalog</h4>
                <p className="text-xs text-slate-400 mt-0.5">Manage deep curricula modules, lesson PDF uploads, reordering.</p>
              </div>
            </Link>

            <Link href="/admin/quizzes" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-amber-600 transition">Quiz Management</h4>
                <p className="text-xs text-slate-400 mt-0.5">Create MCQ quiz challenges, modify question arrays, levels.</p>
              </div>
            </Link>

            <Link href="/admin/payments" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-violet-600 transition">Payments Ledger</h4>
                <p className="text-xs text-slate-400 mt-0.5">Audit transaction invoices, issue refunds, download ledger CSVs.</p>
              </div>
            </Link>

            <Link href="/admin/settings" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition">Site Settings</h4>
                <p className="text-xs text-slate-400 mt-0.5">Brand configuration, UI themes, custom notifications banner.</p>
              </div>
            </Link>

            <Link href="/admin" className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-rose-600 transition">Metrics Center</h4>
                <p className="text-xs text-slate-400 mt-0.5">Real-time charts, global signup rosters, system status.</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    );
  };

  const renderDeveloperDashboard = () => {
    if (loadingDev) {
      return (
        <div className="space-y-8 animate-pulse bg-slate-950 p-6 rounded-2xl">
          <div className="h-32 bg-slate-900 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-24 bg-slate-900 rounded-xl"></div>
            <div className="h-24 bg-slate-900 rounded-xl"></div>
            <div className="h-24 bg-slate-900 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-900 rounded-2xl"></div>
        </div>
      );
    }

    if (devError) {
      return (
        <div className="bg-[#090b13] border border-red-900 text-red-400 p-8 rounded-2xl text-center space-y-4 font-mono">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold">DEVELOPER DIAGNOSTICS OFFLINE</h3>
          <p className="text-xs text-red-500/80 max-w-md mx-auto">{devError}</p>
          <button onClick={loadDeveloperDashboardData} className="px-4 py-2 bg-red-950 border border-red-700 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold transition">
            RETRY COMPILER HANDSHAKE
          </button>
        </div>
      );
    }

    const freeMemGB = devHealth?.system ? (devHealth.system.freeMemoryBytes / (1024 * 1024 * 1024)).toFixed(2) : '0';
    const totalMemGB = devHealth?.system ? (devHealth.system.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(2) : '0';
    const memoryUsagePercent = devHealth?.system ? Math.round(((devHealth.system.totalMemoryBytes - devHealth.system.freeMemoryBytes) / devHealth.system.totalMemoryBytes) * 100) : 0;

    const formatUptime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    return (
      <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] bg-[#07090e] p-6 sm:p-8 rounded-3xl border border-slate-900 text-slate-100">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-[#111827] via-[#1e1b4b] to-[#0f172a] text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-indigo-950/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-indigo-400 font-bold uppercase">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Dev Terminal Environment [CONNECTED]</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Dev Console // {user?.name}
            </h2>
            <p className="text-slate-400 text-xs max-w-xl font-mono leading-relaxed">
              System host: localhost:4000 | Active takeover state: {user?.impersonatedBy ? 'IMPERSONATED [WARNING]' : 'STANDARD IDENTITY'} | Uptime: {formatUptime(devHealth?.system?.uptimeSeconds || 0)}
            </p>
          </div>
        </section>

        {/* System Health Snapshot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Memory Pool */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                SYSTEM MEMORY
              </span>
              <span className="text-indigo-400">{memoryUsagePercent}% USED</span>
            </div>
            <div className="space-y-1">
              <span className="text-xl font-black text-slate-200">{freeMemGB} GB Free</span>
              <span className="text-[10px] text-slate-500 block">Total Capacity: {totalMemGB} GB</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full" style={{ width: `${memoryUsagePercent}%` }}></div>
            </div>
          </div>

          {/* Database Health */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                POSTGRES DATA
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ONLINE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900">
                <span className="text-xs font-bold text-slate-400 block uppercase">Users</span>
                <span className="text-sm font-extrabold text-slate-200">{devHealth?.database?.totalUsersCount || 0}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900">
                <span className="text-xs font-bold text-slate-400 block uppercase">Courses</span>
                <span className="text-sm font-extrabold text-slate-200">{devHealth?.database?.totalCoursesCount || 0}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900">
                <span className="text-xs font-bold text-slate-400 block uppercase">Orders</span>
                <span className="text-sm font-extrabold text-slate-200">{devHealth?.database?.totalOrdersCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Environment Parameters */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 space-y-2.5 font-mono">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                ENVIRONMENT
              </span>
              <span className="text-slate-500 font-bold uppercase">{devHealth?.system?.arch || 'x64'}</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Host OS:</span>
                <span className="font-semibold text-slate-200">{devHealth?.system?.platform || 'windows'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">CPU Cores:</span>
                <span className="font-semibold text-slate-200">{devHealth?.system?.cpuCores || 4} Cores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Stream Terminal */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 text-slate-800">
          <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <Terminal className="w-5 h-5 text-primary" />
            Real-time Security Audit Log Stream
          </h3>
          <div className="bg-[#0d1117] text-gray-200 border border-slate-800 rounded-xl p-5 font-mono text-[11px] shadow-2xl relative">
            <div className="absolute top-2 right-4 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider font-mono">Streaming logs...</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {devLogs && devLogs.length > 0 ? (
                devLogs.map((log: any) => {
                  let badgeColor = 'text-blue-400 border border-blue-900 bg-blue-950/20';
                  if (log.action?.includes('ERROR') || log.action?.includes('FAIL')) {
                    badgeColor = 'text-red-400 border border-red-950 bg-red-950/20';
                  } else if (log.action?.includes('SUCCESS') || log.action?.includes('OK') || log.action?.includes('IMPERSONATION_END')) {
                    badgeColor = 'text-emerald-400 border border-emerald-950 bg-emerald-950/20';
                  } else if (log.action?.includes('IMPERSONATION_START') || log.action?.includes('OVERRIDE')) {
                    badgeColor = 'text-purple-400 border border-purple-950 bg-purple-950/20';
                  }

                  return (
                    <div key={log.id} className="py-1 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-90 hover:opacity-100 transition duration-150">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-500 text-[10px]">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono ${badgeColor}`}>{log.action}</span>
                        <span className="text-slate-300 text-xs break-all">{log.details}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 shrink-0 font-bold self-end sm:self-center">
                        User: {log.userEmail} | IP: {log.ipAddress}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 italic">No log handshakes captured. Assert sandbox API requests.</div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Diagnostics Utilities */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-premium p-6 text-slate-800">
          <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            Developer Utilities & Playground Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="http://localhost:4000/docs" 
              target="_blank" 
              rel="noreferrer"
              className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition">API Health Dashboard</h4>
                <p className="text-xs text-slate-400 mt-0.5">Probe system endpoints, measure TCP latency handshakes, build sandbox requests.</p>
              </div>
            </a>

            <Link 
              href="/dev"
              className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition">Full Dev Console</h4>
                <p className="text-xs text-slate-400 mt-0.5">Execute administrative user impersonations, modify user XP levels, reset streaks.</p>
              </div>
            </Link>

            <a 
              href="http://localhost:4000/docs/swagger" 
              target="_blank" 
              rel="noreferrer"
              className="group p-5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition text-left flex gap-4 items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-600 transition">Swagger UI Specs</h4>
                <p className="text-xs text-slate-400 mt-0.5">Browse native Swagger OpenAPI spec definitions at /docs/swagger/json.</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    );
  };

  if (user?.role === 'ADMIN') {
    return renderAdminDashboard();
  }

  if (user?.role === 'DEVELOPER') {
    return renderDeveloperDashboard();
  }

  return renderStudentDashboard();
}
