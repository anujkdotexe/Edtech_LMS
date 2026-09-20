import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { LeaderboardService } from './leaderboard.service';
import { serverEnv } from '../../config';
import { handleControllerError, sendSuccess } from '../../utils/response';

function getOptionalUserId(request: FastifyRequest): string | null {
  const activeToken = request.cookies.impersonationToken || request.cookies.token;
  if (!activeToken) return null;
  try {
    const decoded = jwt.verify(activeToken, serverEnv.JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
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
