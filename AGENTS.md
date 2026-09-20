# AGENTS.md — Antigravity LMS Developer Guide

## Project Overview

**Antigravity LMS** is a gamified, multilingual language learning platform. Students learn languages (French, Spanish, etc.) structured by CEFR levels (A1–C2), earn XP, build streaks, unlock badges, and compete on leaderboards. Admins manage courses, students, and payments. Developers have a control panel for impersonation, feature flags, and system monitoring.

**Stack**: Fastify API + Next.js frontend + PostgreSQL via Drizzle ORM + pnpm monorepo.

---

## Monorepo Structure

```
e:/LMS/
├── apps/
│   ├── api/                    # Fastify backend (port 4000)
│   └── web/                    # Next.js frontend (port 3000)
├── packages/
│   ├── types/                  # Shared TypeScript types (@lms/types)
│   ├── validations/            # Zod schemas for request validation (@lms/validations)
│   ├── api-contracts/          # Shared API response types (@lms/api-contracts)
│   ├── utils/                  # Shared utility functions (@lms/utils)
│   ├── ui/                     # Shared React component library (@lms/ui)
│   ├── eslint-config/          # Shared ESLint config
│   └── tsconfig/               # Shared TypeScript configs
├── docs/                       # All product & technical documentation (25 files)
├── AGENTS.md                   # This file — project guide for agents/devs
├── CODING_STANDARDS.md         # Coding rules (no emojis, log prefixes, etc.)
├── .env                        # Root env file (loaded by both apps)
├── pnpm-workspace.yaml         # Workspace definition
└── start.ps1 / start.bat       # Dev server startup scripts
```

---

## Backend — `apps/api/`

### Entry Point & Registration

All routes are registered in a single file:

```
apps/api/src/
├── index.ts                    # Server init, plugin registration, all route registration
├── config.ts                   # Zod-validated environment variables (serverEnv)
├── schemas.ts                  # ALL Fastify route schemas (Swagger + validation)
├── db/
│   ├── schema.ts               # Drizzle ORM table definitions (single source of truth)
│   ├── index.ts                # DB connection export (db)
│   ├── migrations/             # Auto-generated migration SQL files
│   ├── seed.ts                 # Dev data seeder
│   └── migrate.ts              # Migration runner
└── modules/                    # Business logic by domain (Clean MVC)
    ├── auth/                   # auth.controller, auth.service, auth.repository, auth.routes, auth.types, auth.middleware
    ├── courses/                # courses.controller, courses.service, courses.repository, courses.routes, courses.types
    ├── quizzes/                # quizzes.controller, quizzes.service, quizzes.repository, quizzes.routes, quizzes.types
    ├── profile/                # profile.controller, profile.service, profile.repository, profile.routes, profile.types
    ├── leaderboard/            # leaderboard.controller, leaderboard.service, leaderboard.repository, leaderboard.routes, leaderboard.types
    ├── dev/                    # dev.controller, dev.service, dev.repository, dev.routes, dev.types
    └── admin/                  # admin.controller, admin.service, admin.repository, admin.routes, admin.types
```

### Module Architecture (Clean MVC — 100% Completed)

All domain modules follow strict internal MVC separation:
- **Controller** (`*.controller.ts`) — handles HTTP: extracts parameters/body, calls service, sends reply.
- **Service** (`*.service.ts`) — pure business logic: validates invariants, coordinates repositories, manages transactions.
- **Repository** (`*.repository.ts`) — isolated Drizzle ORM database access layer.
- **Routes** (`*.routes.ts`) — exports Fastify route plugin with Fastify schemas and auth preHandlers.
- **Types** (`*.types.ts`) — module-specific DTOs and parameter contracts.

### Route Registration Convention

All routes are registered in `index.ts` in numbered groups:
1. Health + Public settings
2. Auth routes (`/api/auth/*`)
3. Course catalog (`/api/courses/*`)
4. Quizzes (`/api/quizzes/*`)
5. Profile (`/api/profile`)
6. Leaderboard (`/api/leaderboard`)
7. Dev control (`/api/dev/*`)
8. Admin student CRM (`/api/admin/students/*`)
9. Admin payments (`/api/admin/payments/*`)
10. Admin settings (`/api/admin/settings`)
11. Admin content management (`/api/admin/courses/:id/modules`, `/api/admin/modules/*`, `/api/admin/lessons/*`)
12. Admin quiz management (`/api/admin/quizzes/*`, `/api/admin/questions/*`)
13. Admin analytics (`/api/admin/analytics/*`)
14. Dev feature flags (`/api/dev/feature-flags`)
15. Dev cache (`/api/dev/cache`)
16. Dev reconciliation + queue (`/api/dev/reconciliation`, `/api/dev/queue`)

