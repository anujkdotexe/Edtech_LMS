'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Trophy, Award, Crown, User, AlertCircle } from 'lucide-react';

interface RankedStudent {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
}

interface LeaderboardResponse {
  leaderboard: RankedStudent[];
  currentUserRank: number | null;
  currentUserXp: number;
}

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeaderboard();
    }
  }, [isAuthenticated]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<LeaderboardResponse>('/api/leaderboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Could not load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8 animate-pulse">
        <div className="shimmer h-12 w-48 rounded-lg"></div>
        <div className="shimmer h-64 rounded-2xl"></div>
        <div className="shimmer h-96 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Error loading Leaderboard</h3>
        <p className="text-sm">{error || 'Could not fetch weekly cohort rankings.'}</p>
        <button onClick={loadLeaderboard} className="btn-primary text-xs py-2">
          Retry Connection
        </button>
      </div>
    );
  }

  const { leaderboard, currentUserRank, currentUserXp } = data;

  // Extract top 3 podium students
  const firstPlace = leaderboard.find(s => s.rank === 1);
  const secondPlace = leaderboard.find(s => s.rank === 2);
  const thirdPlace = leaderboard.find(s => s.rank === 3);

  // Extract the remaining students
  const runnersUp = leaderboard.filter(s => s.rank > 3);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Page Heading */}
      <section className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
          <Trophy className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>Weekly Language Cohorts Rankings</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-800">
          Podium Weekly Leaderboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Compete against active language scholars. Conquer quizzes, review syllabus files, and maintain streaks to claim the Crown!
        </p>
      </section>

      {/* 1. Dynamic User Absolute Rank Block */}
      {currentUserRank && (
        <section className="bg-gradient-to-r from-primary/5 via-violet-50/50 to-primary/5 border border-primary/10 rounded-2xl p-4 sm:p-5 shadow-premium flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="font-display font-extrabold text-slate-800 text-sm">
              Your Dynamic Absolute Standings
            </h4>
            <p className="text-xs text-slate-400">
              Ranked globally among all active student accounts in the workspace database.
            </p>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="text-center sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">XP Milestones</span>
              <span className="text-lg font-black font-display text-primary">{currentUserXp} XP</span>
            </div>
            <div className="bg-primary text-white font-black font-display text-lg px-5 py-2.5 rounded-2xl shadow-sm border border-primary/20">
              Rank #{currentUserRank}
            </div>
          </div>
        </section>
      )}

      {/* 2. Top 3 Podium Visualizations */}
      {(firstPlace || secondPlace || thirdPlace) && (
        <section className="flex flex-col sm:flex-row items-end justify-center gap-4 pt-12 max-w-2xl mx-auto">
          
          {/* 2nd Place Podium */}
          {secondPlace && (
            <div className="flex-1 w-full flex flex-col items-center group animate-[scaleIn_0.4s_ease-out]">
              <div className="w-16 h-16 rounded-full border-2 border-slate-300 relative overflow-hidden bg-slate-100 mb-3 shadow-md group-hover:scale-105 transition">
                {secondPlace.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={secondPlace.avatarUrl} alt={secondPlace.name} width="64" height="64" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">
                  2
                </div>
              </div>
              
              <div className="text-center mb-2">
                <h4 className="font-display font-extrabold text-sm text-slate-700 leading-tight truncate max-w-[150px]">
                  {secondPlace.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold block">Lvl {secondPlace.level} &bull; {secondPlace.totalXp} XP</span>
              </div>

              {/* Physical Second Podium block */}
              <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100/60 rounded-t-2xl min-h-[100px] flex items-center justify-center border-t border-x border-slate-300/40 p-4 shadow-sm">
                <span className="font-black text-2xl text-slate-400 font-display">2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place Podium */}
          {firstPlace && (
            <div className="flex-1 w-full flex flex-col items-center group order-first sm:order-none animate-[scaleIn_0.5s_ease-out] z-10">
              <Crown className="w-7 h-7 text-accent fill-amber-400 animate-bounce mb-1" />
              
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 relative overflow-hidden bg-slate-100 mb-3 shadow-premium group-hover:scale-105 transition ring-4 ring-amber-100">
                {firstPlace.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firstPlace.avatarUrl} alt={firstPlace.name} width="80" height="80" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-white">
                  1
                </div>
              </div>
              
              <div className="text-center mb-2">
                <h4 className="font-display font-extrabold text-base text-slate-800 leading-tight truncate max-w-[150px]">
                  {firstPlace.name}
                </h4>
                <span className="text-xs text-amber-600 font-black block">Lvl {firstPlace.level} &bull; {firstPlace.totalXp} XP</span>
              </div>

              {/* Physical First Podium block */}
              <div className="w-full bg-gradient-to-t from-amber-200 to-amber-100/50 rounded-t-2xl min-h-[140px] flex items-center justify-center border-t border-x border-amber-300/40 p-4 shadow-gamified">
                <span className="font-black text-3xl text-amber-600 font-display">1st</span>
              </div>
            </div>
          )}

          {/* 3rd Place Podium */}
          {thirdPlace && (
            <div className="flex-1 w-full flex flex-col items-center group animate-[scaleIn_0.6s_ease-out]">
              <div className="w-16 h-16 rounded-full border-2 border-amber-600/30 relative overflow-hidden bg-slate-100 mb-3 shadow-md group-hover:scale-105 transition">
                {thirdPlace.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thirdPlace.avatarUrl} alt={thirdPlace.name} width="64" height="64" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-amber-700/60 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">
                  3
                </div>
              </div>
              
              <div className="text-center mb-2">
                <h4 className="font-display font-extrabold text-sm text-slate-700 leading-tight truncate max-w-[150px]">
                  {thirdPlace.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold block">Lvl {thirdPlace.level} &bull; {thirdPlace.totalXp} XP</span>
              </div>

              {/* Physical Third Podium block */}
              <div className="w-full bg-gradient-to-t from-amber-700/10 to-amber-600/5 rounded-t-2xl min-h-[80px] flex items-center justify-center border-t border-x border-amber-600/20 p-4 shadow-sm">
                <span className="font-black text-2xl text-amber-700/70 font-display">3rd</span>
              </div>
            </div>
          )}

        </section>
      )}

      {/* 3. Runners Up List (Ranks 4-100) */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-display font-extrabold text-slate-800 text-sm">
            Top Scholar Leaderboard Cohort
          </h3>
        </div>

        {runnersUp.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No runners up registered. Claim a top rank now!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5 text-center">Rank</th>
                  <th className="py-3 px-5">Student Learner</th>
                  <th className="py-3 px-5 text-center">Language Level</th>
                  <th className="py-3 px-5 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {runnersUp.map((student) => {
                  const isCurrentUser = student.id === user?.id;

                  return (
                    <tr 
                      key={student.id}
                      className={`transition ${isCurrentUser ? 'bg-primary-light/50 text-primary border-l-4 border-l-primary' : 'hover:bg-slate-50/50 text-slate-600'}`}
                    >
                      <td className="py-4 px-5 text-center font-display font-extrabold text-sm text-slate-400">
                        {student.rank}
                      </td>
                      <td className="py-4 px-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border relative overflow-hidden bg-slate-100 shrink-0">
                          {student.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatarUrl} alt={student.name} width="32" height="32" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4.5 h-4.5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <span className="font-display font-bold text-slate-800 text-sm leading-none">
                          {student.name}
                          {isCurrentUser && <span className="ml-1.5 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Award className="w-3 h-3" /> Lvl {student.level}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-display font-extrabold text-slate-800 text-sm">
                        {student.totalXp} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
