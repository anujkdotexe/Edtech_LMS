import { eq, and, sql, desc, count, sum, avg, inArray } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export class AdminRepository {
  // ─── Students ─────────────────────────────────────────────────────────────
  static async findStudentById(id: string) {
    const [student] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return student || null;
  }

  static async findUserByEmail(email: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user || null;
  }

  static async getStudentsWithDetails() {
    const students = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isSuspended: schema.users.isSuspended,
        createdAt: schema.users.createdAt,
        lastLoginAt: schema.users.lastLoginAt,
        totalXp: schema.userXp.totalXp,
        level: schema.userXp.level,
        currentStreak: schema.userStreaks.currentStreak,
      })
      .from(schema.users)
      .leftJoin(schema.userXp, eq(schema.users.id, schema.userXp.userId))
      .leftJoin(schema.userStreaks, eq(schema.users.id, schema.userStreaks.userId))
      .where(eq(schema.users.role, 'STUDENT'))
      .orderBy(desc(schema.users.createdAt));

    const orders = await db
      .select({
        userId: schema.orders.userId,
        courseId: schema.orders.courseId,
        courseTitle: schema.courseTranslations.title,
        status: schema.orders.status,
      })
      .from(schema.orders)
      .innerJoin(schema.courses, eq(schema.orders.courseId, schema.courses.id))
      .leftJoin(
        schema.courseTranslations,
        and(eq(schema.courses.id, schema.courseTranslations.courseId), eq(schema.courseTranslations.locale, 'en'))
      );

    return { students, orders };
  }

  static async createStudentTx(data: {
    name: string;
    email: string;
    passwordHash: string;
    courseId?: string;
    coursePrice?: number;
    adminUserId: string;
  }) {
    return db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(schema.users)
        .values({
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
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

      if (data.courseId) {
        await tx.insert(schema.orders).values({
          userId: newUser.id,
          courseId: data.courseId,
          amount: String(data.coursePrice || 0),
          status: 'SUCCESS',
          transactionId: `ADMIN_ONBOARD_${Date.now()}`,
        });
      }

      await tx.insert(schema.auditLogs).values({
        action: 'ADMIN_STUDENT_CREATED',
        details: `Admin created student ${newUser.email}${data.courseId ? ` and enrolled in course ${data.courseId}` : ''}`,
        userId: data.adminUserId,
      });

      return newUser;
    });
  }

  static async updateStudentSuspension(id: string, isSuspended: boolean, adminUserId: string) {
    const [updated] = await db
      .update(schema.users)
      .set({ isSuspended })
      .where(eq(schema.users.id, id))
      .returning();

    if (updated) {
      await db.insert(schema.auditLogs).values({
        action: isSuspended ? 'ADMIN_STUDENT_SUSPENDED' : 'ADMIN_STUDENT_ACTIVATED',
        details: `Admin ${isSuspended ? 'suspended' : 'unsuspended'} student ${id}`,
        userId: adminUserId,
      });
    }

    return updated;
  }

  static async updateStudentPassword(id: string, passwordHash: string, adminUserId: string) {
    await db
      .update(schema.users)
      .set({ passwordHash, forcePasswordReset: true })
      .where(eq(schema.users.id, id));

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_PASSWORD_RESET',
      details: `Admin reset password for student ${id}`,
      userId: adminUserId,
    });
  }

  static async deleteStudentTx(id: string, adminUserId: string) {
    return db.transaction(async (tx) => {
      await tx.delete(schema.orders).where(eq(schema.orders.userId, id));
      await tx.delete(schema.userXp).where(eq(schema.userXp.userId, id));
      await tx.delete(schema.userStreaks).where(eq(schema.userStreaks.userId, id));
      await tx.delete(schema.userBadges).where(eq(schema.userBadges.userId, id));
      await tx.delete(schema.quizAttempts).where(eq(schema.quizAttempts.userId, id));
      await tx.delete(schema.lessonCompletions).where(eq(schema.lessonCompletions.userId, id));
      await tx.delete(schema.dailyWarmupCompletions).where(eq(schema.dailyWarmupCompletions.userId, id));
      await tx.delete(schema.users).where(eq(schema.users.id, id));

      await tx.insert(schema.auditLogs).values({
        action: 'ADMIN_STUDENT_DELETED',
        details: `Admin hard deleted student ${id} and all cascaded data`,
        userId: adminUserId,
      });
    });
  }

  static async enrollStudent(userId: string, courseId: string, amount: string, adminUserId: string) {
    const existing = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), eq(schema.orders.courseId, courseId), eq(schema.orders.status, 'SUCCESS')))
      .limit(1);

    if (existing.length > 0) return { alreadyEnrolled: true };

    const [order] = await db
      .insert(schema.orders)
      .values({
        userId,
        courseId,
        amount,
        status: 'SUCCESS',
        transactionId: `ADMIN_MANUAL_${Date.now()}`,
      })
      .returning();

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_MANUAL_ENROLLMENT',
      details: `Admin manually enrolled student ${userId} into course ${courseId}`,
      userId: adminUserId,
    });

    return { order, alreadyEnrolled: false };
  }

  static async bulkEnrollStudents(studentIds: string[], courseId: string, coursePrice: string, adminUserId: string) {
    if (studentIds.length === 0) return 0;

    return db.transaction(async (tx) => {
      // Find all existing successful orders for these students in this course
      const existingOrders = await tx
        .select({ userId: schema.orders.userId })
        .from(schema.orders)
        .where(
          and(
            inArray(schema.orders.userId, studentIds),
            eq(schema.orders.courseId, courseId),
            eq(schema.orders.status, 'SUCCESS')
          )
        );

      const alreadyEnrolledUserIds = new Set(existingOrders.map((o) => o.userId));
      const toEnrollUserIds = studentIds.filter((id) => !alreadyEnrolledUserIds.has(id));

      if (toEnrollUserIds.length > 0) {
        const orderValues = toEnrollUserIds.map((userId) => ({
          userId,
          courseId,
          amount: coursePrice,
          status: 'SUCCESS' as const,
          transactionId: `ADMIN_BULK_${Date.now()}_${userId.slice(0, 4)}`,
        }));

        await tx.insert(schema.orders).values(orderValues);
      }

      await tx.insert(schema.auditLogs).values({
        action: 'ADMIN_BULK_ENROLLMENT',
        details: `Admin bulk enrolled ${toEnrollUserIds.length} students into course ${courseId}`,
        userId: adminUserId,
      });

      return toEnrollUserIds.length;
    });
  }

  static async revokeCourseAccess(studentId: string, courseId: string, adminUserId: string) {
    const updated = await db
      .update(schema.orders)
      .set({ status: 'REFUNDED' })
      .where(and(eq(schema.orders.userId, studentId), eq(schema.orders.courseId, courseId), eq(schema.orders.status, 'SUCCESS')))
      .returning();

    if (updated.length > 0) {
      await db.insert(schema.auditLogs).values({
        action: 'ADMIN_COURSE_ACCESS_REVOKED',
        details: `Admin revoked course ${courseId} access for student ${studentId}`,
        userId: adminUserId,
      });
    }

    return updated.length;
  }

  static async logAdminMessage(studentId: string, subject: string, adminUserId: string) {
    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_STUDENT_MESSAGE_SENT',
      details: `Admin sent message to student ${studentId}. Subject: "${subject}"`,
      userId: adminUserId,
    });
  }

  // ─── Payments ─────────────────────────────────────────────────────────────
  static async getPayments() {
    return db
      .select({
        id: schema.orders.id,
        amount: schema.orders.amount,
        status: schema.orders.status,
        transactionId: schema.orders.transactionId,
        createdAt: schema.orders.createdAt,
        studentName: schema.users.name,
        studentEmail: schema.users.email,
        courseTitle: schema.courseTranslations.title,
      })
      .from(schema.orders)
      .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .innerJoin(schema.courseTranslations, eq(schema.orders.courseId, schema.courseTranslations.courseId))
      .orderBy(desc(schema.orders.createdAt));
  }

  static async issueRefund(orderId: string, adminUserId: string) {
    const updated = await db
      .update(schema.orders)
      .set({ status: 'REFUNDED' })
      .where(eq(schema.orders.id, orderId))
      .returning();

    if (updated.length > 0) {
      await db.insert(schema.auditLogs).values({
        action: 'ADMIN_REFUND_ISSUED',
        details: `Admin issued refund for order ${orderId}`,
        userId: adminUserId,
      });
    }

    return updated;
  }

  // ─── Site Settings ────────────────────────────────────────────────────────
  static async getSiteConfig() {
    return db.select().from(schema.siteConfig);
  }

  static async upsertSiteConfigKey(key: string, value: string) {
    await db
      .insert(schema.siteConfig)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.siteConfig.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // ─── Analytics ────────────────────────────────────────────────────────────
  static async getDashboardAnalyticsData() {
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'STUDENT'));

    const [revenueResult] = await db
      .select({ totalRevenue: sum(schema.orders.amount), count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'SUCCESS'));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const signupsQuery = sql`
      SELECT DATE("created_at") as date, count(*)::int as count
      FROM "users"
      WHERE "created_at" >= ${sevenDaysAgo.toISOString()}
      GROUP BY DATE("created_at")
      ORDER BY DATE("created_at") ASC;
    `;
    const signupsResult = await db.execute(signupsQuery);

    const streakLeaders = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        streak: schema.userStreaks.currentStreak,
        totalXp: schema.userXp.totalXp,
      })
      .from(schema.users)
      .innerJoin(schema.userStreaks, eq(schema.users.id, schema.userStreaks.userId))
      .innerJoin(schema.userXp, eq(schema.users.id, schema.userXp.userId))
      .orderBy(desc(schema.userStreaks.currentStreak))
      .limit(5);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [quizStats] = await db
      .select({
        totalAttempts: count(),
        avgScore: avg(schema.quizAttempts.score),
      })
      .from(schema.quizAttempts);

    const [todayQuizStats] = await db
      .select({ todayCount: count() })
      .from(schema.quizAttempts)
      .where(sql`${schema.quizAttempts.attemptedAt} >= ${today.toISOString()}`);

    return {
      totalStudents: totalStudentsResult.count,
      totalRevenue: Number(revenueResult.totalRevenue || 0),
      signupsRows: signupsResult.rows,
      streakLeaders,
      quizCompletions: {
        total: quizStats.totalAttempts,
        today: todayQuizStats.todayCount,
        avgScore: Math.round(Number(quizStats.avgScore || 0)),
      },
    };
  }

  static async getCourseLessons(courseId: string) {
    return db
      .select({
        lessonId: schema.lessons.id,
        orderIndex: schema.lessons.orderIndex,
        moduleId: schema.lessons.moduleId,
      })
      .from(schema.lessons)
      .innerJoin(schema.modules, eq(schema.modules.id, schema.lessons.moduleId))
      .where(eq(schema.modules.courseId, courseId))
      .orderBy(schema.lessons.orderIndex);
  }

  static async getCourseSuccessOrdersCount(courseId: string) {
    const [enrolledResult] = await db
      .select({ enrolledCount: count() })
      .from(schema.orders)
      .where(and(eq(schema.orders.courseId, courseId), eq(schema.orders.status, 'SUCCESS')));

    return enrolledResult ? Number(enrolledResult.enrolledCount) : 0;
  }

  static async getLessonCompletionsPerLesson(lessonIds: string[]) {
    if (lessonIds.length === 0) return [];
    return db
      .select({
        lessonId: schema.lessonCompletions.lessonId,
        completionCount: count(),
      })
      .from(schema.lessonCompletions)
      .where(inArray(schema.lessonCompletions.lessonId, lessonIds))
      .groupBy(schema.lessonCompletions.lessonId);
  }

  // ─── Modules & Lessons ────────────────────────────────────────────────────
  static async createModule(courseId: string, title: string, orderIndex = 0, locale = 'en') {
    return db.transaction(async (tx) => {
      const [newMod] = await tx
        .insert(schema.modules)
        .values({ courseId, orderIndex })
        .returning();

      await tx.insert(schema.moduleTranslations).values({
        moduleId: newMod.id,
        locale,
        title: title || 'Untitled Module',
      });

      return newMod;
    });
  }

  static async updateModule(id: string, updates: { title?: string; orderIndex?: number; locale?: string }) {
    if (updates.orderIndex !== undefined) {
      await db.update(schema.modules).set({ orderIndex: updates.orderIndex }).where(eq(schema.modules.id, id));
    }
    if (updates.title) {
      const trans = await db.select().from(schema.moduleTranslations).where(eq(schema.moduleTranslations.moduleId, id));
      if (trans.length > 0) {
        await db.update(schema.moduleTranslations).set({ title: updates.title }).where(eq(schema.moduleTranslations.id, trans[0].id));
      } else {
        await db.insert(schema.moduleTranslations).values({
          moduleId: id,
          locale: updates.locale || 'en',
          title: updates.title,
        });
      }
    }
  }

  static async deleteModule(id: string) {
    await db.delete(schema.modules).where(eq(schema.modules.id, id));
  }

  static async createLesson(data: {
    moduleId: string;
    title: string;
    summary?: string;
    lessonType?: 'VIDEO' | 'AUDIO' | 'READING' | 'PDF';
    durationSeconds?: number;
    filePath?: string;
    orderIndex?: number;
    locale?: string;
  }) {
    return db.transaction(async (tx) => {
      const [newLesson] = await tx
        .insert(schema.lessons)
        .values({
          moduleId: data.moduleId,
          lessonType: data.lessonType || 'READING',
          durationSeconds: data.durationSeconds || 300,
          filePath: data.filePath || null,
          orderIndex: data.orderIndex || 0,
        })
        .returning();

      await tx.insert(schema.lessonTranslations).values({
        lessonId: newLesson.id,
        locale: data.locale || 'en',
        title: data.title || 'Untitled Lesson',
        summary: data.summary || '',
      });

      return newLesson;
    });
  }

  static async updateLesson(id: string, updates: {
    title?: string;
    summary?: string;
    lessonType?: 'VIDEO' | 'AUDIO' | 'READING' | 'PDF';
    durationSeconds?: number;
    filePath?: string;
    locale?: string;
  }) {
    const lessonUpdates: any = {};
    if (updates.lessonType) lessonUpdates.lessonType = updates.lessonType;
    if (updates.durationSeconds !== undefined) lessonUpdates.durationSeconds = updates.durationSeconds;
    if (updates.filePath !== undefined) lessonUpdates.filePath = updates.filePath;

    if (Object.keys(lessonUpdates).length > 0) {
      await db.update(schema.lessons).set(lessonUpdates).where(eq(schema.lessons.id, id));
    }

    if (updates.title !== undefined || updates.summary !== undefined) {
      const trans = await db.select().from(schema.lessonTranslations).where(eq(schema.lessonTranslations.lessonId, id));
      if (trans.length > 0) {
        const trUpdates: any = {};
        if (updates.title !== undefined) trUpdates.title = updates.title;
        if (updates.summary !== undefined) trUpdates.summary = updates.summary;
        await db.update(schema.lessonTranslations).set(trUpdates).where(eq(schema.lessonTranslations.id, trans[0].id));
      } else {
        await db.insert(schema.lessonTranslations).values({
          lessonId: id,
          locale: updates.locale || 'en',
          title: updates.title || 'Untitled Lesson',
          summary: updates.summary || '',
        });
      }
    }
  }

  static async deleteLesson(id: string) {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
  }

  static async updateLessonFilePath(lessonId: string, filePath: string) {
    await db.update(schema.lessons).set({ filePath }).where(eq(schema.lessons.id, lessonId));
  }

  static async reorderLessons(orderedLessonIds: string[]) {
    return db.transaction(async (tx) => {
      for (let i = 0; i < orderedLessonIds.length; i++) {
        await tx
          .update(schema.lessons)
          .set({ orderIndex: i })
          .where(eq(schema.lessons.id, orderedLessonIds[i]));
      }
    });
  }

  // ─── Quizzes & Questions ──────────────────────────────────────────────────
  static async getQuizWithQuestions(quizId: string, requestedLocale = 'en') {
    const quizRows = await db.select().from(schema.quizzes).where(eq(schema.quizzes.id, quizId)).limit(1);
    if (quizRows.length === 0) return null;
    const quiz = quizRows[0];

    const qTranslations = await db.select().from(schema.quizTranslations).where(eq(schema.quizTranslations.quizId, quizId));
    const trans =
      qTranslations.find((t) => t.locale === requestedLocale) ||
      qTranslations.find((t) => t.locale === 'en') ||
      qTranslations[0];

    const questions = await db.select().from(schema.quizQuestions).where(eq(schema.quizQuestions.quizId, quizId));
    const sortedQuestions = questions
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        orderIndex: q.orderIndex,
      }));

    return {
      id: quiz.id,
      difficulty: quiz.difficulty,
      pointValue: quiz.pointValue,
      title: trans ? trans.title : 'Untitled Quiz',
      rules: trans ? trans.rules || '' : '',
      questions: sortedQuestions,
    };
  }

  static async createQuiz(data: {
    title: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    pointValue?: number;
    locale?: string;
  }) {
    return db.transaction(async (tx) => {
      const [newQuiz] = await tx
        .insert(schema.quizzes)
        .values({
          difficulty: data.difficulty || 'EASY',
          pointValue: data.pointValue || 50,
        })
        .returning();

      await tx.insert(schema.quizTranslations).values({
        quizId: newQuiz.id,
        locale: data.locale || 'en',
        title: data.title || 'Untitled Quiz',
        rules: '',
      });

      return newQuiz;
    });
  }

  static async updateQuiz(id: string, updates: {
    title?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    pointValue?: number;
    locale?: string;
  }) {
    const quizUpdates: any = {};
    if (updates.difficulty) quizUpdates.difficulty = updates.difficulty;
    if (updates.pointValue !== undefined) quizUpdates.pointValue = updates.pointValue;

    if (Object.keys(quizUpdates).length > 0) {
      await db.update(schema.quizzes).set(quizUpdates).where(eq(schema.quizzes.id, id));
    }

    if (updates.title) {
      const trans = await db.select().from(schema.quizTranslations).where(eq(schema.quizTranslations.quizId, id));
      if (trans.length > 0) {
        await db.update(schema.quizTranslations).set({ title: updates.title }).where(eq(schema.quizTranslations.id, trans[0].id));
      } else {
        await db.insert(schema.quizTranslations).values({
          quizId: id,
          locale: updates.locale || 'en',
          title: updates.title,
          rules: '',
        });
      }
    }
  }

  static async deleteQuiz(id: string) {
    await db.delete(schema.quizzes).where(eq(schema.quizzes.id, id));
  }

  static async createQuestion(data: {
    quizId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    orderIndex?: number;
  }) {
    const [newQuestion] = await db
      .insert(schema.quizQuestions)
      .values({
        quizId: data.quizId,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        orderIndex: data.orderIndex || 0,
      })
      .returning();

    return newQuestion;
  }

  static async updateQuestion(id: string, updates: any) {
    await db.update(schema.quizQuestions).set(updates).where(eq(schema.quizQuestions.id, id));
  }

  static async deleteQuestion(id: string) {
    await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.id, id));
  }
}
