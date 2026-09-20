import React from 'react';
import { Zap } from 'lucide-react';

interface XpBarProps {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeededForNextLevel?: number;
  progressPercent: number;
  className?: string;
  showDetails?: boolean;
}

export const XpBar: React.FC<XpBarProps> = ({
  totalXp,
  level,
  xpInLevel,
  xpNeededForNextLevel = 250,
  progressPercent,
  className = '',
  showDetails = true,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1 text-primary">
            <Zap className="w-3.5 h-3.5 fill-primary" />
            <span>Level {level}</span>
          </span>
          <span className="text-slate-500 text-[11px]">
            {xpInLevel} / {xpNeededForNextLevel} XP ({progressPercent}%)
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
        <div
          className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </div>
  );
};
