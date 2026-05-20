# 14. Deployment Architecture

This document describes the production hosting architecture for the gamified LMS.

---

## 1. Network Topology & Deployment Mapping

When migrating from local testing to a public release, the platform is distributed across optimized cloud environments to ensure low latency and high availability:

```text
       DNS Router (Custom Domain / Cloudflare SSL)
            ├── /             ──> Vercel (Next.js Edge Frontend)
            └── /api/*        ──> Railway / Render / VPS (Fastify Core Server)
                                    ├── Database Connection Pool
                                    │      └── Neon PostgreSQL
                                    └── Local Disk Storage (or Cloudflare R2 driver)
```

---

## 2. Platform Allocations & Configuration

### A. Next.js Frontend (Vercel)
- **Deployment Strategy**: Automated Git integration. Pushing to `main` triggers linting, Next.js optimization compilation, and deploys global Edge caches.
- **SSL Management**: Automated wildcard SSL certificate provisioning via Let's Encrypt.
- **Node Runtime**: Set to `Node.js 18` or `Node.js 20` LTS.

### B. Fastify Core Backend (Railway / Render / VPS)
- **Deployment Strategy**: Run as a persistent, stateful Node.js container process using a standard `Dockerfile`.
- **Scaling Limits**: Initial free/starter tier configuration runs on a single `512MB RAM / 0.5 vCPU` container, which easily handles hundreds of concurrent users due to Fastify's low overhead.
- **Port Binding**: Binds automatically to process port environments (`process.env.PORT`).

### C. Relational Database (Neon PostgreSQL)
- **Provisioning**: Managed serverless PostgreSQL instance.
- **Autoscaling Limits**: Auto-suspend inactive instances after 5 minutes of zero traffic (free tier preservation), auto-resuming on the next incoming query (TTFB cold-start $\approx 1.5\text{s}$).

---

## 3. Background Cron & Event Queues

To schedule daily streak resets and leaderboard updates:

```text
   LOCAL DEV                                PRODUCTION MIGRATION
┌──────────────┐                         ┌──────────────┐
│  Node-Cron   │ ──(swap configuration)─> │   QStash     │ ──> HTTP Webhook API Route
└──────────────┘                         └──────────────┘
 (In-memory)                              (Serverless Scheduler)
```

- **Local Development**: Fastify boots up an internal, low-overhead scheduling loop (`node-cron`) that runs in the background.
- **Production Integration**: For high-availability multi-instance setups, background scheduling is delegated to **Upstash QStash**. QStash delivers scheduled HTTP webhook triggers to `/api/gamification/cron/streak-reset` using signed JWT signatures to guarantee authenticity.
