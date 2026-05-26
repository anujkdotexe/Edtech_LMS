'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Activity, CheckCircle2, AlertCircle, ShieldAlert, Play, 
  RefreshCw, Search, Lock, Unlock, Clock, Terminal, 
  ArrowLeft, ShieldCheck, Database, Filter, ChevronRight, Eye
} from 'lucide-react';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'System' | 'Auth' | 'Courses' | 'Quizzes' | 'Leaderboard' | 'Admin CRM' | 'Dev Tooling';
  access: 'Public' | 'Student' | 'Admin' | 'Developer';
  description: string;
  testPath?: string;
  testOptions?: RequestInit;
}

interface TestResult {
  status: 'idle' | 'testing' | 'active' | 'protected' | 'warning' | 'offline';
  statusCode: number | null;
  statusText: string;
  latencyMs: number | null;
  responsePreview: string;
  testedAt: string | null;
}

export default function ApiHealthPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  // Guard access to only developers/admins
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role !== 'DEVELOPER' && user?.role !== 'ADMIN' && !user?.impersonatedBy) {
        router.push('/');
      }
    }
  }, [isAuthenticated, user?.role, user?.impersonatedBy, router]);

  // Registry of LMS API Endpoints
  const endpoints: APIEndpoint[] = [
    {
      id: 'health',
      method: 'GET',
      path: '/health',
      category: 'System',
      access: 'Public',
      description: 'Standard system health indicator. Returns system status and time parameters.',
      testPath: 'http://localhost:4000/health'
    },
    {
      id: 'courses-get',
      method: 'GET',
      path: '/api/courses',
      category: 'Courses',
      access: 'Public',
      description: 'Fetches the complete standard course syllabus catalog with pricing and levels.'
    },
    {
      id: 'course-get-by-id',
      method: 'GET',
      path: '/api/courses/6c69709e-2f53-4375-97f4-6889ac0a28b8',
      category: 'Courses',
      access: 'Public',
      description: 'Fetches detailed modules, lesson structures, and file path parameters for a single course.',
      testPath: '/api/courses/6c69709e-2f53-4375-97f4-6889ac0a28b8'
    },
    {
      id: 'quizzes-get',
      method: 'GET',
      path: '/api/quizzes',
      category: 'Quizzes',
      access: 'Public',
      description: 'Fetches the catalog of gamified multiple-choice quizzes, difficulties, and reward points.'
    },
    {
      id: 'leaderboard-get',
      method: 'GET',
      path: '/api/leaderboard',
      category: 'Leaderboard',
      access: 'Public',
      description: 'Retrieves the current language learning leaderboard active ranks and user stand-in cards.'
    },
    {
      id: 'profile-get',
      method: 'GET',
      path: '/api/profile',
      category: 'Auth',
      access: 'Student',
      description: 'Retrieves user session stats, streaks, pass histories, and unlocked badge arrays.'
    },
    {
      id: 'dev-monitoring-health',
      method: 'GET',
      path: '/api/dev/monitoring/health',
      category: 'Dev Tooling',
      access: 'Developer',
      description: 'Returns internal diagnostic metrics like CPU architecture, memory thresholds, and DB pools.'
    },
    {
      id: 'dev-monitoring-logs',
      method: 'GET',
      path: '/api/dev/monitoring/logs',
      category: 'Dev Tooling',
      access: 'Developer',
      description: 'Gives read-only access to PostgreSQL security audit transaction tracking tables.'
    },
    {
      id: 'dev-monitoring-advanced',
      method: 'GET',
      path: '/api/dev/monitoring/advanced-logs',
      category: 'Dev Tooling',
      access: 'Developer',
      description: 'Streams live simulated diagnostics from file storages, daily webhooks, and query pools.'
    },
    {
      id: 'admin-students-get',
      method: 'GET',
      path: '/api/admin/students',
      category: 'Admin CRM',
      access: 'Admin',
      description: 'Fetches onboarding records, account flags, and suspension toggles in the CRM ledger.'
    },
    {
      id: 'admin-payments-get',
      method: 'GET',
      path: '/api/admin/payments',
      category: 'Admin CRM',
      access: 'Admin',
      description: 'Fetches payment logs, order status lists, transaction parameters, and checkout details.'
    },
    {
      id: 'admin-settings-get',
      method: 'GET',
      path: '/api/admin/settings',
      category: 'Admin CRM',
      access: 'Admin',
      description: 'Fetches workspace configuration parameters, site-wide maintenance modes, and active alert headers.'
    },
    {
      id: 'admin-analytics-dashboard',
      method: 'GET',
      path: '/api/admin/analytics/dashboard',
      category: 'Admin CRM',
      access: 'Admin',
      description: 'Returns deep analytics aggregations like student counts, generated revenue, and streaks.'
    },
    {
      id: 'auth-login',
      method: 'POST',
      path: '/api/auth/login',
      category: 'Auth',
      access: 'Public',
      description: 'Standard login handler. Yields authorization tokens and saves HttpOnly session parameters.',
      testOptions: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'developer@lms.local', password: 'wrongpassword' }) // intentional wrong password to test status
      }
    },
    {
      id: 'auth-signup',
      method: 'POST',
      path: '/api/auth/signup',
      category: 'Auth',
      access: 'Public',
      description: 'Registers new student records, generating default streaks, levels, and stats pools.'
    },
    {
      id: 'auth-forgot-password',
      method: 'POST',
      path: '/api/auth/forgot-password',
      category: 'Auth',
      access: 'Public',
      description: 'Triggers password reset flow, writing a temporary recovery crypt-token directly to server logs.'
    },
    {
      id: 'auth-logout',
      method: 'POST',
      path: '/api/auth/logout',
      category: 'Auth',
      access: 'Public',
      description: 'Clears active credentials cookies and redirects active session parameters.'
    },
    {
      id: 'dev-impersonate',
      method: 'POST',
      path: '/api/dev/impersonate',
      category: 'Dev Tooling',
      access: 'Developer',
      description: 'Switches cookie contexts in real-time, taking control of target student sessions.'
    },
    {
      id: 'admin-students-import',
      method: 'POST',
      path: '/api/admin/students/import',
      category: 'Admin CRM',
      access: 'Admin',
      description: 'Bulk parses name/email fields, seeding users with automatic default credentials.'
    }
  ];

  // States
  const [results, setResults] = useState<Record<string, TestResult>>(() => {
    const initial: Record<string, TestResult> = {};
    endpoints.forEach(e => {
      initial[e.id] = {
        status: 'idle',
        statusCode: null,
        statusText: '',
        latencyMs: null,
        responsePreview: '',
        testedAt: null
      };
    });
    return initial;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<string>('All');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    let active = 0;
    let protectedCount = 0;
    let warning = 0;
    let offline = 0;
    let untested = 0;
    let totalLatency = 0;
    let testedCount = 0;

    Object.values(results).forEach(r => {
      if (r.status === 'active') active++;
      else if (r.status === 'protected') protectedCount++;
      else if (r.status === 'warning') warning++;
      else if (r.status === 'offline') offline++;
      else if (r.status === 'idle') untested++;

      if (r.latencyMs !== null) {
        totalLatency += r.latencyMs;
        testedCount++;
      }
    });

    return {
      active,
      protectedCount,
      warning,
      offline,
      untested,
      avgLatency: testedCount > 0 ? Math.round(totalLatency / testedCount) : 0
    };
  }, [results]);

  // Categories list
  const categories = ['All', 'System', 'Auth', 'Courses', 'Quizzes', 'Leaderboard', 'Admin CRM', 'Dev Tooling'];

  // Filtered Endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(e => {
      const matchesSearch = e.path.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.method.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchesAccess = selectedAccess === 'All' || e.access === selectedAccess;

      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [searchTerm, selectedCategory, selectedAccess]);

  // Single Endpoint Ping Executor
  const pingEndpoint = async (endpoint: APIEndpoint) => {
    setResults(prev => ({
      ...prev,
      [endpoint.id]: {
        ...prev[endpoint.id],
        status: 'testing'
      }
    }));

    const start = performance.now();
    const fetchPath = endpoint.testPath || endpoint.path;
    const fetchOptions = endpoint.testOptions || {
      method: endpoint.method,
      credentials: 'include'
    };

    try {
      const response = await fetch(fetchPath, fetchOptions);
      const end = performance.now();
      const latency = Math.round(end - start);

      let text = '';
      try {
        const json = await response.json();
        text = JSON.stringify(json, null, 2);
      } catch {
        text = await response.text();
      }

      const truncatedText = text.length > 500 ? text.substring(0, 500) + '\n... [Response Truncated]' : text;

      // Classify health status based on standard API outputs
      let status: TestResult['status'] = 'active';
      
      if (response.status === 401 || response.status === 403) {
        // Authenticated routes throwing 401/403 are completely live and securely gated.
        status = 'protected';
      } else if (response.status >= 500 || response.status === 404) {
        status = 'warning';
      } else if (response.status === 400 && endpoint.method === 'POST') {
        // Body-less POST calls return 400, proving the endpoint route exists and is responsive
        status = 'active';
      }

      setResults(prev => ({
        ...prev,
        [endpoint.id]: {
          status,
          statusCode: response.status,
          statusText: response.statusText,
          latencyMs: latency,
          responsePreview: truncatedText,
          testedAt: new Date().toLocaleTimeString()
        }
      }));
    } catch (err: any) {
      const end = performance.now();
      setResults(prev => ({
        ...prev,
        [endpoint.id]: {
          status: 'offline',
          statusCode: null,
          statusText: 'Network Error',
          latencyMs: Math.round(end - start),
          responsePreview: err.message || 'Failed to establish TCP connection. Verify Fastify server is listening on port 4000.',
          testedAt: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  // Scan all listed endpoints
  const scanAll = async () => {
    setIsScanning(true);
    // Ping public / system nodes first, then admin/dev nodes
    for (const endpoint of endpoints) {
      await pingEndpoint(endpoint);
    }
    setIsScanning(false);
  };

  // Run initial scan on load
  useEffect(() => {
    scanAll();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dev"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dev Console</span>
        </Link>

        <span className="text-xs text-slate-400 font-bold">
          Current Engine: <strong className="text-primary">Fastify v8.x</strong> (Proxy Port 4000)
        </span>
      </div>

      {/* Main Board Block */}
      <section className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-slate-900">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/10">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Real-Time Monitor Gated /docs</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                System API Diagnostics & Health
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Asynchronous live API endpoint probe scanner. Evaluates TCP listeners, secure authentication gates, standard HTTP code handshakes, and response latencies directly.
              </p>
            </div>

            <button
              onClick={scanAll}
              disabled={isScanning}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-slate-950 text-xs font-black px-6 py-3 rounded-xl transition duration-300 shadow-lg shadow-primary/20 flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning API...' : 'Re-scan All Endpoints'}</span>
            </button>
          </div>

          {/* Real-time statistics counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-900">
            <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active / Healthy</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-emerald-400">{stats.active}</span>
                <span className="text-[10px] text-slate-500">endpoints</span>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Securely Gated</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-blue-400">{stats.protectedCount}</span>
                <span className="text-[10px] text-slate-500">protected</span>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Warnings (404/500)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-amber-400">{stats.warning}</span>
                <span className="text-[10px] text-slate-500">flags</span>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Offline / Offline</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-red-500">{stats.offline}</span>
                <span className="text-[10px] text-slate-500">errors</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-slate-900/40 backdrop-blur border border-slate-900 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg Latency</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-indigo-400">{stats.avgLatency}ms</span>
                <span className="text-[10px] text-slate-500">response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Filter and Endpoints catalog */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-4 space-y-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search endpoints path or details (e.g. /api/courses)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary focus:bg-white transition font-medium"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center justify-between text-xs pt-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Category
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Access</span>
                <select
                  value={selectedAccess}
                  onChange={(e) => setSelectedAccess(e.target.value)}
                  className="bg-slate-50 border border-slate-200 font-bold px-2 py-1.5 rounded-lg text-slate-600 focus:outline-none text-xs"
                >
                  <option value="All">All Roles</option>
                  <option value="Public">Public</option>
                  <option value="Student">Student</option>
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>
            </div>

          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Registered Endpoints ({filteredEndpoints.length} of {endpoints.length})
            </h3>

            {filteredEndpoints.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-premium p-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-500">No matching API endpoints registered</p>
                <p className="text-xs">Try clearing search parameters or reset category filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEndpoints.map(e => {
                  const res = results[e.id];
                  
                  // Setup method tags colors
                  const methodColors = {
                    GET: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    POST: 'bg-blue-50 text-blue-700 border-blue-100',
                    PUT: 'bg-amber-50 text-amber-700 border-amber-100',
                    DELETE: 'bg-red-50 text-red-700 border-red-100'
                  };

                  // Setup status badges
                  let statusBadge = (
                    <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Untested
                    </span>
                  );

                  if (res.status === 'testing') {
                    statusBadge = (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Ping...
                      </span>
                    );
                  } else if (res.status === 'active') {
                    statusBadge = (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active ({res.statusCode})
                      </span>
                    );
                  } else if (res.status === 'protected') {
                    statusBadge = (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Secure Gate ({res.statusCode})
                      </span>
                    );
                  } else if (res.status === 'warning') {
                    statusBadge = (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Warning ({res.statusCode})
                      </span>
                    );
                  } else if (res.status === 'offline') {
                    statusBadge = (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Offline ({res.statusCode ?? 'ERR'})
                      </span>
                    );
                  }

                  return (
                    <div
                      key={e.id}
                      onClick={() => setSelectedEndpointId(e.id)}
                      className={`bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-premium hover:-translate-y-0.5 hover:shadow-lg ${selectedEndpointId === e.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`border font-black font-display text-xs px-2.5 py-1 rounded-lg ${methodColors[e.method]}`}>
                            {e.method}
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm tracking-tight break-all">
                            {e.path}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {res.latencyMs !== null && (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {res.latencyMs}ms
                            </span>
                          )}
                          {statusBadge}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-50">
                        <p className="text-slate-500 text-xs max-w-xl font-medium leading-relaxed truncate">
                          {e.description}
                        </p>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 border text-slate-500 tracking-wider">
                            {e.access}
                          </span>
                          <button
                            onClick={(evt) => {
                              evt.stopPropagation();
                              pingEndpoint(e);
                            }}
                            disabled={res.status === 'testing'}
                            className="p-1.5 hover:bg-primary-light text-slate-400 hover:text-primary rounded-lg border border-transparent hover:border-primary/20 transition"
                            title="Ping Endpoint"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Dynamic Monitor Console Output */}
        <div className="lg:col-span-4 sticky top-24">
          
          <div className="bg-slate-950 text-white rounded-3xl shadow-2xl border border-slate-900 overflow-hidden flex flex-col min-h-[500px]">
            
            {/* Console Header */}
            <div className="bg-slate-900/60 backdrop-blur px-5 py-4 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="font-display font-black text-xs uppercase tracking-wider text-slate-200">Diagnostics Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            {/* Console Main Detail Pane */}
            {selectedEndpointId ? (() => {
              const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId)!;
              const res = results[selectedEndpointId];
              
              return (
                <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    {/* Route brief */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black font-display text-[10px] bg-slate-900 text-slate-200 border border-slate-800 px-2 py-0.5 rounded uppercase">
                          {selectedEndpoint.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">Access: {selectedEndpoint.access}</span>
                      </div>
                      <h4 className="font-mono text-sm font-extrabold text-white break-all">
                        {selectedEndpoint.method} {selectedEndpoint.path}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed pt-1">
                        {selectedEndpoint.description}
                      </p>
                    </div>

                    {/* Performance parameters */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-900 border border-slate-900 rounded-xl p-3 space-y-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Status Handshake</span>
                        <span className="text-xs font-black text-white">{res.statusCode ? `${res.statusCode} ${res.statusText}` : 'Unmeasured'}</span>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-900 rounded-xl p-3 space-y-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">TCP Latency</span>
                        <span className="text-xs font-black text-indigo-400">{res.latencyMs !== null ? `${res.latencyMs} ms` : 'Unmeasured'}</span>
                      </div>
                    </div>

                    {/* Output Box */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Raw Payload Response JSON</span>
                      <div className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-4 font-mono text-[10px] leading-relaxed overflow-x-auto text-emerald-400 max-h-[220px] overflow-y-auto whitespace-pre">
                        {res.responsePreview || '// No payload collected yet. Trigger a ping scan above.'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900 flex gap-3">
                    <button
                      onClick={() => pingEndpoint(selectedEndpoint)}
                      disabled={res.status === 'testing'}
                      className="flex-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 rounded-xl transition duration-200 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Ping Endpoint</span>
                    </button>
                  </div>

                </div>
              );
            })() : (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <Database className="w-12 h-12 text-slate-800 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Diagnostics Reader Active</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                    Select any registered route parameter card from the list on the left to inspect raw response JSON envelopes.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
