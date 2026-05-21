'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Award } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue: number;
}

export default function AdminQuizCatalog() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [pointValue, setPointValue] = useState(50);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadQuizzes();
    }
  }, [isAuthenticated, user]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Quiz[]>('/api/quizzes');
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setTitle('');
    setDifficulty('EASY');
    setPointValue(50);
    setIsModalOpen(true);
  };

  const openEdit = (q: Quiz) => {
    setModalMode('EDIT');
    setEditingId(q.id);
    setTitle(q.title);
    setDifficulty(q.difficulty);
    setPointValue(q.pointValue);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await apiFetch('/api/admin/quizzes', {
          method: 'POST',
          body: JSON.stringify({ title, difficulty, pointValue }),
        });
      } else {
        await apiFetch(`/api/admin/quizzes/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, difficulty, pointValue }),
        });
      }
      setIsModalOpen(false);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Error saving quiz');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz and all its questions?')) return;
    try {
      await apiFetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Error deleting quiz');
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" /> Quiz Engine
            </h1>
            <p className="text-sm text-slate-500">Manage interactive assessments and point values</p>
          </div>
        </div>
        <button 
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Quiz
        </button>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading Quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No quizzes found. Create one to get started.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-6">Quiz Title</th>
                <th className="py-4 px-6">Difficulty</th>
                <th className="py-4 px-6">Reward (XP)</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-slate-800">{quiz.title}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      quiz.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                      quiz.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-primary">+{quiz.pointValue} XP</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin/quizzes/${quiz.id}`}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1 px-3 rounded-lg border border-indigo-100 transition active:scale-95"
                      >
                        Manage Questions
                      </Link>
                      <button
                        onClick={() => openEdit(quiz)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-1 px-3 rounded-lg transition active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold py-1 px-3 rounded-lg transition active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">{modalMode === 'CREATE' ? 'Create Quiz' : 'Edit Quiz Metadata'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Difficulty</label>
                  <select 
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">XP Reward</label>
                  <input 
                    type="number"
                    required
                    value={pointValue}
                    onChange={e => setPointValue(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition active:scale-95">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
