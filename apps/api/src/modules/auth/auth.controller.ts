import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { serverEnv } from '../../config';
import { getCookieOptions } from './auth.middleware';
import { loginSchema, signupSchema } from '@lms/validations';
import { handleControllerError, sendSuccess } from '../../utils/response';

export class AuthController {
  static async signup(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = signupSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        messages: parseResult.error.errors.map((e) => e.message),
      });
    }

    try {
      const { profile, tokens } = await AuthService.signup(parseResult.data);
      const isProduction = serverEnv.NODE_ENV === 'production';

      reply.setCookie('token', tokens.token, getCookieOptions(isProduction, 900));
      reply.setCookie('refreshToken', tokens.refreshToken, getCookieOptions(isProduction, 604800));
      reply.clearCookie('impersonationToken', { path: '/' });

      return sendSuccess(reply, profile, 201);
    } catch (error) {
      return handleControllerError(reply, error, 'Something went wrong during registration');
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        messages: parseResult.error.errors.map((e) => e.message),
      });
    }

    try {
      const { profile, tokens } = await AuthService.login(parseResult.data);
      const isProduction = serverEnv.NODE_ENV === 'production';

      reply.setCookie('token', tokens.token, getCookieOptions(isProduction, 900));
      reply.setCookie('refreshToken', tokens.refreshToken, getCookieOptions(isProduction, 604800));
      reply.clearCookie('impersonationToken', { path: '/' });

      return sendSuccess(reply, profile, 200);
    } catch (error) {
      return handleControllerError(reply, error, 'Something went wrong during login');
    }
  }

  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token cookie is missing',
      });
    }

    try {
      const { token } = await AuthService.refresh(refreshToken);
      const isProduction = serverEnv.NODE_ENV === 'production';
      reply.setCookie('token', token, getCookieOptions(isProduction, 900));

      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Failed to refresh token');
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('token', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
    reply.clearCookie('impersonationToken', { path: '/' });

    return sendSuccess(reply, { success: true, message: 'Logged out successfully' });
  }

  static async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as { email: string };
    try {
      const result = await AuthService.forgotPassword(email);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error processing password reset request');
    }
  }

  static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, newPassword } = request.body as { token: string; newPassword: string };
    try {
      const result = await AuthService.resetPassword(token, newPassword);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error resetting password');
    }
  }

  static async getMe(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.userId;
    if (!userId) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });
    }

    try {
      const profile = await AuthService.getMe(userId);
      return sendSuccess(reply, profile);
    } catch (error) {
      return handleControllerError(reply, error, 'Failed to fetch current user');
    }
  }

  static async googleOAuth(request: FastifyRequest, reply: FastifyReply) {
    const { email, name, avatarUrl } = request.body as { email: string; name: string; avatarUrl?: string };
    try {
      const { profile, tokens } = await AuthService.googleOAuth({ email, name, avatarUrl });
      const isProduction = serverEnv.NODE_ENV === 'production';

      reply.setCookie('token', tokens.token, getCookieOptions(isProduction, 900));
      reply.setCookie('refreshToken', tokens.refreshToken, getCookieOptions(isProduction, 604800));
      reply.clearCookie('impersonationToken', { path: '/' });

      return sendSuccess(reply, profile);
    } catch (error) {
      return handleControllerError(reply, error, 'Google OAuth failed');
    }
  }
}
