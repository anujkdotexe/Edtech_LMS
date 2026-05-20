# 19. Core Platform Implementation Plan

This document maps the sequential, component-by-component implementation phases from empty monorepo configs to final local deployment and validation.

---

## Phased Building Schedule

```text
 PHASE 1: FOUNDATION (Days 1-4)
   ├── Setup pnpm monorepo workspace & packages configurations (ESLint, TSConfig)
   ├── Create Drizzle schema models and local migrations engine
   └── Seed Postgres with courses (A1-C2), questions, and users

 PHASE 2: AUTH & COURSE catalog (Days 5-8)
   ├── Code Fastify JWT authentication, cookies, and checkRole middleware
   ├── Build Course Catalog and Course Player (PDF documents deck viewer)
   └── Build Mock Checkout Payment Flow (SUCCESS/FAIL routes)

 PHASE 3: GAMIFICATION & QUIZZES (Days 9-12)
   ├── Construct 14-Card MCQ Quiz Board with inline validation animations
   ├── Code Gamification Engine: XP calculations, Streak counter, Achievements
   └── Write Weekly rolling Leaderboard queries and window ranks

 PHASE 4: DASHBOARD & TELEMETRY (Days 13-16)
   ├── Build Admin CRM: Drag-and-drop syllabus organizer, CSV student import
   ├── Build Developer Impersonation & logs tracking panel
   └── Execute full Vitest/Supertest validation sweeps
```

---

## Detailed Component Action Plan

### Phase 1: Foundation & Database Modeling
- **Action**: Compile `schema.ts` inside `apps/api/src/db` based on the normalized physical schema.
- **Verification**: Execute `pnpm run db:generate` followed by `pnpm run db:push` to compile local PostgreSQL tables. Run `seed.ts` script to populate the courses and quizzes.

### Phase 2: Session Security & Reading Viewer
- **Action**: Implement Fastify JWT signing, verification middleware (`verifyJWT`), and cookies. Configure split-pane PDF reader layout.
- **Verification**: Fire requests to `/api/auth/login` using REST Client files, checking that headers respond with valid `Set-Cookie` directives.

### Phase 3: MCQ Quiz Slide Deck & Score Calculation
- **Action**: Build Next.js card-slider showing one question at a time. The final slide calls POST `/api/quizzes/:id/submit`, triggering server evaluation, updating UserXP and UserStreaks, and unlocking badges.
- **Verification**: Run Vitest scripts verifying level progression math (e.g. 500 XP = level 3).

### Phase 4: Administrative CMS & Developer Telemetry
- **Action**: Build CSV parser processing `name,email` files. Assemble absolute-positioned warning banner that triggers on developer takeover, logging impersonated actions to database audit logs.
- **Verification**: Manually activate dev impersonation, take a quiz as a target student, check the `audit_logs` table has mapped both developer ID and student ID.
