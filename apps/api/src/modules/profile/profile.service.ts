import { ProfileRepository } from './profile.repository';
import { NotFoundError, ValidationError } from '../../errors';
import { calculateLevelStats } from '../../utils/xp';
import { AVAILABLE_BADGES } from '../../utils/badges';
import { FullProfileResponse, UserBadgeInfo, ActivityFeedItem } from './profile.types';
import { db } from '../../db';
import * as schema from '../../db/schema';

export class ProfileService {
  static async getFullProfile(userId: string, requestedLocale = 'en'): Promise<FullProfileResponse> {
    const user = await ProfileRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const xp = await ProfileRepository.findUserXp(userId);
    const totalXp = xp ? xp.totalXp : 0;
    const levelStats = calculateLevelStats(totalXp);

    const streaks = await ProfileRepository.findUserStreaks(userId);
    const currentStreak = streaks ? streaks.currentStreak : 0;
    const longestStreak = streaks ? streaks.longestStreak : 0;
    const lastActiveDate = streaks ? streaks.lastActiveDate : null;

    const todayStr = new Date().toISOString().split('T')[0];
    const warmupCompletedToday = await ProfileRepository.checkWarmupCompletedToday(userId, todayStr);

    const userBadgesList = await ProfileRepository.findUserBadges(userId);
    const resolvedBadges: UserBadgeInfo[] = userBadgesList.map((badge) => {
      const info = AVAILABLE_BADGES.find((b) => b.id === badge.badgeId);
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
    if (purchases.length > 0) {
      activityFeed.push({
        text: `Purchased course: ${purchases[0].courseTitle}`,
        date: purchases[0].createdAt,
      });
    }
    if (quizAttempts.length > 0) {
      activityFeed.push({
        text: `Completed quiz: ${quizAttempts[0].quizTitle} with ${quizAttempts[0].score}%`,
        date: quizAttempts[0].attemptedAt,
      });
    }
    if (resolvedBadges.length > 0) {
      activityFeed.push({
        text: `Unlocked badge: ${resolvedBadges[0].name}`,
        date: resolvedBadges[0].unlockedAt,
      });
    }
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

  static async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    if (!data.name && !data.avatarUrl) {
      throw new ValidationError('Nothing to update');
    }

    const updated = await ProfileRepository.updateUserProfile(userId, data);
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

  static async claimDailyWarmup(userId: string, ip?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const result = await ProfileRepository.claimDailyWarmupTx(userId, todayStr, 25);

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
      details: `Claimed daily warmup XP (+25). Streak: ${result.currentStreak}. Level: ${result.newLevel}.`,
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
      message: 'Daily warmup completed! Earned 25 XP.',
    };
  }
}
