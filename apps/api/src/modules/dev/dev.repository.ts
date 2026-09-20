import { eq, desc, and, count, sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { calculateLevelStats } from '../../utils/xp';

export class DevRepository {
  static async getAuditLogs(limit = 20, offset = 0) {
    const logs = await db
      .select({
        id: schema.auditLogs.id,
        userId: schema.auditLogs.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        impersonatedBy: schema.auditLogs.impersonatedBy,
        action: schema.auditLogs.action,
        details: schema.auditLogs.details,
        ipAddress: schema.auditLogs.ipAddress,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.userEmail || 'System/Unknown',
      userName: log.userName || undefined,
      impersonatedBy: log.impersonatedBy,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));
  }

  static async getSystemMetrics() {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - dbStart;

    const [usersCount] = await db.select({ count: count() }).from(schema.users);
    const [coursesCount] = await db.select({ count: count() }).from(schema.courses);
    const [ordersCount] = await db.select({ count: count() }).from(schema.orders);

    return {
      totalUsersCount: usersCount ? Number(usersCount.count) : 0,
      totalCoursesCount: coursesCount ? Number(coursesCount.count) : 0,
      totalOrdersCount: ordersCount ? Number(ordersCount.count) : 0,
      latencyMs,
    };
  }

  static async getFeatureFlags() {
    return await db.select().from(schema.featureFlags).orderBy(schema.featureFlags.key);
  }

  static async setFeatureFlag(key: string, enabled: boolean) {
    const [flag] = await db
      .update(schema.featureFlags)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(schema.featureFlags.key, key))
      .returning();

    return flag || null;
  }

  static async executeOverride(params: {
    targetUserId: string;
    action: 'AWARD_XP' | 'RESET_STREAK' | 'REVOKE_COURSE';
    value: any;
    devUserId: string;
    ip?: string;
  }) {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, params.targetUserId)).limit(1);
    if (user.length === 0) {
      return null;
    }
    const targetUser = user[0];

    await db.transaction(async (tx) => {
      if (params.action === 'AWARD_XP') {
        const xpAmount = parseInt(params.value || '100');
        const xpRecord = await tx.select().from(schema.userXp).where(eq(schema.userXp.userId, params.targetUserId)).limit(1);
        const oldXp = xpRecord.length > 0 ? xpRecord[0].totalXp : 0;
        const newXp = oldXp + xpAmount;
        const { level: newLevel } = calculateLevelStats(newXp);

        if (xpRecord.length > 0) {
          await tx
            .update(schema.userXp)
            .set({ totalXp: newXp, level: newLevel, updatedAt: new Date() })
            .where(eq(schema.userXp.userId, params.targetUserId));
        } else {
          await tx.insert(schema.userXp).values({ userId: params.targetUserId, totalXp: newXp, level: newLevel });
        }

        await tx.insert(schema.auditLogs).values({
          userId: params.targetUserId,
          impersonatedBy: params.devUserId,
          action: 'OVERRIDE_AWARD_XP',
          details: `Manual developer override: awarded ${xpAmount} XP to ${targetUser.email}. New total: ${newXp} XP (Level ${newLevel})`,
          ipAddress: params.ip,
        });
      } else if (params.action === 'RESET_STREAK') {
        const streakValue = parseInt(params.value || '0');
        const streakRecord = await tx.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, params.targetUserId)).limit(1);

        if (streakRecord.length > 0) {
          await tx
            .update(schema.userStreaks)
            .set({ currentStreak: streakValue, updatedAt: new Date() })
            .where(eq(schema.userStreaks.userId, params.targetUserId));
        } else {
          await tx.insert(schema.userStreaks).values({ userId: params.targetUserId, currentStreak: streakValue, longestStreak: streakValue });
        }

        await tx.insert(schema.auditLogs).values({
          userId: params.targetUserId,
          impersonatedBy: params.devUserId,
          action: 'OVERRIDE_RESET_STREAK',
          details: `Manual developer override: streak reset to ${streakValue} for ${targetUser.email}`,
          ipAddress: params.ip,
        });
      } else if (params.action === 'REVOKE_COURSE') {
        const courseId = params.value;
        await tx
          .delete(schema.orders)
          .where(and(eq(schema.orders.userId, params.targetUserId), eq(schema.orders.courseId, courseId)));

        await tx.insert(schema.auditLogs).values({
          userId: params.targetUserId,
          impersonatedBy: params.devUserId,
          action: 'OVERRIDE_REVOKE_COURSE',
          details: `Manual developer override: revoked access of course ID ${courseId} for user ${targetUser.email}`,
          ipAddress: params.ip,
        });
      }
    });

    return targetUser;
  }
}
