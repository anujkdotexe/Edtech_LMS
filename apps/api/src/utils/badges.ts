import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { db } from '../db';

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface SystemBadge {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export const AVAILABLE_BADGES: SystemBadge[] = [
  { id: 'scholar_1', name: 'First Steps', description: 'Earned your first badge in the curriculum.' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day study streak!' },
  { id: 'streak_7', name: 'Unstoppable Habit', description: 'Maintained a 7-day study streak!' },
  { id: 'centurion_streak', name: 'Centurion Streak', description: 'Maintained a 30-day study streak!' },
  { id: 'quiz_master', name: 'Perfect Score', description: 'Scored 100% on a challenging quiz!' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5 in curriculum!' },
  { id: 'level_10', name: 'Grandmaster Linguist', description: 'Reached Level 10 of language mastery!' },
];

export interface BadgeEvaluationContext {
  streak?: number;
  score?: number;
  newLevel?: number;
  action?: string;
}

export interface AwardedBadge {
  badgeId: string;
  name: string;
}

export async function checkAndAwardBadges(
  tx: DbTransaction,
  userId: string,
  context: BadgeEvaluationContext
): Promise<AwardedBadge[]> {
  const existingBadges = await tx
    .select({ badgeId: schema.userBadges.badgeId })
    .from(schema.userBadges)
    .where(eq(schema.userBadges.userId, userId));

  const unlockedBadgeIds = new Set<string>(existingBadges.map((b: { badgeId: string }) => b.badgeId));
  const newlyAwarded: AwardedBadge[] = [];

  const dbBadges = await tx.select().from(schema.systemBadges);
  const badgesToEvaluate = dbBadges.length > 0 ? dbBadges : AVAILABLE_BADGES.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: 'Award',
    criteriaType: 'ACTION',
    criteriaThreshold: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  for (const badge of badgesToEvaluate) {
    if (unlockedBadgeIds.has(badge.id)) continue;

    let qualifies = false;
    const cType = (badge.criteriaType || '').toUpperCase();
    const threshold = badge.criteriaThreshold ?? 1;

    if (cType === 'STREAK' && (context.streak ?? 0) >= threshold) {
      qualifies = true;
    } else if (cType === 'SCORE' && (context.score ?? 0) >= threshold) {
      qualifies = true;
    } else if (cType === 'LEVEL' && (context.newLevel ?? 1) >= threshold) {
      qualifies = true;
    } else if ((cType === 'ACTION' || badge.id === 'scholar_1') && context.action === 'warmup_or_first_lesson') {
      qualifies = true;
    }

    if (qualifies) {
      try {
        await tx.insert(schema.userBadges).values({
          userId,
          badgeId: badge.id,
          unlockedAt: new Date(),
        }).onConflictDoNothing();
        newlyAwarded.push({ badgeId: badge.id, name: badge.name });
      } catch {
        // Safe duplicate prevention
      }
    }
  }

  return newlyAwarded;
}
