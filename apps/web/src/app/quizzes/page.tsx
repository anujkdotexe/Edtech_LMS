'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { BrainCircuit, Sparkles, BookOpen } from 'lucide-react';
import { QuizCard, QuizItem } from '../../components/quizzes/QuizCard';

export default function StudentQuizCatalog() {
  const { isAuthenticated } = useAuthStore();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"></div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display flex items-center gap-3">
            <BrainCircuit className="w-10 h-10 text-indigo-200" />
            Interactive Quizzes
          </h1>
          <p className="text-indigo-100 max-w-2xl text-sm sm:text-base leading-relaxed">
            Test your knowledge, earn XP, and climb the leaderboard! Choose from our catalog of graded assessments designed to challenge your grammar, vocabulary, and reading comprehension.
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Available Assessments
          </h2>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
            {quizzes.length} Quizzes Found
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
        ) : quizzes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold">No quizzes available right now.</p>
            <p className="text-xs mt-1 text-slate-400">
              Check back later when new challenges are added!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
