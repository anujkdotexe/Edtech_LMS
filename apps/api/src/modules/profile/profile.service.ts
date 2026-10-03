import bcrypt from 'bcrypt';
import { ProfileRepository } from './profile.repository';
import { NotFoundError, ValidationError } from '../../errors';
import { calculateLevelStats } from '../../utils/xp';
import { FullProfileResponse, UserBadgeInfo, ActivityFeedItem } from './profile.types';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export interface WarmupChallengeDefinition {
  id: string;
  language: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export class ProfileService {
  static async getDailyWarmup(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = await ProfileRepository.checkWarmupCompletedToday(userId, todayStr);

    let activeChallenges = await db
      .select()
      .from(schema.dailyWarmupChallenges)
      .where(eq(schema.dailyWarmupChallenges.isActive, true));

    if (activeChallenges.length === 0) {
      activeChallenges = await db.select().from(schema.dailyWarmupChallenges);
    }

    if (activeChallenges.length === 0) {
      throw new NotFoundError('No warmup challenges available in database');
    }

    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash * 31 + todayStr.charCodeAt(i)) % activeChallenges.length;
    }
    const challenge = activeChallenges[Math.abs(hash) % activeChallenges.length];

    let options: string[] = [];
    try {
      options = typeof challenge.options === 'string' ? JSON.parse(challenge.options) : challenge.options;
    } catch {
      options = [challenge.correctAnswer];
    }

    return {
      challengeId: challenge.id,
      language: challenge.language,
      prompt: challenge.prompt,
      options,
      completedToday,
      xpReward: challenge.xpReward,
    };
  }
  static async getFullProfile(userId: string, requestedLocale = 'en'): Promise<FullProfileResponse> {
    const user = await ProfileRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const xp = await ProfileRepository.findUserXp(userId);
    const totalXp = xp ? xp.totalXp : 0;
    const levelStats = calculateLevelStats(totalXp);

    const streaks = await ProfileRepository.findUserStreaks(userId);
    let currentStreak = streaks ? streaks.currentStreak : 0;
    const longestStreak = streaks ? streaks.longestStreak : 0;
    const lastActiveDate = streaks ? streaks.lastActiveDate : null;

    const todayStr = new Date().toISOString().split('T')[0];

    // If student was last active before yesterday (diff > 1), streak has lapsed
    if (lastActiveDate && currentStreak > 0) {
      const [y1, m1, d1] = lastActiveDate.split('-').map(Number);
      const [y2, m2, d2] = todayStr.split('-').map(Number);
      const diffDays = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }

    const warmupCompletedToday = await ProfileRepository.checkWarmupCompletedToday(userId, todayStr);

    const allSystemBadges = await db.select().from(schema.systemBadges);
    const userBadgesList = await ProfileRepository.findUserBadges(userId);
    const resolvedBadges: UserBadgeInfo[] = userBadgesList.map((badge) => {
      const info = allSystemBadges.find((b) => b.id === badge.badgeId);
      return {
        badgeId: badge.badgeId,
        name: info ? info.name : badge.badgeId,
        description: info ? info.description : '',
        unlockedAt: badge.unlockedAt,
      };
    });

    const purchases = await ProfileRepository.findUserPurchases(userId, requestedLocale);
    const quizAttempts = await ProfileRepository.findUserQuizAttempts(userId, requestedLocale, 10);

    const activityFeed: ActivityFeedItem[] = [];
    quizAttempts.slice(0, 5).forEach((q) => {
      activityFeed.push({
        text: `Completed quiz: ${q.quizTitle} with ${q.score}%`,
        date: q.attemptedAt,
      });
    });
    resolvedBadges.slice(0, 3).forEach((b) => {
      activityFeed.push({
        text: `Unlocked badge: ${b.name}`,
        date: b.unlockedAt,
      });
    });
    activityFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      stats: {
        ...levelStats,
        currentStreak,
        longestStreak,
        lastActiveDate,
        warmupCompletedToday,
      },
      badges: resolvedBadges,
      purchaseHistory: purchases,
      quizHistory: quizAttempts,
      activityFeed,
    };
  }

  static async updateProfile(userId: string, data: { name?: string; avatarUrl?: string; password?: string; currentPassword?: string }) {
    if (!data.name && !data.avatarUrl && !data.password) {
      throw new ValidationError('Nothing to update');
    }

    const user = await ProfileRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let passwordHash: string | undefined;
    if (data.password) {
      if (data.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      // If user does not have forced password reset active, verify current password
      if (!user.forcePasswordReset && user.passwordHash) {
        if (!data.currentPassword) {
          throw new ValidationError('Current password is required to change password');
        }
        const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!isMatch) {
          throw new ValidationError('Current password is incorrect');
        }
      }

      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await ProfileRepository.updateUserProfile(userId, {
      name: data.name,
      avatarUrl: data.avatarUrl,
      passwordHash,
      forcePasswordReset: data.password ? false : undefined,
    });
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
    };
  }

  static async claimDailyWarmup(
    userId: string,
    challenge?: { challengeId?: string; answer?: string },
    ip?: string
  ) {
    if (!challenge || !challenge.challengeId || !challenge.answer) {
      throw new ValidationError('Daily warmup challenge ID and answer are required');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Query challenge directly from PostgreSQL database table
    const [dbChallenge] = await db
      .select()
      .from(schema.dailyWarmupChallenges)
      .where(eq(schema.dailyWarmupChallenges.id, challenge.challengeId))
      .limit(1);

    if (!dbChallenge) {
      throw new ValidationError('Invalid warmup challenge identifier');
    }

    if (challenge.answer.trim().toLowerCase() !== dbChallenge.correctAnswer.trim().toLowerCase()) {
      throw new ValidationError('Incorrect answer for daily warmup challenge');
    }

    const result = await ProfileRepository.claimDailyWarmupTx(userId, todayStr, dbChallenge.xpReward);

    if (result.alreadyClaimed) {
      return {
        success: true,
        claimed: false,
        alreadyClaimed: true,
        xpAwarded: 0,
        message: 'Daily warmup already completed for today',
      };
    }

    await db.insert(schema.auditLogs).values({
      userId,
      action: 'WARMUP_CLAIM',
      details: `Claimed daily warmup XP (+${result.xpAwarded}). Streak: ${result.currentStreak}. Level: ${result.newLevel}.`,
      ipAddress: ip,
    });

    return {
      success: true,
      claimed: true,
      alreadyClaimed: false,
      xpAwarded: result.xpAwarded,
      newTotalXp: result.newTotalXp,
      newLevel: result.newLevel,
      didLevelUp: result.didLevelUp,
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      newBadges: result.newBadges,
      message: `Daily warmup completed! Earned ${result.xpAwarded} XP.`,
    };
  }
}
