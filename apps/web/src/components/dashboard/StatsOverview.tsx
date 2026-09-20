import React from 'react';
import { Award, Trophy, Zap } from 'lucide-react';
import { XpBar } from '../gamification/XpBar';
import { StreakBadge } from '../gamification/StreakBadge';
import { UserStats } from '../../store/useAuthStore';

interface StatsOverviewProps {
  stats?: UserStats;
  rank?: number | null;
  isLoading?: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  rank,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white border border-slate-100 rounded-2xl p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalXp = stats?.totalXp ?? 0;
  const level = stats?.level ?? 1;
  const xpInLevel = stats?.xpInLevel ?? 0;
  const xpNeeded = stats?.xpNeededForNextLevel ?? 250;
  const progressPercent = stats?.progressPercent ?? 0;

  const getLevelTitle = (lvl: number) => {
    if (lvl >= 20) return 'Grand Master Polyglot';
    if (lvl >= 10) return 'Fluent Scholar';
    if (lvl >= 5) return 'Dedicated Linguist';
    if (lvl >= 3) return 'Apprentice Polyglot';
    return 'Novice Explorer';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Streak Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Streak</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">{currentStreak}</span>
            <span className="text-xs font-semibold text-slate-600">days</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">Best: {longestStreak} days</p>
        </div>
        <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} size="lg" />
      </div>

      {/* Level Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Level</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">Lvl {level}</span>
          </div>
          <p className="text-xs text-indigo-700 font-semibold mt-0.5">{getLevelTitle(level)}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Total XP & Progress Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Experience</p>
          <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-amber-700" />
            {totalXp} XP
          </span>
        </div>
        <XpBar
          totalXp={totalXp}
          level={level}
          xpInLevel={xpInLevel}
          xpNeededForNextLevel={xpNeeded}
          progressPercent={progressPercent}
          showDetails={false}
        />
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>{xpInLevel} / {xpNeeded} XP</span>
          <span>Next Lvl</span>
        </div>
      </div>

      {/* Global Rank Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Global Rank</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">
              {rank ? `#${rank}` : 'Top 10%'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">Updated hourly</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <Trophy className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
