'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
import { Award, BrainCircuit, PlayCircle, Star, Sparkles, BookOpen } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue: number;
}

export default function StudentQuizCatalog() {
  const { isAuthenticated } = useAuthStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes();
    }
  }, [isAuthenticated]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Quiz[]>('/api/quizzes');
      setQuizzes(data);
    } catch (err) {
      console.error(err);
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 h-48 border border-slate-100 animate-pulse shadow-sm">
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
            <p className="text-xs mt-1 text-slate-400">Check back later when new challenges are added!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.id}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col relative group overflow-hidden"
              >
                {/* Background flair */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl opacity-20 transition-opacity group-hover:opacity-40 ${
                  quiz.difficulty === 'EASY' ? 'bg-emerald-500' :
                  quiz.difficulty === 'MEDIUM' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    quiz.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-600' :
                    quiz.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    <Award className="w-6 h-6" />
                  </div>
                  
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                    quiz.difficulty === 'EASY' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    quiz.difficulty === 'MEDIUM' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {quiz.difficulty}
                  </span>
                </div>

                <div className="flex-1 relative z-10">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-amber-50 inline-flex px-2 py-1 rounded-lg border border-amber-100/50">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>+{quiz.pointValue} XP</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 relative z-10">
                  <Link 
                    href={`/quizzes/${quiz.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-primary text-slate-600 hover:text-white border border-slate-200 hover:border-primary font-bold text-sm py-2.5 rounded-xl transition-colors shadow-sm active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Challenge
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
