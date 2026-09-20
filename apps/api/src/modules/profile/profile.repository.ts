import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { updateStreakInTx } from '../../utils/streaks';
import { calculateLevelStats, didUserLevelUp } from '../../utils/xp';
import { checkAndAwardBadges, AVAILABLE_BADGES } from '../../utils/badges';

export class ProfileRepository {
  static async findUserById(userId: string) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    return rows[0] || null;
  }

  static async findUserXp(userId: string) {
    const rows = await db.select().from(schema.userXp).where(eq(schema.userXp.userId, userId)).limit(1);
    return rows[0] || null;
  }

  static async findUserStreaks(userId: string) {
    const rows = await db.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, userId)).limit(1);
    return rows[0] || null;
  }

  static async findUserBadges(userId: string) {
    return await db.select().from(schema.userBadges).where(eq(schema.userBadges.userId, userId));
  }

  static async findUserPurchases(userId: string, locale = 'en') {
    const orders = await db
      .select({
        id: schema.orders.id,
        courseId: schema.orders.courseId,
        amount: schema.orders.amount,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'SUCCESS')))
      .orderBy(desc(schema.orders.createdAt));

    if (orders.length === 0) return [];

    const courseIds = [...new Set(orders.map((o) => o.courseId))];
    const translations = await db
      .select()
      .from(schema.courseTranslations)
      .where(inArray(schema.courseTranslations.courseId, courseIds));

    return orders.map((order) => {
      const trans =
        translations.find((t) => t.courseId === order.courseId && t.locale === locale) ||
        translations.find((t) => t.courseId === order.courseId && t.locale === 'en') ||
        translations.find((t) => t.courseId === order.courseId);

      return {
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt,
        courseTitle: trans?.title || 'Language Course',
      };
    });
  }

  static async findUserQuizAttempts(userId: string, locale = 'en', limit = 10) {
    const attempts = await db
      .select({
        id: schema.quizAttempts.id,
        quizId: schema.quizAttempts.quizId,
        score: schema.quizAttempts.score,
        passed: schema.quizAttempts.passed,
        attemptedAt: schema.quizAttempts.attemptedAt,
      })
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.userId, userId))
      .orderBy(desc(schema.quizAttempts.attemptedAt))
      .limit(limit);

    if (attempts.length === 0) return [];

    const quizIds = [...new Set(attempts.map((a) => a.quizId))];
    const translations = await db
      .select()
      .from(schema.quizTranslations)
      .where(inArray(schema.quizTranslations.quizId, quizIds));

    return attempts.map((attempt) => {
      const trans =
        translations.find((t) => t.quizId === attempt.quizId && t.locale === locale) ||
        translations.find((t) => t.quizId === attempt.quizId && t.locale === 'en') ||
        translations.find((t) => t.quizId === attempt.quizId);

      return {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        attemptedAt: attempt.attemptedAt,
        quizTitle: trans?.title || 'Language Quiz',
      };
    });
  }

  static async checkWarmupCompletedToday(userId: string, todayStr: string): Promise<boolean> {
    const rows = await db
      .select({ completedDate: schema.dailyWarmupCompletions.completedDate })
      .from(schema.dailyWarmupCompletions)
      .where(
        and(
          eq(schema.dailyWarmupCompletions.userId, userId),
          eq(schema.dailyWarmupCompletions.completedDate, todayStr)
        )
      )
      .limit(1);

    return rows.length > 0;
  }

  static async updateUserProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const updates: any = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId))
      .returning();

    return updated;
  }

  static async claimDailyWarmupTx(userId: string, todayStr: string, xpAwarded = 25) {
    return await db.transaction(async (tx) => {
      // 1. Atomic idempotent insert with conflict handling
      const inserted = await tx
        .insert(schema.dailyWarmupCompletions)
        .values({
          userId,
          completedDate: todayStr,
          xpAwarded,
        })
        .onConflictDoNothing({
          target: [schema.dailyWarmupCompletions.userId, schema.dailyWarmupCompletions.completedDate],
        })
        .returning();

      if (inserted.length === 0) {
        return { alreadyClaimed: true };
      }

      // 2. Atomic XP increment
      const xpUpsert = await tx
        .insert(schema.userXp)
        .values({
          userId,
          totalXp: xpAwarded,
          level: 1,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.userXp.userId,
          set: {
            totalXp: sql`${schema.userXp.totalXp} + ${xpAwarded}`,
            updatedAt: new Date(),
          },
        })
        .returning();

      const newTotalXp = xpUpsert[0].totalXp;
      const oldXp = newTotalXp - xpAwarded;
      const { level: newLevel } = calculateLevelStats(newTotalXp);
      const { didLevelUp } = didUserLevelUp(oldXp, newTotalXp);

      if (xpUpsert[0].level !== newLevel) {
        await tx
          .update(schema.userXp)
          .set({ level: newLevel })
          .where(eq(schema.userXp.userId, userId));
      }

      // 3. Update Streak
      const streakResult = await updateStreakInTx(tx, userId, todayStr);

      // 4. Award Badges
      const newBadges = await checkAndAwardBadges(tx, userId, {
        streak: streakResult.currentStreak,
        newLevel,
        action: 'warmup_or_first_lesson',
      });

      return {
        alreadyClaimed: false,
        xpAwarded,
        newTotalXp,
        newLevel,
        didLevelUp,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        newBadges,
      };
    });
  }
}
