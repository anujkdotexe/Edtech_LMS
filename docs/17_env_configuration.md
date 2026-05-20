# 17. Environment Variables Configuration

To prevent system runtime boot crashes due to missing or mismatched configuration files, all process environments are evaluated and validated against rigid **Zod Schemas** at application startup.

---

## 1. Backend Environment Configurations (`apps/api`)

### The Backend Schema Definition
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env parameters
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL connection string is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  UPLOAD_DIR: z.string().default('public/uploads'),
});

const result = serverEnvSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid Backend Environment configuration:', result.error.format());
  process.exit(1);
}

export const serverEnv = result.data;
```

---

## 2. Frontend Environment Configurations (`apps/web`)

### The Frontend Schema Definition
```typescript
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
});

const result = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
});

if (!result.success) {
  console.error('❌ Invalid Frontend Environment configuration:', result.error.format());
  throw new Error('Invalid Frontend Environment configuration');
}

export const clientEnv = result.data;
```

---

## 3. Combined Local `.env` Template

Create this file at the monorepo root `e:/LMS/.env` for local testing:

```ini
# Environment Runtime
NODE_ENV=development
PORT=4000

# Client Bindings
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Storage Database (Local Postgres Default / swap for Neon later)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lms_gamified

# Cryptographic Signatures (Must be 32+ characters)
JWT_SECRET=supersecretsigningkeymustbeatleast32charslong!!!
JWT_REFRESH_SECRET=anotherhighlysecretrefreshsigningkeyatleast32charslong!!!

# Local storage configuration
UPLOAD_DIR=public/uploads
```
