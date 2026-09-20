'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Terminal, ShieldAlert, Users, Database, Clipboard, Award, 
  Flame, Trash2, Shield, UserCheck, CheckCircle2, AlertCircle,
  Activity, Flag, Server, DollarSign, List
} from 'lucide-react';

interface AuditLog {
  id: string;
  userEmail: string;
  impersonatorEmail?: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface SystemHealth {
  status: string;
  database: {
    totalUsersCount: number;
    totalCoursesCount: number;
    totalOrdersCount: number;
  };
  system: {
    platform: string;
    arch: string;
    uptimeSeconds: number;
    freeMemoryBytes: number;
    totalMemoryBytes: number;
    cpuCores: number;
  };
}

interface StudentRef {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
}

interface AdvancedLogs {
  dbQueries: { time: string; query: string; duration: string }[];
  webhooks: { time: string; event: string; payload: string; status: string }[];
  storage: { time: string; action: string; path: string; size: string }[];
}

export default function DevConsolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'IMPERSONATION' | 'CRM' | 'OVERRIDES' | 'DIAGNOSTICS' | 'FEATURE_FLAGS' | 'CACHE' | 'RECONCILIATION' | 'QUEUE'>('IMPERSONATION');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['IMPERSONATION', 'CRM', 'OVERRIDES', 'DIAGNOSTICS', 'FEATURE_FLAGS', 'CACHE', 'RECONCILIATION', 'QUEUE'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);
  
  // Core lists
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [advancedLogs, setAdvancedLogs] = useState<AdvancedLogs | null>(null);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [cacheKeys, setCacheKeys] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any | null>(null);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [queueSummary, setQueueSummary] = useState<any | null>(null);

  // Impersonation state
  const [targetEmail, setTargetEmail] = useState('');
  
  // CRM Import state
  const [csvText, setCsvText] = useState('');
  const [crmMessage, setCrmMessage] = useState<string | null>(null);

