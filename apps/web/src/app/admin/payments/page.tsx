'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import { ShoppingCart, ArrowLeft, RefreshCw, XCircle, CheckCircle2, Download } from 'lucide-react';

interface Payment {
  id: string;
  amount: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId: string | null;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
}

export default function AdminPaymentsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadPayments();
    }
  }, [isAuthenticated, user]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Payment[]>('/api/admin/payments');
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm('Are you sure you want to issue a refund for this transaction?')) return;
    try {
      await apiFetch(`/api/admin/payments/${id}/refund`, { method: 'POST' });
      alert('Refund issued successfully.');
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Error issuing refund');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/payments/export', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to export revenue CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'revenue_export.csv';
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
              <ShoppingCart className="w-6 h-6 text-primary" /> Payments Ledger
            </h1>
            <p className="text-sm text-slate-500">Monitor transactions and issue refunds</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-xl shadow-premium transition active:scale-95 flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading Payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No payment transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Transaction ID</th>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{payment.id.split('-')[0]}...</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{payment.studentName}</div>
                      <div className="text-[10px] text-slate-500">{payment.studentEmail}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{payment.courseTitle}</td>
                    <td className="py-4 px-6 font-black text-slate-800">${payment.amount}</td>
                    <td className="py-4 px-6">
                      {payment.status === 'SUCCESS' ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200 uppercase flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : payment.status === 'REFUNDED' ? (
                        <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 uppercase flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3" /> Refunded
                        </span>
                      ) : payment.status === 'FAILED' ? (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-200 uppercase flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 uppercase w-max block">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      {payment.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleRefund(payment.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-100 transition active:scale-95 inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Issue Refund
                        </button>
                      )}
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
