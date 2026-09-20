import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { verifyJWT } from './auth.middleware';
import * as schemas from '../../schemas';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/signup', { schema: schemas.signupSchema }, AuthController.signup);
  fastify.post('/login', { schema: schemas.loginSchema }, AuthController.login);
  fastify.post('/refresh', { schema: schemas.refreshSchema }, AuthController.refresh);
  fastify.post('/logout', { schema: schemas.logoutSchema }, AuthController.logout);
  fastify.post('/forgot-password', { schema: schemas.forgotPasswordSchema }, AuthController.forgotPassword);
  fastify.post('/reset-password', { schema: schemas.resetPasswordSchema }, AuthController.resetPassword);
  fastify.post('/google', { schema: schemas.googleOAuthSchema }, AuthController.googleOAuth);
  fastify.get('/me', { schema: schemas.getMeSchema, preHandler: [verifyJWT] }, AuthController.getMe);
}
