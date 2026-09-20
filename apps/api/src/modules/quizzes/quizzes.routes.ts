import { FastifyInstance } from 'fastify';
import { QuizzesController } from './quizzes.controller';
import { verifyJWT } from '../auth/auth.middleware';
import * as schemas from '../../schemas';

export async function quizzesRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: schemas.quizzesSchema }, QuizzesController.getAllQuizzes);
  fastify.get('/:id', { schema: schemas.quizByIdSchema, preHandler: [verifyJWT] }, QuizzesController.getQuizQuestions);
  fastify.post('/:id/submit', { schema: schemas.submitQuizSchema, preHandler: [verifyJWT] }, QuizzesController.submitQuizAnswers);
}
