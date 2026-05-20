export type UserRole = 'STUDENT' | 'ADMIN' | 'DEVELOPER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserXP {
  userId: string;
  totalXp: number;
  level: number;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  price: number;
  isPremium: boolean;
  isPublished: boolean;
}
