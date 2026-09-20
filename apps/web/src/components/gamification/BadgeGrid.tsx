import React from 'react';
import { Award, Lock } from 'lucide-react';
import { UnlockedBadge } from '../../store/useAuthStore';

interface BadgeGridProps {
  unlockedBadges: UnlockedBadge[];
  className?: string;
}

const ALL_SYSTEM_BADGES = [
  { id: 'scholar_1', name: 'First Steps', description: 'Passed your first language test or completed first step' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day study streak' },
  { id: 'streak_7', name: 'Unstoppable Habit', description: 'Maintained a 7-day study streak' },
  { id: 'centurion_streak', name: 'Centurion Streak', description: 'Maintained an epic 30-day study streak' },
  { id: 'quiz_master', name: 'Perfect Score', description: 'Scored 100% on a challenging quiz' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5 in curriculum' },
  { id: 'level_10', name: 'Grandmaster Linguist', description: 'Reached Level 10 of language mastery' },
];

export const BadgeGrid: React.FC<BadgeGridProps> = ({ unlockedBadges, className = '' }) => {
  const unlockedMap = new Map(unlockedBadges.map((b) => [b.badgeId, b]));

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 ${className}`}>
      {ALL_SYSTEM_BADGES.map((badge) => {
        const isUnlocked = unlockedMap.has(badge.id);
        const unlockedData = unlockedMap.get(badge.id);

        return (
          <div
            key={badge.id}
            className={`p-3 rounded-2xl border flex flex-col items-center text-center transition ${
              isUnlocked
                ? 'bg-white border-primary/20 shadow-sm hover:shadow-md'
                : 'bg-slate-50 border-slate-200'
            }`}
            title={badge.description}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isUnlocked
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>
            <span className={`font-bold text-xs line-clamp-1 ${isUnlocked ? 'text-slate-900' : 'text-slate-700'}`}>
              {badge.name}
            </span>
            <span className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-tight">
              {isUnlocked && unlockedData?.unlockedAt
                ? `Earned ${new Date(unlockedData.unlockedAt).toLocaleDateString()}`
                : badge.description}
            </span>
          </div>
        );
      })}
    </div>
  );
};
