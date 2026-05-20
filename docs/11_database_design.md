# 11. Database Design & Translations Strategy

## Normalization & Database Strategy

Our storage system is built on **PostgreSQL**, designed around standard third-normal-form (3NF) relational practices. This ensures strict integrity across core student stats (XP, Streaks, Badges), course modules, and transaction logs.

---

## The Relational Content Translation Pattern

To keep core system logic separated from presentation logic, the database decouples entities from their localized text descriptors (such as titles, descriptions, and rules).

```text
  [courses Table] (Master Course)
         │
         ├── has many ──> [course_translations Table]
         │                     ├── locale = 'en' -> title: "French A1"
         │                     └── locale = 'fr' -> title: "Français A1"
```

### Relational Schema Blueprint (Example)
- `courses`: ID, CEFR Level, Price, IsPremium, IsPublished, Timestamps. (No text strings).
- `course_translations`: ID, CourseID, Locale (e.g., 'en', 'fr', 'es'), Title, Description. (Compound unique constraint on `course_id + locale`).

### Dynamic Translation Query Pattern (Drizzle/SQL)

When queries fetch resources, we perform an `LEFT JOIN` on the localized translation table matching the client's locale selection, falling back to English (`en`) if a translation is missing:

```sql
SELECT 
  c.id,
  c.cefr_level,
  c.price,
  COALESCE(t_target.title, t_fallback.title) AS title,
  COALESCE(t_target.description, t_fallback.description) AS description
FROM courses c
-- 1. Attempt to join requested locale translation (e.g., 'fr')
LEFT JOIN course_translations t_target 
  ON t_target.course_id = c.id AND t_target.locale = $1
-- 2. Join default fallback English locale translation
LEFT JOIN course_translations t_fallback 
  ON t_fallback.course_id = c.id AND t_fallback.locale = 'en'
WHERE c.is_published = TRUE;
```

---

## Indexing Blueprint & High-Performance Targets

To keep DB latencies under **20ms** for active operational queries, the following indices are maintained:

| Index Target Table | Covered Column(s) | Query Optimization |
|---|---|---|
| `users` | `email` (Unique Hash) | Faster logins and credentials validation |
| `user_xp` | `total_xp DESC` | Direct scan for live weekly leaderboards |
| `quiz_attempts` | `(user_id, quiz_id)` | Fast lookup of user success states for badge checking |
| `course_translations`| `(course_id, locale)` | Composite index for fast localization mapping |
| `modules` | `(course_id, order_index)` | Dynamic sorting of course syllabi structures |
| `lessons` | `(module_id, order_index)` | Sequential reading course playlist loaders |

---

## Connection Pool Configurations

To fit perfectly into standard Postgres containers and low-cost serverless profiles (e.g., Neon Free Tiers), we enforce strict connection pool parameters:

```typescript
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 15, // Keep within the 20-connection pool limit of Neon Free tier
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Timeout connection attempts after 5 seconds
});

export const db = drizzle(pool);
```
