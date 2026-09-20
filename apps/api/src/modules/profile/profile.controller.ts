import { FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from './profile.service';
import { handleControllerError, sendSuccess } from '../../utils/response';

export class ProfileController {
  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const requestedLocale = (request.headers['accept-language'] || 'en')
      .split(',')[0]
      .trim()
      .substring(0, 2);

    try {
      const profile = await ProfileService.getFullProfile(request.user.userId, requestedLocale);
      profile.impersonatedBy = request.user.impersonatedBy;
      return sendSuccess(reply, profile);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not load profile dashboard stats');
    }
  }

  static async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { name, avatarUrl } = request.body as { name?: string; avatarUrl?: string };

    try {
      const updated = await ProfileService.updateProfile(request.user.userId, { name, avatarUrl });
      return sendSuccess(reply, updated);
    } catch (error) {
      return handleControllerError(reply, error, 'Failed to update profile');
    }
  }

  static async claimDailyWarmup(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    try {
      const result = await ProfileService.claimDailyWarmup(request.user.userId, request.ip);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Failed to claim daily warmup');
    }
  }
}
