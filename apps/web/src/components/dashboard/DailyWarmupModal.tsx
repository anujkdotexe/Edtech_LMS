'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle, Globe, X, Trophy } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface DailyWarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (xpAwarded: number) => void;
}

interface WarmupChallenge {
  challengeId: string;
  language: string;
  prompt: string;
  options: string[];
  completedToday: boolean;
  xpReward: number;
}

export const DailyWarmupModal: React.FC<DailyWarmupModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { fetchProfile } = useAuthStore();
  const [challenge, setChallenge] = useState<WarmupChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingChallenge, setFetchingChallenge] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWarmup = async () => {
    setFetchingChallenge(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<WarmupChallenge>('/api/profile/warmup');
      setChallenge(data);
      if (data.completedToday) {
        setCompleted(true);
      }
    } catch (err: any) {
      console.error('Failed to load daily warmup challenge:', err);
    } finally {
      setFetchingChallenge(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWarmup();
      setTimeLeft(30);
      setExpired(false);
      setSubmitted(false);
      setSelectedOption(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || completed || submitted || expired || fetchingChallenge) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, completed, submitted, expired, fetchingChallenge]);

  const handleSelectOption = async (optionText: string) => {
    if (submitted || completed || expired || loading || !challenge) return;
    setSelectedOption(optionText);
    setSubmitted(true);
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        xpAwarded: number;
      }>('/api/profile/warmup/claim', {
        method: 'POST',
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          answer: optionText,
        }),
      });

      setCompleted(true);
      setSuccessMsg(res.message || `Daily warmup completed! +${challenge.xpReward || 25} XP earned.`);
      if (onCompleted) {
        onCompleted(res.xpAwarded || challenge.xpReward || 25);
      } else {
        await fetchProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect answer! Check back tomorrow to maintain your study streak.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close warmup modal"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Daily 30s Challenge
              </span>
              {challenge?.language && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {challenge.language}
                </span>
              )}
            </div>
            <h3 className="font-display font-extrabold text-slate-900 text-lg mt-0.5">
              Quick Vocabulary Warmup
            </h3>
          </div>
        </div>

        {/* Challenge Body */}
        {fetchingChallenge ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Preparing today&apos;s language warmup...</p>
          </div>
        ) : completed ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-extrabold text-slate-900 text-base">
                Challenge Completed Today!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {successMsg || 'Streak updated! Check back tomorrow for a new vocabulary puzzle.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : challenge ? (
          <div className="space-y-5">
            {/* Countdown timer & prompt banner */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                {challenge.prompt}
              </p>
              <div
                className={`flex items-center gap-1 text-xs font-mono font-black px-3 py-1.5 rounded-xl shrink-0 ${
                  timeLeft <= 10
                    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenge.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    disabled={submitted || expired || loading}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50/40'
                    } ${expired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Timeout warning */}
            {expired && !completed && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Time has expired for this attempt! You can still practice on regular quizzes.</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer with XP reward badge */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> +{challenge.xpReward || 25} XP Reward
              </span>
              <span>Daily Streak Extender</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs">
            No warmup challenge active right now.
          </div>
        )}
      </div>
    </div>
  );
};
