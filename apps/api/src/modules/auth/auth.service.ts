import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { serverEnv } from '../../config';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../../errors';
import { UserAuthProfile } from './auth.types';

export class AuthService {
  static generateTokens(user: { id: string; role: 'STUDENT' | 'ADMIN' | 'DEVELOPER' }) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      serverEnv.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      serverEnv.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { token, refreshToken };
  }

  static async signup(data: { name: string; email: string; password: string; avatarUrl?: string }) {
    const existing = await AuthRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('A user with this email address already exists');
    }

    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const avatarUrl = data.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(data.name)}`;

    const newUser = await AuthRepository.createUserWithGamification({
      name: data.name,
      email: data.email,
      passwordHash,
      avatarUrl,
    });

    const tokens = this.generateTokens(newUser);

    const profile: UserAuthProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      forcePasswordReset: newUser.forcePasswordReset,
      lastLoginAt: newUser.lastLoginAt,
    };

    return { profile, tokens };
  }

  static async login(data: { email: string; password: string }) {
    const user = await AuthRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new ForbiddenError('Your account has been suspended. Please contact support.');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await AuthRepository.updateLastLogin(user.id);
    const tokens = this.generateTokens(user);

    const profile: UserAuthProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      forcePasswordReset: user.forcePasswordReset,
      lastLoginAt: new Date(),
    };

    return { profile, tokens };
  }

  static async refresh(refreshToken: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, serverEnv.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await AuthRepository.findById(decoded.userId);
    if (!user || user.isSuspended) {
      throw new UnauthorizedError('User session is invalid or revoked');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      serverEnv.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { token };
  }

  static async forgotPassword(email: string) {
    const user = await AuthRepository.findByEmail(email);
    if (user) {
      // Must use JWT_RESET_SECRET, not JWT_SECRET
      const resetToken = jwt.sign(
        { userId: user.id },
        serverEnv.JWT_RESET_SECRET,
        { expiresIn: '15m' }
      );
      console.log(`\n\n=== [INFO] MOCK EMAIL SERVICE ===\nTo: ${email}\nSubject: Password Reset\nLink: ${serverEnv.FRONTEND_URL}/reset-password?token=${resetToken}\n=================================\n`);
    }
    return { success: true, message: 'If an account exists, a reset link was sent.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, serverEnv.JWT_RESET_SECRET) as { userId: string };
    } catch {
      throw new ValidationError('Invalid or expired reset token');
    }

    const user = await AuthRepository.findById(decoded.userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await AuthRepository.updatePasswordHash(user.id, passwordHash);

    return { success: true, message: 'Password updated successfully' };
  }

  static async getMe(userId: string) {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isSuspended) {
      throw new ForbiddenError('Account is suspended');
    }

    await AuthRepository.updateLastLogin(user.id);

    const profile: UserAuthProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      forcePasswordReset: user.forcePasswordReset,
      lastLoginAt: user.lastLoginAt,
    };

    return profile;
  }

  static async googleOAuth(data: { email: string; name: string; avatarUrl?: string }) {
    let user = await AuthRepository.findByEmail(data.email);

    if (user) {
      if (!user.avatarUrl && data.avatarUrl) {
        await AuthRepository.updateAvatar(user.id, data.avatarUrl);
        user.avatarUrl = data.avatarUrl;
      }
    } else {
      const dummyPassword = Math.random().toString(36).slice(-10) + '!A1z';
      const passwordHash = await bcrypt.hash(dummyPassword, 10);
      const avatarUrl = data.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(data.name)}`;

      user = await AuthRepository.createUserWithGamification({
        name: data.name,
        email: data.email,
        passwordHash,
        avatarUrl,
      });
    }

    await AuthRepository.updateLastLogin(user.id);
    const tokens = this.generateTokens(user);

    const profile: UserAuthProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      forcePasswordReset: user.forcePasswordReset,
      lastLoginAt: user.lastLoginAt,
    };

    return { profile, tokens };
  }
}
