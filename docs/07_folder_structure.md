# 07. Folder Structure Document

This document outlines the standardized directory architecture across the monorepo workspaces, establishing clean modular boundaries.

---

## 1. Frontend Workspace: `apps/web`

We follow the Next.js 14+ App Router standards, isolating page routers and features:

```text
apps/web/
├── public/                 # Static assets (site-wide icons, illustrations)
├── src/
│   ├── app/                # App Router Directories (pages)
│   │   ├── [locale]/       # next-intl dynamic localization router scope
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── dashboard/  # Student main panel
│   │   │   ├── courses/    # Catalog & course player
│   │   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── quizzes/    # Quizzes catalog & dynamic quiz cards board
│   │   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── leaderboard/
│   │   │   ├── profile/
│   │   │   ├── admin/      # Admin Course & Student management CMS
│   │   │   ├── dev/        # Developer system monitoring panel
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx    # Landing / root redirection page
│   ├── components/         # Shared frontend presentation cards
│   │   ├── ui/             # Pure atomic Tailwind primitives (buttons, inputs)
│   │   ├── CoursePlayer/   # Multi-pane syllabus document viewer
│   │   ├── QuizBoard/      # MCQ card component with slider animations
│   │   └── ImpersonationBanner/ # Floating developer takover alert
│   ├── hooks/              # Custom React hooks (useAuth, useLocalStorage)
│   ├── providers/          # Context container layers (IntlProvider, ThemeProvider)
│   ├── services/           # Raw Fetch/Axios client wrapper layers to apps/api
│   ├── store/              # Zustand state management slice stores
│   └── styles/             # Global Tailwind and index.css directives
├── package.json
└── tsconfig.json
```

---

## 2. Backend Workspace: `apps/api`

We employ a highly modular module encapsulation framework within Fastify:

```text
apps/api/
├── public/                 # Uploaded static files (course PDFs, avatars)
│   └── uploads/
├── src/
│   ├── config/             # Strict Zod-validated environment config schemas
│   ├── db/                 # Postgres connection pool and Drizzle DB handlers
│   │   ├── migrations/     # Auto-generated SQL files from Drizzle migrations
│   │   ├── schema.ts       # Central schema index file
│   │   └── seed.ts         # Dummy data loader scripts (A1-C2, questions, users)
│   ├── middleware/         # Security layers (verifyJWT, checkRole, logging)
│   ├── modules/            # Modular feature clusters containing routers, controllers
│   │   ├── auth/           # Login, signup, refresh token actions
│   │   ├── courses/        # Syllabus, catalog lists, and mock purchases
│   │   ├── quizzes/        # MCQ lists, answer evaluations, scoring, XP
│   │   ├── gamification/   # Streaks reset, live leaderboard snapshot views
│   │   ├── admin/          # CRM managers, course publishers, CSV parsers
│   │   └── dev/            # Live telemetry loggers, takeover state switches
│   ├── plugins/            # Fastify custom extensions (cookie/cors handlers)
│   ├── utils/              # Cryptographic wrappers, CSV processors, custom logs
│   ├── app.ts              # Encapsulated Fastify bootloader script
│   └── index.ts            # Entrypoint triggering process hooks
├── package.json
└── tsconfig.json
```

---

## 3. Shared Packages Workspace: `packages/`

```text
packages/
├── tsconfig/               # Reusable JSON base structures
│   ├── base.json
│   ├── nextjs.json
│   └── fastify.json
├── eslint-config/          # Shared ESLint parameters
│   └── index.js
├── types/                  # Common TypeScript interface indexes
│   └── src/index.ts
├── validations/            # Zod validation schema catalogs
│   └── src/index.ts
├── api-contracts/          # Shared API Route constants
│   └── src/index.ts
├── utils/                  # Shared helper algorithms (XP math, format routines)
│   └── src/index.ts
└── ui/                     # Common design system tokens
    └── src/index.ts
```
