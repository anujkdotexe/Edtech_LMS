'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { BrainCircuit, Sparkles, BookOpen, Search, Trophy, Zap, Filter } from 'lucide-react';
import { QuizCard, QuizItem } from '../../components/quizzes/QuizCard';

export default function StudentQuizCatalog() {
  const { isAuthenticated } = useAuthStore();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes();
    }
  }, [isAuthenticated]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<QuizItem[]>('/api/quizzes');
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.rules && q.rules.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'ALL' ||
        (q.difficulty && q.difficulty.toUpperCase() === selectedDifficulty);
      return matchesSearch && matchesDifficulty;
    });
  }, [quizzes, searchQuery, selectedDifficulty]);

  const difficultyCounts = useMemo(() => {
    const counts = { ALL: quizzes.length, EASY: 0, MEDIUM: 0, HARD: 0 };
    quizzes.forEach((q) => {
      const diff = (q.difficulty || 'EASY').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      if (counts[diff] !== undefined) {
        counts[diff]++;
      }
    });
    return counts;
  }, [quizzes]);

  if (!isAuthenticated) return null;

  const difficultyTabs: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'All Quizzes' },
    { key: 'EASY', label: 'Easy' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'HARD', label: 'Hard' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"></div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 border border-white/10">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Assessment Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display flex items-center gap-3">
            <BrainCircuit className="w-10 h-10 text-indigo-200" />
            Challenge Quizzes
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed font-medium">
            Test your multilingual grammar, vocabulary, and sentence structures. Score +50 to +150 XP per quiz, maintain your streak, and climb the leaderboard!
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Difficulty filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {difficultyTabs.map((tab) => {
            const count = (difficultyCounts as any)[tab.key] ?? 0;
            const isSelected = selectedDifficulty === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setSelectedDifficulty(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black font-display text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Available Assessments
          </h2>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            {filteredQuizzes.length} of {quizzes.length} Quizzes
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 h-48 border border-slate-100 animate-pulse shadow-sm"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm space-y-2">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No matching quizzes found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search terms or selecting a different difficulty filter.
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('ALL');
                }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline inline-block"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
