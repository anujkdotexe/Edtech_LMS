export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
  avatarUrl: string | null;
  forcePasswordReset: boolean;
  isSuspended?: boolean;
  lastLoginAt?: Date | null;
}

export interface TokenPayload {
  userId: string;
  role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
}
