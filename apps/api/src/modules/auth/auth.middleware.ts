import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { serverEnv } from '../../config';
import { UserRole } from '@lms/types';

export const verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  const impersonationToken = request.cookies.impersonationToken;
  const primaryToken = request.cookies.token;

  let decoded: {
    userId: string;
    role: UserRole;
    impersonatedBy?: string;
  } | null = null;

  if (impersonationToken) {
    try {
      decoded = jwt.verify(impersonationToken, serverEnv.JWT_SECRET) as {
        userId: string;
        role: UserRole;
        impersonatedBy?: string;
      };
    } catch {
      // Impersonation token expired or invalid: clear cookie and fall back to primary session
      reply.clearCookie('impersonationToken', { path: '/' });
    }
  }

  if (!decoded && primaryToken) {
    try {
      decoded = jwt.verify(primaryToken, serverEnv.JWT_SECRET) as {
        userId: string;
        role: UserRole;
      };
    } catch {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
      return;
    }
  }

  if (!decoded) {
    reply.status(401).send({ error: 'Unauthorized', message: 'No active session token found' });
    return;
  }

  request.user = {
    userId: decoded.userId,
    role: decoded.role,
    impersonatedBy: decoded.impersonatedBy,
  };
};

export const checkRole = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Forbidden', message: 'Insufficient role permissions' });
      return;
    }
  };
};
export const getCookieOptions = (isProduction: boolean, maxAgeSeconds: number) => ({
  path: '/',
  secure: isProduction, // Set to true only in HTTPS production
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: maxAgeSeconds,
});
