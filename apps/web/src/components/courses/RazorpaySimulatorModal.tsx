'use client';

import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, 
  Smartphone, Building2, Lock, ArrowRight 
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface RazorpaySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course: {
    id: string;
    title: string;
    cefrLevel: string;
    price: number;
  } | null;
}

export const RazorpaySimulatorModal: React.FC<RazorpaySimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  course,
}) => {
  const [method, setMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !course) return null;

  const handlePay = async (simulateOutcome: 'SUCCESS' | 'FAILED') => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        transactionId: string;
      }>(`/api/courses/${course.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ simulatedStatus: simulateOutcome }),
      });

      if (simulateOutcome === 'SUCCESS') {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError('Payment failed: Bank declined sandbox transaction.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Razorpay Top Navy Bar */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between relative">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Local Sandbox</span>
            </div>
            <h3 className="font-extrabold text-base tracking-tight text-white">{course.title}</h3>
            <p className="text-xs text-slate-300">CEFR {course.cefrLevel} Premium Access</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">Amount to pay</span>
            <span className="text-xl font-black text-white">₹{Number(course.price || 0).toFixed(2)}</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close payment modal"
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Payment Successful!</h4>
            <p className="text-xs text-slate-600">Your syllabus courseware has been unlocked. Redirecting...</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  method === 'UPI' ? 'bg-white text-[#0c2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI
              </button>
              <button
                type="button"
                onClick={() => setMethod('CARD')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  method === 'CARD' ? 'bg-white text-[#0c2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Card
              </button>
              <button
                type="button"
                onClick={() => setMethod('NETBANKING')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  method === 'NETBANKING' ? 'bg-white text-[#0c2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Net Banking
              </button>
            </div>

            {/* Method Inputs */}
            {method === 'UPI' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Virtual Payment Address (UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600 bg-slate-50"
                />
                <p className="text-[11px] text-slate-500">Supports Google Pay, PhonePe, Paytm sandbox simulator</p>
              </div>
            )}

            {method === 'CARD' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-blue-600 bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue="12/28"
                    placeholder="MM/YY"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                  />
                  <input
                    type="password"
                    defaultValue="123"
                    placeholder="CVV"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                  />
                </div>
              </div>
            )}

            {method === 'NETBANKING' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Popular Bank</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sandbox Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePay('SUCCESS')}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{loading ? 'Processing...' : `Pay ₹${Number(course.price || 0).toFixed(2)} (Success Flow)`}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handlePay('FAILED')}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition disabled:opacity-50"
              >
                Simulate Card Declined / Failure
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <Lock className="w-3 h-3" /> 256-bit SSL encrypted local mock payment gateway
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
