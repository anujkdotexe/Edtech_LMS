# 15. Monitoring & Logging Strategy

## 1. High-Performance Server Logging (Pino)

Our Fastify backend uses **Pino**, an extremely fast JSON logger, to stream structured events. Because raw console writes degrade latency, Pino streams logs asynchronously to `stdout`.

### Security Redaction Blueprint
To prevent compliance issues, Pino is configured to intercept and mask sensitive parameters in log payloads:

```typescript
import Fastify from 'fastify';

export const loggerConfig = {
  development: {
    transport: {
      target: 'pino-pretty', // Readable formatted console logs locally
      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
    }
  },
  production: {
    // Structured JSON logs in production
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.password',
        'body.passwordConfirm',
        'body.token'
      ],
      censor: '[REDACTED]'
    }
  }
};
```

---

## 2. Global Exception Tracking (Sentry)

Sentry is integrated on both runtimes to capture unhandled promise rejections and database connection timeouts:

### A. Next.js Frontend Integration
- Captures React hydration issues, edge routing failures, and global window exceptions.
- Breadcrumbs are configured to log navigation changes and Zustand slice transactions.

### B. Fastify Backend Integration
- Integrated via a centralized Fastify error handler:
  ```typescript
  import * as Sentry from '@sentry/node';

  fastify.setErrorHandler((error, request, reply) => {
    // 1. Log to standard console output
    request.log.error(error);

    // 2. Stream unhandled 500 errors to Sentry
    if (!error.statusCode || error.statusCode >= 500) {
      Sentry.withScope((scope) => {
        scope.setUser({ id: request.user?.id, email: request.user?.email });
        scope.setTag('impersonated', !!request.user?.impersonatedBy ? 'true' : 'false');
        Sentry.captureException(error);
      });
      return reply.status(500).send({ error: 'Internal Server Error', message: 'An unexpected system error occurred' });
    }

    // 3. Return client validation / business logic errors
    return reply.status(error.statusCode).send({ error: error.name, message: error.message });
  });
  ```

---

## 3. Database Audit Trail Logging

All administrative operations and Developer session takeovers must write a structured log directly to the `audit_logs` table:

```typescript
interface AuditParams {
  userId: string;
  impersonatedBy?: string; // Stored if dev-impersonation was active
  action: string; // e.g. "student_import", "course_delete", "dev_takeover_start"
  details: string; // JSON payload describing changes
  ipAddress?: string;
}

export async function writeAuditTrail(db: any, params: AuditParams) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    impersonatedBy: params.impersonatedBy || null,
    action: params.action,
    details: params.details,
    ipAddress: params.ipAddress || null,
  });
}
```
