'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  ChevronLeft, Lock, Unlock, FileText, Play, CheckCircle2, 
  HelpCircle, Eye, AlertCircle, ShoppingCart
} from 'lucide-react';

interface Lesson {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  filePath: string | null;
  lessonType?: string;
  durationSeconds?: number;
  isFreePreview?: boolean;
  isCompleted?: boolean;
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
  progressPercent?: number;
  totalLessonsCount?: number;
  completedLessonsCount?: number;
  modules: Module[];
}

export default function CourseDetailsPage({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const courseId = (routeParams?.id as string) || params?.id;
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive PDF Container Viewer state
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Purchase Simulation State
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && courseId !== 'undefined') {
      loadCourseSyllabus(courseId);
    }
  }, [courseId]);

  const loadCourseSyllabus = async (id: string) => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    setError(null);
    try {
      const details = await apiFetch<CourseDetails>(`/api/courses/${id}`);
      setCourse(details);
      
      // Auto-select first lesson
      if (details?.modules?.length > 0 && details.modules[0].lessons?.length > 0) {
        const firstLesson = details.modules[0].lessons[0];
        setActiveLesson(firstLesson);
        setLessonCompleted(!!firstLesson.isCompleted);
      }
    } catch (err: any) {
      setError(err.message || 'Could not fetch course syllabus details');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setLessonCompleted(!!lesson.isCompleted);
    setXpAwarded(false);
  };

  const handleSimulateCheckout = async (status: 'SUCCESS' | 'FAILED') => {
    if (!course) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      await apiFetch<{ success: boolean; message: string }>(`/api/courses/${course.id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ simulatedStatus: status }),
      });
      
      if (status === 'SUCCESS') {
        setPurchaseStatus('SUCCESS');
        setTimeout(async () => {
          setPurchaseStatus('IDLE');
          await fetchProfile();
          if (courseId) await loadCourseSyllabus(courseId);
        }, 1500);
      } else {
        setPurchaseStatus('FAILED');
        setPurchaseError('Simulated checkout failed. Sandbox card declined.');
      }
    } catch (err: any) {
      setPurchaseStatus('FAILED');
      setPurchaseError(err.message || 'Checkout failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson || !course) return;
    try {
      await apiFetch<{ success: boolean; message: string; xpAwarded: number }>(
        `/api/lessons/${activeLesson.id}/complete`,
        { method: 'POST' }
      );
      setLessonCompleted(true);
      setXpAwarded(true);

      // Dynamically update course state locally
      setCourse((prev) => {
        if (!prev) return null;
        let total = 0;
        let completed = 0;
        const updatedModules = prev.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => {
            total++;
            const isComp = l.id === activeLesson.id ? true : !!l.isCompleted;
            if (isComp) completed++;
            return { ...l, isCompleted: isComp };
          }),
        }));
        const newPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...prev,
          progressPercent: newPercent,
          completedLessonsCount: completed,
          totalLessonsCount: total,
          modules: updatedModules,
        };
      });

      // Update active lesson state
      setActiveLesson((prev) => (prev ? { ...prev, isCompleted: true } : null));

      await fetchProfile();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="shimmer h-12 w-32 rounded-lg"></div>
        <div className="shimmer h-48 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 shimmer h-96 rounded-xl"></div>
          <div className="md:col-span-8 shimmer h-96 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Failed to Load Syllabus</h3>
        <p className="text-sm">{error || 'Course could not be resolved.'}</p>
        <Link href="/" className="btn-primary text-xs py-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition group">
        <ChevronLeft className="w-4 h-4 transition duration-200 group-hover:-translate-x-0.5" /> Back to Dashboard
      </Link>

      {/* Course Heading Banner */}
      <section className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-primary-light text-primary text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              CEFR {course.cefrLevel} Language Catalog
            </span>
            {course.isPremium && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${course.isUnlocked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                {course.isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Premium Syllabus
              </span>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-900 leading-tight">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {course.description}
          </p>

          {/* Dynamic Progress Bar */}
          <div className="pt-2 max-w-md space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Syllabus Progress
              </span>
              <span className="text-emerald-700 font-extrabold">
                {course.progressPercent ?? 0}% ({course.completedLessonsCount ?? 0}/{course.totalLessonsCount ?? 0} completed)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${course.progressPercent ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Purchase simulation widget embedded directly in course header */}
        {course.isPremium && !course.isUnlocked && (
          <div className="w-full md:w-auto bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col items-center justify-center shrink-0 min-w-[200px]">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">Sandbox License</span>
            <span className="text-2xl font-black font-display text-slate-800 mb-3">${course.price}</span>
            
            {purchaseStatus === 'SUCCESS' ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 fill-emerald-50 text-emerald-600" />
                Access Unlocking...
              </span>
            ) : (
              <div className="flex flex-col w-full gap-2 text-center">
                {purchaseError && <span className="text-[10px] text-red-500 font-semibold">{purchaseError}</span>}
                <button
                  onClick={() => handleSimulateCheckout('SUCCESS')}
                  disabled={purchasing}
                  className="w-full bg-accent hover:bg-amber-500 text-slate-900 text-xs font-extrabold py-2 rounded-lg transition"
                >
                  {purchasing ? 'Processing...' : 'Unlock via Sandbox'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main Split Layout: Syllabus Tree vs PDF Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Modules & Lessons Tree Sidebar */}
        <section className="lg:col-span-4 bg-white border border-slate-100 rounded-xl shadow-premium p-5 space-y-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="font-display font-extrabold text-slate-800 text-sm">
              Syllabus Curriculum
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {course.totalLessonsCount ?? 0} Lessons
            </span>
          </div>

          <div className="space-y-6">
            {course.modules.sort((a,b) => a.orderIndex - b.orderIndex).map((mod) => (
              <div key={mod.id} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-50 border flex items-center justify-center font-bold text-[10px] text-slate-600">
                    M{mod.orderIndex}
                  </span>
                  {mod.title}
                </h3>

                <div className="space-y-1">
                  {mod.lessons.sort((a,b) => a.orderIndex - b.orderIndex).map((lesson) => {
                    const isSelected = activeLesson?.id === lesson.id;
                    const isLocked = lesson.filePath === null;
                    const isCompleted = !!lesson.isCompleted;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 group transition ${isSelected ? 'bg-primary-light border-primary/30 text-primary' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                          )}
                          <span className={`truncate ${isCompleted ? 'text-slate-900 font-bold' : ''}`}>{lesson.title}</span>
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCompleted && (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Done
                            </span>
                          )}
                          {isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Play className={`w-3 h-3 transition opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100 text-primary fill-primary' : 'text-slate-400'}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: Interactive PDF Container Viewer */}
        <section className="lg:col-span-8 bg-white border border-slate-100 rounded-xl shadow-premium p-6 min-h-[500px] flex flex-col justify-between">
          {activeLesson ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* PDF Container Header */}
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wide bg-primary-light px-2.5 py-1 rounded-full">
                    Syllabus Lesson {activeLesson.orderIndex}
                  </span>
                  
                  {activeLesson.filePath ? (
                    <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Interactive local view
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Premium locked
                    </span>
                  )}
                </div>

                <h3 className="font-display font-extrabold text-slate-800 text-lg leading-tight">
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-slate-600 leading-normal">
                  {activeLesson.summary || 'Summary placeholder text detailing vocabulary review.'}
                </p>
              </div>

              {/* Lesson Content Viewer */}
              <div className="flex-1 my-6 flex flex-col space-y-4">
                {activeLesson.filePath ? (() => {
                  const rawFp = activeLesson.filePath;
                  const cleanFp = rawFp.startsWith('/') ? rawFp.slice(1) : rawFp;
                  const publicUrl = cleanFp.startsWith('public/uploads/')
                    ? `/${cleanFp}`
                    : `/public/uploads/${cleanFp.replace(/^lessons\//, '')}`;

                  const fpLower = cleanFp.toLowerCase();
                  const isVideo = fpLower.endsWith('.mp4') || fpLower.endsWith('.webm') || fpLower.endsWith('.ogg');
                  const isPdf = fpLower.endsWith('.pdf');

                  return (
                    <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden flex flex-col shadow-inset">
                      {isVideo ? (
                        <video
                          controls
                          className="w-full max-h-[420px] bg-black rounded-t-xl"
                          src={publicUrl}
                          preload="metadata"
                        >
                          Your browser does not support the video element.
                        </video>
                      ) : isPdf ? (
                        <iframe
                          src={publicUrl}
                          className="w-full h-[480px] border-0"
                          title={activeLesson.title}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[200px]">
                          <FileText className="w-10 h-10 text-slate-400" />
                          <p className="text-xs text-slate-600">Preview not available for this file type.</p>
                          <a
                            href={publicUrl}
                            download
                            className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1"
                          >
                            Download File
                          </a>
                        </div>
                      )}

                      {/* Interactive Lesson Summary & Notes Deck */}
                      <div className="p-4 bg-white border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lesson Learning Objectives &amp; Study Notes</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {activeLesson.summary}
                        </p>
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-900 flex items-start gap-2">
                          <span className="font-bold shrink-0 text-indigo-700">Study Tip:</span>
                          <span>Read through the vocabulary and grammar rules above carefully, practice pronunciation aloud, and mark this lesson as completed to earn +20 XP toward your next level tier!</span>
                        </div>
                      </div>

                      {/* Completion button bar */}
                      <div className="px-4 py-3 border-t border-slate-200/40 flex justify-between items-center bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[50%]">{publicUrl}</span>
                        {lessonCompleted ? (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-[scaleIn_0.2s_ease-out]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Lesson Completed! +20 XP
                          </span>
                        ) : (
                          <button
                            onClick={handleCompleteLesson}
                            className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1"
                          >
                            Mark Completed! (+20 XP)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  // Locked Premium Warning Overlay Inside Viewer
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-8 text-center space-y-4 py-12">
                    <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center rounded-2xl mx-auto shadow-sm">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-extrabold text-slate-800 text-base">Premium Curriculum Lock</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Syllabus media documents and PDF files for premium courses are locked. Simulate a sandbox license checkout using the button above to unlock immediate access!
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <FileText className="w-12 h-12 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">No Lesson Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Select a modular syllabus lesson from the sidebar menu to view its content outline and read dynamic PDF text.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