### Schema Registration Convention

Every route MUST have a matching schema object in `apps/api/src/schemas.ts`. No route is registered without a schema. This powers Swagger and request validation.

### Auth Middleware

```typescript
verifyJWT         // Decodes token cookie → populates request.user
checkRole([...])  // Checks request.user.role against allowed list
```

Usage pattern:
```typescript
preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])]
```

---

## Database — Schema Reference

**File**: `apps/api/src/db/schema.ts` — Drizzle ORM definitions. This is the **single source of truth** for the DB structure.

### Tables

| Table | Purpose |
|---|---|
| `users` | All user accounts (STUDENT, ADMIN, DEVELOPER roles) |
| `user_xp` | XP total and level per user (1:1 with users) |
| `user_streaks` | Current streak, longest streak, last active date (1:1 with users) |
| `user_badges` | Unlocked badge records per user (1:N with users) |
| `courses` | Course entity (CEFR level, price, published flag) |
| `course_translations` | Localized title + description per course per locale |
| `modules` | Ordered modules within a course |
| `module_translations` | Localized title per module per locale |
| `lessons` | Ordered lessons within a module (filePath, lessonType, duration) |
| `lesson_translations` | Localized title + summary per lesson per locale |
| `quizzes` | Quiz entity (difficulty, pointValue) |
| `quiz_translations` | Localized title + rules per quiz per locale |
| `quiz_questions` | MCQ questions (A/B/C/D options + correctOption) |
| `quiz_attempts` | Student quiz submissions (score, passed, correctCount, totalQuestions) |
| `orders` | Purchase records (status: PENDING/SUCCESS/FAILED/REFUNDED) |
| `audit_logs` | Immutable activity log for all sensitive actions |
| `site_config` | Key-value store for site settings (banner, tips, maintenance mode) |
| `daily_warmup_completions` | Server-side daily warmup XP gate (user_id + date PK) |
| `lesson_completions` | Lesson-level progress tracking (user_id + lesson_id unique) |
| `feature_flags` | Persistent feature flag store (replaces in-memory) |

### Migration Workflow

```bash
# After editing schema.ts:
cd apps/api
pnpm run db:generate   # Creates SQL migration in db/migrations/
pnpm run db:push       # Applies migration to connected DB
```

---

## Frontend — `apps/web/`

### Directory Structure

```
apps/web/src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout: nav, auth guard, sidebar (610 lines — being split)
│   ├── page.tsx                # Student homepage dashboard (68KB monolith — being split)
│   ├── globals.css             # Global styles + skeleton animations
│   ├── admin/                  # Admin panel pages
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── students/           # Student CRM
│   │   ├── courses/            # Course management
│   │   ├── quizzes/            # Quiz management
│   │   ├── payments/           # Payment management
│   │   └── settings/           # Site settings
│   ├── courses/                # Student course pages
│   ├── quizzes/                # Student quiz pages
│   ├── leaderboard/            # Leaderboard page
│   ├── profile/                # Student profile page
│   ├── login/                  # Login page
│   └── reset-password/         # Password reset page
├── store/
│   └── useAuthStore.ts         # Zustand global auth state
└── lib/
    └── api.ts                  # apiFetch wrapper (credentials: include, Accept-Language)
```

### State Management

Single Zustand store: `useAuthStore`. Contains:
- `user: UserProfile | null` — full profile including stats, badges, history
- `isAuthenticated: boolean`
- `isLoading: boolean`
- Actions: `fetchProfile`, `login`, `signup`, `googleLogin`, `logout`, `unimpersonate`

Auth hydration currently calls `GET /api/profile` on every page load (heavy — being replaced with `GET /api/auth/me`).

### Component Architecture (Current vs Target)

**Current state**: `layout.tsx` (610 lines) and `page.tsx` (68KB) are monolithic files with no component extraction.

**Target state** (microlithic MVC): All UI split into focused, reusable components. See Architecture section.

---

## Shared Packages

