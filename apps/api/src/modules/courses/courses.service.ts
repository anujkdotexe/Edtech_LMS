import { CoursesRepository } from './courses.repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { CourseCatalogItem, CourseDetail, LessonItem, ModuleItem } from './courses.types';

export class CoursesService {
  static async getAllCourses(
    requestedLocale = 'en',
    currentUser: { userId: string; role: string } | null = null
  ): Promise<CourseCatalogItem[]> {
    const allCourses = await CoursesRepository.findAllCourses();
    const translations = await CoursesRepository.findCourseTranslations();

    let userOrders: any[] = [];
    if (currentUser) {
      userOrders = await CoursesRepository.findUserSuccessfulOrders(currentUser.userId);
    }

    const isAdminOrDev = currentUser !== null && ['ADMIN', 'DEVELOPER'].includes(currentUser.role);
    const visibleCourses = isAdminOrDev ? allCourses : allCourses.filter((c) => c.isPublished);

    return visibleCourses.map((course) => {
      let trans = translations.find((t) => t.courseId === course.id && t.locale === requestedLocale);
      if (!trans) {
        trans = translations.find((t) => t.courseId === course.id && t.locale === 'en');
      }

      const hasPurchased = userOrders.some((o) => o.courseId === course.id);
      const isUnlocked =
        !course.isPremium ||
        hasPurchased ||
        isAdminOrDev;

      return {
        id: course.id,
        cefrLevel: course.cefrLevel,
        price: Number(course.price),
        isPremium: course.isPremium,
        isPublished: course.isPublished,
        isUnlocked,
        title: trans ? trans.title : 'Untitled Course',
        description: trans ? trans.description : '',
      };
    });
  }

