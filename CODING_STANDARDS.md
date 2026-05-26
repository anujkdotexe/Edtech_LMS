# Antigravity LMS Coding Standards & Design Guidelines

This document details the mandatory coding practices, design standards, and architecture rules for the Antigravity Gamified LMS monorepo. All developers and automated AI agents must follow these guidelines strictly.

---

## 1. Prohibition of Emojis in Source Code & Logs

To ensure professional developer-facing traces, clean production builds, and bulletproof log compatibility:
- **No emojis are allowed** inside standard server startup/seeding scripts, shell scripts (`.ps1`, `.bat`, `.sh`), or backend fastify trace/log messages.
- Avoid using emojis in strings, comments, error messaging, or console statements inside TypeScript files (`.ts`, `.tsx`).

### Standard ASCII Log Labels
Always format log outputs with consistent, color-coded or plain ASCII tags. Use the following prefixes depending on severity or event type:
- `[INFO]` for general progress, status updates, or operations start.
- `[OK]` for successful operations, confirmations, or server listening statements.
- `[WARN]` for non-fatal issues, deprecations, or fallback paths.
- `[ERROR]` for transaction failures, system crashes, or unhandled exceptions.

*Example:*
```typescript
// Incorrect
console.log("🚀 Server running on port 4000");
console.error("❌ Database connection failed");

// Correct
console.log("[OK] Server running on port 4000");
console.error("[ERROR] Database connection failed");
```

---

## 2. Frontend Iconography Standards

For the user interface layer, emojis must not be used as content representations or UI decorations.
- Use vector-based scalable icons from the **`lucide-react`** package.
- Apply semantic colors to icons using Tailwind/CSS classes (e.g. `text-slate-400`, `text-emerald-500`, `text-red-500`) instead of hardcoding raw hex values or emoji assets.

*Example:*
```tsx
// Incorrect
<button>🗑️ Delete Student</button>

// Correct
import { Trash2 } from 'lucide-react';
<button className="flex items-center gap-2 text-red-600 hover:text-red-700">
  <Trash2 className="w-4 h-4" /> Delete Student
</button>
```

---

## 3. Database Integrity & State Safety

To prevent orphaned records or data fragmentation in our PostgreSQL schema:
- Always enforce proper cascades on the database layer using Drizzle's `onDelete: 'cascade'` linking constraints for user-relational tables (like `userXp`, `userStreaks`, `userBadges`, `orders`, and `quizAttempts`).
- When performing user deletion actions, perform a proper cascade-backed query to ensure all downstream relational records are scrubbed safely.
- Never use stale mock statuses for financial records. Payment refunds should map to real enums (e.g., `'REFUNDED'`).

---

## 4. UI/UX Rules & User Disruption Guarding

- **Exit Intent Interception**: Any critical interactive session (such as a student currently answering an active quiz) must feature double-guard protection against accidental navigation. Implement interception on:
  - **Browser refresh / close events**: Listen to window `beforeunload` events and raise a warning.
  - **Browser navigation back / forward buttons**: Intercept `popstate` events to capture history pop movements and prompt with a custom styled modal layout instead of letting them instantly lose state.
- **Premium Indicators**: Use clear visual badges (`Live`, `Draft`, `Premium`, `Free`) to denote course publication states and user permissions. Avoid leaving raw toggle states.
