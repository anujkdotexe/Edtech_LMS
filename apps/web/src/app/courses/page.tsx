'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, Lock, Unlock, Search, Sparkles, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';

interface Course {
  id: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
  title: string;
  description: string;
}

export default function CoursesCatalogPage() {
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('ALL');

  // Checkout Simulator Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadCourses();
    }
  }, [isAuthenticated]);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Course[]>('/api/courses');
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCheckout = async (status: 'SUCCESS' | 'FAILED') => {
    if (!selectedCourse) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      await apiFetch<{ success: boolean; message: string }>(`/api/courses/${selectedCourse.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ simulatedStatus: status }),
      });

      if (status === 'SUCCESS') {
        setPurchaseStatus('SUCCESS');
        setTimeout(async () => {
          setPurchaseStatus('IDLE');
          setSelectedCourse(null);
          await fetchProfile();
          await loadCourses();
        }, 1500);
      } else {
        setPurchaseStatus('FAILED');
        setPurchaseError('Simulated payment declined. Sandbox transaction unsuccessful.');
      }
    } catch (err: any) {
      setPurchaseStatus('FAILED');
      setPurchaseError(err.message || 'Checkout simulation error');
    } finally {
      setPurchasing(false);
    }
  };

  if (!isAuthenticated) return null;

  // Filter courses by search query and CEFR pills
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCefr = selectedCefr === 'ALL' || course.cefrLevel === selectedCefr;
    return matchesSearch && matchesCefr;
  });

  const cefrLevels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-800 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            CEFR Language Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Embark on structured foreign language pathways fully customized to international standards.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 text-xs font-bold shadow-sm">
          <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
          <span>Learn, Score Quizzes & Level Up XP!</span>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* CEFR Level filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {cefrLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedCefr(lvl)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCefr === lvl
                  ? 'bg-primary text-white shadow-sm scale-105'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {lvl === 'ALL' ? 'All Levels' : lvl}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search language syllabi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          />
        </div>
      </div>

      {/* Loading & Errors */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-64 rounded-2xl space-y-4 p-6">
              <div className="shimmer h-6 w-1/3 rounded"></div>
              <div className="shimmer h-12 rounded"></div>
              <div className="shimmer h-10 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-bold">Catalog Unresolved</h3>
          <p className="text-sm">{error}</p>
          <button onClick={loadCourses} className="btn-primary text-xs py-1.5 px-4 rounded-lg">
            Retry Loading
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 p-12 rounded-2xl text-center space-y-3 max-w-md mx-auto">
          <Search className="w-12 h-12 text-slate-350 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No syllabi found</h3>
          <p className="text-xs text-slate-400">
            No courses match the criteria. Adjust filters or search strings.
          </p>
        </div>
      ) : (
        /* Courses Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            return (
              <div
                key={course.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-primary-light text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {course.cefrLevel} Level
                    </span>
                    {course.isPremium ? (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                          course.isUnlocked
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}
                      >
                        {course.isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        Premium
                      </span>
                    ) : (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded border uppercase">
                        Free Catalog
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-primary leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pricing License</span>
                    <span className="text-xl font-black font-display text-slate-800">
                      {course.isPremium ? `$${course.price}` : 'Free'}
                    </span>
                  </div>

                  {course.isUnlocked ? (
                    <Link
                      href={`/courses/${course.id}`}
                      className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1"
                    >
                      <BookOpen className="w-4 h-4" />
                      Study Course
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-streak flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Unlock Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Razorpay Simulated Checkout Dialog */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-premium animate-in zoom-in-95 duration-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Simulated Razorpay Gateway
              </span>
              <h3 className="text-xl font-extrabold text-slate-800">
                Unlock {selectedCourse.title}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Acquire instant lifelong access to full syllabus lessons, premium vocabulary PDFs, and customized level badges.
              </p>
              <p className="text-2xl font-black font-display text-slate-800 pt-2">
                ${selectedCourse.price}
              </p>
            </div>

            {purchaseStatus === 'SUCCESS' ? (
              <div className="flex flex-col items-center justify-center py-2 text-emerald-600 space-y-2">
                <CheckCircle2 className="w-10 h-10 fill-emerald-50 text-emerald-600 animate-bounce" />
                <span className="font-bold text-sm">Simulated Checkout Successful!</span>
                <span className="text-[10px] text-slate-400">Updating course enrollment...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {purchaseError && (
                  <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-[10px] text-red-500 font-semibold">
                    {purchaseError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSimulateCheckout('SUCCESS')}
                    disabled={purchasing}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Pay Success
                  </button>
                  <button
                    onClick={() => handleSimulateCheckout('FAILED')}
                    disabled={purchasing}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-slate-200 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Fail Payment
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setPurchaseStatus('IDLE');
                    setPurchaseError(null);
                  }}
                  disabled={purchasing}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold py-2 mt-2 transition"
                >
                  Cancel and Return
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
