'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/useAuthStore';
import { apiFetch } from '../../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

interface Question {
  id: string;
  orderIndex: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

interface QuizDetails {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue: number;
  questions: Question[];
}

export default function AdminQuizQuestions({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const quizId = (routeParams?.id as string) || params?.id;
  const { user, isAuthenticated } = useAuthStore();
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '') && quizId && quizId !== 'undefined') {
      loadQuiz(quizId);
    }
  }, [isAuthenticated, user, quizId]);

  const loadQuiz = async (id: string) => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    try {
      const data = await apiFetch<QuizDetails>(`/api/admin/quizzes/${id}`);
      setQuiz(data);
    } catch (err: any) {
      alert(err.message || 'Error loading quiz details');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setIsModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setModalMode('EDIT');
    setEditingId(q.id);
    setQuestionText(q.questionText);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectOption(q.correctOption);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { questionText, optionA, optionB, optionC, optionD, correctOption };
      if (modalMode === 'CREATE') {
        await apiFetch(`/api/admin/quizzes/${quizId}/questions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/admin/questions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      if (quizId) loadQuiz(quizId);
    } catch (err: any) {
      alert(err.message || 'Error saving question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await apiFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (quizId) loadQuiz(quizId);
    } catch (err: any) {
      alert(err.message || 'Error deleting question');
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading quiz details...</div>;
  if (!quiz) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/quizzes" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{quiz.title}</h1>
            <p className="text-sm text-slate-500">Questions Management • +{quiz.pointValue} XP</p>
          </div>
        </div>
        <button 
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {quiz.questions?.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            No questions yet. Add one to make this quiz playable.
          </div>
        ) : (
          quiz.questions?.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-primary transition"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="font-bold text-slate-800 text-lg leading-snug pr-12">{q.questionText}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pl-9">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isCorrect = q.correctOption === opt;
                  const text = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
                  return (
                    <div key={opt} className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-3 ${
                      isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                        isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>{opt}</span>
                      <span>{text}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl my-8">
            <h3 className="font-bold text-xl mb-6">{modalMode === 'CREATE' ? 'Add New Question' : 'Edit Question'}</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question Prompt</label>
                <textarea 
                  required
                  rows={3}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
                  placeholder="What is the capital of Spain?"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Multiple Choice Options</label>
                
                {[{id: 'A', val: optionA, set: setOptionA}, {id: 'B', val: optionB, set: setOptionB}, {id: 'C', val: optionC, set: setOptionC}, {id: 'D', val: optionD, set: setOptionD}].map(opt => (
                  <div key={opt.id} className={`flex items-center gap-3 p-2 rounded-xl border ${correctOption === opt.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}`}>
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={correctOption === opt.id}
                      onChange={() => setCorrectOption(opt.id as any)}
                      className="w-4 h-4 ml-2 accent-emerald-500 cursor-pointer"
                    />
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex justify-center items-center text-xs font-bold text-slate-500 shrink-0">{opt.id}</div>
                    <input 
                      required
                      type="text"
                      value={opt.val}
                      onChange={e => opt.set(e.target.value)}
                      placeholder={`Option ${opt.id}`}
                      className="w-full bg-transparent border-none text-sm outline-none font-medium text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition active:scale-95">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
