import { eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { updateStreakInTx } from '../../utils/streaks';
import { calculateLevelStats, didUserLevelUp } from '../../utils/xp';
import { checkAndAwardBadges } from '../../utils/badges';

export class QuizzesRepository {
  static async findAllQuizzes() {
    return await db.select().from(schema.quizzes);
  }

  static async findQuizTranslations() {
    return await db.select().from(schema.quizTranslations);
  }

  static async findQuizById(id: string) {
    const rows = await db.select().from(schema.quizzes).where(eq(schema.quizzes.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findQuizTranslationsById(quizId: string) {
    return await db.select().from(schema.quizTranslations).where(eq(schema.quizTranslations.quizId, quizId));
  }

  static async findQuizQuestions(quizId: string) {
    return await db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, quizId));
  }

  static async submitQuizTransaction(params: {
    userId: string;
    quizId: string;
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Atomic XP Upsert
      const xpUpsert = await tx
        .insert(schema.userXp)
        .values({
          userId: params.userId,
          totalXp: params.xpEarned,
          level: 1,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.userXp.userId,
          set: {
            totalXp: sql`${schema.userXp.totalXp} + ${params.xpEarned}`,
            updatedAt: new Date(),
          },
        })
        .returning();

      const newTotalXp = xpUpsert[0].totalXp;
      const oldXp = newTotalXp - params.xpEarned;
      const { level: newLevel } = calculateLevelStats(newTotalXp);
      const { didLevelUp } = didUserLevelUp(oldXp, newTotalXp);

      if (xpUpsert[0].level !== newLevel) {
        await tx
          .update(schema.userXp)
          .set({ level: newLevel })
          .where(eq(schema.userXp.userId, params.userId));
      }

      // 2. Update Streak
      const streakResult = await updateStreakInTx(tx, params.userId);

      // 3. Insert Quiz Attempt Record with correct_count and total_questions
      await tx.insert(schema.quizAttempts).values({
        userId: params.userId,
        quizId: params.quizId,
        score: params.score,
        passed: params.passed,
        correctCount: params.correctCount,
        totalQuestions: params.totalQuestions,
      });

      // 4. Award Badges with authentic badge IDs
      const badgesUnlocked = await checkAndAwardBadges(tx, params.userId, {
        streak: streakResult.currentStreak,
        score: params.score,
        newLevel,
      });

      return {
        newTotalXp,
        didLevelUp,
        newLevel,
        currentStreak: streakResult.currentStreak,
        badgesUnlocked,
      };
    });
  }
}