| Package | Import | Contents |
|---|---|---|
| `@lms/types` | `packages/types/` | Shared TypeScript interfaces for users, courses, quizzes, orders |
| `@lms/validations` | `packages/validations/` | Zod schemas: `loginSchema`, `signupSchema`, etc. Used in API handlers for body validation |
| `@lms/api-contracts` | `packages/api-contracts/` | Typed API response shapes shared between frontend and backend |
| `@lms/utils` | `packages/utils/` | Shared utility functions (date formatting, XP math, etc.) |
| `@lms/ui` | `packages/ui/` | Shared React component library (Button, Card, Badge, Skeleton, etc.) |

---

## Documentation Index

All product and technical documentation lives in `docs/`:

| File | Contents |
|---|---|
| `01_prd.md` | Product Requirements Document |
| `02_trd.md` | Technical Requirements Document |
| `03_ui_ux_design.md` | UI/UX design guidelines |
| `04_appflow.md` | Application user flow |
| `05_backend_schema.md` | Database schema documentation |
| `06_api_spec.md` | API endpoint specification |
| `07_folder_structure.md` | Target folder structure |
| `08_auth_architecture.md` | JWT + HttpOnly cookie auth design |
| `09_rbac_architecture.md` | Role-Based Access Control design |
| `10_gamification_engine.md` | XP/streak/badge math and rules |
| `11_database_design.md` | DB design decisions and indexing |
| `12_state_management.md` | Frontend Zustand state design |
| `13_security_design.md` | Security model and threat mitigations |
| `14_deployment_architecture.md` | Deployment topology |
| `15_monitoring_logging.md` | Logging and monitoring approach |
| `16_testing_strategy.md` | Testing approach and coverage targets |
| `17_env_configuration.md` | Environment variable reference |
| `18_internationalization.md` | i18n approach (translations tables + Accept-Language) |
| `19_implementation_plan.md` | Original sprint implementation plan |
| `20_sprint_planning.md` | 20-day sprint breakdown |
| `21_er_diagram.md` | Entity-Relationship diagram |
| `22_component_architecture.md` | Target component architecture |
| `23_admin_dashboard.md` | Admin dashboard feature spec |
| `24_developer_dashboard.md` | Developer panel feature spec |
| `25_comprehensive_feature_map.md` | All 90+ features with implementation status |

---

## Target Architecture — MVC + Microlithic Component Design

### Backend: MVC per Module

Each domain module should follow this internal structure:

```
modules/courses/
├── courses.controller.ts   # Route handler functions (thin — validate input, call service, send reply)
├── courses.service.ts      # Business logic (DB queries, transformations, validations)
├── courses.repository.ts   # DB access layer (all Drizzle queries isolated here)
├── courses.routes.ts       # Route registration for this module (imported by index.ts)
└── courses.types.ts        # Module-specific types/interfaces
```

**Controller** — handles HTTP: extracts params/body, calls service, returns reply. No business logic.

**Service** — pure business logic: orchestrates DB calls, enforces rules (access control, invariants), returns typed data. No Fastify types.

**Repository** — raw DB queries only. Takes typed inputs, returns Drizzle result types. No business logic.

**Routes** — exports a Fastify plugin function that registers routes for this module with their schemas and preHandlers.

Example:
```typescript
// courses.repository.ts
export async function findCourseById(courseId: string) {
  return db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
}

// courses.service.ts
export async function getCourseWithSyllabus(courseId: string, locale: string) {
  const [course] = await CourseRepository.findCourseById(courseId);
  if (!course) throw new NotFoundError('Course not found');
  // ... assemble syllabus with filtered translations
  return assembled;
}

// courses.controller.ts
export async function getCourseByIdController(request, reply) {
  const { id } = request.params;
  const locale = request.headers['accept-language']?.split('-')[0] || 'en';
  const course = await CourseService.getCourseWithSyllabus(id, locale);
  reply.status(200).send(course);
}
```

### Frontend: Microlithic Component Architecture

Break monolithic page files into focused, reusable components:

