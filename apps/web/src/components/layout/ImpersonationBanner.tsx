import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const ImpersonationBanner: React.FC = () => {
  const { user, unimpersonate } = useAuthStore();

  if (!user?.impersonatedBy) return null;

  return (
    <div className="w-full bg-rose-600 text-white flex items-center justify-between px-4 py-2 text-xs font-semibold shadow-md z-50 relative">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 animate-bounce" />
        <span>
          DEV TAKEOVER &bull; Impersonating <strong>{user.email}</strong>
        </span>
      </div>
      <button
        onClick={unimpersonate}
        className="bg-white hover:bg-slate-100 text-rose-700 font-bold px-3 py-1 rounded shadow-sm transition active:scale-95"
      >
        RESTORE SESSION
      </button>
    </div>
  );
};
