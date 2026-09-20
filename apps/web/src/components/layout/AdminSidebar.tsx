import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  BookOpen,
  Trophy,
  CreditCard,
  Settings,
  Home,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const ADMIN_NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: <BarChart3 className="w-4 h-4" />, exact: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { name: 'Students CRM', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
      { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="w-4 h-4" /> },
      { name: 'Quizzes', path: '/admin/quizzes', icon: <Trophy className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Finance',
    items: [
      { name: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Platform',
    items: [
      { name: 'Site Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      { name: 'Student View', path: '/', icon: <Home className="w-4 h-4" /> },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-slate-200/70 flex flex-col z-40 transition-transform duration-200 shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {ADMIN_NAV.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 mb-1.5">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path, !!item.exact);
                  return (
                    <Link
                      key={item.path + item.name}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={active ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
