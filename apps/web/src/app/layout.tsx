import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import './globals.css';

export const metadata = {
  title: 'Antigravity LMS',
  description: 'Premium Gamified Language Learning Platform',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100"><path fill="%236366F1" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