  // Overrides state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [overrideAction, setOverrideAction] = useState<'AWARD_XP' | 'RESET_STREAK' | 'REVOKE_COURSE'>('AWARD_XP');
  const [overrideValue, setOverrideValue] = useState('100');

  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role !== 'DEVELOPER' && user?.role !== 'ADMIN' && !user?.impersonatedBy) {
        router.push('/');
        return;
      }
      loadDeveloperData();
    }
  }, [isAuthenticated, user?.role, user?.impersonatedBy]);

  const loadDeveloperData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch student references from leaderboard
      const leaderboardRes = await apiFetch<{ leaderboard: any[] }>('/api/leaderboard');
      setStudents(leaderboardRes.leaderboard || []);

      // 2. Fetch Diagnostics
      const healthRes = await apiFetch<SystemHealth>('/api/dev/monitoring/health');
      setHealth(healthRes);

      // 3. Fetch Audit Logs
      const logsRes = await apiFetch<AuditLog[]>('/api/dev/monitoring/logs');
      setAuditLogs(logsRes);

      // 4. Fetch Advanced Logs
      const advLogsRes = await apiFetch<AdvancedLogs>('/api/dev/monitoring/advanced-logs');
      setAdvancedLogs(advLogsRes);

      // 5. Fetch Feature Flags
      try {
        const flagsRes = await apiFetch<{ flags: any[] }>('/api/dev/feature-flags');
        setFeatureFlags(flagsRes.flags || []);
      } catch (_) {}

      // 6. Fetch Cache Keys
      try {
        const cacheRes = await apiFetch<{ cacheKeys: any[] }>('/api/dev/cache');
        setCacheKeys(cacheRes.cacheKeys || []);
      } catch (_) {}

      // 7. Fetch Reconciliation Report
      try {
        const reconRes = await apiFetch<any>('/api/dev/reconciliation');
        setReconciliation(reconRes);
      } catch (_) {}

      // 8. Fetch Queue Monitor
      try {
        const queueRes = await apiFetch<{ summary: any; jobs: any[] }>('/api/dev/queue');
        setQueueJobs(queueRes.jobs || []);
        setQueueSummary(queueRes.summary);
      } catch (_) {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize developer dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // 1. Switch session impersonation takeover
  const handleStartImpersonation = async (email: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiFetch('/api/dev/impersonate', {
        method: 'POST',
        body: JSON.stringify({ studentEmail: email, email }),
      });
      setSuccessMsg(`Takeover successful! Switch active session email: ${email}`);
      
      // Reload page and navigate to dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Session takeover failed.');
      setSubmitting(false);
    }
  };

  // 2. CRM Students CSV import
  const handleCRMImport = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setCrmMessage(null);
    try {
      // Parse CSV text to JSON
      const lines = csvText.split('\n');
      const studentsToImport: Array<{ name: string; email: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          studentsToImport.push({
            name: parts[0].trim(),
            email: parts[1].trim(),
          });
        }
      }

      if (studentsToImport.length === 0) {
        throw new Error("No valid student rows found. Header row must be followed by Name,Email lines.");
      }

      const res = await apiFetch<{ message: string; importedCount: number }>('/api/admin/students/import', {
        method: 'POST',
        body: JSON.stringify({ students: studentsToImport }),
      });

      setCrmMessage(`Successfully imported ${res.importedCount} student(s)! Force-reset passwords generated. Check your Fastify server standard terminal console output for temporary access tokens.`);
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.message || 'CRM student import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Manual administrative override
  const handleExecuteOverride = async () => {
    if (!selectedStudentId) {
      setErrorMsg("Please select a target student first.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiFetch('/api/dev/monitoring/override', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: selectedStudentId,
          action: overrideAction,
          value: overrideValue,
        }),
      });

      setSuccessMsg(`Successfully executed override: ${overrideAction} set to "${overrideValue}".`);
      await loadDeveloperData();
      await fetchProfile();
    } catch (err: any) {
      setErrorMsg(err.message || 'Override execution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-pulse">
        <div className="shimmer h-12 w-48 rounded-lg"></div>
        <div className="shimmer h-80 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Dev Console Heading */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/10">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Takeover Console</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Antigravity Local Diagnostic Panel
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Monitor PostgreSQL pool active parameters, perform manual user overrides, audit takeovers, and onboard students directly.
          </p>
        </div>
      </section>

      {/* Status Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <section className="lg:col-span-3 bg-white border border-slate-100 rounded-xl shadow-premium p-4 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('IMPERSONATION')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'IMPERSONATION' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShieldAlert className="w-4 h-4" /> Session Takeover
          </button>
          
          <button
            onClick={() => setActiveTab('CRM')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'CRM' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4" /> CRM Student Onboard
          </button>
          
          <button
            onClick={() => setActiveTab('OVERRIDES')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'OVERRIDES' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Award className="w-4 h-4" /> Student Overrides
          </button>
          
          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'DIAGNOSTICS' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Database className="w-4 h-4" /> Audit & Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('FEATURE_FLAGS')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'FEATURE_FLAGS' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Flag className="w-4 h-4" /> Feature Flags
          </button>

          <button
            onClick={() => setActiveTab('CACHE')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'CACHE' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Server className="w-4 h-4" /> Cache Inspector
          </button>

          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'RECONCILIATION' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <DollarSign className="w-4 h-4" /> Payment Reconciliation
          </button>

          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition ${activeTab === 'QUEUE' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <List className="w-4 h-4" /> Queue Monitor
          </button>

          <Link
            href="/dev/api-health"
            className="w-full text-left p-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition text-emerald-600 hover:bg-emerald-50 bg-emerald-50/20 border border-emerald-100/50 mt-2"
          >
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Real-Time API Health
          </Link>
        </section>

        {/* Tab Detail Pane */}
        <section className="lg:col-span-9 bg-white border border-slate-100 rounded-xl shadow-premium p-6 min-h-[400px]">
          
          {/* TAB 1: IMPERSONATION TAKEOVER */}
          {activeTab === 'IMPERSONATION' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">
                  Session Impersonation Takeover
                </h3>
                <p className="text-xs text-slate-400">
                  Switch session context instantly. Floating neon warnings remind developers active takeovers are in effect.
                </p>
              </div>

              {/* Manual search form */}
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="Enter student email (e.g. student@lms.local)"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-primary focus:bg-white transition font-medium"
                />
                <button
                  onClick={() => handleStartImpersonation(targetEmail)}
                  disabled={submitting || !targetEmail}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  Takeover Session
                </button>
              </div>

              {/* Students reference catalog list */}
              <div className="space-y-3.5 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Active Monorepo Students Catalog
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((student) => (
                    <div 
                      key={student.id}
                      className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex justify-between items-center hover:border-primary/20 transition group"
                    >
                      <div className="space-y-0.5">
                        <span className="font-display font-bold text-slate-800 text-sm">{student.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block">Level {student.level} &bull; {student.totalXp} XP</span>
                      </div>
                      
                      <button
                        onClick={() => handleStartImpersonation('student@lms.local')}
                        disabled={submitting}
                        className="bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-500 font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-sm"
                      >
                        Impersonate
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CRM ONBOARDING IMPORT */}
          {activeTab === 'CRM' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">
                  CRM Student Onboarding Bulk Import
                </h3>
                <p className="text-xs text-slate-400">
                  Bulk insert multiple Student entries. Force-reset parameters are enabled automatically.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Paste Student CSV List (Name,Email)</label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"Name,Email\nDavid Vance,david@lms.local\nElena Rostova,elena@lms.local"}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-primary focus:bg-white transition"
                ></textarea>
              </div>

              {crmMessage && (
                <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 rounded-xl text-xs flex items-start gap-2">
                  <Clipboard className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <span>{crmMessage}</span>
                </div>
              )}

              <button
                onClick={handleCRMImport}
                disabled={submitting}
                className="btn-primary text-xs w-full flex items-center justify-center gap-1.5"
              >
                Trigger CRM Import
              </button>
            </div>
          )}

          {/* TAB 3: OVERRIDES */}
          {activeTab === 'OVERRIDES' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">
                  Manual Student Database Overrides
                </h3>
                <p className="text-xs text-slate-400">
                  Direct database alterations to adjust XP, reset streak days, or revoke premium checkout transactions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Select student */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Target Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Choose student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.totalXp} XP)</option>
                    ))}
                  </select>
                </div>

                {/* Select Action */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Override Action</label>
                  <select
                    value={overrideAction}
                    onChange={(e) => setOverrideAction(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="AWARD_XP">Award XP Booster (+)</option>
                    <option value="RESET_STREAK">Reset/Set Active Streak</option>
                    <option value="REVOKE_COURSE">Revoke Course checkout</option>
                  </select>
                </div>

                {/* Input value */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Modifier Value</label>
                  {overrideAction === 'REVOKE_COURSE' ? (
                    <select
                      value={overrideValue}
                      onChange={(e) => setOverrideValue(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none"
                    >
                      <option value="A1-French">A1 French Course</option>
                      <option value="B1-German">B1 German Course</option>
                    </select>
                  ) : (
                    <input 
                      type="number" 
                      value={overrideValue}
                      onChange={(e) => setOverrideValue(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none font-semibold"
                    />
                  )}
                </div>

              </div>

              <button
                onClick={handleExecuteOverride}
                disabled={submitting}
                className="btn-accent text-xs w-full flex items-center justify-center gap-1.5"
              >
                Execute Database Override
              </button>
            </div>
          )}

          {/* TAB 4: AUDIT & DIAGNOSTICS */}
          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-8">
              
              {/* Diagnostics Metrics grid */}
              {health && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    System Health Diagnostics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Postgres Users</span>
                      <span className="text-base font-black font-display text-slate-800">{health.database.totalUsersCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Active Orders</span>
                      <span className="text-base font-black font-display text-slate-800">{health.database.totalOrdersCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Platform CPU</span>
                      <span className="text-base font-black font-display text-slate-800">{health.system.cpuCores} Cores</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">System Architecture</span>
                      <span className="text-base font-black font-display text-slate-800">{health.system.arch}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Logs list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Recent Database Security Audit Logs
                </h4>
                
                <div className="bg-slate-50 border rounded-xl overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 text-[11px] leading-relaxed font-semibold hover:bg-slate-100/30 transition">
                        <div className="flex justify-between items-center mb-1 text-slate-400">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{log.action}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 font-bold mb-0.5">{log.details}</p>
                        <div className="text-[10px] text-slate-400">
                          <span>User Context: <strong>{log.userEmail}</strong></span>
                          {log.impersonatorEmail && (
                            <span className="ml-3 text-red-500 font-bold uppercase">Impersonated by: {log.impersonatorEmail}</span>
                          )}
                          <span className="ml-3">IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Logs (Mock) */}
              {advancedLogs && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Mock DB Query Log
                    </h4>
                    <div className="bg-slate-900 border rounded-xl overflow-hidden p-3 font-mono text-[10px] text-emerald-400 space-y-1">
                      {advancedLogs.dbQueries.map((log, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-slate-500 w-32 shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
                          <span className="flex-1">{log.query}</span>
                          <span className="text-amber-400">{log.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Mock Webhook Events
                    </h4>
                    <div className="bg-slate-900 border rounded-xl overflow-hidden p-3 font-mono text-[10px] text-blue-400 space-y-1">
                      {advancedLogs.webhooks.map((log, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-slate-500 w-32 shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
                          <span className="text-pink-400 w-32 shrink-0">{log.event}</span>
                          <span className="flex-1 text-slate-300">{log.payload}</span>
                          <span className="text-emerald-400">{log.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Mock Storage Engine Log
                    </h4>
                    <div className="bg-slate-900 border rounded-xl overflow-hidden p-3 font-mono text-[10px] text-purple-400 space-y-1">
                      {advancedLogs.storage.map((log, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-slate-500 w-32 shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
                          <span className="text-amber-400 w-24 shrink-0">{log.action}</span>
                          <span className="flex-1 text-slate-300">{log.path}</span>
                          <span className="text-emerald-400">{log.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: FEATURE FLAGS */}
          {activeTab === 'FEATURE_FLAGS' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">Feature Flags Management</h3>
                <p className="text-xs text-slate-400">Enable or disable platform features with percentage-based rollouts. Changes take effect immediately (in-memory, no deploy required).</p>
              </div>
              <div className="space-y-3">
                {featureFlags.map((flag) => (
                  <div key={flag.key} className={`flex items-center justify-between p-4 rounded-xl border transition ${flag.enabled ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                      <span className={`font-mono font-bold text-xs ${flag.enabled ? 'text-emerald-800' : 'text-slate-600'}`}>{flag.key}</span>
                      <p className="text-[10px] text-slate-400 truncate">{flag.description}</p>
                      <span className="text-[10px] text-slate-400">Rollout: <strong className="text-slate-600">{flag.rolloutPct}%</strong> &bull; Updated: {new Date(flag.updatedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flag.enabled ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {flag.enabled ? 'ON' : 'OFF'}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await apiFetch('/api/dev/feature-flags/toggle', {
                              method: 'POST',
                              body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
                            });
                            const flagsRes = await apiFetch<{ flags: any[] }>('/api/dev/feature-flags');
                            setFeatureFlags(flagsRes.flags || []);
                          } catch (err: any) { setErrorMsg(err.message); }
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition active:scale-95 ${
                          flag.enabled
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        {flag.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
                {featureFlags.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No feature flags available.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: CACHE INSPECTOR */}
          {activeTab === 'CACHE' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">Cache Inspector</h3>
                <p className="text-xs text-slate-400">Browse active in-memory cache keys, view TTL countdowns, and manually purge stale entries.</p>
              </div>
              <div className="space-y-3">
                {cacheKeys.map((entry) => (
                  <div key={entry.key} className={`p-4 rounded-xl border transition ${entry.expired ? 'bg-red-50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-800 block">{entry.key}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{entry.valuePreview}</span>
                        <div className="flex gap-3 mt-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.expired ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                            {entry.expired ? 'EXPIRED' : `TTL: ${entry.remainingTtl}s`}
                          </span>
                          <span className="text-[10px] text-slate-400">Max: {entry.ttlSeconds}s</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await apiFetch(`/api/dev/cache/${encodeURIComponent(entry.key)}`, { method: 'DELETE' });
                            const cacheRes = await apiFetch<{ cacheKeys: any[] }>('/api/dev/cache');
                            setCacheKeys(cacheRes.cacheKeys || []);
                            setSuccessMsg(`Cache key '${entry.key}' purged successfully.`);
                          } catch (err: any) { setErrorMsg(err.message); }
                        }}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100 transition active:scale-95 shrink-0"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))}
                {cacheKeys.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Cache is empty.</p>}
              </div>
            </div>
          )}

          {/* TAB 7: PAYMENT RECONCILIATION */}
          {activeTab === 'RECONCILIATION' && reconciliation && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">Payment Reconciliation Report</h3>
                <p className="text-xs text-slate-400">Cross-references database order totals against simulated gateway totals to detect discrepancies.</p>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl border font-bold ${
                reconciliation.reconciliationStatus === 'RECONCILED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : reconciliation.reconciliationStatus === 'GATEWAY_UNAVAILABLE'
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {reconciliation.reconciliationStatus === 'RECONCILED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                )}
                <span className="text-sm">
                  {reconciliation.reconciliationStatus === 'RECONCILED'
                    ? 'All payments reconciled successfully.'
                    : reconciliation.reconciliationStatus === 'GATEWAY_UNAVAILABLE'
                    ? (reconciliation.message || 'Payment gateway credentials not configured (STRIPE_SECRET_KEY missing). Gateway reconciliation unavailable.')
                    : 'Variance detected between DB and gateway.'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-3 border text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Total Orders</span>
                  <span className="text-xl font-black font-display text-slate-800">{reconciliation.summary.totalOrders}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Successful</span>
                  <span className="text-xl font-black font-display text-emerald-700">{reconciliation.summary.successCount}</span>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Failed</span>
                  <span className="text-xl font-black font-display text-rose-700">{reconciliation.summary.failedCount}</span>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Refunded</span>
                  <span className="text-xl font-black font-display text-amber-700">{reconciliation.summary.refundedCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Revenue Comparison</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><span className="text-[9px] text-slate-400 block uppercase">DB Total</span><span className="font-bold text-slate-800 text-sm">${reconciliation.revenue.dbTotalRevenue.toFixed(2)}</span></div>
                  <div><span className="text-[9px] text-slate-400 block uppercase">Gateway Total</span><span className="font-bold text-slate-800 text-sm">${reconciliation.revenue.gatewayTotalRevenue.toFixed(2)}</span></div>
                  <div><span className="text-[9px] text-slate-400 block uppercase">Variance</span><span className={`font-bold text-sm ${Number(reconciliation.revenue.variance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>${reconciliation.revenue.variance.toFixed(2)} ({reconciliation.revenue.variancePct}%)</span></div>
                </div>
              </div>

              {reconciliation.flaggedOrders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Flagged Manual Enrollments</h4>
                  <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                    {reconciliation.flaggedOrders.map((o: any) => (
                      <div key={o.orderId} className="p-3 bg-amber-50 text-[10px] flex justify-between">
                        <span className="font-mono text-amber-700">{o.transactionId}</span>
                        <span className="text-amber-600 font-bold">${o.amount?.toFixed(2)} - {o.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-right">Generated at: {new Date(reconciliation.generatedAt).toLocaleString()}</p>
            </div>
          )}

          {/* TAB 8: QUEUE MONITOR */}
          {activeTab === 'QUEUE' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-base">Background Job Queue Monitor</h3>
                <p className="text-xs text-slate-400">View status of background workers: cron jobs, email dispatchers, webhook processors, and import tasks.</p>
              </div>

              {queueSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border rounded-xl p-3 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Total Jobs</span>
                    <span className="text-xl font-black font-display text-slate-800">{queueSummary.total}</span>
                  </div>
                  <div className="bg-emerald-50 border-emerald-100 border rounded-xl p-3 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Completed</span>
                    <span className="text-xl font-black font-display text-emerald-700">{queueSummary.completed}</span>
                  </div>
                  <div className="bg-amber-50 border-amber-100 border rounded-xl p-3 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Pending</span>
                    <span className="text-xl font-black font-display text-amber-700">{queueSummary.pending}</span>
                  </div>
                  <div className="bg-rose-50 border-rose-100 border rounded-xl p-3 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Failed</span>
                    <span className="text-xl font-black font-display text-rose-700">{queueSummary.failed}</span>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {queueJobs.map((job) => (
                  <div key={job.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{job.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          job.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                          job.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>{job.status}</span>
                        {job.attempts > 1 && <span className="text-[9px] font-bold text-orange-600">Retries: {job.attempts}</span>}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{job.type}</span>
                      <span className="text-[10px] text-slate-400 block">Created: {new Date(job.createdAt).toLocaleString()}</span>
                      {job.processedAt && <span className="text-[10px] text-emerald-600 block">Processed: {new Date(job.processedAt).toLocaleString()}</span>}
                    </div>
                    <div className="bg-slate-900 text-emerald-400 font-mono text-[9px] px-2 py-1 rounded max-w-[180px] overflow-hidden">
                      {JSON.stringify(job.payload).substring(0, 50)}{JSON.stringify(job.payload).length > 50 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
