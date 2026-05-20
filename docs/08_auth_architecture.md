# 08. Authentication Architecture

## JWT Lifecycle & Cookie Management

The platform utilizes a robust, stateless access token pattern coupled with database-tracked refresh tokens for secure and seamless session rotation:

```text
Student Login
   │
   ├── Validates credentials via bcrypt
   ├── Generates short-lived Access Token (JWT, 15m expiration)
   ├── Generates long-lived Refresh Token (JWT, 7d expiration)
   └── Returns payload and sets secure HttpOnly cookies:
        ├── Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=900
        └── Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

### Cookie Directive Matrix

| Cookie Name | Purpose | Expiration | Security Directives |
|---|---|---|---|
| `token` | Access Token containing claims: `userId`, `role`, `impersonatedBy` | 15 Minutes | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| `refreshToken` | Rotation token containing a unique session signature | 7 Days | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth` |

---

## Refresh Token Rotation Flow

To guarantee safety against credential hijacking:
1. When the `token` cookie expires (returns `401 Unauthorized`), the client triggers a POST `/api/auth/refresh`.
2. The Fastify backend extracts the `refreshToken` cookie, verifies the JWT signature, and checks the database user record.
3. If valid, a new access token is minted and a fresh `token` cookie is set.
4. If a refresh token is reused or tampered with, all active sessions for that student are immediately invalidated (force logout).

---

## Impersonation Cookie Architecture

When a Developer impersonates a student:
- The backend generates a temporary access token signed with the student's ID, but adds a claims property: `impersonatedBy: "dev-user-uuid"`.
- This token is saved in a special cookie `impersonationToken`.
- The Fastify auth middleware (`verifyJWT`) checks for this cookie first. If present, it executes the request in the context of the student, but records the dev's identity in all audit trails.

---

## Local Development vs. Production Settings

To run the platform locally without requiring complex SSL configuration:

```typescript
// Fastify Cookie configuration helper
export const getCookieOptions = (isProduction: boolean, maxAgeSeconds: number) => ({
  path: '/',
  secure: isProduction, // Set to true only in HTTPS production
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: maxAgeSeconds,
});
```
