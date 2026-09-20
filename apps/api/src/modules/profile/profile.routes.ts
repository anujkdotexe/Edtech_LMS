import { FastifyInstance } from 'fastify';
import { ProfileController } from './profile.controller';
import { verifyJWT } from '../auth/auth.middleware';
import * as schemas from '../../schemas';

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: schemas.profileSchema, preHandler: [verifyJWT] }, ProfileController.getProfile);
  fastify.put('/', { schema: schemas.updateProfileSchema, preHandler: [verifyJWT] }, ProfileController.updateProfile);
  fastify.get('/warmup', { schema: schemas.getDailyWarmupSchema, preHandler: [verifyJWT] }, ProfileController.getDailyWarmup);
  fastify.post('/warmup/claim', { schema: schemas.claimWarmupSchema, preHandler: [verifyJWT] }, ProfileController.claimDailyWarmup);
}
