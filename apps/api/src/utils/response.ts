import { FastifyReply } from 'fastify';
import { AppError } from '../errors';

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send(data);
}

export function handleControllerError(reply: FastifyReply, error: any, defaultMessage = 'Internal Server Error') {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
    });
  }

  // Handle Postgres unique constraint violation
  if (error?.code === '23505') {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: 'A record with this identifier already exists',
    });
  }

  console.error('[ERROR] Unexpected handler exception:', error);
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: defaultMessage,
  });
}
