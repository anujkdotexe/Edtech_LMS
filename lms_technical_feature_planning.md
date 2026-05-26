# LMS Gamified Platform - Technical Feature Planning

This document serves as the comprehensive technical planning blueprint for the gamified Learning Management System (LMS). It outlines the architecture, data structures, relative monorepo files, REST API boundaries, database schemas, and data flow sequences for the Student, Admin, and Developer personas.

---

## 🛡️ Architecture Overview

The platform uses a modern, high-performance monorepo architecture:
- **Frontend App**: Next.js 14 App Router, TypeScript, and Tailwind CSS. Client states are coordinated via Zustand.
- **Backend API**: Fastify v4, TypeScript, and Drizzle ORM.
- **Database Engine**: PostgreSQL for transactional state, student profiles, streak tracking, and payment audits.
- **Session Authentication**: Stateless JSON Web Tokens (JWT) stored in HTTP-only secure cookies to protect against XSS and CSRF.

---

## 🎓 1. Student Learner Module

The Student module is designed to keep learners engaged through micro-learning vocabulary modules, CEFR-difficulty quiz catalogs, instant feedback loops, and visual gamification streaks.

### A. Authentication & Onboarding
- **Email Login & Signup**: standard username/password credentials. Signups prompt immediate selection of responsive pixel-art vector seeds mapping character avatars.
- **Google Social OAuth**: Enables federated single-sign-on (SSO). Callback exchanges auth tokens and seeds initial learner state columns (0 XP, 0 Streak) dynamically.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/login/page.tsx` (Sign-in / sign-up wizard UI)
  - `apps/api/src/modules/auth/auth.handlers.ts` (Bcrypt authentication & JWT generation)
  - `apps/api/src/schemas.ts#loginSchema` (Ajv validation constraints)
- **Database Schema**:
  - `users` table: Holds `name`, `email`, `passwordHash`, `avatarUrl`, `role` (enum STUDENT, ADMIN, DEVELOPER), and `isSuspended` columns.
- **Data Flow Sequence**:
  ```
  [Next.js Client Login] ----> POST /api/auth/login ----> [Fastify API Gateway]
                                                                |
                                                      [SELECT FROM users]
                                                                v
  [Sets HTTP-only Cookie] <--- 200 OK User Profile <--- [Validate Hash via Bcrypt]
  ```

### B. Gamified Dashboard & Streaks
- **Personalized Header**: Uses client system time offsets to render customized greeting tags ('Good morning', 'Good evening').
- **Streak Flame Indicator**: Tracks consecutive days active. Quiz submissions update last active timestamps, incrementing streak levels or resetting them if inactive for over 36 hours.
- **XP Level Progress Bar**: Awards XP on quiz completions. Milestones occur at 250 XP increments. Renders current level bounds and calculates remaining XP ratios dynamically.
- **Warmup Vocabulary Deck**: Triggers a daily 30-second vocabulary warm-up card deck modal on first login to anchor cognitive engagement.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/layout.tsx` (Decoupled headers, streaks, levels renderers)
  - `apps/api/src/modules/profile/profile.handlers.ts` (Drizzle SELECT aggregations)
- **Database Schema**:
  - `user_xp` table: Holds `userId`, `totalXp` (integer), `level` (integer), and `updatedAt` columns.
  - `user_streaks` table: Holds `userId`, `currentStreak` (integer), `longestStreak` (integer), and `lastActiveDate` (date) columns.

### C. MCQ Quiz Engine
- **Quiz Catalog**: Fetches list of all active MCQs filtering by languages and CEFR tags.
- **Quiz Session**: Renders questions one at a time. Saves student choices inside active memory states.
- **Result Metrics**: Submission calculates scores. Updates streak dates, awards XP reward blocks, triggers level milestones, and writes attempt history records.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/quizzes/[id]/page.tsx` (Interactive session states)
  - `apps/api/src/modules/quizzes/quizzes.handlers.ts` (Attempts evaluator)
- **Database Schema**:
  - `quizzes` table: Holds `id`, `courseId`, `xpReward`, `passingScore`, and `title`.
  - `questions` table: Holds `id`, `quizId`, `orderIndex`, `questionText`, `options` (text array), and `correctAnswer`.
  - `quiz_attempts` table: Holds `id`, `userId`, `quizId`, `score`, `passed` (boolean), and `attemptedAt`.

