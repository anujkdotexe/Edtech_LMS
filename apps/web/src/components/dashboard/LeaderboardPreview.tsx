import React from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, User } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
}

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  entries,
  currentUserId,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="h-5 w-32 bg-slate-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const topFive = entries.slice(0, 5);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-slate-900 text-sm">Leaderboard</h4>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {topFive.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No rankings available yet.</p>
        ) : (
          topFive.map((entry) => {
            const isMe = entry.id === currentUserId;
            let rankBadge = (
              <span className="w-6 text-center text-xs font-bold text-slate-400">
                #{entry.rank}
              </span>
            );
            if (entry.rank === 1) {
              rankBadge = (
                <span className="w-6 text-center text-xs font-black text-amber-600 bg-amber-50 rounded-md py-0.5 border border-amber-200/60">
                  #1
                </span>
              );
            } else if (entry.rank === 2) {
              rankBadge = (
                <span className="w-6 text-center text-xs font-black text-slate-600 bg-slate-100 rounded-md py-0.5 border border-slate-200/60">
                  #2
                </span>
              );
            } else if (entry.rank === 3) {
              rankBadge = (
                <span className="w-6 text-center text-xs font-black text-amber-800 bg-amber-100/60 rounded-md py-0.5 border border-amber-200/60">
                  #3
                </span>
              );
            }

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                  isMe
                    ? 'bg-indigo-50/80 border border-indigo-200/60 font-semibold text-indigo-900'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {rankBadge}
                  <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <span className="truncate max-w-[120px] font-medium">
                    {entry.name} {isMe && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-[10px] text-slate-400">Lvl {entry.level}</span>
                  <span className="font-extrabold text-slate-900">{entry.totalXp} XP</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
