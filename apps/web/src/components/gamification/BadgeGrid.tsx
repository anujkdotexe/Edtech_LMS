'use client';

import React, { useEffect, useState } from 'react';
import { Award, Lock, Flame, Trophy, Crown, Sparkles } from 'lucide-react';
import { UnlockedBadge } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';

export interface SystemBadgeItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  criteriaType?: string;
  criteriaThreshold?: number;
}

interface BadgeGridProps {
  unlockedBadges: UnlockedBadge[];
  allBadges?: SystemBadgeItem[];
  className?: string;
  compact?: boolean;
}

const DEFAULT_SYSTEM_BADGES: SystemBadgeItem[] = [
  { id: 'scholar_1', name: 'First Steps', description: 'Earned your first badge in the curriculum.', icon: 'Award' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day study streak!', icon: 'Flame' },
  { id: 'streak_7', name: 'Unstoppable Habit', description: 'Maintained a 7-day study streak!', icon: 'Flame' },
  { id: 'centurion_streak', name: 'Centurion Streak', description: 'Maintained an epic 30-day study streak!', icon: 'Crown' },
  { id: 'quiz_master', name: 'Perfect Score', description: 'Scored 100% on a challenging quiz!', icon: 'Trophy' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5 in curriculum!', icon: 'Sparkles' },
  { id: 'level_10', name: 'Grandmaster Linguist', description: 'Reached Level 10 of language mastery!', icon: 'Trophy' },
];

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  unlockedBadges = [],
  allBadges: initialBadges,
  className = '',
  compact = false,
}) => {
  const [systemBadges, setSystemBadges] = useState<SystemBadgeItem[]>(
    initialBadges && initialBadges.length > 0 ? initialBadges : DEFAULT_SYSTEM_BADGES
  );

  useEffect(() => {
    if (!initialBadges || initialBadges.length === 0) {
      apiFetch<SystemBadgeItem[]>('/api/public/badges')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSystemBadges(data);
          }
        })
        .catch(() => {
          // Keep resilient defaults if offline
        });
    }
  }, [initialBadges]);

  const unlockedMap = new Map((unlockedBadges || []).map((b) => [b.badgeId, b]));

  const getBadgeIcon = (iconName?: string, isUnlocked?: boolean) => {
    if (!isUnlocked) return <Lock className="w-4 h-4 text-slate-400" />;

    switch ((iconName || '').toLowerCase()) {
      case 'flame':
        return <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'trophy':
        return <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />;
      case 'crown':
        return <Crown className="w-5 h-5 text-amber-600 fill-amber-300" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-200" />;
      default:
        return <Award className="w-5 h-5 text-indigo-600" />;
    }
  };

  const badgesToRender = compact
    ? systemBadges.filter((b) => unlockedMap.has(b.id)).length > 0
      ? systemBadges.filter((b) => unlockedMap.has(b.id))
      : systemBadges.slice(0, 3)
    : systemBadges;

  const gridClasses = compact
    ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5'
    : 'grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-3';

  return (
    <div className={`${gridClasses} ${className}`}>
      {badgesToRender.map((badge) => {
        const isUnlocked = unlockedMap.has(badge.id);
        const unlockedData = unlockedMap.get(badge.id);

        return (
          <div
            key={badge.id}
            className={`p-3 rounded-2xl border flex flex-col items-center text-center transition min-w-[110px] ${
              isUnlocked
                ? 'bg-gradient-to-b from-indigo-50/60 to-white border-indigo-200/80 shadow-sm hover:shadow-md'
                : 'bg-slate-50/80 border-slate-200 opacity-60'
            }`}
            title={`${badge.name}: ${badge.description}`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2 shadow-sm shrink-0 ${
                isUnlocked ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-100 border border-slate-200'
              }`}
            >
              {getBadgeIcon(badge.icon, isUnlocked)}
            </div>
            <span className={`font-bold text-xs leading-tight line-clamp-2 ${isUnlocked ? 'text-slate-900' : 'text-slate-600'}`}>
              {badge.name}
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-snug">
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
