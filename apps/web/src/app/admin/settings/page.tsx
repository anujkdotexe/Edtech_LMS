'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import {
  Settings,
  ArrowLeft,
  Save,
  Bell,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Lightbulb,
  Info,
} from 'lucide-react';

interface EmailTemplateConfig {
  subject: string;
  body: string;
}

interface SiteSettings {
  activeBanner: string;
  bannerEnabled: boolean;
  maintenanceMode: boolean;
  dailyTip: string;
  emailTemplates?: {
    welcome: EmailTemplateConfig;
    passwordReset: EmailTemplateConfig;
    courseEnrolled: EmailTemplateConfig;
  };
}

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState<SiteSettings>({
    activeBanner: '',
    bannerEnabled: false,
    maintenanceMode: false,
    dailyTip: '',
    emailTemplates: {
      welcome: { subject: '', body: '' },
      passwordReset: { subject: '', body: '' },
      courseEnrolled: { subject: '', body: '' },
    },
  });
  const [activeEmailTab, setActiveEmailTab] = useState<'welcome' | 'passwordReset' | 'courseEnrolled'>('welcome');
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
      setSettings({
        ...data,
        emailTemplates: data.emailTemplates || {
          welcome: { subject: '', body: '' },
          passwordReset: { subject: '', body: '' },
          courseEnrolled: { subject: '', body: '' },
        },
      });
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
      setSuccessMsg('All site settings and email templates updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailTemplate = (
    key: 'welcome' | 'passwordReset' | 'courseEnrolled',
    field: 'subject' | 'body',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [key]: {
          ...prev.emailTemplates?.[key],
          [field]: value,
        },
      } as any,
    }));
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  const currentTemplate = settings.emailTemplates?.[activeEmailTab] || { subject: '', body: '' };

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
            <p className="text-sm text-slate-500">Configure banners, email templates, daily tips, and app controls</p>
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

            {/* Announcements & Banners */}
            <div className="space-y-4">
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
                    placeholder="E.g., Welcome to our platform! New language courses are available."
                  />
                </div>
              )}
            </div>

            {/* Daily Tips */}
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mt-8">
                <Lightbulb className="w-5 h-5 text-amber-500" /> Daily Rotating Tip
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tip of the Day</label>
                <input
                  type="text"
                  value={settings.dailyTip}
                  onChange={(e) => setSettings({ ...settings, dailyTip: e.target.value })}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="Practice for 15 minutes a day to maintain your streak!"
                />
              </div>
            </div>

            {/* Email Templates Portal (Feature #94) */}
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mt-8">
                <Mail className="w-5 h-5 text-sky-500" /> Email Templates Portal
              </h3>

              {/* Template Tabs */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveEmailTab('welcome')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeEmailTab === 'welcome'
                      ? 'bg-sky-100 text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Welcome Email
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmailTab('passwordReset')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeEmailTab === 'passwordReset'
                      ? 'bg-sky-100 text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Password Reset
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmailTab('courseEnrolled')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeEmailTab === 'courseEnrolled'
                      ? 'bg-sky-100 text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Course Enrolled
                </button>
              </div>

              {/* Template Editor */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-sky-500" />
                    {activeEmailTab === 'passwordReset' && (
                      <span>Available dynamic variable: <code className="bg-sky-100 text-sky-800 px-1 rounded">{'{{resetLink}}'}</code></span>
                    )}
                    {activeEmailTab === 'courseEnrolled' && (
                      <span>Available dynamic variable: <code className="bg-sky-100 text-sky-800 px-1 rounded">{'{{courseTitle}}'}</code></span>
                    )}
                    {activeEmailTab === 'welcome' && (
                      <span>Welcome message dispatched on onboarding.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Subject Line</label>
                  <input
                    type="text"
                    value={currentTemplate.subject}
                    onChange={(e) => updateEmailTemplate(activeEmailTab, 'subject', e.target.value)}
                    className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="Subject line..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Email Content Body</label>
                  <textarea
                    rows={4}
                    value={currentTemplate.body}
                    onChange={(e) => updateEmailTemplate(activeEmailTab, 'body', e.target.value)}
                    className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-mono text-xs leading-relaxed"
                    placeholder="Enter email body text..."
                  />
                </div>
              </div>
            </div>

            {/* Maintenance & Danger Zone */}
            <div className="space-y-4">
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

            {/* Submit Button */}
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
