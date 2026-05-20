'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  ChevronLeft, ChevronRight, HelpCircle, Award, Trophy, 
  Flame, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Sparkles 
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

interface QuizDetails {
  id: string;
  title: string;
  rules: string;
  difficulty: string;
  pointValue: number;
  questions: Question[];
}

interface SubmitResult {
  score: number;
  passed: boolean;
  xpEarned: number;
  newTotalXp: number;
  didLevelUp: boolean;
  newLevel: number;
  currentStreak: number;
  badgesUnlocked: Array<{ badgeId: string; name: string }>;
}

export default function QuizArenaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz Play States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  // Results States
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizQuestions();
    }
  }, [isAuthenticated, params.id]);

  const loadQuizQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await apiFetch<QuizDetails>(`/api/quizzes/${params.id}`);
      setQuiz(details);
    } catch (err: any) {
      setError(err.message || 'Could not fetch quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleExitAttempt = () => {
    setShowExitWarning(true);
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    router.push('/');
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    try {
      // Assemble answers formatted to match Fastify submissions requirement
      const submissionBody = {
        answers: quiz.questions.map(q => ({
          questionId: q.id,
          selectedOption: selectedAnswers[q.id] || ''
        }))
      };

      const result = await apiFetch<SubmitResult>(`/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionBody),
      });

      setSubmitResult(result);
      if (result.didLevelUp) {
        setShowLevelUpModal(true);
      }
      
      // Update local profile stats
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Quiz submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmitResult(null);
    setShowLevelUpModal(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    loadQuizQuestions();
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 animate-pulse">
        <div className="shimmer h-8 w-24 rounded-lg"></div>
        <div className="shimmer h-96 rounded-2xl"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Error Occurred</h3>
        <p className="text-sm">{error}</p>
        <button onClick={handleRetry} className="btn-primary text-xs py-2 inline-flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Reconnect Session
        </button>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="font-bold text-lg">Empty Quiz Challenge</h3>
        <p className="text-sm">This quiz does not have any active questions in its curriculum database.</p>
        <Link href="/" className="btn-primary text-xs py-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Active question parameters
  const activeQuestion = quiz.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / quiz.questions.length) * 100);
  const totalQuestions = quiz.questions.length;
  const activeSelected = selectedAnswers[activeQuestion.id];

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-6 relative">
      
      {/* 1. QUIZ ACTIVE PLAY SCREEN */}
      {!submitResult && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Quiz Play Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <button 
              onClick={handleExitAttempt}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Exit Quiz Arena
            </button>

            <span className="bg-primary-light text-primary text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {quiz.difficulty} &bull; +{quiz.pointValue} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inset">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question Visual Card Slide */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-premium space-y-6 relative overflow-hidden transition duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full filter blur-xl"></div>
            
            {/* Question Text */}
            <h3 className="font-display font-extrabold text-slate-800 text-lg leading-snug">
              {activeQuestion.questionText}
            </h3>

            {/* Answer Options Grid */}
            <div className="space-y-3.5 pt-2">
              {[
                { key: 'A', label: activeQuestion.optionA },
                { key: 'B', label: activeQuestion.optionB },
                { key: 'C', label: activeQuestion.optionC },
                { key: 'D', label: activeQuestion.optionD },
              ].map((opt) => {
                const isSelected = activeSelected === opt.key;

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(activeQuestion.id, opt.key)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition active:scale-[0.99] flex items-center gap-3 ${isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50'}`}
                  >
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-white/20 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                      {opt.key}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-secondary text-xs font-bold py-2.5 px-4 flex items-center gap-1 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                disabled={!activeSelected}
                className="btn-primary text-xs font-bold py-2.5 px-5 flex items-center gap-1"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={!activeSelected || submitting}
                className="btn-accent text-xs font-extrabold py-3 px-6 flex items-center gap-1.5 shadow-md fill-slate-900"
              >
                {submitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-900" /> Submit Quiz Challenge
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* 2. QUIZ CELEBRATION RESULTS OUTLINE */}
      {submitResult && (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-premium text-center space-y-6 animate-[scaleIn_0.3s_ease-out]">
          
          {submitResult.passed ? (
            // Success Header
            <div className="space-y-3">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <Trophy className="w-10 h-10 fill-amber-400 text-amber-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-800">
                Congratulations! Passed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-normal">
                You have successfully mastered the grammar module check and qualified the CEFR guidelines!
              </p>
            </div>
          ) : (
            // Fail Header
            <div className="space-y-3">
              <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-800">
                Keep Practicing!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-normal">
                The passing threshold requires a **70% score**. Consolation points have been awarded. Re-evaluate options and try again!
              </p>
            </div>
          )}

          {/* Points & Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Quiz Score</span>
              <span className={`text-xl font-black font-display ${submitResult.passed ? 'text-emerald-600' : 'text-red-500'}`}>{submitResult.score}%</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">XP Earned</span>
              <span className="text-xl font-black font-display text-amber-500">+{submitResult.xpEarned} XP</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Active Streak</span>
              <span className="text-xl font-black font-display text-accent-streak flex items-center justify-center gap-0.5">
                <Flame className="w-5 h-5 fill-accent-streak text-accent-streak shrink-0" />
                {submitResult.currentStreak}d
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Overall Level</span>
              <span className="text-xl font-black font-display text-primary">Lvl {submitResult.newLevel}</span>
            </div>
          </div>

          {/* Newly Unlocked Achievements list */}
          {submitResult.badgesUnlocked.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-left space-y-3">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-4 h-4 fill-amber-400 text-amber-600" /> Achievements Unlocked ({submitResult.badgesUnlocked.length})
              </h4>
              
              <div className="space-y-2">
                {submitResult.badgesUnlocked.map((badge) => (
                  <div key={badge.badgeId} className="flex gap-2.5 items-center">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center text-xs shrink-0 font-bold">
                      <Award className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="btn-secondary text-xs py-3 px-6 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" /> Play Quiz Again
            </button>

            <Link 
              href="/"
              className="btn-primary text-xs py-3 px-6 flex items-center justify-center"
            >
              Return to Dashboard
            </Link>
          </div>

        </div>
      )}

      {/* 3. GOLDEN LEVEL-UP CELEBRATORY STAR MODAL */}
      {showLevelUpModal && submitResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center space-y-6 border border-amber-300 animate-[scaleIn_0.3s_ease-out] relative overflow-hidden">
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>

            <div className="space-y-2 relative z-10">
              <span className="bg-slate-950/20 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 justify-center mx-auto w-fit">
                <Sparkles className="w-3.5 h-3.5" /> Level Up Event <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div className="w-24 h-24 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center mx-auto text-4xl font-black shadow-lg border-4 border-amber-300 my-4 animate-bounce">
                {submitResult.newLevel}
              </div>
              
              <h3 className="font-display font-extrabold text-slate-950 text-2xl leading-tight">
                Level Increased!
              </h3>
              <p className="text-slate-900/80 text-xs max-w-xs mx-auto leading-relaxed">
                Outstanding language study progress! Your efforts pushed your total experience threshold to the next milestone level!
              </p>
            </div>

            <button
              onClick={() => setShowLevelUpModal(false)}
              className="relative z-10 w-full bg-slate-900 text-amber-400 font-extrabold py-3.5 rounded-xl shadow-md text-xs hover:bg-slate-950 transition active:scale-[0.98]"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* 4. MID-QUIZ EXIT CONFIRMATION WARNING MODAL */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 text-center space-y-5 animate-[scaleIn_0.2s_ease-out]">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-extrabold text-slate-800 text-base leading-tight">
                Abandon Quiz Attempt?
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                Are you sure you want to exit? Your selected options will be discarded, and this attempt will not grant any experience points!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => setShowExitWarning(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition"
              >
                Keep Playing
              </button>

              <button
                onClick={handleConfirmExit}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs transition"
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
