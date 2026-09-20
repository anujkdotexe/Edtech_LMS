'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  modules: Module[];
}

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    if (isAuthenticated) {
      loadCourseSyllabus();
    }
  }, [isAuthenticated, params.id]);

  const loadCourseSyllabus = async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await apiFetch<CourseDetails>(`/api/courses/${params.id}`);
      setCourse(details);
      
      // Auto-select first lesson if unlocked
      if (details.modules.length > 0 && details.modules[0].lessons.length > 0) {
        const firstLesson = details.modules[0].lessons[0];
        setActiveLesson(firstLesson);
      }
    } catch (err: any) {
      setError(err.message || 'Could not fetch course syllabus details');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setLessonCompleted(false);
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
          await loadCourseSyllabus();
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
    if (!activeLesson) return;
    try {
      await apiFetch<{ success: boolean; message: string; xpAwarded: number }>(
        `/api/lessons/${activeLesson.id}/complete`,
        { method: 'POST' }
      );
      setLessonCompleted(true);
      setXpAwarded(true);
      await fetchProfile();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  if (!isAuthenticated) return null;

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
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition group">
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${course.isUnlocked ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                {course.isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Premium Syllabus
              </span>
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-800 leading-tight">
            {course.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Purchase simulation widget embedded directly in course header */}
        {course.isPremium && !course.isUnlocked && (
          <div className="w-full md:w-auto bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col items-center justify-center shrink-0 min-w-[200px]">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Sandbox License</span>
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
          <h3 className="font-display font-extrabold text-slate-800 text-sm pb-2.5 border-b border-slate-100">
            Syllabus Curriculum Modules
          </h3>

          <div className="space-y-6">
            {course.modules.sort((a,b) => a.orderIndex - b.orderIndex).map((mod) => (
              <div key={mod.id} className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-50 border flex items-center justify-center font-bold text-[10px] text-slate-500">
                    M{mod.orderIndex}
                  </span>
                  {mod.title}
                </h4>

                <div className="space-y-1">
                  {mod.lessons.sort((a,b) => a.orderIndex - b.orderIndex).map((lesson) => {
                    const isSelected = activeLesson?.id === lesson.id;
                    const isLocked = lesson.filePath === null;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 group transition ${isSelected ? 'bg-primary-light border-primary/30 text-primary' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                          <span className="truncate">{lesson.title}</span>
                        </span>
                        
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <Play className={`w-3 h-3 transition shrink-0 opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100 text-primary fill-primary' : 'text-slate-400'}`} />
                        )}
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
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Interactive local view
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Premium locked
                    </span>
                  )}
                </div>

                <h3 className="font-display font-extrabold text-slate-800 text-lg leading-tight">
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  {activeLesson.summary || 'Summary placeholder text detailing vocabulary review.'}
                </p>
              </div>

              {/* Lesson Content Viewer */}
              <div className="flex-1 my-6 flex flex-col">
                {activeLesson.filePath ? (() => {
                  const fp = activeLesson.filePath.toLowerCase();
                  const isVideo = fp.endsWith('.mp4') || fp.endsWith('.webm') || fp.endsWith('.ogg');
                  const isPdf = fp.endsWith('.pdf');
                  // Normalise path: strip leading slash for public serving
                  const publicUrl = activeLesson.filePath.startsWith('/') 
                    ? activeLesson.filePath 
                    : `/${activeLesson.filePath}`;

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
                          <FileText className="w-10 h-10 text-slate-300" />
                          <p className="text-xs text-slate-500">Preview not available for this file type.</p>
                          <a
                            href={publicUrl}
                            download
                            className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1"
                          >
                            Download File
                          </a>
                        </div>
                      )}

                      {/* Completion button bar */}
                      <div className="px-4 py-3 border-t border-slate-200/40 flex justify-between items-center bg-white">
                        <span className="text-[10px] text-slate-400 font-medium font-mono truncate max-w-[60%]">{activeLesson.filePath}</span>
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
                    <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center rounded-2xl mx-auto shadow-sm">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h4 className="font-display font-extrabold text-slate-800 text-base">Premium Curriculum Lock</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
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
