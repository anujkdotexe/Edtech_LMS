import { eq, and, inArray, sql } from 'drizzle-orm';
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
      // 1. Atomic idempotent insert with conflict handling
      const inserted = await tx
        .insert(schema.lessonCompletions)
        .values({
          userId,
          lessonId,
          completedAt: new Date(),
        })
        .onConflictDoNothing({
          target: [schema.lessonCompletions.userId, schema.lessonCompletions.lessonId],
        })
        .returning();

      if (inserted.length === 0) {
        return { alreadyCompleted: true };
      }

      // 2. Atomic XP increment
      const xpUpsert = await tx
        .insert(schema.userXp)
        .values({
          userId,
          totalXp: 15,
          level: 1,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.userXp.userId,
          set: {
            totalXp: sql`${schema.userXp.totalXp} + 15`,
            updatedAt: new Date(),
          },
        })
        .returning();

      const newTotalXp = xpUpsert[0].totalXp;
      const oldXp = newTotalXp - 15;
      const { level: newLevel } = calculateLevelStats(newTotalXp);
      const { didLevelUp } = didUserLevelUp(oldXp, newTotalXp);

      if (xpUpsert[0].level !== newLevel) {
        await tx
          .update(schema.userXp)
          .set({ level: newLevel })
          .where(eq(schema.userXp.userId, userId));
      }

      // 3. Update streak
      const streakResult = await updateStreakInTx(tx, userId);

      // 4. Check badges
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
