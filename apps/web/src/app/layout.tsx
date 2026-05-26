'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Flame, ShieldAlert, Award, LogOut, Terminal, User, BookOpen, Trophy, Zap, 
  Users, DollarSign, Activity, Settings, Flag, Server, List, BarChart3,
  ChevronRight, Home, CreditCard, Menu, X
} from 'lucide-react';
import './globals.css';

// Admin sidebar navigation sections
const ADMIN_NAV = [
  { section: 'Overview', items: [
    { name: 'Dashboard', path: '/admin', icon: <BarChart3 className="w-4 h-4" />, exact: true },
  ]},
  { section: 'Management', items: [
    { name: 'Students CRM', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Quizzes', path: '/admin/quizzes', icon: <Trophy className="w-4 h-4" /> },
  ]},
  { section: 'Finance', items: [
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
  ]},
  { section: 'Platform', items: [
    { name: 'Site Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Student View', path: '/', icon: <Home className="w-4 h-4" /> },
  ]},
];

// Developer sidebar navigation sections
const DEV_NAV = [
  { section: 'Console', items: [
    { name: 'Dev Console', path: '/dev', icon: <Terminal className="w-4 h-4" />, exact: true },
    { name: 'API Diagnostics', path: '/dev/api-health', icon: <Activity className="w-4 h-4" /> },
  ]},
  { section: 'Infrastructure', items: [
    { name: 'Feature Flags', path: '/dev', icon: <Flag className="w-4 h-4" />, tab: 'FEATURE_FLAGS' },
    { name: 'Cache Inspector', path: '/dev', icon: <Server className="w-4 h-4" />, tab: 'CACHE' },
    { name: 'Queue Monitor', path: '/dev', icon: <List className="w-4 h-4" />, tab: 'QUEUE' },
    { name: 'Reconciliation', path: '/dev', icon: <DollarSign className="w-4 h-4" />, tab: 'RECONCILIATION' },
  ]},
  { section: 'Access', items: [
    { name: 'Admin Panel', path: '/admin', icon: <ShieldAlert className="w-4 h-4" /> },
    { name: 'Student View', path: '/', icon: <Home className="w-4 h-4" /> },
  ]},
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, logout, unimpersonate } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auth & Role Guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated) {
        if (pathname === '/login') {
          router.push('/');
        } else {
          const role = user?.role || 'STUDENT';
          const isDev = role === 'DEVELOPER' || !!user?.impersonatedBy;
          const isAdmin = role === 'ADMIN' || isDev;
          if (pathname.startsWith('/dev') && !isDev) {
            router.push(isAdmin ? '/admin' : '/');
          } else if (pathname.startsWith('/admin') && !isAdmin) {
            router.push('/');
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleStopImpersonation = async () => {
    await unimpersonate();
    router.refresh();
  };

  const isActive = (path: string, exact = false) => {
    if (exact || path === '/') return pathname === path;
    return pathname.startsWith(path);
  };

  const role = user?.role || 'STUDENT';
  const isDev = role === 'DEVELOPER' || !!user?.impersonatedBy;
  const isAdmin = role === 'ADMIN' || isDev;
  const isAdminOrDev = isAdmin || isDev;
  const isOnAdminOrDevPage = pathname.startsWith('/admin') || pathname.startsWith('/dev');

  // ─── Shared Minimal Top Bar for Admin/Dev ─────────────────────────────────
  const renderAdminDevTopBar = (isDark: boolean) => (
    <header className={`h-14 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 ${
      isDark
        ? 'bg-slate-950/95 border-indigo-950/60 backdrop-blur-md'
        : 'bg-white border-slate-200/70 backdrop-blur-md'
    }`}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Brand */}
      <Link href={isDev ? '/dev' : '/admin'} className="flex items-center gap-2 group">
        <span className={`p-2 rounded-lg font-black text-lg tracking-wider transition group-hover:scale-105 ${
          isDark ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-800 text-white shadow-sm'
        }`}>
          {isDev ? <Terminal className="w-5 h-5 text-indigo-100" /> : <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />}
        </span>
        <span className={`font-display font-extrabold text-lg tracking-tight hidden sm:block ${
          isDev ? 'bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent' : 'text-slate-800'
        }`}>
          {isDev ? 'Antigravity Dev' : 'Antigravity Admin'}
        </span>
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
          isDev
            ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/40'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDev ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          {isDev ? 'DEV SHELL' : 'ADMIN'}
        </div>

        {/* Name */}
        <div className="hidden md:flex flex-col text-right">
          <span className={`font-semibold text-sm leading-tight ${isDev ? 'text-slate-200' : 'text-slate-800'}`}>{user?.name}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDev ? 'text-indigo-400' : 'text-slate-400'}`}>{user?.role}</span>
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-semibold cursor-pointer overflow-hidden transition ${
              isDev ? 'border-indigo-600/40 bg-slate-900 hover:border-indigo-500' : 'border-slate-200 bg-slate-100 hover:border-slate-300'
            }`}
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className={`w-4 h-4 ${isDev ? 'text-slate-400' : 'text-slate-500'}`} />
            )}
          </div>
          {isDropdownOpen && renderDropdownMenu()}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`p-2 rounded-lg transition ${isDev ? 'text-slate-500 hover:text-red-400 hover:bg-slate-900' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );

  // ─── Sidebar for Admin ─────────────────────────────────────────────────────
  const renderAdminSidebar = () => (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-slate-200/70 flex flex-col z-40 transition-transform duration-200 shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {ADMIN_NAV.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 mb-1.5">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path, item.exact);
                  return (
                    <Link
                      key={item.path + item.name}
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                        active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.name}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );

  // ─── Sidebar for Developer ─────────────────────────────────────────────────
  const renderDevSidebar = () => (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-slate-950 border-r border-indigo-950/60 flex flex-col z-40 transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {DEV_NAV.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 px-2 mb-1.5">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.path : isActive(item.path);
                  return (
                    <Link
                      key={item.path + item.name}
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                        active && pathname === item.path
                          ? 'bg-indigo-950/80 border border-indigo-800/30 text-indigo-300 shadow-inner'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-indigo-950/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-950/30 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );

  // ─── Profile Dropdown (role-specific) ─────────────────────────────────────
  const renderDropdownMenu = () => {
    const studentLinks = [
      { href: '/profile', icon: <User className="w-4 h-4 text-slate-400" />, label: 'My Profile' },
      { href: '/courses', icon: <BookOpen className="w-4 h-4 text-slate-400" />, label: 'My Courses' },
      { href: '/leaderboard', icon: <Trophy className="w-4 h-4 text-slate-400" />, label: 'Leaderboard' },
    ];
    const adminLinks = [
      { href: '/admin', icon: <BarChart3 className="w-4 h-4 text-slate-400" />, label: 'Admin Overview' },
      { href: '/admin/students', icon: <Users className="w-4 h-4 text-slate-400" />, label: 'Students CRM' },
      { href: '/admin/courses', icon: <BookOpen className="w-4 h-4 text-slate-400" />, label: 'Courses' },
      { href: '/admin/payments', icon: <CreditCard className="w-4 h-4 text-slate-400" />, label: 'Payments' },
      { href: '/admin/quizzes', icon: <Trophy className="w-4 h-4 text-slate-400" />, label: 'Quizzes' },
      { href: '/admin/settings', icon: <Settings className="w-4 h-4 text-slate-400" />, label: 'Settings' },
    ];
    const devLinks = [
      { href: '/dev', icon: <Terminal className="w-4 h-4 text-indigo-400" />, label: 'Dev Console', devStyle: true },
      { href: '/dev/api-health', icon: <Activity className="w-4 h-4 text-indigo-400" />, label: 'API Diagnostics', devStyle: true },
      { href: '/admin', icon: <ShieldAlert className="w-4 h-4 text-slate-400" />, label: 'Admin Panel' },
    ];

    const baseItemClass = "flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition w-full text-left";
    const devItemClass = "flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition w-full text-left";

    return (
      <div className="absolute right-0 top-11 w-60 bg-white/98 backdrop-blur-md border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
        {/* User info header */}
        <div className="px-4 py-2.5 border-b border-slate-100">
          <p className="font-display font-bold text-sm text-slate-800 truncate">{user?.name}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary uppercase tracking-wider">{user?.role}</span>
        </div>

        {/* Profile (always) */}
        <div className="py-1">
          <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className={baseItemClass}>
            <User className="w-4 h-4 text-slate-400" />
            <span>My Profile</span>
          </Link>
        </div>

        {/* Student-specific links */}
        {!isAdmin && (
          <>
            <div className="border-t border-slate-100 pt-1">
              {[
                { href: '/courses', icon: <BookOpen className="w-4 h-4 text-slate-400" />, label: 'My Courses' },
                { href: '/leaderboard', icon: <Trophy className="w-4 h-4 text-slate-400" />, label: 'Leaderboard' },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setIsDropdownOpen(false)} className={baseItemClass}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Admin-specific links */}
        {isAdmin && !isDev && (
          <>
            <div className="border-t border-slate-100 pt-1">
              <p className="px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Admin</p>
              {adminLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setIsDropdownOpen(false)} className={baseItemClass}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Developer-specific links */}
        {isDev && (
          <>
            <div className="border-t border-slate-100 pt-1">
              <p className="px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-indigo-400">Developer</p>
              {devLinks.map((l) => (
                <Link key={l.href + l.label} href={l.href} onClick={() => setIsDropdownOpen(false)} className={l.devStyle ? devItemClass : baseItemClass}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-1">
              <p className="px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Admin</p>
              {adminLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setIsDropdownOpen(false)} className={baseItemClass}>
                  {l.icon}<span>{l.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Logout */}
        <div className="border-t border-slate-100 pt-1 mt-1">
          {user?.impersonatedBy && (
            <button onClick={() => { setIsDropdownOpen(false); handleStopImpersonation(); }}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition w-full text-left">
              <ShieldAlert className="w-4 h-4" /><span>Stop Impersonation</span>
            </button>
          )}
          <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition w-full text-left">
            <LogOut className="w-4 h-4" /><span>Log Out</span>
          </button>
        </div>
      </div>
    );
  };

  // ─── Student top nav ───────────────────────────────────────────────────────
  const studentNavLinks = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Courses', path: '/courses', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
  ];

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <html lang="en">
        <head>
          <title>Antigravity LMS</title>
          <meta name="description" content="Premium Gamified Language Learning Platform" />
        </head>
        <body className="bg-slate-50 min-h-screen flex flex-col">
          <header className="sticky top-0 w-full bg-white border-b border-slate-100 h-14 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-slate-200 rounded-lg" />
              <div className="h-5 w-32 bg-slate-200 rounded-md" />
            </div>
            <div className="hidden md:flex items-center gap-3 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded-md" />
              <div className="h-4 w-20 bg-slate-200 rounded-md" />
            </div>
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-20 h-7 bg-slate-200 rounded-full" />
              <div className="w-9 h-9 bg-slate-200 rounded-full" />
            </div>
          </header>
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="w-full h-36 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          </main>
          <footer className="bg-slate-50 border-t border-slate-200/50 py-5 text-center text-slate-400 text-xs">
            <p>&copy; 2026 Antigravity LMS &bull; Loading...</p>
          </footer>
        </body>
      </html>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <html lang="en">
      <head>
        <title>Antigravity LMS</title>
        <meta name="description" content="Premium Gamified Language Learning Platform" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 width=%22100%22 height=%22100%22><path fill=%22%23FFB000%22 d=%22M13 10V3L4 14h7v7l9-11h-7z%22/></svg>" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50">

        {/* Impersonation Warning Banner */}
        {user?.impersonatedBy && (
          <div className="w-full bg-red-600 text-white flex items-center justify-between px-4 py-2 text-xs font-semibold shadow-md z-50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 impersonation-stripe" />
            <div className="flex items-center gap-2 z-10">
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>DEV TAKEOVER &bull; Impersonating <strong>{user.email}</strong></span>
            </div>
            <button onClick={handleStopImpersonation}
              className="z-10 bg-white hover:bg-slate-100 text-red-700 font-bold px-3 py-1 rounded shadow-sm border border-red-700 transition">
              RESTORE SESSION
            </button>
          </div>
        )}

        {/* ── ADMIN / DEVELOPER LAYOUT (Sidebar + Content) ── */}
        {isAuthenticated && pathname !== '/login' && isAdminOrDev && isOnAdminOrDevPage ? (
          <div className="flex flex-col flex-1">
            {/* Minimal top bar */}
            {isDev ? renderAdminDevTopBar(true) : renderAdminDevTopBar(false)}

            {/* Sidebar + Page content */}
            <div className="flex flex-1 relative overflow-hidden">
              {isDev ? renderDevSidebar() : renderAdminSidebar()}

              {/* Page content — shifted right by sidebar width on large screens */}
              <main className="flex-1 overflow-y-auto lg:ml-56 min-h-[calc(100vh-3.5rem)]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </main>
            </div>
          </div>

        ) : (
          /* ── STUDENT LAYOUT (Top nav) ── */
          <>
            {isAuthenticated && pathname !== '/login' && (
              <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-premium z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                  {/* Logo */}
                  <Link href="/" className="flex items-center gap-2 group">
                    <span className="bg-primary text-white p-2 rounded-lg font-black tracking-wider shadow-sm transition group-hover:scale-105">
                      <Zap className="w-4 h-4 fill-white text-white" />
                    </span>
                    <span className="font-display font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Antigravity LMS
                    </span>
                  </Link>

                  {/* Nav links */}
                  <nav className="hidden md:flex items-center gap-1">
                    {studentNavLinks.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        className={`px-3.5 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1.5 ${
                          isActive(link.path, link.path === '/')
                            ? 'bg-primary-light text-primary font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Right: streak, XP, avatar */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-accent-streak px-3 py-1.5 rounded-full border border-amber-100">
                      <Flame className={`w-4 h-4 fill-accent-streak ${user?.stats?.currentStreak ? 'animate-bounce' : ''}`} />
                      <span className="font-extrabold font-display text-sm">{user?.stats?.currentStreak || 0}d</span>
                    </div>

                    <div className="hidden sm:flex flex-col w-28 md:w-36 gap-0.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-0.5 text-primary">
                          <Award className="w-3 h-3" />Lvl {user?.stats?.level || 1}
                        </span>
                        <span>{(user?.stats?.totalXp ?? 0) % 250}/250</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-accent h-full rounded-full xp-fill" style={{ width: `${user?.stats?.progressPercent || 0}%` }} />
                      </div>
                    </div>

                    {/* Avatar + dropdown */}
                    <div className="relative flex items-center gap-2 pl-3 border-l border-slate-200" ref={dropdownRef}>
                      <div className="hidden lg:flex flex-col text-right">
                        <span className="font-semibold text-sm text-slate-800 leading-tight">{user?.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{user?.role}</span>
                      </div>
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-9 h-9 rounded-full border-2 border-primary/20 flex items-center justify-center bg-slate-100 overflow-hidden cursor-pointer hover:border-primary transition"
                      >
                        {user?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      {isDropdownOpen && renderDropdownMenu()}
                      <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition" title="Logout">
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </header>
            )}

            {/* Mobile bottom nav for students */}
            {isAuthenticated && pathname !== '/login' && !isAdminOrDev && (
              <nav className="md:hidden sticky top-14 w-full bg-white border-b border-slate-100 flex justify-around py-2 z-40 text-slate-500 font-semibold text-xs shadow-sm">
                {studentNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex flex-col items-center gap-0.5 px-4 py-1 ${isActive(link.path, link.path === '/') ? 'text-primary' : 'text-slate-400'}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </nav>
            )}

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            <footer className="bg-slate-50 border-t border-slate-200/50 py-5 text-center text-slate-400 text-xs">
              <p>&copy; 2026 Antigravity LMS &bull; Built with Decoupled Monorepo Architecture.</p>
            </footer>
          </>
        )}
      </body>
    </html>
  );
}
