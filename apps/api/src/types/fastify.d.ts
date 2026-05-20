import { UserRole } from '@lms/types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      role: UserRole;
      impersonatedBy?: string;
    };
  }
}