---

## 💼 2. Administrative Console

The Admin Console manages CRM records, bulk seeds students, updates syllabus modules, and audits transaction receipts.

### A. Customer Relationship Management (CRM)
- **Student Ledger**: Search, filter, and paginate through registered STUDENT role records. Lists XP, streaks, levels, and active courses.
- **Suspension Actions**: Toggle accounts active or suspended. Suspended accounts instantly reject authentication JWT requests.
- **Temporary Password Reset**: Forces standard resets to 'password123', writing a `forcePasswordReset` flag requesting password updates on next student login.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/admin/students/page.tsx` (CRM dashboard layout)
  - `apps/api/src/modules/admin/students.handlers.ts` (CRM database executors)
- **Database Schema**:
  - `users` table: Updates `isSuspended` and `forcePasswordReset` columns.
  - `audit_logs` table: Inserts operational history codes tracking administrator actions.
- **Data Flow Sequence**:
  ```
  [Admin CRM Grid] ----> POST /api/admin/students/:id/suspend ----> [Fastify]
                                                                       |
                                                           [UPDATE users table]
                                                                       v
  [Suspended State Badge] <----- 200 OK (isSuspended: true) <---- [INSERT audit_logs]
  ```

### B. Syllabus Course Creator
- **Syllabus Config**: Creates, edits, and deletes courses. Configures pricing models, localized categories, and draft parameters.
- **Course modules & lessons**: Structures chapters inside courses. Custom drag-and-drop systems update chronological order indexes.
- **Courseware PDF Syllabus Manager**: Integrates multipart form upload streams. Writes files to local upload catalogs, referencing files paths inside lesson tables.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/admin/courses/[id]/page.tsx` (Syllabus structuring UI)
  - `apps/api/src/modules/admin/content.handlers.ts` (Multipart file stream processors)
- **Database Schema**:
  - `courses` table: Holds CEFR constraints, pricing, isPublished status.
  - `modules` table: Holds module headers, sorting order index keys.
  - `lessons` table: Holds lesson titles, modular relationships, and local files path strings.

---

## 💻 3. Developer System Shell

The Developer Shell integrates low-level system logs, impersonation modules, database migrators, and hardware gauges.

### A. Diagnostics & Security Logs
- **API Request Tracker**: Monitors method pathways, HTTP response statuses, and execution latencies.
- **Database transaction viewer**: Streams SQL execution paths triggered via Drizzle ORM to intercept slow operations and N+1 query bottlenecks.
- **Razorpay webhooks logs**: Captures incoming payloads, logging event handlers results.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/dev/page.tsx` (Developer panel layout and logs viewer)
  - `apps/api/src/modules/dev/dev.handlers.ts` (Diagnostics logs queries handlers)
- **Database Schema**:
  - `audit_logs` table: Reads developer actions, credential takeovers, and override events.

### B. Sandbox overrides & takeover
- **User impersonation takeover**: Temporarily takes control of student accounts. Overwrites active JWT tokens, logging target student IDs in an `impersonatedBy` flag while keeping original developer cookies credentials.
- **Gamification overrides**: Awards arbitrary XP blocks or resets streaks immediately to test active UI states.
- **Relative Monorepo Paths**:
  - `apps/web/src/app/layout.tsx` (Impersonation notification bar)
  - `apps/api/src/modules/dev/dev.handlers.ts#impersonateHandler` (Auth state hijack)
- **Data Flow Sequence**:
  ```
  [Dev Console] ----> POST /api/dev/impersonate (targetEmail) ----> [Fastify]
                                                                        |
                                                            [Verify DEV credentials]
                                                                        |
  [Render warning bar] <--- Sets Impersonated JWT Cookie <--- [Insert audit_logs entry]
  ```

### C. Infrastructure Health Monitors
- **Diagnostics auto-probes**: Backend `/docs` endpoint automatically runs async queries on load, checking connection pools, storage directories, and HTTP codes without manual action.
- **Hardware gauges**: Compiles CPU cores, server RAM allocations, and uptime.
- **Relative Monorepo Paths**:
  - `apps/api/src/templates/docs.html` (Auto-probing diagnostics UI)
  - `apps/api/src/modules/dev/dev.handlers.ts#getSystemHealthHandler` (OS system calls scanner)
