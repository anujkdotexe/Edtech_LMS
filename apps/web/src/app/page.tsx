'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import { 
  Flame, Award, BookOpen, Trophy, Sparkles, Lock, Unlock, 
  HelpCircle, ChevronRight, CheckCircle2, AlertCircle, ShoppingCart, Zap, X, Clock
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

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardAssets();
      // Check if warmup completed today in localStorage
      const today = new Date().toDateString();
      const saved = localStorage.getItem(`warmup_${today}_${user?.id}`);
      if (saved) {
        setWarmupCompleted(true);
      }
    }
  }, [isAuthenticated, user?.id]);

  const loadDashboardAssets = async () => {
    setLoadingAssets(true);
    try {
      const fetchedCourses = await apiFetch<Course[]>('/api/courses');
      const fetchedQuizzes = await apiFetch<Quiz[]>('/api/quizzes');
      setCourses(fetchedCourses);
      setQuizzes(fetchedQuizzes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingAssets(false);
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
}
