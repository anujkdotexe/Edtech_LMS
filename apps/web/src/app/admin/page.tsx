'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiFetch } from '../../lib/api';
  BookOpen, Plus, Pencil, Trash2, Users, CreditCard, BarChart3, 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, Upload, ShieldAlert, Award, ArrowUpRight, Settings
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
  title: string;
  description: string;
}

interface Student {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
}

interface AnalyticsDashboard {
  totalStudents: number;
  totalRevenue: number;
  weeklySignups: { date: string; count: number }[];
  streakLeaders: { id: string; name: string; avatarUrl: string; streak: number }[];
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // UI Tabs state: 'overview' | 'courses' | 'students' | 'quizzes'
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'quizzes'>('overview');
  
  // Loading & Errors
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Course CRUD Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetCourseId, setTargetCourseId] = useState<string | null>(null);
  
  // Course Form fields
  const [courseTitle, setCourseTitle] = useState('');
  const [courseLevel, setCourseLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');
  const [coursePrice, setCoursePrice] = useState('0.00');
  const [courseIsPremium, setCourseIsPremium] = useState(false);
  const [courseDesc, setCourseDesc] = useState('');
  
  // Submit loading
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [crudSuccess, setCrudSuccess] = useState<string | null>(null);

  // CSV Importer State
  const [csvText, setCsvText] = useState('John Doe, john.doe@lms.local\nJane Smith, jane.smith@lms.local');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; message: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Student overrides state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [overrideXPAmount, setOverrideXPAmount] = useState('100');
  const [overriding, setOverriding] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadDashboard();
      loadCourses();
      loadStudents();
    }
  }, [isAuthenticated, user]);

  const loadDashboard = async () => {
    try {
      const data = await apiFetch<AnalyticsDashboard>('/api/admin/analytics/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await apiFetch<Course[]>('/api/courses');
      setCourses(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load courses catalog');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      // Load student roster from leaderboard ranking endpoint
      const response = await apiFetch<{ leaderboard: Student[] }>('/api/leaderboard');
      setStudents(response.leaderboard || []);
    } catch (err: any) {
      // Fallback in case of networking issues
    } finally {
      setLoadingStudents(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setTargetCourseId(null);
    setCourseTitle('');
    setCourseLevel('A1');
    setCoursePrice('0.00');
    setCourseIsPremium(false);
    setCourseDesc('');
    setIsCourseModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setModalMode('EDIT');
    setTargetCourseId(course.id);
    setCourseTitle(course.title);
    setCourseLevel(course.cefrLevel as any);
    setCoursePrice(String(course.price));
    setCourseIsPremium(course.isPremium);
    setCourseDesc(course.description);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCourse(true);
    setCrudSuccess(null);
    try {
      const payload = {
        title: courseTitle,
        cefrLevel: courseLevel,
        price: parseFloat(coursePrice) || 0.0,
        isPremium: courseIsPremium,
        description: courseDesc,
      };

      if (modalMode === 'CREATE') {
        await apiFetch('/api/courses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCrudSuccess('Course successfully compiled and published!');
      } else {
        await apiFetch(`/api/courses/${targetCourseId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setCrudSuccess('Course metadata updated in database.');
      }

      setIsCourseModalOpen(false);
      await loadCourses();
      setTimeout(() => setCrudSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Course saving failed.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? All associated module logs, lessons, and translation catalogs will be permanently purged.')) {
      return;
    }
    try {
      await apiFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      setCrudSuccess('Course successfully purged.');
      await loadCourses();
      setTimeout(() => setCrudSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not delete course.');
    }
  };

  const handleBulkImport = async () => {
    setImporting(true);
    setImportResult(null);
    setImportError(null);

    // Parse CSV lines: "Name, Email"
    const parsedStudents: Array<{ name: string; email: string }> = [];
    const lines = csvText.split('\n');
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        parsedStudents.push({
          name: parts[0].trim(),
          email: parts[1].trim(),
        });
      }
    }

    if (parsedStudents.length === 0) {
      setImportError('Invalid CSV content. Please provide student lists in "Name, Email" format.');
      setImporting(false);
      return;
    }

    try {
      const result = await apiFetch<{ importedCount: number; message: string }>('/api/admin/students/import', {
        method: 'POST',
        body: JSON.stringify({ students: parsedStudents }),
      });
      setImportResult(result);
      setCsvText('');
      await loadStudents();
    } catch (err: any) {
      setImportError(err.message || 'Bulk student onboarding failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleOverrideXP = async (action: 'AWARD_XP' | 'RESET_STREAK') => {
    if (!selectedStudent) return;
    setOverriding(true);
    setOverrideSuccess(null);
    try {
      // Call standard administrative overrides API
      const value = action === 'AWARD_XP' ? parseInt(overrideXPAmount) : 0;
      await apiFetch('/api/dev/monitoring/override', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: selectedStudent.id,
          action,
          value,
        }),
      });

      setOverrideSuccess(`Successfully performed override ${action} on ${selectedStudent.name}.`);
      await loadStudents();
      setTimeout(() => {
        setOverrideSuccess(null);
        setSelectedStudent(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Override failed.');
    } finally {
      setOverriding(false);
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Forbidden</h3>
        <p className="text-sm">You do not possess the required administrative credentials to access this dashboard portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-800 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            LMS Executive Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Control global course catalogs, configure multilingual details, import student lists, and audit platform parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { loadCourses(); loadStudents(); }}
            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-wider">
            {user?.role} Administrative Center
          </span>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="border-b border-slate-100 flex gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Overview Dashboard
          </span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'courses' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Course Catalog Manager
          </span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> CRM Students & Onboarding
          </span>
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'quizzes' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Quiz Catalog
          </span>
        </button>
      </div>

      {/* SUCCESS POPUPS */}
      {crudSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{crudSuccess}</span>
        </div>
      )}

      {/* TAB CONTENTS */}
      
      {/* 1. OVERVIEW DASHBOARD TAB */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Revenue</h3>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">${dashboardData.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +12.5% vs last month
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Active Students</h3>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{dashboardData.totalStudents}</p>
              <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +5% vs last month
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Course Signups</h3>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{dashboardData.totalStudents}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Avg. Completion</h3>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800">42%</p>
            </div>
          </div>

          {/* Quick Admin Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/students" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Student CRM Hub</h4>
                </div>
              </div>
            </Link>

            <Link href="/admin/payments" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Payments Ledger</h4>
                </div>
              </div>
            </Link>

            <Link href="/admin/settings" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl flex items-center justify-between transition group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold font-display">Global Settings</h4>
                </div>
              </div>
            </Link>
          </div>

          {/* Charts & Lists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <h3 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Weekly Signups
              </h3>
              {/* Dynamic bar chart visualization */}
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {dashboardData.weeklySignups.map((day, i) => {
                  const maxCount = Math.max(...dashboardData.weeklySignups.map(d => d.count), 1);
                  const heightPercentage = (day.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                      <div 
                        className="w-full bg-primary/20 rounded-t-xl group-hover:bg-primary transition-colors relative"
                        style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                          {day.count} signups
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
              <h3 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Streak Leaders
              </h3>
              <div className="space-y-4">
                {dashboardData.streakLeaders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No active streaks yet.</p>
                ) : (
                  dashboardData.streakLeaders.map((leader, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={leader.avatarUrl || '/avatars/default.svg'} alt={leader.name} className="w-10 h-10 rounded-full border-2 border-slate-100" />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-700">
                          #{i + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{leader.name}</p>
                        <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                          <span className="text-amber-500">🔥</span> {leader.streak} Day Streak
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COURSE CATALOG CRUD */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider">Published Syllabi List</h3>
            <button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Language Course
            </button>
          </div>

          {loadingCourses ? (
            <div className="shimmer h-48 rounded-2xl"></div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                    <th className="py-4 px-6">CEFR Level</th>
                    <th className="py-4 px-6">Course Syllabus</th>
                    <th className="py-4 px-6">Pricing Tier</th>
                    <th className="py-4 px-6">License Type</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {courses.map((course) => (
                    <tr key={course.id} className="text-xs text-slate-600 hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6">
                        <span className="bg-primary-light text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          {course.cefrLevel}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        <div>
                          <p>{course.title}</p>
                          <p className="text-[10px] font-normal text-slate-400 line-clamp-1">{course.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">${course.price}</td>
                      <td className="py-4 px-6">
                        {course.isPremium ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">Premium</span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase">Free</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link 
                            href={`/admin/courses/${course.id}`}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1 px-3 rounded-lg border border-indigo-100 transition active:scale-95"
                          >
                            Manage Content
                          </Link>
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-100 hover:bg-slate-50 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-100 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. CRM STUDENTS & CSV IMPORT */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CRM Roster List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Users className="w-4.5 h-4.5 text-primary" /> Active Student Roster
            </h3>
            
            {loadingStudents ? (
              <div className="shimmer h-64 rounded-2xl"></div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-premium">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="py-4 px-4">Student</th>
                      <th className="py-4 px-4">Level</th>
                      <th className="py-4 px-4">Total Score</th>
                      <th className="py-4 px-4 text-right">Admin Overrides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((student) => (
                      <tr key={student.id} className="text-xs text-slate-600 hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <img src={student.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full bg-slate-50 object-cover" />
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-primary">Level {student.level}</td>
                        <td className="py-3 px-4 font-semibold">{student.totalXp} XP</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => { setSelectedStudent(student); setOverrideSuccess(null); }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1 px-3 rounded-lg border border-indigo-100 transition active:scale-95"
                          >
                            Edit Stats
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CSV Onboarding Importer */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Upload className="w-4.5 h-4.5 text-primary" /> Bulk CSV CRM Onboarding
              </h3>
              <p className="text-[10px] text-slate-400">
                Paste student records using the comma-separated <strong>Name, Email</strong> format. Fastify will bulk-onboard, hash temporary credentials, and print temporary login passcodes to log sweeps.
              </p>

              {importResult && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-semibold">
                  <p className="font-bold">Onboarded {importResult.importedCount} Students successfully!</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">Credentials printed to standard developer logs. Temporary force-resets active.</p>
                </div>
              )}
              {importError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-semibold">
                  {importError}
                </div>
              )}

              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-100 rounded-xl bg-slate-50/50 outline-none font-mono focus:bg-white transition"
                  placeholder="Student Name, email@lms.local"
                />
              </div>

              <button
                onClick={handleBulkImport}
                disabled={importing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition w-full active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                {importing ? 'Processing Import...' : 'Import Student Roster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CRUD FORM MODAL */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-premium animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-slate-800 border-b border-slate-50 pb-3 mb-4">
              {modalMode === 'CREATE' ? 'Create New Course Syllabus' : 'Edit Course Metadata'}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 focus:bg-white outline-none transition"
                  placeholder="e.g. Español B1 Intermedio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CEFR Level</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value as any)}
                    className="w-full px-4 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 outline-none focus:bg-white transition"
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper-Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                    <option value="C2">C2 Proficient</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price ($)</label>
                  <input
                    type="text"
                    required
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 focus:bg-white outline-none transition"
                    placeholder="19.99"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isPremiumCheck"
                  checked={courseIsPremium}
                  onChange={(e) => setCourseIsPremium(e.target.checked)}
                  className="rounded border-slate-200 text-primary focus:ring-primary/20"
                />
                <label htmlFor="isPremiumCheck" className="text-xs font-bold text-slate-600 cursor-pointer">
                  Requires Premium License Purchase
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Summary</label>
                <textarea
                  rows={3}
                  required
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-100 rounded-xl bg-slate-50 focus:bg-white outline-none transition"
                  placeholder="Madrid vocabulary structures, daily conversational prompts..."
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCourse}
                  className="bg-primary hover:bg-primary-hover text-white py-2 px-5 rounded-xl shadow-md transition active:scale-95"
                >
                  {submittingCourse ? 'Saving Course...' : 'Save Syllabus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. STATS OVERRIDE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-premium animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-slate-50 text-slate-500 font-semibold relative overflow-hidden mx-auto shadow-sm">
                <img src={selectedStudent.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">
                  Override Stats: {selectedStudent.name}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Trigger manual administrative database override parameters for daily streak sweepers and XP pools.
                </p>
              </div>
            </div>

            {overrideSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-xl text-[10px] font-semibold mt-4">
                {overrideSuccess}
              </div>
            )}

            <div className="mt-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Award XP Pool Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={overrideXPAmount}
                    onChange={(e) => setOverrideXPAmount(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 outline-none focus:bg-white transition"
                    placeholder="100"
                  />
                  <button
                    onClick={() => handleOverrideXP('AWARD_XP')}
                    disabled={overriding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition shrink-0 active:scale-95"
                  >
                    Award XP
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                <button
                  onClick={() => handleOverrideXP('RESET_STREAK')}
                  disabled={overriding}
                  className="bg-red-500 hover:bg-red-650 text-white font-bold text-xs py-2 px-4 rounded-xl transition active:scale-95"
                >
                  Reset Streak
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  disabled={overriding}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close overrides
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
