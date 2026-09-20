import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle, Globe } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface DailyWarmupCardProps {
  initialCompleted?: boolean;
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

export const DailyWarmupCard: React.FC<DailyWarmupCardProps> = ({
  initialCompleted = false,
  onCompleted,
}) => {
  const { fetchProfile } = useAuthStore();
  const [challenge, setChallenge] = useState<WarmupChallenge | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingChallenge, setFetchingChallenge] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWarmup = async () => {
    setFetchingChallenge(true);
    setFetchError(false);
    try {
      const data = await apiFetch<WarmupChallenge>('/api/profile/warmup');
      setChallenge(data);
      if (data.completedToday) {
        setCompleted(true);
      }
    } catch (err: any) {
      console.error('Failed to load daily warmup challenge:', err);
      setFetchError(true);
    } finally {
      setFetchingChallenge(false);
    }
  };

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  useEffect(() => {
    fetchWarmup();
  }, []);

  useEffect(() => {
    if (completed || submitted || expired || fetchingChallenge) return;
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
  }, [completed, submitted, expired, fetchingChallenge]);

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
      }
      await fetchProfile();
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already completed')) {
        setCompleted(true);
        setSuccessMsg('You have already completed your warmup for today!');
      } else if (err.message?.toLowerCase().includes('incorrect answer')) {
        setErrorMsg('Incorrect answer! Check back tomorrow to maintain your study streak.');
      } else {
        setErrorMsg(err.message || 'Failed to submit daily warmup challenge.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingChallenge) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="h-5 w-12 bg-slate-200 rounded-full" />
        </div>
        <div className="h-4 w-5/6 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Unable to load Daily Warmup</h4>
            <p className="text-xs text-slate-600">We could not retrieve today's challenge. Please check your connection.</p>
          </div>
        </div>
        <button
          onClick={fetchWarmup}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Daily Warmup Completed</h4>
            <p className="text-xs text-slate-600">Streak updated! Check back tomorrow for a new vocabulary puzzle.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
          +25 XP
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-4 h-4 fill-indigo-700" />
          <h4 className="font-bold text-slate-900 text-sm">Daily Vocab Warmup</h4>
          {challenge?.language && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
              <Globe className="w-3 h-3" />
              {challenge.language}
            </span>
          )}
        </div>
        {!expired && !submitted && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      <p className="text-sm font-semibold text-slate-800">
        {challenge?.prompt || 'Loading challenge...'}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {(challenge?.options || []).map((option) => {
          let btnClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700';
          if (submitted) {
            if (selectedOption === option) {
              btnClass = errorMsg
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
            }
          }

          return (
            <button
              key={option}
              disabled={submitted || expired || loading}
              onClick={() => handleSelectOption(option)}
              className={`p-3 rounded-xl border text-xs font-medium text-left transition ${btnClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {expired && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Time expired! A new vocabulary challenge unlocks tomorrow.</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
