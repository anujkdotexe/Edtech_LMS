'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { Settings, ArrowLeft, Save, Bell, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SiteSettings {
  activeBanner: string;
  bannerEnabled: boolean;
  maintenanceMode: boolean;
  dailyTip: string;
}

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState<SiteSettings>({
    activeBanner: '',
    bannerEnabled: false,
    maintenanceMode: false,
    dailyTip: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadSettings();
    }
  }, [isAuthenticated, user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<SiteSettings>('/api/admin/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" /> Global Site Settings
            </h1>
            <p className="text-sm text-slate-500">Configure banners, maintenance mode, and app metadata</p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading Configuration...</div>
        ) : (
          <form onSubmit={handleSave} className="p-8 space-y-8">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <ShieldCheck className="w-5 h-5" /> {successMsg}
              </div>
            )}

            <div className="space-y-6">
              <h3 className="font-display font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Bell className="w-5 h-5 text-indigo-500" /> Announcements & Banners
              </h3>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="bannerEnabled"
                  checked={settings.bannerEnabled}
                  onChange={(e) => setSettings({ ...settings, bannerEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <label htmlFor="bannerEnabled" className="font-bold text-sm text-slate-700 cursor-pointer">
                  Enable Global Alert Banner
                </label>
              </div>

              {settings.bannerEnabled && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Banner Message</label>
                  <textarea
                    rows={2}
                    value={settings.activeBanner}
                    onChange={(e) => setSettings({ ...settings, activeBanner: e.target.value })}
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="E.g., System maintenance scheduled for..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="font-display font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mt-8">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Maintenance & Danger Zone
              </h3>

              <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-100">
                <div>
                  <h4 className="font-bold text-red-800">Maintenance Mode</h4>
                  <p className="text-xs text-red-600/80">Blocks all non-admin traffic to the LMS portal.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
