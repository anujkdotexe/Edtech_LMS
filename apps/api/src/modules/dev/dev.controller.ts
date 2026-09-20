import { FastifyRequest, FastifyReply } from 'fastify';
import { DevService } from './dev.service';
import { serverEnv } from '../../config';
import { getCookieOptions } from '../auth/auth.middleware';
import { handleControllerError, sendSuccess } from '../../utils/response';

export class DevController {
  static async impersonate(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'DEVELOPER') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Only developers can utilize impersonation tools' });
    }

    const { studentEmail } = request.body as { studentEmail?: string };
    if (!studentEmail) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Target student email is required' });
    }

    try {
      const { impersonating, impersonationToken } = await DevService.impersonate(
        studentEmail,
        request.user.userId,
        request.ip
      );
      const isProduction = serverEnv.NODE_ENV === 'production';
      reply.setCookie('impersonationToken', impersonationToken, getCookieOptions(isProduction, 3600));

      return sendSuccess(reply, {
        success: true,
        impersonating,
        message: 'Session switched successfully. Impersonation warning banner activated.',
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Something went wrong during impersonation');
    }
  }

  static async unimpersonate(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !request.user.impersonatedBy) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No active impersonation session found' });
    }

    try {
      await DevService.unimpersonate(request.user.userId, request.user.impersonatedBy, request.ip);
      reply.clearCookie('impersonationToken', { path: '/' });

      return sendSuccess(reply, {
        success: true,
        message: 'Impersonation ended. Developer session restored.',
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Something went wrong when ending impersonation');
    }
  }

  static async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { limit?: string; offset?: string };
    const limit = parseInt(query.limit || '20');
    const offset = parseInt(query.offset || '0');

    try {
      const logs = await DevService.getAuditLogs(limit, offset);
      return sendSuccess(reply, logs);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch audit logs');
    }
  }

  static async getSystemHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await DevService.getSystemHealth();
      return sendSuccess(reply, health);
    } catch (error) {
      return handleControllerError(reply, error, 'Diagnostics failed');
    }
  }

  static async adminOverride(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { targetUserId, action, value } = request.body as {
      targetUserId?: string;
      action?: 'AWARD_XP' | 'RESET_STREAK' | 'REVOKE_COURSE';
      value?: any;
    };

    if (!targetUserId || !action) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'targetUserId and action parameters are required',
      });
    }

    try {
      const result = await DevService.adminOverride({
        targetUserId,
        action,
        value,
        devUserId: request.user.userId,
        ip: request.ip,
      });
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Override failed');
    }
  }

  static async getFeatureFlags(request: FastifyRequest, reply: FastifyReply) {
    try {
      const flags = await DevService.getFeatureFlags();
      return sendSuccess(reply, { flags });
    } catch (error) {
      return handleControllerError(reply, error, 'Error fetching feature flags');
    }
  }

  static async toggleFeatureFlag(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { key, enabled } = request.body as { key: string; enabled: boolean };
    try {
      const flag = await DevService.toggleFeatureFlag(key, enabled, request.user.userId);
      return sendSuccess(reply, { success: true, flag });
    } catch (error) {
      return handleControllerError(reply, error, 'Error toggling feature flag');
    }
  }

  static async getCacheKeys(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await DevService.getCacheKeys();
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error fetching cache keys');
    }
  }

  static async deleteCacheKey(request: FastifyRequest, reply: FastifyReply) {
    const key = decodeURIComponent((request.params as { key: string }).key);
    try {
      const result = await DevService.deleteCacheKey(key);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error deleting cache key');
    }
  }

  static async getReconciliationReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await DevService.getReconciliationReport();
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error generating reconciliation report');
    }
  }

  static async getQueueMonitor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await DevService.getQueueMonitor();
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Error fetching queue monitor');
    }
  }

  static async getAdvancedLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await DevService.getAdvancedLogs();
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Failed to fetch advanced logs');
    }
  }
}
