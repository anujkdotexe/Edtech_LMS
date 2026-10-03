import { UserRole } from '@lms/types';

export interface UserAuthStats {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  warmupCompletedToday: boolean;
}

export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  forcePasswordReset: boolean;
  isSuspended?: boolean;
  lastLoginAt?: Date | null;
  stats?: UserAuthStats;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
}


