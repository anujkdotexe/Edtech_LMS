import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// Badge Registry definition for resolving nice names & descriptions
const BADGE_REGISTRY = [
  { id: 'scholar_1', name: 'First Steps Scholar', description: 'Passed your first language quiz!' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day learning streak!' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5!' },
  { id: 'perfect_100', name: 'Perfect Score Master', description: 'Scored a flawless 100% on a quiz!' },
  { id: 'streak_7', name: 'Unstoppable Habit', description: 'Achieved an amazing 7-day learning streak!' },
  { id: 'level_10', name: 'Grandmaster Linguist', description: 'Reached Level 10 of language mastery!' },
  { id: 'scholar_5', name: 'Academic Elite', description: 'Successfully passed 5 or more distinct quizzes!' },
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

    // 6. Fetch Purchase History
    const purchases = await db.select({
      id: schema.orders.id,
      amount: schema.orders.amount,
      createdAt: schema.orders.createdAt,
      courseTitle: schema.courseTranslations.title
    })
    .from(schema.orders)
    .innerJoin(schema.courseTranslations, eq(schema.orders.courseId, schema.courseTranslations.courseId))
    .where(eq(schema.orders.userId, userId));
    
    // Deduplicate translations (using default locale logic for simplistic return)
    const uniquePurchases = purchases.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);

    // 7. Fetch Quiz History
    const quizAttempts = await db.select({
      id: schema.quizAttempts.id,
      score: schema.quizAttempts.score,
      passed: schema.quizAttempts.passed,
      attemptedAt: schema.quizAttempts.attemptedAt,
      quizTitle: schema.quizTranslations.title
    })
    .from(schema.quizAttempts)
    .innerJoin(schema.quizTranslations, eq(schema.quizAttempts.quizId, schema.quizTranslations.quizId))
    .where(eq(schema.quizAttempts.userId, userId))
    .orderBy(desc(schema.quizAttempts.attemptedAt))
    .limit(10);
    
    const uniqueQuizAttempts = quizAttempts.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);

    // 8. Compute mock activity feed from existing data
    const activityFeed = [];
    if (uniquePurchases.length > 0) {
      activityFeed.push({ text: `Purchased course: ${uniquePurchases[0].courseTitle}`, date: uniquePurchases[0].createdAt });
    }
    if (uniqueQuizAttempts.length > 0) {
      activityFeed.push({ text: `Completed quiz: ${uniqueQuizAttempts[0].quizTitle} with ${uniqueQuizAttempts[0].score}%`, date: uniqueQuizAttempts[0].attemptedAt });
    }
    if (resolvedBadges.length > 0) {
      activityFeed.push({ text: `Unlocked badge: ${resolvedBadges[0].name}`, date: resolvedBadges[0].unlockedAt });
    }
    // Sort activity feed newest first
    activityFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      purchaseHistory: uniquePurchases,
      quizHistory: uniqueQuizAttempts,
      activityFeed: activityFeed
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

