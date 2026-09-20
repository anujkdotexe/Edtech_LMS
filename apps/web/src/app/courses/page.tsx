'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, Search, Sparkles, AlertCircle } from 'lucide-react';
import { CourseCard, CourseItem } from '../../components/courses/CourseCard';
import { PurchaseModal } from '../../components/courses/PurchaseModal';

export default function CoursesCatalogPage() {
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('ALL');

  // Purchase Modal state
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadCourses();
    }
  }, [isAuthenticated]);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CourseItem[]>('/api/courses');
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPurchase = (course: CourseItem) => {
    setSelectedCourse(course);
    setIsPurchaseOpen(true);
  };

  const handlePurchaseSuccess = async () => {
    await loadCourses();
    await fetchProfile();
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
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            CEFR Language Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Embark on structured foreign language pathways fully customized to international standards.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200/60 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Learn, Score Quizzes &amp; Level Up XP!</span>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* CEFR Level filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {cefrLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedCefr(lvl)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search language syllabi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          />
        </div>
      </div>

      {/* Loading & Errors */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold">Catalog Unresolved</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadCourses}
            className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-primary-hover transition"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200/80 p-12 rounded-2xl text-center space-y-3 max-w-md mx-auto">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No syllabi found</h3>
          <p className="text-xs text-slate-400">
            No courses match the criteria. Adjust filters or search strings.
          </p>
        </div>
      ) : (
        /* Courses Grid Using Reusable CourseCard */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPurchaseClick={handleOpenPurchase}
            />
          ))}
        </div>
      )}

      {/* Reusable Course Purchase Modal */}
      <PurchaseModal
        course={selectedCourse}
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
