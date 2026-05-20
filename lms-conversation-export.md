# Gamified LMS — Full Conversation Export

> **Project**: Duolingo-style Gamified Learning Management System
> **Exported**: May 20, 2026
> **Stack Decision**: Next.js 14 + Fastify + PostgreSQL (Neon) + Vercel

---

## Table of Contents

1. [Initial Stack Recommendation](#1-initial-stack-recommendation)
2. [Fully Custom Backend Stack](#2-fully-custom-backend-stack)
3. [Full Project Spec (Images)](#3-full-project-spec-images)
4. [Vercel vs Railway Decision](#4-vercel-vs-railway-decision)
5. [Role-Based Feature Map](#5-role-based-feature-map)

---

## 1. Initial Stack Recommendation

### Prompt
> "I am going to work on a project which is an educational LMS — like Duolingo — which will have courses to learn languages etc. I want to know which tech stack would be best.
>
> **Core Features (Phase 1 Scope)**:
> - Authentication: Secure Login/Signup with Google OAuth
> - Course Catalog with progress tracking
> - Gamification: Streaks, XP & Levels, Leaderboards
> - Quiz System: 14-card quiz modules with instant feedback
> - Payment Infrastructure (Dodo or Razorpay)
> - Admin Dashboard: manage students, revenue, content (PDF etc.)"

### Response

#### Core Stack

**Frontend — Next.js 14+ (App Router)**
Best choice for SSR, file-based routing, built-in API routes, and Vercel deployment. Duolingo itself is React-based.

**Styling — Tailwind CSS + shadcn/ui**
Tailwind for utility-first speed, shadcn for high-quality accessible components. Add **Framer Motion** for micro-animations — streak flames, XP popups, level-up animations.

**Backend — Next.js API Routes + tRPC**
Co-located backend with end-to-end type safety between frontend and backend. Zero boilerplate, huge productivity win for a small team.

**Database — PostgreSQL via Supabase**
Postgres for relational LMS data, built-in Row Level Security, real-time subscriptions (live leaderboards), generous free tier. Handles Google OAuth out of the box via Supabase Auth.

**ORM — Prisma**
Clean schema definition, auto-generated types, pairs perfectly with Postgres and tRPC.

---

#### Gamification Layer

| Feature | Approach |
|---|---|
| XP & Levels | Postgres table: `user_xp`, computed level thresholds |
| Streaks | Daily cron job resets streak if no activity |
| Leaderboards | Supabase real-time query on `user_xp` table, ranked |
| Badges | JSON config-driven badge definitions, awarded via server logic |

---

#### Payments

**Razorpay** — India-based (Mumbai), so Razorpay wins over Dodo. Better INR support, UPI, netbanking, EMI, developer-friendly API. Use Payment Links for quick setup, then Orders API for custom checkout.

---

#### Admin Dashboard

Two options:
- **Supabase Studio** (free, instant) — works for early days
- **Custom Admin Panel** in Next.js with role-based access — Phase 2

For content uploads (PDFs, videos): **Cloudflare R2** (S3-compatible, no egress fees) or Supabase Storage.

---

#### Infrastructure & Deployment

| Layer | Tool |
|---|---|
| Hosting | Vercel |
| Database | Supabase (managed Postgres) |
| File Storage | Supabase Storage → Cloudflare R2 at scale |
| Emails | Resend |
| Analytics | PostHog |

---

#### Full Stack Summary

```
Next.js 14 (App Router)
├── Tailwind CSS + shadcn/ui + Framer Motion
├── tRPC (type-safe API layer)
├── Prisma ORM
├── Supabase (Auth + Postgres + Storage + Realtime)
├── Razorpay (payments)
├── Resend (transactional email)
├── Vercel (deployment + cron jobs)
└── PostHog (analytics)
```

---

#### What to Avoid

- **Firebase** — NoSQL is a poor fit for relational LMS data
- **WordPress/LearnDash** — hits walls fast on gamification customization
- **Separate Express backend** — unnecessary when Next.js API routes + tRPC cover needs
- **Redux** — overkill; use Zustand for global state

---

#### Suggested Build Order

- **Phase 1** → Auth + Course Catalog + Basic Quiz System + Razorpay checkout
- **Phase 2** → XP/Streaks/Leaderboard engine + Progress tracking
- **Phase 3** → Admin dashboard + Content management + Analytics

---

## 2. Fully Custom Backend Stack

### Prompt
> "What if we make everything like the whole backend which is personalized? Which has everything?"

### Response

#### Revised Architecture

```
Next.js (Frontend) ←→ Fastify API Server (Backend) ←→ PostgreSQL
```

**Frontend** — Next.js 14+ (App Router) — stays the same.

**Backend — Node.js + Fastify**
Dedicated backend server, separate from Next.js. Fastify over Express: significantly faster, built-in schema validation, cleaner plugin architecture.

**Authentication — Custom JWT + Passport.js**
- Access Token (short-lived, 15min) + Refresh Token (long-lived, 7–30 days)
- Google OAuth via `passport-google-oauth20`
- Access token in memory/React state, Refresh token in httpOnly cookie (secure against XSS)
- Password hashing with bcrypt

**Database — PostgreSQL (raw, self-managed)**
Host on Railway, Render, or Hetzner VPS. Use Drizzle ORM — lightweight, fully type-safe, feels like writing SQL. Better than Prisma's abstraction layer for a custom backend.

**File Storage — Cloudflare R2**
Direct API, no AWS dependency, no egress fees. Signed URLs for secure PDF/video delivery.

**Email — Nodemailer + SMTP or Resend API**
Streak reminders, welcome emails, quiz results — all triggered from Fastify server.

---

#### Database Schema Design

```sql
-- Users & Auth
users, refresh_tokens, oauth_accounts

-- Content
courses, modules, lessons, lesson_content (PDF/video/text)

-- Gamification
user_xp, user_streaks, user_badges, leaderboard_snapshots

-- Quizzes
quizzes, quiz_questions, quiz_attempts, quiz_answers

-- Payments
orders, transactions, subscriptions

-- Admin
admin_users, audit_logs, content_uploads
```

---

#### Gamification — Built From Scratch

```
Streak Engine
├── Cron job runs daily at midnight
├── Checks last_active_date per user
├── Increments or resets streak
└── Sends email if streak at risk

XP Engine
├── Lesson completed → +XP event fired
├── Quiz passed → +XP based on score
├── XP thresholds define levels (1–50)
└── Badge triggers evaluated on each XP event

Leaderboard
├── Materialized view or scheduled snapshot
├── Weekly reset option
└── REST endpoint: GET /leaderboard?period=weekly
```

---

#### Full Custom Stack Summary

```
Frontend
└── Next.js 14 + Tailwind + shadcn/ui + Framer Motion + Zustand

Backend (fully custom)
├── Fastify (API server)
├── Drizzle ORM
├── PostgreSQL (on Railway or Hetzner VPS)
├── JWT Auth + Passport.js (Google OAuth)
├── BullMQ + Redis (background jobs: streaks, emails, XP events)
├── Cloudflare R2 (file storage)
├── Razorpay (payments)
└── Nodemailer / Resend (emails)

Infrastructure
├── Backend → Railway / Render / Hetzner VPS
├── Frontend → Vercel
├── DB → Railway Postgres or self-hosted
├── Cache/Queue → Upstash Redis (managed, free tier)
└── Monitoring → Better Stack or Sentry
```

---

#### BullMQ + Redis — Background Job Queue

| Job | Trigger |
|---|---|
| Streak check & reset | Daily cron |
| XP level-up notification | After lesson complete |
| Welcome email | After signup |
| Payment confirmation email | After Razorpay webhook |
| Leaderboard snapshot | Every hour |
| Badge evaluation | After any XP event |

---

#### Trade-offs: Supabase vs Fully Custom

| | Supabase Approach | Fully Custom |
|---|---|---|
| Speed to build | Fast | Slower |
| Control | Limited | Total |
| Scalability | Good | Excellent |
| Cost at scale | Can get expensive | Cheaper |
| Auth flexibility | Limited | Unlimited |
| Maintenance burden | Low | Higher |

---

#### Honest Recommendation

- **1–2 developers, move fast** → Supabase stack for Phase 1, migrate pieces to custom as you scale
- **3+ months runway, build it right** → Go fully custom. Own your data, no ceiling, fraction of cost at scale

---

## 3. Full Project Spec (Images)

### Prompt
> *(User uploaded 4 images showing a full screen-by-screen breakdown document titled "What we require in Initial Release (15–20 Days)")*

### Spec Summary from Images

#### Screen 1 — Login & Signup
| Item | Details |
|---|---|
| Login Page | Email + Password login with background design |
| Sign Up Page | Name, Avatar selection (12 avatars), Email, Password |
| Forgot Password | Email-based password reset with link |
| Form Validations | All input checks and error messages |

#### Screen 2 — Home Dashboard
| Item | Details |
|---|---|
| Welcome Section | Personalized greeting with user name |
| Stats Display | Streak, Level, Total Score cards |
| 30-Second Warmup | Quick vocabulary practice with timer |
| Quick Links | Daily Quiz card + Leaderboard preview card |
| Daily Tip | Rotating learning tips section |

#### Screen 3 — Quiz Catalog
| Item | Details |
|---|---|
| Quiz Listing | All 14 quiz cards in a grid |
| Card Design | Emoji, title, difficulty badge, points, question count |
| Color Coding | Green (Easy), Orange (Medium), Red (Hard) |
| Quiz Rules | Rules section at the bottom |

#### Screen 4 — Quiz Play
| Item | Details |
|---|---|
| Question Display | One question at a time with 4 options |
| Answer Selection | Click to select, visual feedback |
| Progress Tracking | Progress bar showing question number |
| Score Calculation | Points counted based on correct answers |
| Result Screen | Final score, Try Again, Back to Quizzes |
| Exit Confirmation | Warning popup if user tries to leave mid-quiz |

#### Screen 5 — Courses Catalog
| Item | Details |
|---|---|
| Course Listing | 8 course cards (A1 to C2 + 2 Premium) |
| Card Design | Level badge, title, video count, hours, price |
| Locked/Purchased States | Visual indicator for each course |
| CEFR Guide | Level explanation section at the bottom |
| Filter Tags | Category filter pills at the top |

#### Screen 6 — Course Detail & Purchase
| Item | Details |
|---|---|
| Course Header | Level badge, title, description, stats |
| Syllabus | Module list with titles and video counts |
| Price Display | Course price with Unlock button |
| Purchase Flow | Secure payment form + confirmation |
| Purchase CTA | Bottom section with unlock prompt |

#### Screen 7 — Leaderboard
| Item | Details |
|---|---|
| Rankings Table | Rank, Student name, Level, Streak, Score |
| Stats Header | First Place, Total Learners, Longest Streak |
| User Highlight | Current user row highlighted |
| Empty State | Motivational message for new users |

#### Screen 8 — Profile
| Item | Details |
|---|---|
| User Info | Avatar, name, streak, level display |
| Stats Grid | Score, Level, Streak, Rank (4 cards) |
| Achievements | 7 badge cards (locked/unlocked) |
| Activity Feed | Recent activity list |
| Level Progress | XP progress bar |
| Change Password | Password update form |
| Change Avatar | Avatar re-selection |

#### Screen 9 — Navigation & Responsive Design
| Item | Details |
|---|---|
| Top Navigation Bar | Logo + 5 links + Logout with active states |
| Mobile Menu | Hamburger menu for phones and tablets |
| Responsive Layout | Works on Desktop, Tablet, and Mobile |

#### Screen 10 — Gamification System (Backend)
| Item | Details |
|---|---|
| XP & Levels | Points from quizzes convert to XP, level up at 250 XP |
| Streak Tracking | Daily activity counting, reset on missed day |
| Achievement Logic | Auto-unlock 7 badges based on conditions |
| Leaderboard Ranking | Real-time score-based ranking |

#### Screen 11 — Admin Panel (Basic)
| Item | Details |
|---|---|
| Admin Login | Separate admin access with role check |
| Dashboard | Total users, revenue, quiz completions |
| User Management | View users, search, see details |
| Quiz Management | Add/Edit/Delete quizzes and questions |
| Course Management | Add/Edit/Delete courses, change pricing |
| Content Management | Edit daily tips and site content |

#### Screen 12 — Database & Backend Setup
| Item | Details |
|---|---|
| Database Design | All tables, relationships, indexes |
| API Development | All backend endpoints for every feature |
| Data Seeding | All 14 quizzes with questions + 8 courses loaded |
| Security | Password encryption, protected routes, input sanitization |

#### Screen 13 — Deployment & Go Live
| Item | Details |
|---|---|
| Hosting Setup | Deploy on Vercel with your domain |
| SSL Certificate | HTTPS security (auto) |
| Database Hosting | Production database on Neon PostgreSQL |
| Email Setup | Password reset emails working |
| Error Monitoring | Sentry for tracking production errors |
| Final Testing | Cross-browser check, mobile check, payment test |

---

### Architecture Diagram (Generated)

The full system architecture was visualized as a layered diagram with the following layers:

```
FRONTEND — Next.js 14 (App Router)
├── Login/Signup    Home Dashboard    Quiz Catalog    Quiz Play    Course Catalog
├── Course Detail   Leaderboard       Profile         Admin Panel  Nav + Layout

API LAYER — Fastify + tRPC
├── Auth API        Course API        Quiz API        Gamification API    Payment API

SERVICES — Business Logic
├── XP Engine       Streak Engine     Badge Engine    Leaderboard Svc    Email Service

BACKGROUND JOBS — BullMQ + Upstash Redis
├── Streak cron     XP event job      Leaderboard job  Payment webhook

DATABASE — PostgreSQL (Neon) + Drizzle ORM
├── Users + Auth    Content           Gamification     Quizzes            Payments

EXTERNAL SERVICES
├── Razorpay        Cloudflare R2     Resend           Sentry             PostHog

INFRASTRUCTURE + DEPLOYMENT
├── Vercel          Railway           Neon Postgres    Upstash Redis
```

---

### Implementation Notes (Spec-specific)

- **14 quiz cards** with color-coded difficulty maps to a `difficulty` enum in Postgres with computed badge color on frontend
- **12 avatars** on signup — stored as enum or static asset list, embedded in codebase (no S3 needed)
- **7 badges** auto-unlock via event-driven check that fires on every XP award — one function, 7 badge condition rules
- **30-second warmup** on dashboard is purely frontend — timer component pulling random vocab card from quiz pool
- **250 XP** = level up threshold (configurable via admin)

---

### 15–20 Day Build Order

| Days | Focus |
|---|---|
| 1–4 | Auth + DB schema + API skeleton |
| 5–8 | Quiz system end to end |
| 9–12 | Course catalog + Razorpay payment flow |
| 13–16 | Gamification engine (XP, streaks, badges, leaderboard) |
| 17–20 | Admin panel + Sentry + deployment on Vercel + Neon |

---

## 4. Vercel vs Railway Decision

### Prompt
> "I will prefer Vercel over Railway — is it wrong?"

### Response

Not wrong at all. Vercel can handle the backend too.

**Vercel can run Fastify via Serverless Functions.** API routes deploy as serverless functions — Vercel handles scaling, SSL, and deployment. Everything in one platform, one `git push` to deploy both frontend and backend.

#### Trade-offs

**Cold starts** — Vercel serverless functions have a ~200–500ms cold start if not recently hit. Noticeable but not a dealbreaker for a $200/ticket product. Mitigatable by keeping functions warm.

**BullMQ won't work on Vercel** — BullMQ requires a persistent Node.js process. Serverless functions spin up and die per request. Workarounds:

| Option | Detail |
|---|---|
| Vercel Cron Jobs | Replace streak reset cron natively — Pro plan supports scheduled functions |
| Upstash QStash | Serverless-friendly job queue, HTTP callback to your Vercel function instead of persistent worker |
| Railway for worker only | Deploy just the BullMQ worker on Railway free tier, keep everything else on Vercel |

For Phase 1 (hundreds of students, 14 quizzes, 8 courses) — Vercel alone is completely fine. QStash + Vercel Cron covers background jobs cleanly. Move to Railway only when processing thousands of events per day — a Phase 3 problem.

#### Final Infra Stack (Vercel-only)

```
Vercel          → Next.js frontend + Fastify API (serverless)
Vercel Cron     → Streak reset, leaderboard snapshot
Upstash Redis   → Cache + QStash for job queue
Neon Postgres   → Production database
Cloudflare R2   → File storage
```

---

## 5. Role-Based Feature Map

### Prompt
> "Tell me all the elements on the frontend which would be shown on the basic user, admin and developer user type — user will only be able to see courses, quizzes etc; developer login would have access to logs, user accounts etc; admin will be able to check users, add course content, create new courses etc. Developer login would have access to everything. Also add payment details in both developer and admin accounts — failed, successful etc. Allot course to students, keep option to add multiple students at once. Give me a proper list of actions and features a whole real-world full-stack app should have."

### Response

#### Critical Rule
Role enforcement must happen on the **backend**, not just the frontend. Hiding a button in the UI is not access control. Every Admin and Dev endpoint must check `req.user.role` server-side and return `403` if it doesn't match.

---

### Student Role

#### Auth & Onboarding
| Feature | Type |
|---|---|
| Email login (email + password with validation) | action |
| Google OAuth (one-click sign in) | action |
| Forgot password (email link reset flow) | action |
| Avatar selection (12 avatars on signup) | action |
| Change password (from profile settings) | action |
| Change avatar (re-select anytime) | action |

#### Home & Dashboard
| Feature | Type |
|---|---|
| Personalized greeting (name + time-based message) | view |
| Streak counter (current streak + flame indicator) | view |
| XP + level card (total score + level display) | view |
| 30-sec warmup (quick vocab timer on open) | action |
| Daily tip (rotating learning tip card) | view |
| Leaderboard preview (top 3 + your rank) | view |
| Quick links (daily quiz + continue course) | action |

#### Quiz System
| Feature | Type |
|---|---|
| Quiz catalog (14 cards, color-coded difficulty) | view |
| Start quiz (4-option MCQ, one at a time) | action |
| Progress bar (question N of total in-quiz) | view |
| Instant feedback (correct/wrong highlight on pick) | view |
| Score result screen (final score, try again, exit) | view |
| Exit confirmation (warning popup mid-quiz) | view |
| Quiz history (past attempts + best scores) | view |

#### Courses & Learning
| Feature | Type |
|---|---|
| Course catalog (8 cards, CEFR tags, filter pills) | view |
| Course detail (syllabus, module list, stats) | view |
| Purchase course (Razorpay checkout flow) | action |
| Course player (video + PDF lesson viewer) | action |
| Progress tracking (lessons completed per course) | view |
| Locked state (visual lock on unpurchased) | view |
| Purchase history (courses bought + receipts) | view |

#### Gamification & Social
| Feature | Type |
|---|---|
| Full leaderboard (rank, name, streak, score) | view |
| My rank highlight (current user row accented) | view |
| Badge showcase (7 badges, locked/unlocked) | view |
| XP progress bar (progress to next level) | view |
| Activity feed (recent completions timeline) | view |
| Stats grid (score, level, streak, rank) | view |

---

### Admin Role

#### Dashboard Overview
| Feature | Type |
|---|---|
| Revenue summary (total, monthly, daily MRR) | view |
| Active students (total + today's logins) | view |
| Quiz completions (count + avg score today) | view |
| New signups chart (weekly signup trend graph) | view |
| Course enrollment (top courses by students) | view |
| Streak leaders (top 5 active streaks) | view |

#### Student Management
| Feature | Type |
|---|---|
| Student list (search, filter, paginate) | view |
| Student profile view (XP, streak, courses, payment) | view |
| Add single student (manual email + name invite) | action |
| Bulk import students (CSV upload, N at once) | action |
| Assign course (grant access without payment) | action |
| Bulk assign course (assign to multiple students) | action |
| Revoke course access (remove student from course) | destructive |
| Suspend student (disable login temporarily) | destructive |
| Delete student (hard delete with confirm dialog) | destructive |
| Reset student password (force send reset email) | action |
| Export student data (CSV export of all students) | action |
| Send message (email student directly) | action |

#### Course Management
| Feature | Type |
|---|---|
| Create course (title, CEFR level, price, desc) | action |
| Edit course (update meta, pricing, status) | action |
| Delete course (with enrolled-student warning) | destructive |
| Add module (section grouping within course) | action |
| Add lesson (video, PDF, or text content) | action |
| Upload content (PDF, MP4 to Cloudflare R2) | action |
| Reorder lessons (drag-and-drop ordering) | action |
| Toggle published (draft vs live toggle per course) | action |
| Course analytics (completion %, dropout rate) | view |

#### Quiz Management
| Feature | Type |
|---|---|
| Create quiz (title, difficulty, point value) | action |
| Add questions (MCQ with 4 options + correct answer) | action |
| Edit question (update text, options, answer) | action |
| Delete quiz (with attempt data warning) | destructive |
| Quiz analytics (avg score, fail rate per quiz) | view |
| Preview quiz (see student-facing view) | view |

#### Payments
| Feature | Type |
|---|---|
| Payment list (all transactions, search/filter) | view |
| Successful payments (filter by status: paid) | view |
| Failed payments (filter by status: failed) | view |
| Pending payments (initiated but unconfirmed) | view |
| Refund record (view refunds issued) | view |
| Issue refund (trigger via Razorpay API) | action |
| Payment detail (order ID, amount, student, time) | view |
| Revenue export (download CSV by date range) | action |
| Manual enrollment (grant access bypassing payment) | action |

#### Content & Site Settings
| Feature | Type |
|---|---|
| Edit daily tips (add/remove rotating tip cards) | action |
| Manage badges (edit badge names + conditions) | action |
| Announcement banner (site-wide message to students) | action |
| Email templates (edit welcome/streak emails) | action |

---

### Developer Role

> Developer role inherits **everything in Admin**, plus the sections below. Never expose this panel to students or admins. Destructive actions must require typed confirmation (`type DELETE to confirm`).

#### System Logs
| Feature | Type |
|---|---|
| API request logs (method, route, status, latency) | dev only |
| Error logs (stack traces from Sentry) | dev only |
| Auth event log (logins, logouts, token refresh) | dev only |
| Webhook log (Razorpay events in/out) | dev only |
| Cron job log (streak + leaderboard run history) | dev only |
| Queue monitor (BullMQ/QStash job status) | dev only |
| DB query log (slow query + N+1 detection) | dev only |
| Storage log (R2 upload/delete events) | dev only |

#### User & Account Tools
| Feature | Type |
|---|---|
| Impersonate user (log in as any student to debug) | dev only |
| Manually award XP (override XP for any user) | dev only |
| Reset streak (zero out streak for testing) | dev only |
| Force badge unlock (grant any badge to any user) | dev only |
| JWT inspector (decode + validate tokens) | dev only |
| Role editor (change any user's role) | destructive |
| Hard delete user (purge all data permanently) | destructive |
| Audit log (who did what + timestamp) | dev only |

#### Payment & Finance Debug
| Feature | Type |
|---|---|
| Raw webhook payload (full Razorpay JSON events) | dev only |
| Retry failed payment (re-trigger webhook processing) | dev only |
| Test payment mode (toggle Razorpay test/live key) | dev only |
| Payment reconciliation (DB vs Razorpay diff report) | dev only |
| Force enrollment (grant course ignoring payment) | dev only |

#### System & Infrastructure
| Feature | Type |
|---|---|
| Environment config (view env var names, not values) | dev only |
| DB health check (ping + connection pool status) | dev only |
| Cache inspector (Redis key browser + TTL) | dev only |
| Storage browser (R2 bucket file tree) | dev only |
| Seed database (load test data in staging) | dev only |
| Feature flags (toggle features without deploy) | dev only |
| Run migration (trigger Drizzle DB migration) | destructive |
| System health (API, DB, Redis uptime status) | dev only |

#### Analytics & Reporting
| Feature | Type |
|---|---|
| PostHog events (raw event stream + funnels) | dev only |
| Performance metrics (P50/P95/P99 API latency) | dev only |
| Error rate chart (5xx rate over time) | dev only |
| Retention cohorts (week-1 / week-4 retention) | dev only |

---

## Final Agreed Stack Summary

```
Frontend
└── Next.js 14 (App Router)
    ├── Tailwind CSS
    ├── shadcn/ui
    ├── Framer Motion (animations)
    └── Zustand (global state)

Backend
└── Fastify (API server, deployed serverless on Vercel)
    ├── Drizzle ORM
    ├── JWT + Passport.js (Google OAuth)
    ├── Custom role middleware (student / admin / developer)
    └── Input sanitization + protected routes

Database
└── Neon PostgreSQL
    ├── Tables: users, courses, modules, lessons, quizzes,
    │          quiz_questions, quiz_attempts, user_xp,
    │          user_streaks, user_badges, leaderboard_snapshots,
    │          orders, transactions, audit_logs
    └── Drizzle migrations

Background Jobs
└── Vercel Cron (streak reset, leaderboard snapshot)
    └── Upstash QStash (event-driven jobs: XP, badges, emails)

File Storage
└── Cloudflare R2 (PDFs, videos, course assets)

Payments
└── Razorpay (UPI, cards, EMI, webhooks)

Email
└── Resend (welcome, streak risk, password reset, receipts)

Monitoring
├── Sentry (error tracking)
└── PostHog (product analytics, funnels, cohorts)

Deployment
└── Vercel (frontend + API serverless functions + cron)
    └── Custom domain + auto SSL
```

---

*Document generated from full conversation on May 20, 2026.*
