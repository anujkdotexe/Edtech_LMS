import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { Zap, BookOpen, Trophy, Home, User, LogOut, ShieldAlert, Terminal, Sparkles } from 'lucide-react';
import { StreakBadge } from '../gamification/StreakBadge';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const studentNavLinks = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Courses', path: '/courses', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDev = user?.role === 'DEVELOPER' || !!user?.impersonatedBy;
  const isAdmin = user?.role === 'ADMIN' || isDev;

  return (
    <header className="sticky top-0 w-full bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="bg-primary text-white p-2 rounded-xl font-black tracking-wider shadow-sm transition group-hover:scale-105">
            <Zap className="w-4 h-4 fill-white text-white" />
          </span>
          <span className="font-display font-extrabold text-lg bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Antigravity LMS
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {studentNavLinks.map((link) => {
            const active = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          {user?.stats && (
            <StreakBadge
              currentStreak={user.stats.currentStreak}
              longestStreak={user.stats.longestStreak}
              size="sm"
            />
          )}

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 hover:border-primary/40 transition flex items-center justify-center focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded">
                      {user?.role}
                    </span>
                    {user?.stats?.level && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Lvl {user.stats.level}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-emerald-500" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  {isDev && (
                    <Link
                      href="/dev"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      <span>Dev Console</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
