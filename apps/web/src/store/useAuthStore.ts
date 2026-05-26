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
  stats: UserStats;
  badges: UnlockedBadge[];
  activityFeed?: ActivityFeedItem[];
  purchaseHistory?: PurchaseHistoryItem[];
  quizHistory?: QuizHistoryItem[];
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<UserProfile | null>;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  signup: (userData: { name: string; email: string; password?: string; avatarUrl: string }) => Promise<void>;
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

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err: any) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      // Signup automatically logs the user in on the backend
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  googleLogin: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore network errors on logout, reset local state anyway
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  unimpersonate: async () => {
    set({ isLoading: true });
    try {
      await apiFetch('/api/dev/unimpersonate', { method: 'POST' });
      const user = await apiFetch<UserProfile>('/api/profile');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
