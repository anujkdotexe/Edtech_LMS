# 20. Sprint & Milestone Planning Document

This document breaks down our 20-day delivery lifecycle into 4 operational Sprints, each defining precise deliverables and success parameters.

---

## The 20-Day Timeline Overview

```text
  Day 1     Day 5       Day 10      Day 15      Day 20
  ├─────────┼───────────┼───────────┼───────────┤
  Sprint 1  Sprint 2    Sprint 3    Sprint 4    Launch
```

---

## Sprint 1: Monorepo Foundation, Database Modeling & Auth (Days 1–5)

### Core Objective
Setup the workspaces, database schemas, local migration scripts, and baseline session credentials flows.

### Milestones & Deliverables
- **M1.1**: Successful resolution of all monorepo configs (`package.json`, `pnpm-workspace.yaml`, `tsconfig.json`).
- **M1.2**: PostgreSQL tables generated via Drizzle ORM and successfully seeded with core courses (A1-C2) and quiz question banks.
- **M1.3**: Authenticated JWT signup, login, refresh token, and cookie rotation endpoints fully tested in Fastify.
- **M1.4**: Next.js main layout layouts completed (Responsive sidebars, active link indicators).

---

## Sprint 2: Course syllabus & MCQ Quiz Board (Days 6–10)

### Core Objective
Build the reading syllabus player and the interactive multiple-choice question slide board.

### Milestones & Deliverables
- **M2.1**: Course Catalog displaying Level filters, Unlocked vs. Locked states.
- **M2.2**: Split-pane Course Player containing dynamic local PDF viewer deck.
- **M2.3**: 14-Card MCQ Quiz Board with inline option select transitions and correct/incorrect slide-over sound cards.
- **M2.4**: Exit confirmation popup dialog that blocks navigation mid-quiz and tracks history losses.

---

## Sprint 3: The Gamification Loop & Live Leaderboards (Days 11–15)

### Core Objective
Program the core game engines on the server and construct rolling rank boards.

### Milestones & Deliverables
- **M3.1**: Server-side XP evaluation logic (+20 XP lessons, +50 XP quizzes, +10 XP warmups) and auto-leveling updates.
- **M3.2**: Streak engine tracking daily consecutive visits and daily midnight UTC check crons.
- **M3.3**: Achievement module evaluating the 7 core badges on any XP write.
- **M3.4**: Leaderboard page displaying top 100 students, current student highlight, and motivational empty states.

---

## Sprint 4: Admin CMS, Dev Impersonation & Final Audit (Days 16–20)

### Core Objective
Build administrative control grids, developer takeover features, system telemetry dashboards, and run complete validation sweeps.

### Milestones & Deliverables
- **M4.1**: Admin CourseCMS: dynamic forms to add module/lesson routes, upload PDFs, and drag/drop reordering.
- **M4.2**: Student CSV importer (`name,email`) generating random temporary passwords printed in system logs.
- **M4.3**: Developer Impersonation: one-click target student taker, audit log writer, absolute yellow takeover indicator banner.
- **M4.4**: All API routes and gamification tests passing 100% in Vitest/Supertest.
