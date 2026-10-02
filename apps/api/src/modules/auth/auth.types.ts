import { UserRole } from '@lms/types';

export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  forcePasswordReset: boolean;
  isSuspended?: boolean;
  lastLoginAt?: Date | null;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

