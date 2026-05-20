import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { serverEnv } from '../../config';
import { getCookieOptions } from '../auth/auth.middleware';
import os from 'os';

// 1. DEVELOPER TAKE-OVER IMPERSONATE
export const impersonateHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Enforce developer authentication check (verifyJWT must be run first)
  if (!request.user || request.user.role !== 'DEVELOPER') {
    reply.status(403).send({ error: 'Forbidden', message: 'Only developers can utilize impersonation tools' });
    return;
  }

  const { studentEmail } = request.body as { studentEmail?: string };
  if (!studentEmail) {
    reply.status(400).send({ error: 'Bad Request', message: 'Target student email is required' });
    return;
  }

  try {
    // Find target student
    const users = await db.select().from(schema.users).where(eq(schema.users.email, studentEmail)).limit(1);
    if (users.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: `No student found with email ${studentEmail}` });
      return;
    }

    const targetUser = users[0];

    // Log the takeover event in database audit logs
    await db.insert(schema.auditLogs).values({
      userId: targetUser.id,
      impersonatedBy: request.user.userId,
      action: 'DEVELOPER_IMPERSONATION_START',
      details: `Developer initiated session takeover on student account: ${targetUser.email} (${targetUser.name})`,
      ipAddress: request.ip,
    });

    const isProduction = serverEnv.NODE_ENV === 'production';

    // Mint access token signed with the student's ID, but carrying impersonatedBy claims
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.id,
        role: targetUser.role,
        impersonatedBy: request.user.userId, // Stems back to the original developer UID
      },
      serverEnv.JWT_SECRET,
      { expiresIn: '1h' } // Expiration set to 1 hour for debugging limits
    );

    // Set secure HttpOnly cookie
    reply.setCookie('impersonationToken', impersonationToken, getCookieOptions(isProduction, 3600));

    reply.status(200).send({
      success: true,
      impersonating: targetUser.email,
      message: 'Session switched successfully. Impersonation warning banner activated.',
    });
  } catch (error) {
    console.error('❌ Error during developer impersonation:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Something went wrong during impersonation' });
  }
};

// 2. UNIMPERSONATE (STOP TAKE-OVER)
export const unimpersonateHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // If request does not have active impersonation claim, return error
  if (!request.user || !request.user.impersonatedBy) {
    reply.status(400).send({ error: 'Bad Request', message: 'No active impersonation session found' });
    return;
  }

  try {
    // Log release event
    await db.insert(schema.auditLogs).values({
      userId: request.user.userId,
      impersonatedBy: request.user.impersonatedBy,
      action: 'DEVELOPER_IMPERSONATION_END',
      details: 'Developer ended session takeover, returning to developer identity',
      ipAddress: request.ip,
    });

    // Clear warning cookie
    reply.clearCookie('impersonationToken', { path: '/' });

    reply.status(200).send({
      success: true,
      message: 'Impersonation ended. Developer session restored.',
    });
  } catch (error) {
    console.error('❌ Error during developer unimpersonation:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Something went wrong when ending impersonation' });
  }
};

// 3. GET AUDIT LOGS (Paginated audit logs viewer)
export const getAuditLogsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const query = request.query as { limit?: string; offset?: string };
  const limit = parseInt(query.limit || '20');
  const offset = parseInt(query.offset || '0');

  try {
    const logs = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch details of logs with user references
    const resolvedLogs = await Promise.all(
      logs.map(async (log) => {
        let userEmail = 'System/Unknown';
        let impersonatorEmail = undefined;

        if (log.userId) {
          const userFound = await db.select().from(schema.users).where(eq(schema.users.id, log.userId)).limit(1);
          if (userFound.length > 0) userEmail = userFound[0].email;
        }

        if (log.impersonatedBy) {
          const impFound = await db.select().from(schema.users).where(eq(schema.users.id, log.impersonatedBy)).limit(1);
          if (impFound.length > 0) impersonatorEmail = impFound[0].email;
        }

        return {
          id: log.id,
          userEmail,
          impersonatorEmail,
          action: log.action,
          details: log.details,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      })
    );

    reply.status(200).send(resolvedLogs);
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch audit logs' });
  }
};

