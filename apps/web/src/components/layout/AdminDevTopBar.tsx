import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Menu,
  X,
  Zap,
  Terminal,
  User,
  LogOut,
  ShieldAlert,
  BookOpen,
  Trophy,
  Activity,
  BarChart3,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';

interface AdminDevTopBarProps {
  isDev: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AdminDevTopBar: React.FC<AdminDevTopBarProps> = ({
  isDev,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { user, logout, unimpersonate } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`h-14 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 z-40 ${
        isDev
          ? 'bg-slate-950/95 border-indigo-950/60 backdrop-blur-md'
          : 'bg-white border-slate-200/70 backdrop-blur-md'
      }`}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onToggleSidebar}
        className={`lg:hidden p-2 rounded-lg transition ${
          isDev ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-slate-100'
        }`}
        aria-label="Toggle Navigation"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Brand */}
      <Link href={isDev ? '/dev' : '/admin'} className="flex items-center gap-2 group">
        <span
          className={`p-2 rounded-xl font-black text-lg tracking-wider transition group-hover:scale-105 ${
            isDev
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
              : 'bg-slate-900 text-white shadow-sm'
          }`}
        >
          {isDev ? (
            <Terminal className="w-4 h-4 text-indigo-100" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          )}
        </span>
        <span
          className={`font-display font-extrabold text-base tracking-tight hidden sm:block ${
            isDev
              ? 'bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent'
              : 'text-slate-900'
          }`}
        >
          {isDev ? 'Antigravity Dev' : 'Antigravity Admin'}
        </span>
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isDev
              ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/40'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isDev ? 'bg-indigo-500' : 'bg-emerald-500'
            }`}
          />
          {isDev ? 'DEV SHELL' : 'ADMIN'}
        </div>

        {/* Name */}
        <div className="hidden md:flex flex-col text-right">
          <span
            className={`font-semibold text-xs leading-tight ${
              isDev ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {user?.name}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDev ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User Profile Menu"
            aria-expanded={isDropdownOpen}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold overflow-hidden transition ${
              isDev
                ? 'border-indigo-600/40 bg-slate-900 hover:border-indigo-500'
                : 'border-slate-200 bg-slate-100 hover:border-slate-300'
            }`}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                width="32"
                height="32"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`w-4 h-4 ${isDev ? 'text-slate-400' : 'text-slate-500'}`} />
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  {user?.role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Student View</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                {user?.impersonatedBy && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      unimpersonate();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 font-medium text-left"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Stop Impersonation</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          onClick={() => logout()}
          className={`p-1.5 rounded-lg transition ${
            isDev
              ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
          }`}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
