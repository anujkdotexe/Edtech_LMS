import { eq, and, desc } from 'drizzle-orm';
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
    return await db
      .select({
        id: schema.orders.id,
        amount: schema.orders.amount,
        createdAt: schema.orders.createdAt,
        courseTitle: schema.courseTranslations.title,
      })
      .from(schema.orders)
      .innerJoin(
        schema.courseTranslations,
        and(
          eq(schema.orders.courseId, schema.courseTranslations.courseId),
          eq(schema.courseTranslations.locale, locale)
        )
      )
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  static async findUserQuizAttempts(userId: string, locale = 'en', limit = 10) {
    return await db
      .select({
        id: schema.quizAttempts.id,
        score: schema.quizAttempts.score,
        passed: schema.quizAttempts.passed,
        attemptedAt: schema.quizAttempts.attemptedAt,
        quizTitle: schema.quizTranslations.title,
      })
      .from(schema.quizAttempts)
      .innerJoin(
        schema.quizTranslations,
        and(
          eq(schema.quizAttempts.quizId, schema.quizTranslations.quizId),
          eq(schema.quizTranslations.locale, locale)
        )
      )
      .where(eq(schema.quizAttempts.userId, userId))
      .orderBy(desc(schema.quizAttempts.attemptedAt))
      .limit(limit);
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
      // 1. Check if already claimed
      const existing = await tx
        .select()
        .from(schema.dailyWarmupCompletions)
        .where(
          and(
            eq(schema.dailyWarmupCompletions.userId, userId),
            eq(schema.dailyWarmupCompletions.completedDate, todayStr)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { alreadyClaimed: true };
      }

      // 2. Insert completion
      await tx.insert(schema.dailyWarmupCompletions).values({
        userId,
        completedDate: todayStr,
        xpAwarded,
      });

      // 3. Update XP
      const currentXpRows = await tx
        .select()
        .from(schema.userXp)
        .where(eq(schema.userXp.userId, userId))
        .limit(1);

      const oldTotalXp = currentXpRows.length > 0 ? currentXpRows[0].totalXp : 0;
      const newTotalXp = oldTotalXp + xpAwarded;
      const { level: newLevel } = calculateLevelStats(newTotalXp);
      const { didLevelUp } = didUserLevelUp(oldTotalXp, newTotalXp);

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

      // 4. Update Streak
      const streakResult = await updateStreakInTx(tx, userId, todayStr);

      // 5. Award Badges
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
