'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { Navbar } from './Navbar';
import { ImpersonationBanner } from './ImpersonationBanner';
import { AdminDevTopBar } from './AdminDevTopBar';
import { AdminSidebar } from './AdminSidebar';
import { DevSidebar } from './DevSidebar';
import { Home, BookOpen, Trophy, Sparkles, Bell } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, checkSession } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [banner, setBanner] = useState<{ activeBanner: string; bannerEnabled: boolean } | null>(null);

  useEffect(() => {
    apiFetch<{ activeBanner?: string; bannerEnabled?: boolean }>('/api/public/settings')
      .then((res) => {
        if (res && res.activeBanner && res.bannerEnabled) {
          setBanner({ activeBanner: res.activeBanner, bannerEnabled: true });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const isPublicRoute = pathname === '/login' || pathname.startsWith('/reset-password');
    if (!isAuthenticated) {
      checkSession().then((me) => {
        if (me && !isPublicRoute) {
          fetchProfile();
        }
      });
    }
  }, [checkSession, fetchProfile, isAuthenticated, pathname]);

  // Auth & Client-side Route Guard
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = pathname === '/login' || pathname.startsWith('/reset-password');
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated) {
        if (pathname === '/login') {
          if (user?.forcePasswordReset) {
            router.push('/reset-password?forced=true');
          } else if (user?.role === 'ADMIN') {
            router.push('/admin');
          } else if (user?.role === 'DEVELOPER') {
            router.push('/dev');
          } else {
            router.push('/');
          }
        } else if (pathname.startsWith('/reset-password')) {
          if (!user?.forcePasswordReset) {
            router.push('/');
          }
        } else if (user?.forcePasswordReset) {
          router.push('/reset-password?forced=true');
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

  const role = user?.role || 'STUDENT';
  const isDev = role === 'DEVELOPER' || !!user?.impersonatedBy;
  const isAdmin = role === 'ADMIN' || isDev;
  const isAdminOrDev = isAdmin || isDev;
  const isOnAdminOrDevPage = pathname.startsWith('/admin') || pathname.startsWith('/dev');

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <header className="sticky top-0 w-full bg-white border-b border-slate-100 h-14 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-xl" />
            <div className="h-5 w-32 bg-slate-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-20 h-7 bg-slate-200 rounded-full" />
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="w-full h-36 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
        <footer className="bg-slate-50 border-t border-slate-200/50 py-5 text-center text-slate-600 text-xs">
          <p>&copy; 2026 Antigravity LMS &bull; Loading...</p>
        </footer>
      </div>
    );
  }

  const studentNavLinks = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Courses', path: '/courses', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Quizzes', path: '/quizzes', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Global Announcement Banner */}
      {banner?.bannerEnabled && banner.activeBanner && (
        <aside aria-label="Site announcement" className="bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{banner.activeBanner}</span>
        </aside>
      )}

      {/* Impersonation Warning Banner */}
      <ImpersonationBanner />

      {/* Admin or Dev Console Layout */}
      {isAuthenticated && pathname !== '/login' && isAdminOrDev && isOnAdminOrDevPage ? (
        <div className="flex flex-col flex-1">
          <AdminDevTopBar
            isDev={isDev}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          <div className="flex flex-1 relative overflow-hidden">
            {isDev ? (
              <DevSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            ) : (
              <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto lg:ml-56 min-h-[calc(100vh-3.5rem)]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      ) : (
        /* Student Layout */
        <>
          {isAuthenticated && pathname !== '/login' && <Navbar />}

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            {children}
          </main>

          {/* Modern Student Mobile Bottom Navigation Bar */}
          {isAuthenticated && pathname !== '/login' && !isAdminOrDev && (
            <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex justify-around items-center py-2 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              {studentNavLinks.map((link) => {
                const active = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                      active ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className={active ? 'text-primary' : 'text-slate-400'}>
                      {link.icon}
                    </span>
                    <span className="text-[11px] leading-none">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-600 text-xs mb-14 md:mb-0">
            <p>&copy; 2026 Antigravity LMS &bull; Clean MVC &amp; Microlithic Architecture</p>
          </footer>
        </>
      )}
    </div>
  );
};
