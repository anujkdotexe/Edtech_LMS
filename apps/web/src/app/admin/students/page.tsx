'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { Users, AlertCircle, ArrowLeft, RefreshCw, Slash, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadStudents();
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

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this student? They will lose access.')) return;
    try {
      await apiFetch(`/api/admin/students/${id}/suspend`, { method: 'POST' });
      alert('Student suspended successfully (audit logged).');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error suspending student');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Reset password to default (password123)?')) return;
    try {
      await apiFetch(`/api/admin/students/${id}/reset-password`, { method: 'POST' });
      alert('Password reset to password123 successfully.');
    } catch (err: any) {
      alert(err.message || 'Error resetting password');
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Student CRM
            </h1>
            <p className="text-sm text-slate-500">Manage user accounts, suspensious, and credentials</p>
          </div>
        </div>
      </div>

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
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Join Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{student.name}</td>
                    <td className="py-4 px-6 text-slate-500">{student.email}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(student.id)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-amber-100 transition active:scale-95 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset Pwd
                        </button>
                        <button
                          onClick={() => handleSuspend(student.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-100 transition active:scale-95 flex items-center gap-1"
                        >
                          <Slash className="w-3 h-3" /> Suspend
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
    </div>
  );
}