```
apps/web/src/
├── app/                        # Pages only — thin shells that compose components
├── components/                 # Reusable UI components
│   ├── ui/                     # Primitives: Button, Card, Badge, Avatar, Skeleton, Modal, Input
│   ├── layout/                 # AppShell, Sidebar, Navbar, MobileSidebar
│   ├── auth/                   # LoginForm, SignupForm, ForgotPasswordForm
│   ├── gamification/           # XpBar, StreakBadge, BadgeGrid, LevelTag
│   ├── courses/                # CourseCard, CourseGrid, SyllabusTree, LessonRow
│   ├── quizzes/                # QuizCard, QuizQuestion, QuizResult, ProgressBar
│   ├── admin/                  # StudentTable, PaymentTable, CourseEditor, QuizEditor
│   ├── dev/                    # FeatureFlagRow, AuditLogTable, HealthGrid
│   └── shared/                 # SkeletonCard, EmptyState, ErrorBoundary, RoleBadge
├── hooks/                      # Custom React hooks
│   ├── useProfile.ts           # Fetches and caches user profile
│   ├── useCourses.ts           # Course catalog fetching
│   ├── useLeaderboard.ts       # Leaderboard fetching
│   └── useAdminStudents.ts     # Admin student list management
├── store/
│   └── useAuthStore.ts         # Auth state only (not profile data)
└── lib/
    ├── api.ts                  # apiFetch with 401 auto-refresh
    └── constants.ts            # Route constants, XP math constants
```

### Component Rules

1. **One responsibility per component** — a `CourseCard` renders a course card. It does not fetch data.
2. **Data fetching in hooks** — all API calls live in `hooks/` or in page-level components. UI components receive props only.
3. **Skeleton variants** — every data-fetching component must have a `isLoading` prop that renders a skeleton instead of content.
4. **No inline styles** — use Tailwind classes only (project already uses TailwindCSS).
5. **Error boundaries** — wrap all page sections in an `ErrorBoundary` component.
6. **Shared primitives from `@lms/ui`** — Button, Input, Card, Badge, Modal, Skeleton are defined once in the shared package and imported across the app.

---

## Environment Variables

**File**: `e:/LMS/.env` (monorepo root, loaded by both apps)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key (min 32 chars) |
| `JWT_RESET_SECRET` | Yes | Password reset token signing key (min 32 chars) |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `PORT` | No | API port (default: 4000) |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |
| `UPLOAD_DIR` | No | Local file upload directory (default: public/uploads) |

---

## Dev Server Startup

```bash
# From monorepo root — starts both API and Web simultaneously
.\start.ps1        # PowerShell
start.bat          # Command Prompt

# Or individually:
cd apps/api && pnpm run dev   # API on :4000
cd apps/web && pnpm run dev   # Web on :3000
```

**API endpoints**:
- REST API: `http://localhost:4000/api/*`
- Swagger UI: `http://localhost:4000/docs/swagger`
- API health portal: `http://localhost:4000/docs`
- Raw health check: `http://localhost:4000/health`

---

## Coding Standards

Full rules in `CODING_STANDARDS.md`. Summary:

- **No emojis** in source code. Use `[OK]`, `[ERROR]`, `[WARN]`, `[INFO]` as log prefixes.
- **Zod validation** on all request body inputs. Use schemas from `@lms/validations`.
- **Transactions** for any mutation touching more than one table.
- **No full-table-scans** for counts — use `db.select({ count: count() }).from(table)`.
- **Batch DB queries** with `inArray` — never loop DB calls.
- **Monetary values** — Drizzle returns `numeric` as strings. Use `Number()` only at arithmetic points, never `parseFloat()`.
- **No in-memory state** — no module-level objects used as production state.
- **HttpOnly cookies only** — never store JWTs in localStorage or sessionStorage.
- **Role guard** on every protected route: `preHandler: [verifyJWT, checkRole(['ADMIN'])]`.

---

## Key Architectural Rules (Non-Negotiable)

1. **Gamification transactions**: XP + level + streak + badge sweep must always be in a single `db.transaction()`. Never split across multiple queries.
2. **correctOption never in client response**: `GET /api/quizzes/:id` must never return `correctOption`. Only the submit handler reads it server-side.
3. **i18n fallback order**: `Accept-Language header → en → first available row`.
4. **Warmup XP is server-gated**: `daily_warmup_completions` table with `(user_id, completed_date)` composite PK. No client-side tracking.
5. **Lesson completion is server-tracked**: `lesson_completions` table. Course progress is derived from DB, not localStorage.
6. **Feature flags are DB-persisted**: `feature_flags` table. Never in-memory module objects.
7. **Role routing**: ADMIN → `/admin`, DEVELOPER → `/dev`, STUDENT → `/`. Enforced by both Next.js middleware (server) and useEffect guard (client).