// 4. GET SYSTEM HEALTH & METRICS
export const getSystemHealthHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const totalUsers = await db.select().from(schema.users);
    const totalCourses = await db.select().from(schema.courses);
    const totalOrders = await db.select().from(schema.orders);

    reply.status(200).send({
      status: 'healthy',
      database: {
        totalUsersCount: totalUsers.length,
        totalCoursesCount: totalCourses.length,
        totalOrdersCount: totalOrders.length,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptimeSeconds: os.uptime(),
        freeMemoryBytes: os.freemem(),
        totalMemoryBytes: os.totalmem(),
        cpuCores: os.cpus().length,
      },
    });
  } catch (error) {
    console.error('❌ Error compiling health check diagnostics:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Diagnostics failed' });
  }
};

// 5. ADMINISTRATIVE OVERRIDES (XP, streak modifications, course revokes)
export const adminOverrideHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { targetUserId, action, value } = request.body as {
    targetUserId?: string;
    action?: 'AWARD_XP' | 'RESET_STREAK' | 'REVOKE_COURSE';
    value?: any;
  };

  if (!targetUserId || !action) {
    reply.status(400).send({ error: 'Bad Request', message: 'targetUserId and action parameters are required' });
    return;
  }

  try {
    // Assert target user exists
    const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, targetUserId)).limit(1);
    if (usersFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Target user not found' });
      return;
    }
    const targetUser = usersFound[0];

    await db.transaction(async (tx) => {
      if (action === 'AWARD_XP') {
        const xpAmount = parseInt(value || '100');
        const xpRecord = await tx.select().from(schema.userXp).where(eq(schema.userXp.userId, targetUserId)).limit(1);

        const oldXp = xpRecord.length > 0 ? xpRecord[0].totalXp : 0;
        const newXp = oldXp + xpAmount;
        const newLevel = Math.floor(newXp / 250) + 1;

        if (xpRecord.length > 0) {
          await tx
            .update(schema.userXp)
            .set({ totalXp: newXp, level: newLevel, updatedAt: new Date() })
            .where(eq(schema.userXp.userId, targetUserId));
        } else {
          await tx.insert(schema.userXp).values({ userId: targetUserId, totalXp: newXp, level: newLevel });
        }

        await tx.insert(schema.auditLogs).values({
          userId: targetUserId,
          impersonatedBy: request.user!.userId,
          action: 'OVERRIDE_AWARD_XP',
          details: `Manual developer override: awarded ${xpAmount} XP to ${targetUser.email}. New total: ${newXp} XP (Level ${newLevel})`,
          ipAddress: request.ip,
        });
      } else if (action === 'RESET_STREAK') {
        const streakValue = parseInt(value || '0');
        const streakRecord = await tx.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, targetUserId)).limit(1);

        if (streakRecord.length > 0) {
          await tx
            .update(schema.userStreaks)
            .set({ currentStreak: streakValue, updatedAt: new Date() })
            .where(eq(schema.userStreaks.userId, targetUserId));
        } else {
          await tx.insert(schema.userStreaks).values({ userId: targetUserId, currentStreak: streakValue, longestStreak: streakValue });
        }

        await tx.insert(schema.auditLogs).values({
          userId: targetUserId,
          impersonatedBy: request.user!.userId,
          action: 'OVERRIDE_RESET_STREAK',
          details: `Manual developer override: streak reset to ${streakValue} for ${targetUser.email}`,
          ipAddress: request.ip,
        });
      } else if (action === 'REVOKE_COURSE') {
        const courseId = value;
        if (!courseId) throw new Error('courseId is required for REVOKE_COURSE override');

        await tx
          .delete(schema.orders)
          .where(
            and(
              eq(schema.orders.userId, targetUserId),
              eq(schema.orders.courseId, courseId)
            )
          );

        await tx.insert(schema.auditLogs).values({
          userId: targetUserId,
          impersonatedBy: request.user!.userId,
          action: 'OVERRIDE_REVOKE_COURSE',
          details: `Manual developer override: revoked access of course ID ${courseId} for user ${targetUser.email}`,
          ipAddress: request.ip,
        });
      }
    });

    reply.status(200).send({
      success: true,
      message: `Override action ${action} executed successfully on student ${targetUser.email}.`,
    });
  } catch (error: any) {
    console.error('❌ Error executing administrative developer override:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: error.message || 'Override failed' });
  }
};

