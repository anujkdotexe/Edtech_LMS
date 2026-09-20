'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import {
  BookOpen, Users, CreditCard, BarChart3, 
  Sparkles, CheckCircle2, RefreshCw, ShieldAlert, Settings, Award, Flame
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
  title: string;
  description: string;
}

interface Student {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
}

interface AnalyticsDashboard {
  totalStudents: number;
  totalRevenue: number;
  weeklySignups: { date: string; count: number }[];
  streakLeaders: { id: string; name: string; avatarUrl: string; streak: number }[];
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [crudSuccess, setCrudSuccess] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadDashboard();
      loadCourses();
      loadStudents();
    }
  }, [isAuthenticated, user]);

  const loadDashboard = async () => {
    try {
      const data = await apiFetch<AnalyticsDashboard>('/api/admin/analytics/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await apiFetch<Course[]>('/api/courses');
      setCourses(data);
    } catch {
      // noop
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await apiFetch<{ leaderboard: Student[] }>('/api/leaderboard');
      setStudents(response.leaderboard || []);
    } catch {
      // noop
    } finally {
      setLoadingStudents(false);
    }
  };


  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Forbidden</h3>
        <p className="text-sm">You do not possess the required administrative credentials to access this dashboard portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400">Platform analytics, signups, revenue, and streak leaders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadDashboard(); loadCourses(); loadStudents(); }}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {crudSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{crudSuccess}</span>
        </div>
      )}

      {/* OVERVIEW SECTION (always shown — this is the overview page now) */}
      {dashboardData && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Revenue</h3>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">${dashboardData.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-400 font-medium mt-2">All-time processed revenue</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Active Students</h3>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{dashboardData.totalStudents}</p>
              <p className="text-xs text-slate-400 font-medium mt-2">
                {dashboardData.weeklySignups.reduce((s, d) => s + d.count, 0)} new this week
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Course Signups</h3>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">
                {dashboardData.weeklySignups.reduce((s, d) => s + d.count, 0)}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-2">signups in last 7 days</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Streak Leaders</h3>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{dashboardData.streakLeaders.length}</p>
              <p className="text-xs text-slate-400 font-medium mt-2">active streak holders</p>
            </div>
          </div>

          {/* Quick Admin Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/students" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Student CRM Hub</h4>
                </div>
              </div>
            </Link>

            <Link href="/admin/payments" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Payments Ledger</h4>
                </div>
              </div>
            </Link>

            <Link href="/admin/settings" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Global Settings</h4>
                </div>
              </div>
            </Link>
          </div>

          {/* Charts & Lists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <h3 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Weekly Signups
              </h3>
              {/* Dynamic bar chart visualization */}
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {dashboardData.weeklySignups.map((day, i) => {
                  const maxCount = Math.max(...dashboardData.weeklySignups.map(d => d.count), 1);
                  const heightPercentage = (day.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                      <div 
                        className="w-full bg-primary/20 rounded-t-xl group-hover:bg-primary transition-colors relative"
                        style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                          {day.count} signups
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <h3 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Streak Leaders
              </h3>
              <div className="space-y-4">
                {dashboardData.streakLeaders.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">No active streaks yet.</p>
                ) : (
                  dashboardData.streakLeaders.map((leader, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={leader.avatarUrl || '/avatars/default.svg'}
                          alt={leader.name}
                          width="40"
                          height="40"
                          className="w-10 h-10 rounded-full border-2 border-slate-100"
                        />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800">
                          #{i + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{leader.name}</p>
                        <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-amber-700 text-amber-700" /> {leader.streak} Day Streak
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
