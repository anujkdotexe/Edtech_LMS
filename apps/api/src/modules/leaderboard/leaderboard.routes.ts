import { FastifyInstance } from 'fastify';
import { LeaderboardController } from './leaderboard.controller';
import * as schemas from '../../schemas';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: schemas.leaderboardSchema }, LeaderboardController.getLeaderboard);
}
