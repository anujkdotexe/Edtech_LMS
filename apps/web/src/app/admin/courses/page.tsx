'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiFetch } from '../../../lib/api';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  price: number;
  isPremium: boolean;
  isPublished: boolean;
  isUnlocked?: boolean;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');
  const [price, setPrice] = useState<number>(19.99);
  const [isPremium, setIsPremium] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    if (isAuthenticated && ['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
      loadCourses();
    }
  }, [isAuthenticated, user]);

  const loadCourses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<Course[]>('/api/courses');
      setCourses(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCefrLevel('A1');
    setPrice(19.99);
    setIsPremium(true);
    setIsPublished(true);
    setLanguage('es');
    setIsModalOpen(true);
  };

  const openEdit = (c: Course) => {
    setModalMode('EDIT');
    setEditingId(c.id);
    setTitle(c.title);
    setDescription(c.description || '');
    setCefrLevel(c.cefrLevel);
    setPrice(Number(c.price) || 0);
    setIsPremium(c.isPremium);
    setIsPublished(c.isPublished);
    setLanguage('es');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (modalMode === 'CREATE') {
        await apiFetch('/api/courses', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            cefrLevel,
            price: Number(price),
            isPremium,
            isPublished,
            language,
          }),
        });
      } else if (editingId) {
        await apiFetch(`/api/courses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            cefrLevel,
            price: Number(price),
            isPremium,
            isPublished,
            locale: language,
          }),
        });
      }
      setIsModalOpen(false);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Error saving course');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      await apiFetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle publication status');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course and all its modules and lessons? This action cannot be undone.')) {
      return;
    }
    try {
      await apiFetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'ALL' || c.cefrLevel === levelFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && c.isPublished) ||
        (statusFilter === 'DRAFT' && !c.isPublished);
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [courses, searchQuery, levelFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.isPublished).length;
    const draft = total - published;
    const premium = courses.filter((c) => c.isPremium).length;
    return { total, published, draft, premium };
  }, [courses]);

  if (!isAuthenticated || !['ADMIN', 'DEVELOPER'].includes(user?.role || '')) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Academic Curriculum
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Course Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, configure CEFR syllabus tiers, adjust pricing, and publish curriculum content.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Courses</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Published / Live</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.published}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-600">Draft Status</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.draft}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600">Premium / Paid</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.premium}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-primary text-slate-700"
          >
            <option value="ALL">All CEFR Levels</option>
            <option value="A1">A1 - Beginner</option>
            <option value="A2">A2 - Elementary</option>
            <option value="B1">B1 - Intermediate</option>
            <option value="B2">B2 - Upper Intermediate</option>
            <option value="C1">C1 - Advanced</option>
            <option value="C2">C2 - Mastery</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-primary text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft Only</option>
          </select>
        </div>
      </div>

      {/* Courses Catalog Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">Loading courses catalog...</div>
        ) : errorMsg ? (
          <div className="p-16 text-center text-red-500 font-bold">{errorMsg}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            No courses found matching your filter criteria. Create one to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">CEFR Level</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-primary transition">
                        {c.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                        {c.description || 'No description provided.'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {c.cefrLevel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {c.isPremium && Number(c.price) > 0 ? (
                        <span className="font-semibold text-slate-800">${Number(c.price).toFixed(2)}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleTogglePublish(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          c.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {c.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {c.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-xl border border-indigo-100 transition active:scale-95 flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" /> Syllabus
                        </Link>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Metadata"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {modalMode === 'CREATE' ? 'Create New Course' : 'Edit Course Details'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Spanish for Beginners"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe curriculum objectives, vocabulary themes, and outcomes..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CEFR Level</label>
                  <select
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Mastery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Locale Code</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. es, fr, de"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    Requires Purchase (Premium)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    Publish Live Immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : modalMode === 'CREATE' ? 'Create Course' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
