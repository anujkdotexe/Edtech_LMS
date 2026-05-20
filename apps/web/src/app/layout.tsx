'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { Flame, ShieldAlert, Award, LogOut, Terminal, User, BookOpen, Trophy, Zap } from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, logout, unimpersonate } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleStopImpersonation = async () => {
    await unimpersonate();
    router.refresh();
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <html lang="en">
        <head>
          <title>LMS Gamified Platform</title>
          <meta name="description" content="Premium Gamified Language Learning Platform" />
        </head>
        <body className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-slate-500 font-medium">Booting LMS Engine...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>LMS Gamified Platform</title>
        <meta name="description" content="Premium Gamified Language Learning Platform" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 width=%22100%22 height=%22100%22><path fill=%22%23FFB000%22 d=%22M13 10V3L4 14h7v7l9-11h-7z%22/></svg>" />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Neon Floating Developer Impersonation Banner */}
        {user?.impersonatedBy && (
          <div className="w-full text-white flex items-center justify-between px-4 py-2 text-xs font-semibold shadow-md z-50 animate-pulse relative overflow-hidden bg-red-600">
            <div className="absolute inset-0 opacity-15 impersonation-stripe"></div>
            <div className="flex items-center gap-2 z-10">
              <ShieldAlert className="w-4.5 h-4.5 animate-bounce" />
              <span>DEV TAKEOVER ACTIVE &bull; Impersonating student account <strong>{user.email}</strong></span>
            </div>
            <button 
              onClick={handleStopImpersonation}
              className="z-10 bg-white hover:bg-slate-100 text-red-700 font-bold px-3 py-1 rounded shadow-sm border border-red-700 hover:border-transparent transition duration-200"
            >
              RESTORE DEV SESSION
            </button>
          </div>
        )}

        {/* Global Navigation Header */}
        {isAuthenticated && pathname !== '/login' && (
          <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-premium z-40 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              
              {/* Logo / Brand */}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="bg-primary text-white p-2 rounded-lg font-black text-lg tracking-wider shadow-sm transition duration-300 group-hover:scale-105">
                  <Zap className="w-5 h-5 fill-white text-white" />
                </span>
                <span className="font-display font-extrabold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Antigravity LMS</span>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/" className={`px-4 py-2 rounded-lg font-medium text-sm transition ${isActive('/') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  Dashboard
                </Link>
                <Link href="/courses" className={`px-4 py-2 rounded-lg font-medium text-sm transition ${isActive('/courses') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  Courses
                </Link>
                <Link href="/leaderboard" className={`px-4 py-2 rounded-lg font-medium text-sm transition ${isActive('/leaderboard') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  Leaderboard
                </Link>
                {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
                  <Link href="/admin" className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${isActive('/admin') ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <BookOpen className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                {(user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
                  <Link href="/dev" className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${isActive('/dev') ? 'bg-amber-100 text-amber-800' : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'}`}>
                    <Terminal className="w-4 h-4" />
                    Dev Console
                  </Link>
                )}
              </nav>

              {/* Gamified Stat Items */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Streak Counter */}
                <div className="flex items-center gap-1.5 bg-amber-50 text-accent-streak px-3 py-1.5 rounded-full border border-amber-100 shadow-streak relative group" title="Streak status">
                  <Flame className={`w-5 h-5 fill-accent-streak ${user?.stats?.currentStreak ? 'animate-bounce' : ''}`} />
                  <span className="font-extrabold font-display text-sm">{user?.stats?.currentStreak || 0}d</span>
                </div>

                {/* Level Tag & XP Bar */}
                <div className="hidden sm:flex flex-col w-32 md:w-44 gap-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-0.5 text-primary">
                      <Award className="w-3.5 h-3.5" />
                      Lvl {user?.stats?.level || 1}
                    </span>
                    <span>{user?.stats?.totalXp % 250 || 0} / 250 XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inset">
                    <div 
                      className="bg-accent h-full rounded-full xp-fill shadow-[0_0_8px_rgba(255,176,0,0.5)]" 
                      style={{ width: `${user?.stats?.progressPercent || 0}%` }}
                    ></div>
                  </div>
                </div>

                 {/* User Dropdown */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 relative">
                  <div className="flex flex-col text-right hidden lg:flex">
                    <span className="font-display font-semibold text-sm text-slate-800 leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{user?.role}</span>
                  </div>
                  
                  {/* Avatar Picker Icon */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center bg-slate-100 text-slate-500 font-semibold relative overflow-hidden cursor-pointer hover:border-primary transition"
                  >
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* Glassmorphic Dropdown Panel */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-premium py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                      <div className="px-4 py-2 border-b border-slate-100 text-left">
                        <p className="font-display font-bold text-sm text-slate-800 truncate">{user?.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-primary-light text-primary uppercase tracking-wider">{user?.role}</span>
                      </div>
                      <div className="py-1">
                        <Link 
                          href="/profile" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left w-full"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>View Profile</span>
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
                          <Link 
                            href="/admin" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left w-full"
                          >
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        {(user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
                          <Link 
                            href="/dev" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition text-left w-full"
                          >
                            <Terminal className="w-4 h-4 text-amber-500" />
                            <span>Dev Console</span>
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button 
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }} 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition text-left w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout} 
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition" 
                    title="Logout Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </header>
        )}

        {/* Global Nav Bottom Bar for mobile devices */}
        {isAuthenticated && pathname !== '/login' && (
          <nav className="md:hidden sticky top-16 w-full bg-white border-b border-slate-100 flex justify-around py-2.5 z-40 text-slate-500 font-semibold text-xs shadow-sm">
            <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : 'text-slate-500'}`}>
              <BookOpen className="w-4.5 h-4.5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/courses" className={`flex flex-col items-center gap-1 ${isActive('/courses') ? 'text-primary' : 'text-slate-500'}`}>
              <BookOpen className="w-4.5 h-4.5" />
              <span>Courses</span>
            </Link>
            <Link href="/leaderboard" className={`flex flex-col items-center gap-1 ${isActive('/leaderboard') ? 'text-primary' : 'text-slate-500'}`}>
              <Trophy className="w-4.5 h-4.5" />
              <span>Leaderboard</span>
            </Link>
             {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
              <Link href="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-primary' : 'text-slate-500'}`}>
                <BookOpen className="w-4.5 h-4.5" />
                <span>Admin</span>
              </Link>
            )}
            {(user?.role === 'DEVELOPER' || user?.impersonatedBy) && (
              <Link href="/dev" className={`flex flex-col items-center gap-1 ${isActive('/dev') ? 'text-amber-700' : 'text-amber-500'}`}>
                <Terminal className="w-4.5 h-4.5" />
                <span>Console</span>
              </Link>
            )}
          </nav>
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-slate-50 border-t border-slate-200/50 py-6 text-center text-slate-400 text-xs">
          <p>&copy; 2026 Antigravity LMS Gamified Platform &bull; Developed Decoupled Monorepo Architecture.</p>
        </footer>
      </body>
    </html>
  );
}
