import { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// Badge Registry definition for resolving nice names & descriptions
const BADGE_REGISTRY = [
  { id: 'scholar_1', name: 'First Steps Scholar', description: 'Passed your first language quiz!' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day learning streak!' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5!' },
];

export const getProfileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Requires authentication check (verifyJWT must run first)
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
    return;
  }

  const userId = request.user.userId;

  try {
    // 1. Fetch user profile
    const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (usersFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      return;
    }
    const user = usersFound[0];

    // 2. Fetch user XP progress
    const xpFound = await db.select().from(schema.userXp).where(eq(schema.userXp.userId, userId)).limit(1);
    const totalXp = xpFound.length > 0 ? xpFound[0].totalXp : 0;
    const level = xpFound.length > 0 ? xpFound[0].level : 1;

    // 3. Compute next-level progress
    const xpInLevel = totalXp % 250;
    const xpNeededForNextLevel = 250;
    const progressPercent = Math.round((xpInLevel / xpNeededForNextLevel) * 100);

    // 4. Fetch streaks progress
    const streaksFound = await db.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, userId)).limit(1);
    const currentStreak = streaksFound.length > 0 ? streaksFound[0].currentStreak : 0;
    const longestStreak = streaksFound.length > 0 ? streaksFound[0].longestStreak : 0;
    const lastActiveDate = streaksFound.length > 0 ? streaksFound[0].lastActiveDate : null;

    // 5. Fetch unlocked badges
    const userBadgesList = await db.select().from(schema.userBadges).where(eq(schema.userBadges.userId, userId));
    const resolvedBadges = userBadgesList.map((badge) => {
      const info = BADGE_REGISTRY.find((b) => b.id === badge.badgeId);
      return {
        badgeId: badge.badgeId,
        name: info ? info.name : badge.badgeId,
        description: info ? info.description : '',
        unlockedAt: badge.unlockedAt,
      };
    });

    reply.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      impersonatedBy: request.user.impersonatedBy,
      stats: {
        totalXp,
        level,
        xpInLevel,
        xpNeededForNextLevel,
        progressPercent,
        currentStreak,
        longestStreak,
        lastActiveDate,
      },
      badges: resolvedBadges,
    });
  } catch (error) {
    console.error('❌ Error compiling user stats profile:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not load profile dashboard stats' });
  }
};

// 2. PUT PROFILE HANDLER (Update name/avatar)
export const updateProfileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
    return;
  }

  const userId = request.user.userId;
  const { name, avatarUrl } = request.body as { name?: string; avatarUrl?: string };

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const [updatedUser] = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();

    if (!updatedUser) {
      reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      return;
    }

    reply.status(200).send({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not update profile' });
  }
};

