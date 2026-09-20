import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface DailyWarmupCardProps {
  initialCompleted?: boolean;
  onCompleted?: (xpAwarded: number) => void;
}

const WARMUP_QUESTION = {
  prompt: 'Choose the correct French translation for "The Book":',
  options: [
    { text: 'Le livre', isCorrect: true },
    { text: 'La porte', isCorrect: false },
    { text: 'La maison', isCorrect: false },
    { text: 'Le stylo', isCorrect: false },
  ],
};

export const DailyWarmupCard: React.FC<DailyWarmupCardProps> = ({
  initialCompleted = false,
  onCompleted,
}) => {
  const { fetchProfile } = useAuthStore();
  const [completed, setCompleted] = useState(initialCompleted);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  useEffect(() => {
    if (completed || submitted || expired) return;
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
  }, [completed, submitted, expired]);

  const handleSelectOption = async (index: number) => {
    if (submitted || completed || expired || loading) return;
    setSelectedOption(index);
    setSubmitted(true);

    const isCorrect = WARMUP_QUESTION.options[index].isCorrect;
    if (!isCorrect) {
      setErrorMsg('Incorrect translation! Try again tomorrow to keep your streak.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        xpAwarded: number;
      }>('/api/warmup/claim', {
        method: 'POST',
      });

      setCompleted(true);
      setSuccessMsg(res.message || 'Daily warmup completed! +25 XP earned.');
      if (onCompleted) {
        onCompleted(res.xpAwarded || 25);
      }
      // Refresh profile to sync stats and XP
      await fetchProfile();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('already completed')) {
        setCompleted(true);
        setSuccessMsg('You have already completed your warmup for today!');
      } else {
        setErrorMsg(err.message || 'Failed to claim warmup reward.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/80 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Daily Warmup Completed</h4>
            <p className="text-xs text-slate-500">You earned +25 XP today. Come back tomorrow for more!</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
          +25 XP
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles className="w-4 h-4 fill-indigo-600" />
          <h4 className="font-bold text-slate-900 text-sm">Daily Vocab Warmup</h4>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase">
            +25 XP
          </span>
        </div>
        {!expired && !submitted && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      <p className="text-sm font-semibold text-slate-800">{WARMUP_QUESTION.prompt}</p>

      <div className="grid grid-cols-2 gap-2.5">
        {WARMUP_QUESTION.options.map((option, idx) => {
          let btnClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700';
          if (submitted) {
            if (option.isCorrect) {
              btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
            } else if (selectedOption === idx) {
              btnClass = 'bg-rose-50 border-rose-300 text-rose-700 font-bold';
            }
          }

          return (
            <button
              key={option.text}
              disabled={submitted || expired || loading}
              onClick={() => handleSelectOption(idx)}
              className={`p-3 rounded-xl border text-xs font-medium text-left transition ${btnClass}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {expired && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Time expired! Check back tomorrow for a new warmup challenge.</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
