'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../store/useAuthStore';
import { apiFetch } from '../../../../lib/api';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Pencil, Trash2, GripVertical, FileText, Upload, Save, X, Eye, EyeOff 
} from 'lucide-react';

interface Lesson {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  filePath: string | null;
}

interface Module {
  id: string;
  orderIndex: number;
  title: string;
  lessons: Lesson[];
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
  isPublished: boolean;
  modules: Module[];
}

export default function AdminCourseEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [moduleModal, setModuleModal] = useState<{isOpen: boolean, mode: 'CREATE' | 'EDIT', id: string | null, title: string}>({ isOpen: false, mode: 'CREATE', id: null, title: '' });
  const [lessonModal, setLessonModal] = useState<{isOpen: boolean, mode: 'CREATE' | 'EDIT', moduleId: string | null, lessonId: string | null, title: string, summary: string}>({ isOpen: false, mode: 'CREATE', moduleId: null, lessonId: null, title: '', summary: '' });

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadCourse();
    }
  }, [isAuthenticated, user, params.id]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CourseDetails>(`/api/courses/${params.id}`);
      setCourse(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      await apiFetch(`/api/courses/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Could not update publication state');
    }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (moduleModal.mode === 'CREATE') {
        await apiFetch(`/api/admin/courses/${params.id}/modules`, {
          method: 'POST',
          body: JSON.stringify({ title: moduleModal.title }),
        });
      } else {
        await apiFetch(`/api/admin/modules/${moduleModal.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: moduleModal.title }),
        });
      }
      setModuleModal({ ...moduleModal, isOpen: false });
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Could not save module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      await apiFetch(`/api/admin/modules/${moduleId}`, { method: 'DELETE' });
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Could not delete module');
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (lessonModal.mode === 'CREATE') {
        await apiFetch(`/api/admin/modules/${lessonModal.moduleId}/lessons`, {
          method: 'POST',
          body: JSON.stringify({ title: lessonModal.title, summary: lessonModal.summary }),
        });
      } else {
        await apiFetch(`/api/admin/lessons/${lessonModal.lessonId}`, {
          method: 'PUT',
          body: JSON.stringify({ title: lessonModal.title, summary: lessonModal.summary }),
        });
      }
      setLessonModal({ ...lessonModal, isOpen: false });
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Could not save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await apiFetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Could not delete lesson');
    }
  };

  const handleFileUpload = async (lessonId: string, file: File) => {
    if (!file) return;
    setUploadingLessonId(lessonId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || '';
      const impersonationToken = document.cookie.split('; ').find(row => row.startsWith('impersonationToken='))?.split('=')[1];
      const activeToken = impersonationToken || token;

      const res = await fetch(`http://localhost:4000/api/admin/lessons/${lessonId}/upload`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingLessonId(null);
    }
  };

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (errorMsg) return <div className="p-8 text-center text-red-500">{errorMsg}</div>;
  if (!course) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{course.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                course.isPublished 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {course.isPublished ? 'Live' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-slate-500">Course Content Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow transition active:scale-95 flex items-center gap-2 border ${
              course.isPublished
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
            }`}
          >
            {course.isPublished ? (
              <>
                <EyeOff className="w-4 h-4 text-emerald-600" /> Make Draft
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Go Live
              </>
            )}
          </button>
          <button 
            onClick={() => setModuleModal({ isOpen: true, mode: 'CREATE', id: null, title: '' })}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {course.modules.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            No modules yet. Create one to get started.
          </div>
        ) : (
          course.modules.map((module) => (
            <div key={module.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                  <h3 className="font-bold text-slate-800">{module.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLessonModal({ isOpen: true, mode: 'CREATE', moduleId: module.id, lessonId: null, title: '', summary: '' })}
                    className="text-xs font-bold text-primary hover:text-primary-hover bg-primary-light/30 px-3 py-1.5 rounded-lg transition"
                  >
                    + Add Lesson
                  </button>
                  <button 
                    onClick={() => setModuleModal({ isOpen: true, mode: 'EDIT', id: module.id, title: module.title })}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                  ><Pencil className="w-4 h-4" /></button>
                  <button 
                    onClick={() => handleDeleteModule(module.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition"
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {module.lessons.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No lessons in this module.</p>
                ) : (
                  module.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition group">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{lesson.title}</p>
                          {lesson.filePath && (
                            <a href={lesson.filePath} target="_blank" className="text-[10px] text-blue-500 hover:underline">
                              View Attachment
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                        <label className="cursor-pointer text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {uploadingLessonId === lesson.id ? 'Uploading...' : 'Upload File'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.mp4"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(lesson.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <button 
                          onClick={() => setLessonModal({ isOpen: true, mode: 'EDIT', moduleId: module.id, lessonId: lesson.id, title: lesson.title, summary: lesson.summary })}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                        ><Pencil className="w-4 h-4" /></button>
                        <button 
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                        ><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Module Modal */}
      {moduleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-4">{moduleModal.mode === 'CREATE' ? 'New Module' : 'Edit Module'}</h3>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <input 
                autoFocus
                required
                type="text" 
                value={moduleModal.title}
                onChange={e => setModuleModal({...moduleModal, title: e.target.value})}
                placeholder="Module Title"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModuleModal({...moduleModal, isOpen: false})} className="px-4 py-2 text-sm text-slate-500">Cancel</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-4">{lessonModal.mode === 'CREATE' ? 'New Lesson' : 'Edit Lesson'}</h3>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <input 
                autoFocus
                required
                type="text" 
                value={lessonModal.title}
                onChange={e => setLessonModal({...lessonModal, title: e.target.value})}
                placeholder="Lesson Title"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary"
              />
              <textarea 
                value={lessonModal.summary}
                onChange={e => setLessonModal({...lessonModal, summary: e.target.value})}
                placeholder="Summary or descriptive text..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-primary h-24"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setLessonModal({...lessonModal, isOpen: false})} className="px-4 py-2 text-sm text-slate-500">Cancel</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