  static async getCourseById(
    courseId: string,
    requestedLocale = 'en',
    currentUser: { userId: string; role: string } | null = null
  ): Promise<CourseDetail> {
    const course = await CoursesRepository.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const cTranslations = await CoursesRepository.findCourseTranslationsById(courseId);
    const courseTrans =
      cTranslations.find((t) => t.locale === requestedLocale) ||
      cTranslations.find((t) => t.locale === 'en');

    let isUnlocked = false;
    if (!course.isPremium) {
      isUnlocked = true;
    } else if (currentUser) {
      if (['ADMIN', 'DEVELOPER'].includes(currentUser.role)) {
        isUnlocked = true;
      } else {
        const orders = await db
          .select()
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.userId, currentUser.userId),
              eq(schema.orders.courseId, courseId),
              eq(schema.orders.status, 'SUCCESS')
            )
          )
          .limit(1);
        isUnlocked = orders.length > 0;
      }
    }

    const courseModules = await CoursesRepository.findModulesByCourseId(courseId);
    const moduleIds = courseModules.map((m) => m.id);

    const mTranslations = await CoursesRepository.findModuleTranslations(moduleIds);
    const allLessons = await CoursesRepository.findLessonsByModuleIds(moduleIds);
    const lessonIds = allLessons.map((l) => l.id);
    const lTranslations = await CoursesRepository.findLessonTranslations(lessonIds);

    let completedLessonSet = new Set<string>();
    if (currentUser && lessonIds.length > 0) {
      const userCompletions = await CoursesRepository.findUserLessonCompletions(
        currentUser.userId,
        lessonIds
      );
      completedLessonSet = new Set(userCompletions.map((c) => c.lessonId));
    }

    let totalLessonsCount = 0;
    let completedLessonsCount = 0;

    const syllabusModules: ModuleItem[] = courseModules
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((mod) => {
        const mTrans =
          mTranslations.find((t) => t.moduleId === mod.id && t.locale === requestedLocale) ||
          mTranslations.find((t) => t.moduleId === mod.id && t.locale === 'en');

        const moduleLessons: LessonItem[] = allLessons
          .filter((les) => les.moduleId === mod.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((les) => {
            totalLessonsCount++;
            const isCompleted = completedLessonSet.has(les.id);
            if (isCompleted) completedLessonsCount++;

            const lTrans =
              lTranslations.find((t) => t.lessonId === les.id && t.locale === requestedLocale) ||
              lTranslations.find((t) => t.lessonId === les.id && t.locale === 'en');

            const hasAccess = isUnlocked || les.isFreePreview;

            return {
              id: les.id,
              orderIndex: les.orderIndex,
              title: lTrans ? lTrans.title : 'Untitled Lesson',
              summary: lTrans?.summary || '',
              filePath: hasAccess ? les.filePath : null,
              lessonType: les.lessonType,
              durationSeconds: les.durationSeconds,
              isFreePreview: les.isFreePreview,
              isCompleted,
            };
          });

        return {
          id: mod.id,
          orderIndex: mod.orderIndex,
          title: mTrans ? mTrans.title : 'Untitled Module',
          lessons: moduleLessons,
        };
      });

    const progressPercent =
      totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    return {
      id: course.id,
      cefrLevel: course.cefrLevel,
      price: Number(course.price),
      isPremium: course.isPremium,
      isPublished: course.isPublished,
      isUnlocked,
      title: courseTrans ? courseTrans.title : 'Untitled Course',
      description: courseTrans ? courseTrans.description : '',
      modules: syllabusModules,
      progressPercent,
    };
  }

  static async completeLesson(
    lessonId: string,
    user: { userId: string; role: string; impersonatedBy?: string }
  ) {
    const lesson = await CoursesRepository.findLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    // Verify course entitlement server-side
    const isAdminOrDev = ['ADMIN', 'DEVELOPER'].includes(user.role);
    if (!lesson.isFreePreview && !isAdminOrDev) {
      const [module] = await db
        .select()
        .from(schema.modules)
        .where(eq(schema.modules.id, lesson.moduleId))
        .limit(1);

      if (!module) {
        throw new NotFoundError('Course module not found');
      }

      const course = await CoursesRepository.findCourseById(module.courseId);
      if (course && course.isPremium) {
        const orders = await db
          .select()
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.userId, user.userId),
              eq(schema.orders.courseId, course.id),
              eq(schema.orders.status, 'SUCCESS')
            )
          )
          .limit(1);

        if (orders.length === 0) {
          throw new ForbiddenError('You do not have access to this course');
        }
      }
    }

    const result = await CoursesRepository.completeLessonInTx(user.userId, lessonId);
    if (result.alreadyCompleted) {
      return {
        success: true,
        completed: true,
        alreadyCompleted: true,
        xpEarned: 0,
        message: 'Lesson already completed',
      };
    }

    return {
      success: true,
      completed: true,
      alreadyCompleted: false,
      xpEarned: result.xpEarned,
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      didLevelUp: result.didLevelUp,
      newLevel: result.newLevel,
      newBadges: result.newBadges,
    };
  }

  static async purchaseCourse(
    courseId: string,
    user: { userId: string; role: string; impersonatedBy?: string },
    simulatedStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS',
    ip?: string
  ) {
    const course = await CoursesRepository.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (!course.isPremium) {
      throw new ValidationError('This course is free and unlocked for all students');
    }

    const existingOrders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.userId, user.userId),
          eq(schema.orders.courseId, courseId),
          eq(schema.orders.status, 'SUCCESS')
        )
      )
      .limit(1);

    if (existingOrders.length > 0) {
      throw new ValidationError('You have already purchased this course');
    }

    const orderStatus = simulatedStatus === 'FAILED' ? 'FAILED' : 'SUCCESS';
    const transactionId = 'mock_tx_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const newOrder = await CoursesRepository.createOrder({
      userId: user.userId,
      courseId,
      status: orderStatus,
      transactionId,
      amount: course.price,
    });

    await db.insert(schema.auditLogs).values({
      userId: user.userId,
      impersonatedBy: user.impersonatedBy,
      action: 'COURSE_PURCHASE_SIMULATION',
      details: `Simulated checkout completed with status ${orderStatus} for course ID ${courseId}. Transaction: ${transactionId}`,
      ipAddress: ip,
    });

    return {
      success: orderStatus === 'SUCCESS',
      orderId: newOrder.id,
      status: orderStatus,
      message:
        orderStatus === 'SUCCESS' ? 'Course successfully unlocked' : 'Simulated payment failed',
    };
  }
}
