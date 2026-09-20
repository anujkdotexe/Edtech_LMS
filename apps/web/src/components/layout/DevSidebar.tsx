import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Terminal,
  Activity,
  Flag,
  Server,
  List,
  DollarSign,
  ShieldAlert,
  Home,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface DevNavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  exact?: boolean;
  tab?: string;
}

interface DevNavSection {
  section: string;
  items: DevNavItem[];
}

const DEV_NAV: DevNavSection[] = [
  {
    section: 'Console',
    items: [
      { name: 'Dev Console', path: '/dev', icon: <Terminal className="w-4 h-4" />, exact: true },
      { name: 'API Diagnostics', path: '/dev/api-health', icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Infrastructure',
    items: [
      { name: 'Feature Flags', path: '/dev?tab=FEATURE_FLAGS', icon: <Flag className="w-4 h-4" />, tab: 'FEATURE_FLAGS' },
      { name: 'Cache Inspector', path: '/dev?tab=CACHE', icon: <Server className="w-4 h-4" />, tab: 'CACHE' },
      { name: 'Queue Monitor', path: '/dev?tab=QUEUE', icon: <List className="w-4 h-4" />, tab: 'QUEUE' },
      { name: 'Reconciliation', path: '/dev?tab=RECONCILIATION', icon: <DollarSign className="w-4 h-4" />, tab: 'RECONCILIATION' },
    ],
  },
  {
    section: 'Access',
    items: [
      { name: 'Admin Panel', path: '/admin', icon: <ShieldAlert className="w-4 h-4" /> },
      { name: 'Student View', path: '/', icon: <Home className="w-4 h-4" /> },
    ],
  },
];

interface DevSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevSidebar: React.FC<DevSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { logout } = useAuthStore();

  const isItemActive = (path: string, exact?: boolean, tab?: string) => {
    if (tab) {
      return pathname === '/dev' && currentTab === tab;
    }
    if (exact) {
      return pathname === path && !currentTab;
    }
    return pathname.startsWith(path) && !currentTab;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-slate-950 border-r border-indigo-950/60 flex flex-col z-40 transition-transform duration-200 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {DEV_NAV.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 px-2 mb-1.5">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(item.path, item.exact, item.tab);
                  return (
                    <Link
                      key={item.path + item.name}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 shadow-inner'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={active ? 'text-indigo-400' : 'text-slate-500'}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-indigo-950/60">
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
