export interface CourseCatalogItem {
  id: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isPublished: boolean;
  isUnlocked: boolean;
  title: string;
  description: string;
}

export interface LessonItem {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  filePath: string | null;
  lessonType: string;
  durationSeconds: number;
  isFreePreview: boolean;
  isCompleted?: boolean;
}

export interface ModuleItem {
  id: string;
  orderIndex: number;
  title: string;
  lessons: LessonItem[];
}

export interface CourseDetail extends CourseCatalogItem {
  modules: ModuleItem[];
  progressPercent?: number;
}
