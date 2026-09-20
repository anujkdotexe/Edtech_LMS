import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { LeaderboardService } from './leaderboard.service';
import { serverEnv } from '../../config';
import { handleControllerError, sendSuccess } from '../../utils/response';

function getOptionalUserId(request: FastifyRequest): string | null {
  const { impersonationToken, token: primaryToken } = request.cookies;

  if (impersonationToken) {
    try {
      const decoded = jwt.verify(impersonationToken, serverEnv.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      // Impersonation token expired or invalid: fall back to primary session
    }
  }

  if (primaryToken) {
    try {
      const decoded = jwt.verify(primaryToken, serverEnv.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  return null;
}

export class LeaderboardController {
  static async getLeaderboard(request: FastifyRequest, reply: FastifyReply) {
    const currentUserId = getOptionalUserId(request);
    try {
      const result = await LeaderboardService.getLeaderboard(currentUserId);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch leaderboards');
    }
  }
}
