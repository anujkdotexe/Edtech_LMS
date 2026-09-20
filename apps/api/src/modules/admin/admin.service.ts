import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import bcrypt from 'bcrypt';
import { serverEnv } from '../../config';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AdminRepository } from './admin.repository';
import {
  StudentFilters,
  CreateStudentDto,
  BulkEnrollDto,
  RevokeCourseDto,
  SendMessageDto,
  UpdateSiteSettingsDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from './admin.types';

const SITE_SETTINGS_DEFAULTS: Record<string, string> = {
  activeBanner: 'Welcome to our platform! New language courses are available.',
  bannerEnabled: 'true',
  maintenanceMode: 'false',
  dailyTip: 'Practice for 15 minutes a day to maintain your streak!',
};

export class AdminService {
  // ─── Students ─────────────────────────────────────────────────────────────
  static async listStudents(filters: StudentFilters) {
    const { students, orders } = await AdminRepository.getStudentsWithDetails();

    const result = students.map((s) => {
      const studentOrders = orders.filter((o) => o.userId === s.id && o.status === 'SUCCESS');
      const enrolledCourseTitles = studentOrders.map((o) => o.courseTitle || 'Untitled Course');
      const enrolledCourseIds = studentOrders.map((o) => o.courseId);

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        isActive: !s.isSuspended,
        isSuspended: s.isSuspended,
        createdAt: s.createdAt,
        lastLoginAt: s.lastLoginAt,
        totalXp: s.totalXp ?? 0,
        level: s.level ?? 1,
        currentStreak: s.currentStreak ?? 0,
        enrolledCourses: enrolledCourseTitles,
        enrolledCourseIds,
      };
    });

    return result.filter((student) => {
      let matches = true;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        matches =
          matches &&
          (student.name.toLowerCase().includes(q) || student.email.toLowerCase().includes(q));
      }
      if (filters.status) {
        matches = matches && (filters.status === 'ACTIVE' ? student.isActive : !student.isActive);
      }
      if (filters.courseId) {
        matches = matches && student.enrolledCourseIds.includes(filters.courseId);
      }
      return matches;
    });
  }

  static async addStudent(dto: CreateStudentDto, adminUserId: string) {
    const existing = await AdminRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const tempPassword = dto.password || crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let coursePrice = 0;
    if (dto.courseId) {
      const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, dto.courseId)).limit(1);
      if (course) {
        coursePrice = Number(course.price || 0);
      }
    }

    const newUser = await AdminRepository.createStudentTx({
      name: dto.name,
      email: dto.email,
      passwordHash,
      courseId: dto.courseId,
      coursePrice,
      adminUserId,
    });

    console.log(`\n=== [INFO] STUDENT ONBOARDED ===\nEmail: ${dto.email}\nTemp Password: ${tempPassword}\n================================\n`);

    return {
      student: { id: newUser.id, name: newUser.name, email: newUser.email },
      tempPassword,
    };
  }

  static async bulkEnroll(dto: BulkEnrollDto, adminUserId: string) {
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, dto.courseId)).limit(1);
    if (!course) {
      throw new Error('COURSE_NOT_FOUND');
    }

    const coursePrice = String(course.price || 0);
    const count = await AdminRepository.bulkEnrollStudents(dto.studentIds, dto.courseId, coursePrice, adminUserId);
    return { count };
  }

  static async revokeCourse(dto: RevokeCourseDto, adminUserId: string) {
    const count = await AdminRepository.revokeCourseAccess(dto.studentId, dto.courseId, adminUserId);
    return { count };
  }

  static async sendMessage(dto: SendMessageDto, adminUserId: string) {
    const student = await AdminRepository.findStudentById(dto.studentId);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND');
    }

    await AdminRepository.logAdminMessage(dto.studentId, dto.subject, adminUserId);
    return { success: true };
  }

  static async exportStudentsCsv() {
    const { students, orders } = await AdminRepository.getStudentsWithDetails();

    let csvContent = 'ID,Name,Email,Status,Level,Total XP,Current Streak,Enrolled Courses,Created At\n';
    for (const student of students) {
      const studentOrders = orders.filter((o) => o.userId === student.id && o.status === 'SUCCESS');
      const courses = studentOrders.map((o) => o.courseTitle || 'Untitled').join('; ');

      const escapedName = `"${student.name.replace(/"/g, '""')}"`;
      const escapedEmail = `"${student.email.replace(/"/g, '""')}"`;
      const escapedCourses = `"${courses.replace(/"/g, '""')}"`;
      const status = !student.isSuspended ? 'ACTIVE' : 'SUSPENDED';

      csvContent += `${student.id},${escapedName},${escapedEmail},${status},${student.level ?? 1},${student.totalXp ?? 0},${student.currentStreak ?? 0},${escapedCourses},${student.createdAt.toISOString()}\n`;
    }

    return csvContent;
  }

  static async suspendStudent(id: string, adminUserId: string) {
    const student = await AdminRepository.findStudentById(id);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND');
    }

    const newSuspendedState = !student.isSuspended;
    await AdminRepository.updateStudentSuspension(id, newSuspendedState, adminUserId);
    return { isSuspended: newSuspendedState, isActive: !newSuspendedState };
  }

  static async resetStudentPassword(id: string, adminUserId: string) {
    const student = await AdminRepository.findStudentById(id);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND');
    }

    const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await AdminRepository.updateStudentPassword(id, passwordHash, adminUserId);

    console.log(`\n=== [INFO] STUDENT PASSWORD RESET ===\nStudent ID: ${id}\nTemp Password: ${tempPassword}\n=====================================\n`);

    return { tempPassword };
  }

  static async deleteStudent(id: string, adminUserId: string) {
    const student = await AdminRepository.findStudentById(id);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND');
    }

    await AdminRepository.deleteStudentTx(id, adminUserId);
    return { success: true };
  }

  static async enrollStudent(studentId: string, courseId: string, adminUserId: string) {
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
    if (!course) {
      throw new Error('COURSE_NOT_FOUND');
    }

    const result = await AdminRepository.enrollStudent(studentId, courseId, String(course.price || 0), adminUserId);
    return result;
  }

  static async importStudents(
    studentsList: Array<{ name: string; email: string }>,
    adminUserId: string,
    impersonatedBy?: string,
    clientIp?: string
  ) {
    let importedCount = 0;
    const printedCredentials: Array<{ email: string; tempPass: string }> = [];

    for (const student of studentsList) {
      const existing = await AdminRepository.findUserByEmail(student.email);
      if (existing) continue;

      const tempPass = 'temp_' + Math.random().toString(36).substring(2, 8);
      const passwordHash = await bcrypt.hash(tempPass, 10);

      await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.users)
          .values({
            name: student.name,
            email: student.email,
            passwordHash,
            role: 'STUDENT',
            forcePasswordReset: true,
          })
          .returning();

        await tx.insert(schema.userXp).values({
          userId: newUser.id,
          totalXp: 0,
          level: 1,
        });

        await tx.insert(schema.userStreaks).values({
          userId: newUser.id,
          currentStreak: 0,
          longestStreak: 0,
        });
      });

      printedCredentials.push({ email: student.email, tempPass });
      importedCount++;
    }

    await db.insert(schema.auditLogs).values({
      userId: adminUserId,
      impersonatedBy,
      action: 'ADMIN_STUDENTS_IMPORT',
      details: `Onboarded ${importedCount} students via bulk manager.`,
      ipAddress: clientIp,
    });

    console.log('[INFO] --- BULK ONBOARDING CREDENTIALS LOG ---');
    printedCredentials.forEach((c) => {
      console.log(`[INFO] User: ${c.email} | Temporary Password: ${c.tempPass}`);
    });
    console.log('[INFO] ----------------------------------------');

    return { importedCount };
  }

  // ─── Payments ─────────────────────────────────────────────────────────────
  static async getPayments() {
    const allOrders = await AdminRepository.getPayments();
    // Deduplicate translations
    return allOrders.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }

  static async issueRefund(orderId: string, adminUserId: string) {
    const updated = await AdminRepository.issueRefund(orderId, adminUserId);
    if (updated.length === 0) {
      throw new Error('ORDER_NOT_FOUND');
    }
    return { success: true };
  }

  static async exportPaymentsCsv() {
    const uniqueOrders = await this.getPayments();

    let csvContent = 'Order ID,Student Name,Student Email,Course,Amount,Status,Transaction ID,Date\n';
    for (const order of uniqueOrders) {
      const escapedName = `"${order.studentName.replace(/"/g, '""')}"`;
      const escapedEmail = `"${order.studentEmail.replace(/"/g, '""')}"`;
      const escapedTitle = `"${order.courseTitle.replace(/"/g, '""')}"`;
      const escapedTx = order.transactionId ? `"${order.transactionId.replace(/"/g, '""')}"` : '';
      csvContent += `${order.id},${escapedName},${escapedEmail},${escapedTitle},${order.amount},${order.status},${escapedTx},${order.createdAt.toISOString()}\n`;
    }

    return csvContent;
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  static async getSettings() {
    const rows = await AdminRepository.getSiteConfig();
    const dbMap: Record<string, string> = {};
    for (const row of rows) {
      dbMap[row.key] = row.value;
    }

    for (const [key, value] of Object.entries(SITE_SETTINGS_DEFAULTS)) {
      if (!(key in dbMap)) {
        await AdminRepository.upsertSiteConfigKey(key, value);
        dbMap[key] = value;
      }
    }

    return {
      activeBanner: dbMap['activeBanner'] ?? SITE_SETTINGS_DEFAULTS.activeBanner,
      bannerEnabled: dbMap['bannerEnabled'] === 'true',
      maintenanceMode: dbMap['maintenanceMode'] === 'true',
      dailyTip: dbMap['dailyTip'] ?? SITE_SETTINGS_DEFAULTS.dailyTip,
    };
  }

  static async updateSettings(updates: UpdateSiteSettingsDto) {
    const entries: Record<string, string> = {};
    if (updates.activeBanner !== undefined) entries['activeBanner'] = updates.activeBanner;
    if (updates.bannerEnabled !== undefined) entries['bannerEnabled'] = String(updates.bannerEnabled);
    if (updates.maintenanceMode !== undefined) entries['maintenanceMode'] = String(updates.maintenanceMode);
    if (updates.dailyTip !== undefined) entries['dailyTip'] = updates.dailyTip;

    for (const [key, value] of Object.entries(entries)) {
      await AdminRepository.upsertSiteConfigKey(key, value);
    }

    return this.getSettings();
  }

  // ─── Analytics ────────────────────────────────────────────────────
  static async getDashboardAnalytics() {
    const data = await AdminRepository.getDashboardAnalyticsData();

    const defaultSignups: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = data.signupsRows.find((r: any) => {
        const rowDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
        return rowDate === dateStr;
      });
      defaultSignups.push({
        date: dateStr,
        count: match ? Number((match as any).count) : 0,
      });
    }

    return {
      totalStudents: data.totalStudents,
      totalRevenue: data.totalRevenue,
      weeklySignups: defaultSignups,
      streakLeaders: data.streakLeaders,
      quizCompletions: data.quizCompletions,
    };
  }

  static async getCourseAnalytics(courseId: string) {
    const lessons = await AdminRepository.getCourseLessons(courseId);
    const enrolledCount = await AdminRepository.getCourseSuccessOrdersCount(courseId);

    const lessonIds = lessons.map((l) => l.lessonId);
    let completionMap = new Map<string, number>();

    if (lessonIds.length > 0) {
      const completionsPerLesson = await AdminRepository.getLessonCompletionsPerLesson(lessonIds);
      completionMap = new Map(
        completionsPerLesson.map((c) => [c.lessonId, Number(c.completionCount)])
      );
    }

    let prevRate = 100;
    const dropoffAnalysis = lessons.map((lesson, idx) => {
      const completionCount = completionMap.get(lesson.lessonId) || 0;
      const baseCount = Math.max(enrolledCount, completionCount, 1);
      const completionRate = Math.min(100, Math.round((completionCount / baseCount) * 100));
      const dropoffRate = idx === 0 ? 0 : Math.max(0, prevRate - completionRate);
      prevRate = completionRate;

      return {
        lessonId: lesson.lessonId,
        orderIndex: lesson.orderIndex,
        completionCount,
        completionRate,
        dropoffRate,
      };
    });

    return {
      courseId,
      totalEnrolled: enrolledCount,
      totalLessons: lessons.length,
      dropoffAnalysis,
    };
  }

  // ─── Content ──────────────────────────────────────────────────────────────
  static async createModule(dto: CreateModuleDto) {
    return AdminRepository.createModule(dto.courseId, dto.title, dto.orderIndex, dto.locale);
  }

  static async updateModule(id: string, dto: UpdateModuleDto) {
    await AdminRepository.updateModule(id, dto);
    return { success: true };
  }

  static async deleteModule(id: string) {
    await AdminRepository.deleteModule(id);
    return { success: true };
  }

  static async createLesson(dto: CreateLessonDto) {
    return AdminRepository.createLesson(dto);
  }

  static async updateLesson(id: string, dto: UpdateLessonDto) {
    await AdminRepository.updateLesson(id, dto);
    return { success: true };
  }

  static async deleteLesson(id: string) {
    await AdminRepository.deleteLesson(id);
    return { success: true };
  }

  static async uploadLessonFile(id: string, fileData: any) {
    const lessonCheck = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
    if (lessonCheck.length === 0) {
      throw new Error('LESSON_NOT_FOUND');
    }

    const ext = path.extname(fileData.filename) || '.pdf';
    const uniqueName = `${id}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const absoluteUploadDir = path.resolve(process.cwd(), serverEnv.UPLOAD_DIR);
    if (!fs.existsSync(absoluteUploadDir)) {
      fs.mkdirSync(absoluteUploadDir, { recursive: true });
    }
    const savePath = path.join(absoluteUploadDir, uniqueName);

    await pipeline(fileData.file, fs.createWriteStream(savePath));

    const publicUrl = `/public/uploads/${uniqueName}`;
    await AdminRepository.updateLessonFilePath(id, publicUrl);

    return { filePath: publicUrl };
  }

  static async reorderLessons(moduleId: string, orderedLessonIds: string[]) {
    const [moduleCheck] = await db.select().from(schema.modules).where(eq(schema.modules.id, moduleId)).limit(1);
    if (!moduleCheck) {
      throw new Error('MODULE_NOT_FOUND');
    }

    await AdminRepository.reorderLessons(orderedLessonIds);
    return { count: orderedLessonIds.length };
  }

  // ─── Quizzes ──────────────────────────────────────────────────────────────
  static async createQuiz(dto: CreateQuizDto) {
    return AdminRepository.createQuiz(dto);
  }

  static async updateQuiz(id: string, dto: UpdateQuizDto) {
    await AdminRepository.updateQuiz(id, dto);
    return { success: true };
  }

  static async deleteQuiz(id: string) {
    await AdminRepository.deleteQuiz(id);
    return { success: true };
  }

  static async createQuestion(dto: CreateQuestionDto) {
    return AdminRepository.createQuestion(dto);
  }

  static async updateQuestion(id: string, dto: UpdateQuestionDto) {
    await AdminRepository.updateQuestion(id, dto);
    return { success: true };
  }

  static async deleteQuestion(id: string) {
    await AdminRepository.deleteQuestion(id);
    return { success: true };
  }
}
