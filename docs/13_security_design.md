# 13. Security Design Document

## 1. Web Security Shield Configurations

### CORS Policies
The standalone Fastify backend applies a strict origin filter. It rejects any automated browser connection originating from non-allowlisted clients:

```typescript
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

export async function configureSecurity(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('CORS violation: Origin rejected'), false);
    },
    credentials: true, // Allow exchange of secure cookies (token/refreshToken)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
}
```

### XSS & Session Stealing Mitigation
- **HttpOnly Cookies**: All sessions (`token`, `refreshToken`, `impersonationToken`) are served with the `HttpOnly` directive. This prevents client-side JavaScript (`document.cookie`) from reading token data, neutralizing Cross-Site Scripting (XSS) session stealing vectors.
- **SameSite=Lax**: Controls automatic session cookie transmission in third-party navigation requests, preventing CSRF clickjacking attacks.

---

## 2. Input Sanitization & Parameter Validation

### Ajv / Zod Validation Integration
Fastify is configured with strict request validation handlers. Any inbound POST payload is immediately parsed and verified using schemas before reaching controller logic:

```typescript
import { z } from 'zod';
import { FastifySchema } from 'fastify';

// Compile Zod Schema into native AJV validators
export const signupValidationSchema: FastifySchema = {
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email(),
    password: z.string().min(6).max(72),
    avatarUrl: z.string().url().optional()
  })
};
```

---

## 3. SQL Injection Prevention

We use **Drizzle ORM** for all database queries. Drizzle prevents SQL injection out-of-the-box by converting raw inputs into parameterized queries:

```typescript
// SECURE: Automatically compiled as parameterized query: SELECT * FROM users WHERE email = $1;
const matchedUsers = await db.select().from(users).where(eq(users.email, userInputEmail));
```

---

## 4. Comprehensive Audit Trails & Log Safety

To capture developer takeover behavior:
- All administrative requests record audit events in the `audit_logs` table containing: UserID, ImpersonatedByID (if active), Event Action (e.g., `impersonate_start`), Target Details, IP Address, and timestamp.
- **Sensitive Data Scrubbing**: High-volume system telemetry streams (Fastify Logger) are configured to parse and scrub fields matching `password`, `token`, `passwordHash` before committing records to files or consoles.
