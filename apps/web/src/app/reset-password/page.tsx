'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    if (!token) return;

    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password, password }),
      });
      
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-premium text-center">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Reset Password</h1>
        
        {success ? (
          <div className="text-emerald-600 space-y-4 py-8">
            <p className="font-bold">Password successfully reset!</p>
            <p className="text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-8">Enter your new secure password below.</p>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-6">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="password"
                required
                disabled={!token}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New Password"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none"
              />
              <input 
                type="password"
                required
                disabled={!token}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none"
              />
              <button 
                type="submit"
                disabled={loading || !token}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Update Password'}
              </button>
            </form>
            
            <div className="mt-6 text-sm text-slate-500 font-medium">
              Remembered your password? <Link href="/login" className="text-primary hover:underline">Log in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
