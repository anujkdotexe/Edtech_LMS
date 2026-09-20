import { eq } from 'drizzle-orm';
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
