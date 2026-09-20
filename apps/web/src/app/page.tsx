'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../lib/api';
import {
  BookOpen,
  Trophy,
  Sparkles,
  Zap,
  ShieldAlert,
  Terminal,
  Lightbulb,
  ArrowRight,
  Flame,
  CheckCircle,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { DailyWarmupCard } from '../components/dashboard/DailyWarmupCard';
import { LeaderboardPreview } from '../components/dashboard/LeaderboardPreview';
import { CourseCard, CourseItem } from '../components/courses/CourseCard';
import { QuizCard, QuizItem } from '../components/quizzes/QuizCard';
import { PurchaseModal } from '../components/courses/PurchaseModal';
import { BadgeGrid } from '../components/gamification/BadgeGrid';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('Practice for 15 minutes a day to maintain your streak!');
  const [loading, setLoading] = useState(true);

  // Purchase modal
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, quizzesData, leaderboardData, settingsData] = await Promise.allSettled([
        apiFetch<CourseItem[]>('/api/courses'),
        apiFetch<QuizItem[]>('/api/quizzes'),
        apiFetch<{ leaderboard: any[]; currentUserRank?: number }>('/api/leaderboard'),
        apiFetch<{ dailyTip?: string }>('/api/public/settings'),
      ]);

      if (coursesData.status === 'fulfilled') setCourses(coursesData.value);
      if (quizzesData.status === 'fulfilled') setQuizzes(quizzesData.value);
      if (leaderboardData.status === 'fulfilled') {
        setLeaderboard(leaderboardData.value.leaderboard || []);
        if (leaderboardData.value.currentUserRank) {
          setUserRank(leaderboardData.value.currentUserRank);
        }
      }
      if (settingsData.status === 'fulfilled' && settingsData.value?.dailyTip) {
        setDailyTip(settingsData.value.dailyTip);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleOpenPurchase = (course: CourseItem) => {
    setSelectedCourse(course);
    setIsPurchaseOpen(true);
  };

  const handlePurchaseSuccess = async () => {
    await loadData();
    await fetchProfile();
  };

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Dynamic motivation message
  const motivation = useMemo(() => {
    const streak = user?.stats?.currentStreak ?? 0;
    if (streak >= 3) {
      return `${streak}-day streak active! Keep the momentum going today.`;
    }
    if (streak > 0) {
      return `${streak}-day streak in progress. Complete a lesson to extend your streak!`;
    }
    return 'Start your daily streak today with a 30-second vocabulary challenge!';
  }, [user?.stats?.currentStreak]);

  // Identify active / unlocked course to resume learning
  const activeCourse = useMemo(() => {
    if (!courses.length) return null;
    const unlocked = courses.find((c) => c.isUnlocked || Number(c.price) === 0);
    return unlocked || null;
  }, [courses]);

  const isDev = user?.role === 'DEVELOPER' || !!user?.impersonatedBy;
  const isAdmin = user?.role === 'ADMIN' || isDev;

  return (
    <div className="space-y-8">
      {/* Admin / Dev Quick Switcher Banner */}
      {isAdmin && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-slate-800 text-amber-400">
              {isDev ? <Terminal className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </span>
            <div>
              <p className="font-bold text-sm">Privileged Account Session</p>
              <p className="text-xs text-slate-300">
                You are viewing the student portal as a {user?.role}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDev && (
              <Link
                href="/dev"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Developer Console
              </Link>
            )}
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Hero Welcome & Personalized Dynamic Greeting */}
      <div className="bg-gradient-to-r from-primary via-indigo-600 to-primary-dark rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{greeting}, {user?.name || 'Student'}!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Level up your language proficiency today.
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium">{motivation}</p>
          <div className="flex items-center gap-2 pt-1 text-indigo-100 text-xs sm:text-sm">
            <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="italic">{dailyTip}</p>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <Zap className="w-72 h-72 fill-white text-white" />
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/courses"
          className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-4 shadow-sm hover:shadow transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Course Catalog</p>
            <p className="text-[11px] text-slate-600">CEFR A1–C2 tiers</p>
          </div>
        </Link>

        <Link
          href="/quizzes"
          className="bg-white border border-slate-200/80 hover:border-amber-300 rounded-2xl p-4 shadow-sm hover:shadow transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition">Practice Quizzes</p>
            <p className="text-[11px] text-slate-600">Score XP &amp; Badges</p>
          </div>
        </Link>

        <Link
          href="/leaderboard"
          className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4 shadow-sm hover:shadow transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">Leaderboard</p>
            <p className="text-[11px] text-slate-600">Weekly rankings</p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="bg-white border border-slate-200/80 hover:border-purple-300 rounded-2xl p-4 shadow-sm hover:shadow transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition">My Profile</p>
            <p className="text-[11px] text-slate-600">Stats &amp; History</p>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <StatsOverview
        stats={user?.stats}
        rank={userRank}
        isLoading={loading}
      />

      {/* Continue Learning Highlight (If active/enrolled course exists) */}
      {activeCourse && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {activeCourse.cefrLevel || 'A1'}
                </span>
                <span className="text-xs font-bold text-slate-600">Continue Learning</span>
              </div>
              <h3 className="font-display font-black text-slate-900 text-base mt-0.5">{activeCourse.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-1">{activeCourse.description}</p>
            </div>
          </div>
          <Link
            href={`/courses/${activeCourse.id}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <span>Resume Syllabus</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Grid: Left (Courses & Quizzes) | Right (Warmup & Leaderboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900 font-display">
                  Available Courses
                </h2>
              </div>
              <Link
                href="/courses"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                View Catalog
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-44 bg-white border border-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-600 text-xs">
                No courses published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.slice(0, 4).map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    onPurchaseClick={handleOpenPurchase}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quizzes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-black text-slate-900 font-display">
                  Practice Quizzes
                </h2>
              </div>
              <Link
                href="/quizzes"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                All Quizzes
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-36 bg-white border border-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-600 text-xs">
                No quizzes available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.slice(0, 4).map((q) => (
                  <QuizCard key={q.id} quiz={q} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Dynamic 30-Sec Daily Vocab Warmup */}
          <DailyWarmupCard
            initialCompleted={user?.stats?.warmupCompletedToday}
            onCompleted={() => loadData()}
          />

          {/* Leaderboard Preview */}
          <LeaderboardPreview
            entries={leaderboard}
            currentUserId={user?.id}
            isLoading={loading}
          />

          {/* Unlocked Badges Preview */}
          {user?.badges && user.badges.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Your Badges</h4>
                </div>
                <Link
                  href="/profile"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View All
                </Link>
              </div>
              <BadgeGrid unlockedBadges={user.badges} />
            </div>
          )}
        </div>
      </div>

      {/* Course Purchase Modal */}
      <PurchaseModal
        course={selectedCourse}
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
