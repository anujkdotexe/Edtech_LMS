# 16. Testing Strategy Document

## 1. Testing Infrastructure (Vitest)

We employ **Vitest** for our testing suite. It runs directly on native ESM configurations, shares Vitest caching strategies, and executes test suites concurrently.

```text
   Operational Testing Targets
   ├── Unit Tests (Gamification math, Zod validations, next-intl selectors)
   ├── Integration Tests (Supertest API router checks, JWT expiration rotations)
   └── Flow Simulations (Mock payments webhook outcomes, Developer taking control)
```

---

## 2. Unit Testing: Gamification Logic

Our game mechanic calculations are strictly verified through isolated unit tests.

### Test Matrix for Gamification Engine

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateLevel } from '@lms/utils';
import { BADGE_REGISTRY } from './badgeRegistry';

describe('Gamification Calculations', () => {
  it('should accurately calculate levels in increments of 250 XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(249)).toBe(1);
    expect(calculateLevel(250)).toBe(2);
    expect(calculateLevel(1250)).toBe(6);
  });

  it('should trigger badge unlock when criteria is met', () => {
    const fireStarterBadge = BADGE_REGISTRY.find(b => b.id === 'fire_starter')!;
    
    // Streak is too low
    expect(fireStarterBadge.evaluator({ quizAttempts: 0, completedLessons: 0, level: 1, streak: 2, perfectQuizzes: 0, unlockedCourses: 1 })).toBe(false);
    
    // Streak is sufficient
    expect(fireStarterBadge.evaluator({ quizAttempts: 0, completedLessons: 0, level: 1, streak: 3, perfectQuizzes: 0, unlockedCourses: 1 })).toBe(true);
  });
});
```

---

## 3. Integration Testing: Simulated Payment Webhooks

We verify our mock purchase infrastructure by writing automated integration tests that simulate successful and failed webhook payloads:

```typescript
import supertest from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../src/app'; // Fastify application entry

describe('Mock Checkout API Flows', () => {
  it('should unlock the course on SUCCESS outcomes', async () => {
    const response = await supertest(app.server)
      .post('/api/courses/some-course-id/purchase')
      .send({ simulatedStatus: 'SUCCESS' })
      .set('Cookie', ['token=mock-valid-student-jwt']);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.message).toContain('unlocked');
  });

  it('should reject access and return order failure on FAILED outcomes', async () => {
    const response = await supertest(app.server)
      .post('/api/courses/some-course-id/purchase')
      .send({ simulatedStatus: 'FAILED' })
      .set('Cookie', ['token=mock-valid-student-jwt']);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe('FAILED');
  });
});
```

---

## 4. Integration Testing: Dev Takeover Session (Impersonation)

Tests must guarantee that:
1. Only authenticated Developer roles can access `/api/dev/impersonate`. Standard users and admins must return a `403 Forbidden`.
2. When the developer initiates a takeover, the returned cookies set an `impersonationToken`.
3. Actions executed under impersonation successfully log both `userId` (student) and `impersonatedBy` (developer) into the system audit tables.
