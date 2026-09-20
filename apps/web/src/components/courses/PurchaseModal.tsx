import React, { useState } from 'react';
import { X, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CourseItem } from './CourseCard';
import { apiFetch } from '../../lib/api';

interface PurchaseModalProps {
  course: CourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !course) return null;

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/courses/${course.id}/purchase`, {
        method: 'POST',
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          aria-label="Close purchase modal"
          className="absolute top-5 right-5 p-1 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Course Unlocked!</h3>
            <p className="text-xs text-slate-600">You now have full access to this course.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <Badge variant="primary" size="sm">
                {course.cefrLevel} Course
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 pt-1">{course.title}</h3>
              <p className="text-xs text-slate-500">{course.description}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total Price</p>
                  <p className="text-xl font-black text-slate-900">${course.price}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Instant Access
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="ghost" fullWidth onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={handlePurchase} isLoading={loading}>
                Confirm &amp; Unlock
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
