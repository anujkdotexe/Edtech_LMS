import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { serverEnv } from '../../config';
import { loginSchema, signupSchema } from '@lms/validations';
import { getCookieOptions } from './auth.middleware';

// 1. SIGNUP HANDLER
export const signupHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Validate input request body using Zod schema
  const parseResult = signupSchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.status(400).send({ error: 'Validation Error', messages: parseResult.error.errors.map(e => e.message) });
    return;
  }

  const { name, email, password, avatarUrl } = parseResult.data;

  // Check if user already exists
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existingUser.length > 0) {
    reply.status(400).send({ error: 'Bad Request', message: 'A user with this email address already exists' });
    return;
  }

  try {
    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user inside a database transaction to ensure XP and Streaks are initialized
    await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(schema.users).values({
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        avatarUrl: avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(name),
      }).returning();

      // Initialize default user XP (0 XP, Level 1)
      await tx.insert(schema.userXp).values({
        userId: newUser.id,
        totalXp: 0,
        level: 1,
      });

      // Initialize default streak (0 streak)
      await tx.insert(schema.userStreaks).values({
        userId: newUser.id,
        currentStreak: 0,
        longestStreak: 0,
      });
    });

    reply.status(201).send({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('[ERROR] Error during signup:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Something went wrong during registration' });
  }
};

// 2. LOGIN HANDLER
export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Validate input request body using Zod schema
  const parseResult = loginSchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.status(400).send({ error: 'Validation Error', messages: parseResult.error.errors.map(e => e.message) });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    // Fetch user from DB
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (users.length === 0) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    const user = users[0];

    // Check if account is suspended
    if (user.isSuspended) {
      reply.status(403).send({ error: 'Forbidden', message: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Check credentials match
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
      return;
    }

    // Generate token payloads
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const isProduction = serverEnv.NODE_ENV === 'production';

    // Mint Access Token (expires in 15 minutes)
    const token = jwt.sign(payload, serverEnv.JWT_SECRET, { expiresIn: '15m' });

    // Mint Refresh Token (expires in 7 days)
    const refreshToken = jwt.sign({ userId: user.id }, serverEnv.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Inject secure HttpOnly cookies
    reply.setCookie('token', token, getCookieOptions(isProduction, 900)); // 15 mins
    reply.setCookie('refreshToken', refreshToken, getCookieOptions(isProduction, 604800)); // 7 days

    // Clear impersonation token to prevent developer carryover on fresh student logins
    reply.clearCookie('impersonationToken', { path: '/' });

    reply.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      forcePasswordReset: user.forcePasswordReset,
    });
  } catch (error) {
    console.error('[ERROR] Error during login:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Something went wrong during login' });
  }
};

// 3. REFRESH HANDLER
export const refreshHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Refresh token cookie is missing' });
    return;
  }

  try {
    // Verify refresh token signature
    const decoded = jwt.verify(refreshToken, serverEnv.JWT_REFRESH_SECRET) as { userId: string };

    // Fetch user details to ensure session validity
    const users = await db.select().from(schema.users).where(eq(schema.users.id, decoded.userId)).limit(1);
    if (users.length === 0) {
      reply.status(401).send({ error: 'Unauthorized', message: 'User session has expired' });
      return;
    }

    const user = users[0];
    const isProduction = serverEnv.NODE_ENV === 'production';

    // Mint fresh Access Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      serverEnv.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Refresh cookies
    reply.setCookie('token', token, getCookieOptions(isProduction, 900));

    reply.status(200).send({ success: true });
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
  }
};

// 4. LOGOUT HANDLER
export const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const isProduction = serverEnv.NODE_ENV === 'production';
  
  // Revoke cookies
  reply.clearCookie('token', { path: '/' });
  reply.clearCookie('refreshToken', { path: '/' });
  reply.clearCookie('impersonationToken', { path: '/' });

  reply.status(200).send({ success: true, message: 'Logged out successfully' });
};

// 5. FORGOT PASSWORD HANDLER
export const forgotPasswordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email } = request.body as { email: string };
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (users.length > 0) {
      const user = users[0];
      const resetToken = jwt.sign({ userId: user.id }, serverEnv.JWT_SECRET, { expiresIn: '1h' });
      // In a real app, send an email here via AWS SES or Resend
      console.log(`\n\n=== MOCK EMAIL SERVICE ===\nTo: ${email}\nSubject: Password Reset\nLink: ${serverEnv.FRONTEND_URL}/reset-password?token=${resetToken}\n==========================\n`);
    }
    // Always return success to prevent email enumeration
    reply.status(200).send({ success: true, message: 'If an account exists, a reset link was sent.' });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 6. RESET PASSWORD HANDLER
export const resetPasswordHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { token, newPassword } = request.body as { token: string; newPassword: string };
  try {
    const decoded = jwt.verify(token, serverEnv.JWT_SECRET) as { userId: string };
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, decoded.userId));
    reply.status(200).send({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired token' });
  }
};

// 7. GOOGLE OAUTH HANDLER (WITH ACCOUNT MERGING)
export const googleOAuthHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, name, avatarUrl } = request.body as { email: string; name: string; avatarUrl?: string };

  try {
    // Check if user already exists
    let users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    let user;

    if (users.length > 0) {
      // 1. Account Merging: Link Google login dynamically to the existing profile
      user = users[0];
      
      // Update avatarUrl if the existing profile had none
      if (!user.avatarUrl && avatarUrl) {
        await db.update(schema.users).set({ avatarUrl }).where(eq(schema.users.id, user.id));
        user.avatarUrl = avatarUrl;
      }
    } else {
      // 2. First-time registration: Create student account inside transaction
      const defaultAvatar = avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(name);
      
      user = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(schema.users).values({
          name,
          email,
          passwordHash: await bcrypt.hash(Math.random().toString(36).substring(2, 10) + 'GoOgLe!', 10), // secure random placeholder
          role: 'STUDENT',
          avatarUrl: defaultAvatar,
        }).returning();

        // Initialize default user XP (0 XP, Level 1)
        await tx.insert(schema.userXp).values({
          userId: newUser.id,
          totalXp: 0,
          level: 1,
        });

        // Initialize default streak (0 streak)
        await tx.insert(schema.userStreaks).values({
          userId: newUser.id,
          currentStreak: 0,
          longestStreak: 0,
        });

        return newUser;
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      reply.status(403).send({ error: 'Forbidden', message: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Mint token payloads
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const isProduction = serverEnv.NODE_ENV === 'production';

    // Generate cookies
    const token = jwt.sign(payload, serverEnv.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, serverEnv.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    reply.setCookie('token', token, getCookieOptions(isProduction, 900));
    reply.setCookie('refreshToken', refreshToken, getCookieOptions(isProduction, 604800));
    reply.clearCookie('impersonationToken', { path: '/' });

    reply.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      forcePasswordReset: user.forcePasswordReset,
    });
  } catch (error) {
    console.error('[ERROR] Error during Google OAuth:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Something went wrong during Google OAuth' });
  }
};

