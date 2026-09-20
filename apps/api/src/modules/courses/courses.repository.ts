import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { updateStreakInTx } from '../../utils/streaks';
import { calculateLevelStats, didUserLevelUp } from '../../utils/xp';
import { checkAndAwardBadges } from '../../utils/badges';

export class CoursesRepository {
  static async findAllCourses() {
    return await db.select().from(schema.courses);
  }

  static async findCourseTranslations(locales: string[] = ['en']) {
    return await db.select().from(schema.courseTranslations);
  }

  static async findUserSuccessfulOrders(userId: string) {
    return await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'SUCCESS')));
  }

  static async findCourseById(id: string) {
    const rows = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findCourseTranslationsById(courseId: string) {
    return await db
      .select()
      .from(schema.courseTranslations)
      .where(eq(schema.courseTranslations.courseId, courseId));
  }

  static async findModulesByCourseId(courseId: string) {
    return await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.courseId, courseId));
  }

  static async findModuleTranslations(moduleIds: string[]) {
    if (moduleIds.length === 0) return [];
    return await db
      .select()
      .from(schema.moduleTranslations)
      .where(inArray(schema.moduleTranslations.moduleId, moduleIds));
  }

  static async findLessonsByModuleIds(moduleIds: string[]) {
    if (moduleIds.length === 0) return [];
    return await db
      .select()
      .from(schema.lessons)
      .where(inArray(schema.lessons.moduleId, moduleIds));
  }

  static async findLessonTranslations(lessonIds: string[]) {
    if (lessonIds.length === 0) return [];
    return await db
      .select()
      .from(schema.lessonTranslations)
      .where(inArray(schema.lessonTranslations.lessonId, lessonIds));
  }

  static async findUserLessonCompletions(userId: string, lessonIds: string[]) {
    if (lessonIds.length === 0) return [];
    return await db
      .select({ lessonId: schema.lessonCompletions.lessonId })
      .from(schema.lessonCompletions)
      .where(
        and(
          eq(schema.lessonCompletions.userId, userId),
          inArray(schema.lessonCompletions.lessonId, lessonIds)
        )
      );
  }

  static async findLessonById(lessonId: string) {
    const rows = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).limit(1);
    return rows[0] || null;
  }

  static async createOrder(data: {
    userId: string;
    courseId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    transactionId: string;
    amount: string;
  }) {
    const [order] = await db.insert(schema.orders).values(data).returning();
    return order;
  }

  static async completeLessonInTx(userId: string, lessonId: string) {
    return await db.transaction(async (tx) => {
      // 1. Check if already completed
      const existing = await tx
        .select()
        .from(schema.lessonCompletions)
        .where(
          and(
            eq(schema.lessonCompletions.userId, userId),
            eq(schema.lessonCompletions.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { alreadyCompleted: true };
      }

      // 2. Insert completion
      await tx.insert(schema.lessonCompletions).values({
        userId,
        lessonId,
        completedAt: new Date(),
      });

      // 3. Award XP (+15 XP)
      const currentXpRows = await tx
        .select()
        .from(schema.userXp)
        .where(eq(schema.userXp.userId, userId))
        .limit(1);

      const oldXp = currentXpRows.length > 0 ? currentXpRows[0].totalXp : 0;
      const newTotalXp = oldXp + 15;
      const { level: newLevel } = calculateLevelStats(newTotalXp);
      const { didLevelUp } = didUserLevelUp(oldXp, newTotalXp);

      if (currentXpRows.length > 0) {
        await tx
          .update(schema.userXp)
          .set({ totalXp: newTotalXp, level: newLevel, updatedAt: new Date() })
          .where(eq(schema.userXp.userId, userId));
      } else {
        await tx.insert(schema.userXp).values({
          userId,
          totalXp: newTotalXp,
          level: newLevel,
        });
      }

      // 4. Update streak
      const streakResult = await updateStreakInTx(tx, userId);

      // 5. Check badges
      const newBadges = await checkAndAwardBadges(tx, userId, {
        streak: streakResult.currentStreak,
        newLevel,
        action: 'warmup_or_first_lesson',
      });

      return {
        alreadyCompleted: false,
        xpEarned: 15,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        didLevelUp,
        newLevel,
        newBadges,
      };
    });
  }
}
