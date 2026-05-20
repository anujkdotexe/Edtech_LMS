# 01. Product Requirements Document (PRD)

## Vision & Objectives
The **Gamified LMS SaaS Platform** is a premium, modern education platform inspired by the visual elegance of Duolingo, Stripe, and Linear. The goal is to provide a highly interactive and gamified learning environment for languages where students maintain active streaks, compete on live leaderboards, earn experience points (XP), and unlock badges, while admins and developers possess state-of-the-art tools to manage users, content, and system state.

### Strategic Priorities
1. **Premium Engagement (Duolingo-style)**: High-retention game mechanics (streaks, real-time weekly leaderboards, micro-animations, customizable avatars).
2. **Robust Content Control**: Admin-friendly markdown/PDF learning module organization and instant drag-and-drop structure adjustments.
3. **Advanced Developer Diagnostics**: Bulletproof system logging, features toggles, database health, and a zero-password developer student-impersonation system for troubleshooting.
4. **Local and Free-Tier Friendly**: Optimized for zero-cost infrastructure in initial testing (local Postgres, mock payments, local storage drivers, simulated cron engines).

---

## Core Personas

### 1. Student
- **Motivation**: Learn a new language through structured courses, track personal progress, and stay motivated using gamified reinforcement.
- **Key Behaviors**: Review course catalog, purchase/unlock modules, consume PDF-based lessons, complete MCQs, keep streaks alive, showcase earned badges, monitor rank.

### 2. Admin
- **Motivation**: Curate and manage educational material, manage student enrollment, monitor revenue trends, and review system-wide student performance.
- **Key Behaviors**: Add/edit/delete courses and modular content, upload lessons (PDFs), construct and review quiz questions, bulk-import students via CSV, assign courses manually.

### 3. Developer
- **Motivation**: Maintain system health, resolve technical bottlenecks, audit user activities, debug issues on behalf of students.
- **Key Behaviors**: View system log streams, impersonate any student profile to verify bugs, adjust global feature flags, trigger migrations, inspect system caches.

---

## Functional Requirements (Release Scope)

### Epic 1: Auth & Onboarding
- **Student Signup/Login**: Traditional email and password credentials with robust form validations.
- **Avatar Builder**: Integrates Dicebear SVG avatars on registration, allowing users to roll new styles or select from a premium array.
- **Security Check**: Forced password resets for bulk-imported temporary accounts on initial login.

### Epic 2: Course & Content Player
- **Course Catalog**: Filterable layout presenting A1 to C2 CEFR tiers. Indicators showing "Unlocked" vs. "Purchase Required".
- **Module & Lesson View**: Syllabus layout showing progress bars, completed lessons, and course details.
- **PDF Viewer**: A distraction-free in-browser reading deck delivering PDF course material from local static assets.

### Epic 3: Gamification Engine
- **XP Progression**: Students earn standard XP (e.g., 20 XP per lesson, 50 XP per passed quiz). Every 250 XP advances the user 1 level.
- **Streak Monitor**: Tracks daily active visits. Failing to log activity in a 24-hour window breaks the streak. Displays a premium glowing orange flame for active streaks.
- **Leaderboards**: A rolling ranked catalog of students sorted by weekly/overall XP. Current student's row is highlighted with a premium glassmorphic active container.
- **Badges/Achievements**: 7 unique milestone awards evaluated server-side upon any XP gain (e.g., "Scholar Level 1", "Centurion Streak").

### Epic 4: Interactive Quizzes
- **14-Card Quizzes**: Multiple-choice quiz modules with real-time correct/incorrect selection sounds and visual highlights.
- **Exit Warning**: Trigger a custom modal warning if a user attempts to navigate away mid-quiz.

### Epic 5: Administrative CRM
- **Course CMS**: Administrative controls to create, publish, order, and adjust syllabus structures.
- **Student Registry**: Full list view of students with filters to edit profiles, reset passwords, assign modules, or delete accounts.
- **Bulk CSV Upload**: Standard `name,email` parsing structure which automatically provisions credentials and schedules transactional reset-emails.

### Epic 6: Developer Toolkit
- **System Health Panel**: Real-time stats on DB connectivity, average endpoint latencies, and storage utilization.
- **Secure Impersonation**: One-click developer-only login takeover with automated audit logging and a prominent warning banner.

---

## Non-Functional Requirements & Success Criteria

| Category | Requirement | Metric / Target |
|---|---|---|
| **Performance** | Page Load / TTFB | Under 200ms for static pages, API latency under 100ms for P95 |
| **Aesthetics** | Themes & Styling | Light mode first, ultra-smooth CSS transitions, 60fps Framer Motion micro-animations |
| **Scalability** | Relational Database | 100% normalized tables with compound indices on search columns |
| **Security** | Authentication | Password hashing using Bcrypt, JWT tokens stored in HttpOnly cookies |
| **Local Dev** | Storage & Integrations | Easily swappable modular drivers (local disk paths mapped to Cloudflare R2 configurations) |
