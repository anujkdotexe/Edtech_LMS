'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { 
  Users, AlertCircle, ArrowLeft, RefreshCw, Slash, Trash2, 
  Download, BookOpen, Plus, X, ShieldAlert, ShieldCheck 
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  cefrLevel: string;
  price: number;
}

export default function AdminStudentsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual enrollment modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Add single student modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Checkbox bulk selections state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEnrollModalOpen, setIsBulkEnrollModalOpen] = useState(false);
  const [bulkEnrollCourseId, setBulkEnrollCourseId] = useState('');
  const [bulkEnrolling, setBulkEnrolling] = useState(false);

  // Revoke modal state
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeStudent, setRevokeStudent] = useState<Student | null>(null);
  const [revokeCourseId, setRevokeCourseId] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Send message modal state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageStudent, setMessageStudent] = useState<Student | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadStudents();
      loadCourses();
    }
  }, [isAuthenticated, user]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Student[]>('/api/admin/students');
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await apiFetch<Course[]>('/api/courses');
      setCourses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;
    setAdding(true);
    try {
      await apiFetch('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify({ name: addName, email: addEmail }),
      });
      alert('Student invited successfully! Credentials email dispatched.');
      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error inviting student');
    } finally {
      setAdding(false);
    }
  };

  const handleBulkEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !bulkEnrollCourseId) return;
    setBulkEnrolling(true);
    try {
      await apiFetch('/api/admin/students/bulk-enroll', {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedIds, courseId: bulkEnrollCourseId }),
      });
      alert(`Successfully enrolled ${selectedIds.length} students in course!`);
      setIsBulkEnrollModalOpen(false);
      setBulkEnrollCourseId('');
      setSelectedIds([]);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error in bulk enrollment');
    } finally {
      setBulkEnrolling(false);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeStudent || !revokeCourseId) return;
    setRevoking(true);
    try {
      await apiFetch('/api/admin/students/revoke', {
        method: 'POST',
        body: JSON.stringify({ userId: revokeStudent.id, courseId: revokeCourseId }),
      });
      alert('Course access revoked successfully.');
      setIsRevokeModalOpen(false);
      setRevokeStudent(null);
      setRevokeCourseId('');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error revoking course access');
    } finally {
      setRevoking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageStudent || !msgSubject || !msgBody) return;
    setSendingMsg(true);
    try {
      await apiFetch('/api/admin/students/message', {
        method: 'POST',
        body: JSON.stringify({ userId: messageStudent.id, subject: msgSubject, message: msgBody }),
      });
      alert('Inline email sent successfully!');
      setIsMessageModalOpen(false);
      setMessageStudent(null);
      setMsgSubject('');
      setMsgBody('');
    } catch (err: any) {
      alert(err.message || 'Error sending message');
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };

  const handleSuspend = async (student: Student) => {
    const actionWord = student.isSuspended ? 'unsuspend' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionWord} this student?`)) return;
    try {
      await apiFetch(`/api/admin/students/${student.id}/suspend`, { method: 'POST' });
      alert(`Student account ${student.isSuspended ? 'unsuspended' : 'suspended'} successfully.`);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error updating student suspension');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Generate a temporary password and reset this student\'s account?')) return;
    try {
      const res: any = await apiFetch(`/api/admin/students/${id}/reset-password`, { method: 'POST' });
      alert(res?.tempPassword ? `Password reset successfully. Temporary password: ${res.tempPassword}` : (res?.message || 'Password reset successfully.'));
    } catch (err: any) {
      alert(err.message || 'Error resetting password');
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete student ${student.name} (${student.email})? This action cannot be undone and will delete all progress, course purchase history, and quiz attempts.`)) return;
    try {
      await apiFetch(`/api/admin/students/${student.id}`, { method: 'DELETE' });
      alert('Student account permanently deleted.');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error deleting student');
    }
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudent || !enrollCourseId) return;
    setEnrolling(true);
    try {
      await apiFetch(`/api/admin/students/${enrollStudent.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ courseId: enrollCourseId }),
      });
      alert(`Successfully enrolled student in the course!`);
      setIsEnrollModalOpen(false);
      setEnrollStudent(null);
      setEnrollCourseId('');
    } catch (err: any) {
      alert(err.message || 'Error enrolling student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/students/export', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to export students CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Error exporting CSV');
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Student CRM
            </h1>
            <p className="text-sm text-slate-500">Manage user accounts, suspensions, credentials, and course enrollments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-premium transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Invite Student
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-xl shadow-premium transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions Indicator Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-premium flex items-center justify-between animate-[slideIn_0.3s_ease-out]">
          <span className="text-xs font-bold font-mono">
            {selectedIds.length} STUDENTS SELECTED FOR BULK TAKE-OVER
          </span>
          <button
            onClick={() => setIsBulkEnrollModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded-xl border border-primary/20 shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Bulk Enroll in Course
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading Students...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6 w-12">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Join Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => (
                  <tr key={student.id} className={`transition ${selectedIds.includes(student.id) ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-6 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">{student.name}</td>
                    <td className="py-4 px-6 text-slate-500">{student.email}</td>
                    <td className="py-4 px-6">
                      {student.isSuspended ? (
                        <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200 uppercase flex items-center gap-1 w-max">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 uppercase flex items-center gap-1 w-max">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEnrollStudent(student);
                            setIsEnrollModalOpen(true);
                          }}
                          className="bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-primary/10 transition active:scale-95 flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" /> Enroll
                        </button>
                        <button
                          onClick={() => {
                            setRevokeStudent(student);
                            setIsRevokeModalOpen(true);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-rose-100 transition active:scale-95 flex items-center gap-1"
                        >
                          Revoke
                        </button>
                        <button
                          onClick={() => {
                            setMessageStudent(student);
                            setIsMessageModalOpen(true);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-indigo-100 transition active:scale-95 flex items-center gap-1"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleResetPassword(student.id)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-amber-100 transition active:scale-95 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset Pwd
                        </button>
                        <button
                          onClick={() => handleSuspend(student)}
                          className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition active:scale-95 flex items-center gap-1 ${
                            student.isSuspended 
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100'
                          }`}
                        >
                          <Slash className="w-3 h-3" /> {student.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-100 transition active:scale-95 flex items-center gap-1"
                          title="Delete Student Permanently"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Manual Enrollment Modal */}
      {isEnrollModalOpen && enrollStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full p-6 space-y-6 relative">
            <button 
              onClick={() => { setIsEnrollModalOpen(false); setEnrollStudent(null); setEnrollCourseId(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-primary w-5 h-5" /> Manual Enrollment
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Assign a course to <strong className="text-slate-700">{enrollStudent.name}</strong> without requiring checkout/payment.
              </p>
            </div>
            <form onSubmit={handleManualEnroll} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Select Course</label>
                <select required value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>[{course.cefrLevel}] {course.title} - ${course.price}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsEnrollModalOpen(false); setEnrollStudent(null); setEnrollCourseId(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                >Cancel</button>
                <button type="submit" disabled={enrolling || !enrollCourseId}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-premium transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >{enrolling ? 'Enrolling...' : 'Assign Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full p-6 space-y-6 relative">
            <button onClick={() => { setIsAddModalOpen(false); setAddName(''); setAddEmail(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="text-emerald-600 w-5 h-5" /> Invite New Student
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Creates an account instantly with a temporary password (<code className="bg-slate-100 px-1 rounded">password123</code>). Credentials are dispatched via email.
              </p>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Full Name</label>
                <input required type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Email Address</label>
                <input required type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. jane.doe@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Student will be required to reset their password on first login. A mock welcome email is printed to the server console.</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setAddName(''); setAddEmail(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                >Cancel</button>
                <button type="submit" disabled={adding || !addName || !addEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-premium transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >{adding ? 'Creating...' : 'Create & Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {isBulkEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full p-6 space-y-6 relative">
            <button onClick={() => { setIsBulkEnrollModalOpen(false); setBulkEnrollCourseId(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-primary w-5 h-5" /> Bulk Course Enrollment
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enroll <strong className="text-slate-700">{selectedIds.length} selected students</strong> in a course at once without payment.
              </p>
            </div>
            <form onSubmit={handleBulkEnroll} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Target Course</label>
                <select required value={bulkEnrollCourseId} onChange={(e) => setBulkEnrollCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>[{course.cefrLevel}] {course.title} - ${course.price}</option>
                  ))}
                </select>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs text-primary font-medium">
                {selectedIds.length} student(s) will be enrolled. Students already in the course will be skipped automatically.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsBulkEnrollModalOpen(false); setBulkEnrollCourseId(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                >Cancel</button>
                <button type="submit" disabled={bulkEnrolling || !bulkEnrollCourseId}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-premium transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >{bulkEnrolling ? 'Enrolling...' : `Enroll ${selectedIds.length} Students`}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Course Access Modal */}
      {isRevokeModalOpen && revokeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full p-6 space-y-6 relative">
            <button onClick={() => { setIsRevokeModalOpen(false); setRevokeStudent(null); setRevokeCourseId(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-rose-600 w-5 h-5" /> Revoke Course Access
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Remove course access for <strong className="text-slate-700">{revokeStudent.name}</strong>. The enrollment record will be marked as <span className="text-rose-600 font-semibold">REFUNDED</span>.
              </p>
            </div>
            <form onSubmit={handleRevoke} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Course to Revoke</label>
                <select required value={revokeCourseId} onChange={(e) => setRevokeCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>[{course.cefrLevel}] {course.title}</option>
                  ))}
                </select>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>This will immediately lock the student out of the course content. This action is logged in the audit trail.</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsRevokeModalOpen(false); setRevokeStudent(null); setRevokeCourseId(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                >Cancel</button>
                <button type="submit" disabled={revoking || !revokeCourseId}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-premium transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >{revoking ? 'Revoking...' : 'Revoke Access'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {isMessageModalOpen && messageStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-lg w-full p-6 space-y-6 relative">
            <button onClick={() => { setIsMessageModalOpen(false); setMessageStudent(null); setMsgSubject(''); setMsgBody(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-indigo-600 w-5 h-5" /> Send Message to Student
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Compose an inline email to <strong className="text-slate-700">{messageStudent.name}</strong> ({messageStudent.email}). Message is sent via the mock email service and logged.
              </p>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Subject Line</label>
                <input required type="text" value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="e.g. Important notice regarding your account"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Message Body</label>
                <textarea required rows={5} value={msgBody} onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition resize-none"
                />
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
                This message will be printed to the server console (mock email). In production, it would be sent via your email provider.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsMessageModalOpen(false); setMessageStudent(null); setMsgSubject(''); setMsgBody(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                >Cancel</button>
                <button type="submit" disabled={sendingMsg || !msgSubject || !msgBody}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-premium transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >{sendingMsg ? 'Sending...' : 'Send Message'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

