import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { serverEnv } from '../../config';
import { UserRole } from '@lms/types';

export const verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  const impersonationToken = request.cookies.impersonationToken;
  const token = request.cookies.token;

  // Impersonation token has priority if developer is actively taking over student account
  const activeToken = impersonationToken || token;

  if (!activeToken) {
    reply.status(401).send({ error: 'Unauthorized', message: 'No active session token found' });
    return;
  }

  try {
    const decoded = jwt.verify(activeToken, serverEnv.JWT_SECRET) as {
      userId: string;
      role: UserRole;
      impersonatedBy?: string;
    };
    
    request.user = {
      userId: decoded.userId,
      role: decoded.role,
      impersonatedBy: decoded.impersonatedBy,
    };
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
  }
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
