export interface StudentFilters {
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  courseId?: string;
}

export interface CreateStudentDto {
  name: string;
  email: string;
  password?: string;
  courseId?: string;
}

export interface BulkEnrollDto {
  studentIds?: string[];
  userIds?: string[];
  courseId: string;
}

export interface RevokeCourseDto {
  studentId?: string;
  userId?: string;
  courseId: string;
}

export interface SendMessageDto {
  studentId?: string;
  userId?: string;
  subject: string;
  message: string;
}

export interface SiteSettings {
  activeBanner: string;
  bannerEnabled: boolean;
  maintenanceMode: boolean;
  dailyTip: string;
}

export interface UpdateSiteSettingsDto {
  activeBanner?: string;
  bannerEnabled?: boolean;
  maintenanceMode?: boolean;
  dailyTip?: string;
}

export interface CreateModuleDto {
  courseId: string;
  title: string;
  orderIndex?: number;
  locale?: string;
}

export interface UpdateModuleDto {
  title?: string;
  orderIndex?: number;
  locale?: string;
}

export interface CreateLessonDto {
  moduleId: string;
  title: string;
  summary?: string;
  lessonType?: 'VIDEO' | 'AUDIO' | 'READING' | 'PDF';
  durationSeconds?: number;
  filePath?: string;
  orderIndex?: number;
  locale?: string;
}

export interface UpdateLessonDto {
  title?: string;
  summary?: string;
  lessonType?: 'VIDEO' | 'AUDIO' | 'READING' | 'PDF';
  durationSeconds?: number;
  filePath?: string;
  locale?: string;
}

export interface CreateQuizDto {
  title: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue?: number;
  locale?: string;
}

export interface UpdateQuizDto {
  title?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue?: number;
  locale?: string;
}

export interface CreateQuestionDto {
  quizId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  orderIndex?: number;
}

export interface UpdateQuestionDto {
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  orderIndex?: number;
}
