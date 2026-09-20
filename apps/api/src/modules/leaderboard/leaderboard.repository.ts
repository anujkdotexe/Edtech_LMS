import { eq, desc, gt, and, count } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export class LeaderboardRepository {
  static async getTopStudents(limit = 100) {
    return await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        totalXp: schema.userXp.totalXp,
        level: schema.userXp.level,
      })
      .from(schema.users)
      .innerJoin(schema.userXp, eq(schema.users.id, schema.userXp.userId))
      .where(eq(schema.users.role, 'STUDENT'))
      .orderBy(desc(schema.userXp.totalXp))
      .limit(limit);
  }

  static async getUserXp(userId: string) {
    const rows = await db.select().from(schema.userXp).where(eq(schema.userXp.userId, userId)).limit(1);
    return rows[0] || null;
  }

  static async countStudentsWithHigherXp(xpThreshold: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(schema.userXp)
      .innerJoin(schema.users, eq(schema.userXp.userId, schema.users.id))
      .where(
        and(
          eq(schema.users.role, 'STUDENT'),
          gt(schema.userXp.totalXp, xpThreshold)
        )
      );

    return result ? Number(result.count) : 0;
  }
}
