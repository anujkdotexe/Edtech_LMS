import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface UserStats {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  warmupCompletedToday?: boolean;
}

export interface UnlockedBadge {
  badgeId: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface ActivityFeedItem {
  text: string;
  date: string;
}

export interface PurchaseHistoryItem {
  id: string;
  amount: string;
  createdAt: string;
  courseTitle: string;
}

export interface QuizHistoryItem {
  id: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
  quizTitle: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
  avatarUrl: string | null;
  forcePasswordReset?: boolean;
  impersonatedBy?: string;
  lastLoginAt?: string | null;
  stats: UserStats;
  badges: UnlockedBadge[];
  activityFeed?: ActivityFeedItem[];
  purchaseHistory?: PurchaseHistoryItem[];
  quizHistory?: QuizHistoryItem[];
}

export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
  avatarUrl: string | null;
  forcePasswordReset?: boolean;
  lastLoginAt?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<UserAuthProfile | null>;
  fetchProfile: () => Promise<UserProfile | null>;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  signup: (userData: { name: string; email: string; password?: string; avatarUrl?: string }) => Promise<void>;
  googleLogin: (userData: { name: string; email: string; avatarUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  unimpersonate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Lightweight session check for app shells and guards
  checkSession: async () => {
    try {
      const me = await apiFetch<UserAuthProfile>('/api/auth/me');
      set((state) => ({
        user: state.user
          ? { ...state.user, ...me }
          : ({
              ...me,
              stats: {
                totalXp: 0,
                level: 1,
                xpInLevel: 0,
                xpNeededForNextLevel: 250,
                progressPercent: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: null,
                warmupCompletedToday: false,
              },
              badges: [],
              activityFeed: [],
              purchaseHistory: [],
              quizHistory: [],
            } as UserProfile),
        isAuthenticated: true,
        isLoading: false,
      }));
      return me;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const authProfile = await apiFetch<UserAuthProfile>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      set((state) => ({
        user: {
          ...authProfile,
          stats: state.user?.stats || {
            totalXp: 0,
            level: 1,
            xpInLevel: 0,
            xpNeededForNextLevel: 250,
            progressPercent: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
          },
          badges: state.user?.badges || [],
        },
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const authProfile = await apiFetch<UserAuthProfile>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      set({
        user: {
          ...authProfile,
          stats: {
            totalXp: 0,
            level: 1,
            xpInLevel: 0,
            xpNeededForNextLevel: 250,
            progressPercent: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
          },
          badges: [],
          activityFeed: [],
          purchaseHistory: [],
          quizHistory: [],
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  googleLogin: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const authProfile = await apiFetch<UserAuthProfile>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      set((state) => ({
        user: {
          ...authProfile,
          stats: state.user?.stats || {
            totalXp: 0,
            level: 1,
            xpInLevel: 0,
            xpNeededForNextLevel: 250,
            progressPercent: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
          },
          badges: state.user?.badges || [],
        },
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout, reset local state anyway
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  unimpersonate: async () => {
    set({ isLoading: true });
    try {
      await apiFetch('/api/dev/unimpersonate', { method: 'POST' });
      await get().checkSession();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
