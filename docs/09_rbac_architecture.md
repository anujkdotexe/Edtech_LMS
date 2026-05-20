# 09. Role-Based Access Control (RBAC) Document

## Role Hierarchy & Action Matrix

Our authorization layer enforces a strict three-tier hierarchy where **Developer** accounts inherit all permissions from **Admin**, which in turn control all resources except lower-level system configurations:

| Feature / Action | Student | Admin | Developer | Enforced Backend Check |
|---|:---:|:---:|:---:|---|
| **View Catalog / Quizzes** | ✓ | ✓ | ✓ | `verifyJWT` |
| **Complete Lesson / Quiz** | ✓ | ✓ | ✓ | `verifyJWT` (as user/impersonated) |
| **Buy / Unlock Courses** | ✓ | ✓ | ✓ | `verifyJWT` (mock payment trigger) |
| **Manage Course Content (CMS)**| ✗ | ✓ | ✓ | `checkRole(['ADMIN', 'DEVELOPER'])` |
| **Bulk Import Students (CSV)** | ✗ | ✓ | ✓ | `checkRole(['ADMIN', 'DEVELOPER'])` |
| **Assign Course Direct** | ✗ | ✓ | ✓ | `checkRole(['ADMIN', 'DEVELOPER'])` |
| **View Audit / Request Logs** | ✗ | ✗ | ✓ | `checkRole(['DEVELOPER'])` |
| **Takeover Session (Impersonate)**| ✗ | ✗ | ✓ | `checkRole(['DEVELOPER'])` |
| **Reset Database / Migrations**| ✗ | ✗ | ✓ | `checkRole(['DEVELOPER'])` |

---

## Fastify RBAC Decorator & Middleware

Role validation happens at the server level on every endpoint. If validation fails, a `403 Forbidden` JSON block is returned immediately.

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';

// Fastify authentication and authorization hooks
export const checkRole = (allowedRoles: ('STUDENT' | 'ADMIN' | 'DEVELOPER')[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. verifyJWT hook executes first and appends decoded user claims to request.user
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }

    // 2. Resolve roles (Developers inherit Admin permissions)
    const userRole = request.user.role;
    const hasPermission = allowedRoles.includes(userRole) || 
      (userRole === 'DEVELOPER' && allowedRoles.includes('ADMIN'));

    if (!hasPermission) {
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: `Role '${userRole}' is not authorized to access this resource` 
      });
    }
  };
};
```

---

## Endpoint Rules Integration Example

```typescript
import { FastifyInstance } from 'fastify';
import { verifyJWT } from '../../middleware/verifyJWT';
import { checkRole } from '../../middleware/checkRole';

export async function adminRoutes(fastify: FastifyInstance) {
  // Apply verifyJWT first, then checkRole for all routes in this block
  fastify.addHook('onRequest', verifyJWT);

  // Administrative Endpoint to Create Courses
  fastify.post('/courses', { preHandler: [checkRole(['ADMIN'])] }, async (request, reply) => {
    // Execute course creation logic...
  });

  // Developer Endpoint to View System Telemetry
  fastify.get('/telemetry', { preHandler: [checkRole(['DEVELOPER'])] }, async (request, reply) => {
    // Extract server stats...
  });
}
```
