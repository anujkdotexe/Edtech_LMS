import { XpStats } from '../../utils/xp';

export interface UserStats extends XpStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  warmupCompletedToday: boolean;
}

export interface UserBadgeInfo {
  badgeId: string;
  name: string;
  description: string;
  unlockedAt: Date;
}

export interface PurchaseHistoryItem {
  id: string;
  amount: string;
  createdAt: Date;
  courseTitle: string;
}

export interface QuizHistoryItem {
  id: string;
  score: number;
  passed: boolean;
  attemptedAt: Date;
  quizTitle: string;
}

export interface ActivityFeedItem {
  text: string;
  date: Date;
}

export interface FullProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  impersonatedBy?: string;
  stats: UserStats;
  badges: UserBadgeInfo[];
  purchaseHistory: PurchaseHistoryItem[];
  quizHistory: QuizHistoryItem[];
  activityFeed: ActivityFeedItem[];
}
