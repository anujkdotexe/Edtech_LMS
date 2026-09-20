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
import { Home, BookOpen, Trophy } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchProfile, checkSession } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const isPublicRoute = pathname === '/login' || pathname.startsWith('/reset-password');
    if (!isPublicRoute) {
      checkSession().then((me) => {
        if (me) {
          fetchProfile();
        }
      });
    }
  }, [checkSession, fetchProfile, pathname]);

  // Auth & Client-side Route Guard
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = pathname === '/login' || pathname.startsWith('/reset-password');
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated) {
        if (pathname === '/login' || pathname.startsWith('/reset-password')) {
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
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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

          {/* Student Mobile Sub-Nav */}
          {isAuthenticated && pathname !== '/login' && !isAdminOrDev && (
            <nav aria-label="Mobile Navigation" className="md:hidden sticky top-14 w-full bg-white border-b border-slate-100 flex justify-around py-2 z-30 text-slate-500 font-semibold text-xs shadow-sm">
              {studentNavLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex flex-col items-center gap-0.5 px-4 py-1 ${
                    pathname === link.path ? 'text-primary' : 'text-slate-600 hover:text-slate-900'
                  }`}
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

          <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-600 text-xs">
            <p>&copy; 2026 Antigravity LMS &bull; Clean MVC &amp; Microlithic Architecture</p>
          </footer>
        </>
      )}
    </div>
  );
};
