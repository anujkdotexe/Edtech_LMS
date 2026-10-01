# Edtech LMS - Enterprise Monorepo Learning Management System

A high-performance, modular enterprise learning management platform built using a PNPM monorepo architecture. Features decoupled Next.js web applications, Fastify API gateways, and shared internal TypeScript packages.

## Architecture & Technology Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend API Gateway:** Fastify, TypeScript
- **Database & ORM:** PostgreSQL with Drizzle ORM
- **Authentication & Validation:** JWT (HTTP-only cookies), Bcrypt, Ajv schema validation
- **Monorepo Management:** PNPM Workspaces with Turborepo tooling

## Monorepo Package Structure

```
Edtech_LMS/
├── apps/
│   ├── web/               # Next.js learner, admin, and developer dashboards
│   └── api/               # Fastify API gateway and business logic handlers
├── packages/
│   ├── api-contracts/     # Strongly typed API request/response specifications
│   ├── types/             # Shared TypeScript types and data models
│   ├── validations/       # Ajv schema validators for payloads
│   ├── ui/                # Reusable UI component design system
│   ├── utils/             # Core utilities and helper functions
│   ├── tsconfig/          # Shared TypeScript configurations
│   └── eslint-config/     # Unified linting rules
├── docs/                  # System design, feature maps, and architecture records
├── pnpm-workspace.yaml    # Workspace package orchestration
└── README.md
```

## Key Features

### 1. Student Learning Platform
- Interactive MCQ quiz evaluation engine with instant scoring.
- Gamification mechanics: XP level milestone calculations and automated consecutive day streaks.
- Personalized dashboard with vocabulary decks and progress analytics.

### 2. Administrative CRM & Content Manager
- Comprehensive student ledger with account status and role-based access control.
- Dynamic syllabus creator with drag-and-drop course and module sequencing.
- Multipart courseware upload processing for local PDF storage.

### 3. Developer Diagnostic Shell
- Live database query trace streaming via Drizzle ORM to inspect slow queries and N+1 bottlenecks.
- Safe sandbox account impersonation takeover for verification.
- Server health and resource diagnostics monitoring (CPU cores, memory allocations, uptime).

## Setup & Local Development

### Prerequisites
- Node.js 18+
- PNPM (`npm install -g pnpm`)
- PostgreSQL instance

### Installation
```bash
# Clone the repository
git clone https://github.com/anujkdotexe/Edtech_LMS.git
cd Edtech_LMS

# Install all workspace dependencies
pnpm install

# Run development servers
pnpm dev
```

## Documentation
Additional architectural diagrams, feature breakdowns, and API workflows are located in the [`docs/`](./docs) directory.

## License
Proprietary — Developed by [Anuj Kondawar](https://github.com/anujkdotexe).
