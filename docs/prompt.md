Run an exhaustive, end-to-end audit of this entire codebase against all specifications in `docs/` (from `01_prd.md` to `25_comprehensive_feature_map.md` and `audits/implementation-audit-report.md`) as well as `CODING_STANDARDS.md` and `AGENTS.md`.

Do not skim, summarize, or assume anything works without concrete verification. Inspect the codebase layer by layer and execute the following checks:

1. Spec & Feature Completeness:
   - Audit every single feature card for Student (33 cards), Admin (46 cards), and Developer (33 cards) portals against the actual code.
   - Flag any half-baked implementations, missing routes/pages, stubbed handlers, or simulated mock logic that should be real.

2. Zero Hardcoded Data & Real Database Integrity:
   - Verify that NO page or component displays hardcoded mock data, static placeholder text, fallback dummy arrays, or hardcoded IDs/UUIDs.
   - Confirm every metric, streak, XP calculation, course list, lesson viewer, quiz question, and analytics chart is backed by live database queries.

3. Frontend & Backend Contract Alignment:
   - Verify all API contracts: check every `apiFetch` and `fetch` call in `apps/web` against the route definitions and Fastify schemas in `apps/api`.
   - Audit for parameter/variable mismatches (e.g. `userId` vs `studentId`, `userIds` vs `studentIds`, casing discrepancies, missing request bodies, or unmapped response fields).
   - Ensure Fastify schema responses match the exact shape of service DTOs so Ajv serialization does not drop properties or throw errors.

4. Broken Buttons, Dead Ends & User Flows:
   - Trace all user interactions from button click to database update and back:
     * Student: signup, avatar pick, course checkout/purchase, video/PDF syllabus view, lesson completion, quiz submit + XP/streak/badge transaction, daily warmup claim, password update.
     * Admin: student management (add, bulk import, suspend, reset password, enroll, revoke, message), course & lesson CRUD + file uploads + reordering, quiz & question CRUD, payments ledger + refund + CSV export, site settings toggles.
     * Developer: impersonation/unimpersonation, XP/streak overrides, feature flags, diagnostics health check, and tab navigation.
   - Verify that error states, confirmation modals, disabled states, and redirect loops (e.g., forced password reset) behave correctly without dead ends.

5. Code Quality & Standards Enforcement:
   - Enforce all rules in `CODING_STANDARDS.md`: no emojis in source code/logs (use `[OK]`, `[ERROR]`, `[WARN]`, `[INFO]`), strict Zod validation on inputs, multi-table mutations enclosed in single `db.transaction()`, no N+1 query loops (use `inArray`), and safe numeric handling for currency/XP.
   - Run full TypeScript type checks (`pnpm --filter @lms/api exec tsc --noEmit` and `pnpm --filter @lms/web exec tsc --noEmit`) to ensure zero compile errors.

Deliver a structured audit report detailing:
- Identified defects, broken flows, and contract mismatches.
- Exact file paths and line numbers for every issue.
- A prioritized implementation plan to resolve every defect cleanly.
