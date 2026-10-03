import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export class AuthRepository {
  static async findByEmail(email: string) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return rows[0] || null;
  }

  static async findById(id: string) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findUserWithGamification(id: string) {
    const user = await this.findById(id);
    if (!user) return null;

    const [xp] = await db.select().from(schema.userXp).where(eq(schema.userXp.userId, id)).limit(1);
    const [streak] = await db.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, id)).limit(1);

    const todayStr = new Date().toISOString().split('T')[0];
    const [warmup] = await db
      .select()
      .from(schema.dailyWarmupCompletions)
      .where(
        and(
          eq(schema.dailyWarmupCompletions.userId, id),
          eq(schema.dailyWarmupCompletions.completedDate, todayStr)
        )
      )
      .limit(1);

    const totalXp = xp ? xp.totalXp : 0;
    let currentStreak = streak ? streak.currentStreak : 0;
    const longestStreak = streak ? streak.longestStreak : 0;
    const lastActiveDate = streak ? streak.lastActiveDate : null;

    if (lastActiveDate && currentStreak > 0) {
      const [y1, m1, d1] = lastActiveDate.split('-').map(Number);
      const [y2, m2, d2] = todayStr.split('-').map(Number);
      const diffDays = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }

    return {
      user,
      totalXp,
      currentStreak,
      longestStreak,
      lastActiveDate,
      warmupCompletedToday: !!warmup,
    };
  }

  static async createUserWithGamification(userData: {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
  }) {
    return await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(schema.users)
        .values({
          name: userData.name,
          email: userData.email,
          passwordHash: userData.passwordHash,
          role: 'STUDENT',
          avatarUrl: userData.avatarUrl,
          lastLoginAt: new Date(),
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

      return newUser;
    });
  }

  static async updateLastLogin(id: string) {
    return await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, id));
  }

  static async updatePasswordHash(id: string, passwordHash: string) {
    return await db
      .update(schema.users)
      .set({ passwordHash, forcePasswordReset: false, updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }

  static async updateAvatar(id: string, avatarUrl: string) {
    return await db
      .update(schema.users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }
}
