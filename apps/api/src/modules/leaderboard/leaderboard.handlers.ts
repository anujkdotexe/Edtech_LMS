import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, gt, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { serverEnv } from '../../config';

// Optional auth parsing to resolve rank context
const getOptionalUserId = (request: FastifyRequest) => {
  const activeToken = request.cookies.impersonationToken || request.cookies.token;
  if (!activeToken) return null;
  try {
    const decoded = jwt.verify(activeToken, serverEnv.JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (err) {
    return null;
  }
};

export const getLeaderboardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const currentUserId = getOptionalUserId(request);

  try {
    // 1. Fetch top 100 students ranked by total XP
    const topStudents = await db
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
      .limit(100);

    // 2. Map indices as ranks
    const rankedList = topStudents.map((student, idx) => ({
      rank: idx + 1,
      id: student.id,
      name: student.name,
      avatarUrl: student.avatarUrl,
      totalXp: student.totalXp,
      level: student.level,
    }));

    // 3. Resolve absolute rank for current logged in user (if they are a STUDENT)
    let currentUserRank = null;
    let currentUserXp = 0;

    if (currentUserId) {
      // Find within the fetched top 100 first to save queries
      const foundInTop100 = rankedList.find((s) => s.id === currentUserId);
      if (foundInTop100) {
        currentUserRank = foundInTop100.rank;
        currentUserXp = foundInTop100.totalXp;
      } else {
        // Fetch current user details
        const userXpFound = await db.select().from(schema.userXp).where(eq(schema.userXp.userId, currentUserId)).limit(1);
        if (userXpFound.length > 0) {
          currentUserXp = userXpFound[0].totalXp;

          // Count users with strictly higher XP
          const higherXpCount = await db
            .select()
            .from(schema.userXp)
            .innerJoin(schema.users, eq(schema.userXp.userId, schema.users.id))
            .where(
              and(
                eq(schema.users.role, 'STUDENT'),
                gt(schema.userXp.totalXp, currentUserXp)
              )
            );

          currentUserRank = higherXpCount.length + 1;
        }
      }
    }

    reply.status(200).send({
      leaderboard: rankedList,
      currentUserRank,
      currentUserXp,
    });
  } catch (error) {
    console.error('❌ Error rendering weekly leaderboards:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch leaderboards' });
  }
};
