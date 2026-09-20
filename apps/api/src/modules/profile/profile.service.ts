import bcrypt from 'bcrypt';
import { ProfileRepository } from './profile.repository';
import { NotFoundError, ValidationError } from '../../errors';
import { calculateLevelStats } from '../../utils/xp';
import { AVAILABLE_BADGES } from '../../utils/badges';
import { FullProfileResponse, UserBadgeInfo, ActivityFeedItem } from './profile.types';
import { db } from '../../db';
import * as schema from '../../db/schema';

export interface WarmupChallengeDefinition {
  id: string;
  language: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export const WARMUP_CHALLENGES: Record<string, WarmupChallengeDefinition> = {
  vocab_fr_book: {
    id: 'vocab_fr_book',
    language: 'French',
    prompt: 'Choose the correct French translation for "The Book":',
    options: ['Le livre', 'La porte', 'La maison', 'Le stylo'],
    correctAnswer: 'Le livre',
  },
  vocab_es_water: {
    id: 'vocab_es_water',
    language: 'Spanish',
    prompt: 'Choose the correct Spanish translation for "Water":',
    options: ['El agua', 'El fuego', 'El pan', 'La leche'],
    correctAnswer: 'El agua',
  },
  vocab_de_apple: {
    id: 'vocab_de_apple',
    language: 'German',
    prompt: 'Choose the correct German translation for "The Apple":',
    options: ['Der Apfel', 'Die Banane', 'Das Brot', 'Das Wasser'],
    correctAnswer: 'Der Apfel',
  },
  vocab_fr_morning: {
    id: 'vocab_fr_morning',
    language: 'French',
    prompt: 'How do you greet someone in the morning in French?',
    options: ['Bonjour', 'Bonne nuit', 'Au revoir', "S'il vous plaît"],
    correctAnswer: 'Bonjour',
  },
  vocab_es_house: {
    id: 'vocab_es_house',
    language: 'Spanish',
    prompt: 'Choose the correct Spanish translation for "The House":',
    options: ['La casa', 'La mesa', 'La silla', 'El coche'],
    correctAnswer: 'La casa',
  },
  vocab_de_cat: {
    id: 'vocab_de_cat',
    language: 'German',
    prompt: 'Choose the correct German translation for "The Cat":',
    options: ['Die Katze', 'Der Hund', 'Das Pferd', 'Die Maus'],
    correctAnswer: 'Die Katze',
  },
  vocab_it_coffee: {
    id: 'vocab_it_coffee',
    language: 'Italian',
    prompt: 'Choose the correct Italian translation for "The Coffee":',
    options: ['Il caffè', 'Il tè', 'Il vino', 'La pizza'],
    correctAnswer: 'Il caffè',
  },
};

export class ProfileService {
  static async getDailyWarmup(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = await ProfileRepository.checkWarmupCompletedToday(userId, todayStr);

    const keys = Object.keys(WARMUP_CHALLENGES);
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash * 31 + todayStr.charCodeAt(i)) % keys.length;
    }
    const challengeKey = keys[Math.abs(hash) % keys.length];
    const challenge = WARMUP_CHALLENGES[challengeKey];

    return {
      challengeId: challenge.id,
      language: challenge.language,
      prompt: challenge.prompt,
      options: challenge.options,
      completedToday,
      xpReward: 25,
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

  static async updateProfile(userId: string, data: { name?: string; avatarUrl?: string; password?: string }) {
    if (!data.name && !data.avatarUrl && !data.password) {
      throw new ValidationError('Nothing to update');
    }

    let passwordHash: string | undefined;
    if (data.password) {
      if (data.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
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
    const keys = Object.keys(WARMUP_CHALLENGES);
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash * 31 + todayStr.charCodeAt(i)) % keys.length;
    }
    const expectedChallengeKey = keys[Math.abs(hash) % keys.length];
    const expectedChallenge = WARMUP_CHALLENGES[expectedChallengeKey];

    if (challenge.challengeId !== expectedChallenge.id) {
      throw new ValidationError('Submitted challenge ID does not match current daily challenge');
    }

    const definedChallenge = expectedChallenge;
    if (challenge.answer.trim().toLowerCase() !== definedChallenge.correctAnswer.toLowerCase()) {
      throw new ValidationError('Incorrect answer for daily warmup challenge');
    }

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
