import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  currentStreak,
  longestStreak,
  className = '',
  size = 'md',
}) => {
  const isHot = currentStreak >= 3;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3.5 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border transition ${
        isHot
          ? 'bg-amber-50 text-amber-600 border-amber-200/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      } ${sizeClasses[size]} ${className}`}
      title={
        longestStreak
          ? `Current: ${currentStreak} days | Longest: ${longestStreak} days`
          : `${currentStreak} day streak`
      }
    >
      <Flame
        className={`${iconSizes[size]} ${
          isHot ? 'fill-amber-500 text-amber-500 animate-pulse' : 'text-slate-400'
        }`}
      />
      <span>
        {currentStreak} {size === 'sm' ? 'd' : currentStreak === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
};
