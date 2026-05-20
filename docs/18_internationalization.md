# 18. Internationalization Architecture

## 1. UI Translation Strategy vs. Course Content Translation

The platform enforces a strict boundary between two different translation scopes:

```text
  LOCALIZATION ENGINE (Accept-Language header / [locale] route)
         ├── UI Translation (Static layout elements, buttons, dashboards)
         │       └── Managed by next-intl via static files (messages/en.json)
         └── Course content Translation (Courses, Modules, Syllabus summaries, Quizzes)
                 └── Managed via JOINs on course_translations and quiz_translations in Postgres
```

---

## 2. Frontend Configuration (`next-intl`)

We utilize Next.js 14 App Router Dynamic Middleware routing scopes `[locale]` to enforce path translations:

### A. Middleware Configuration (`apps/web/src/middleware.ts`)
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Supported UI languages
  locales: ['en', 'fr'],
  // Default language fallback
  defaultLocale: 'en',
  // Match path locale prefixes (e.g. /en/dashboard, /fr/dashboard)
  localePrefix: 'always'
});

export const config = {
  // Catch all localized path variants
  matcher: ['/', '/(de|en|fr|es)/:path*']
};
```

### B. Directory Structure & Messages File Mapping
```text
apps/web/
├── messages/
│   ├── en.json
│   └── fr.json
```

*Example: `messages/en.json`*
```json
{
  "Dashboard": {
    "welcome": "Welcome back, {name}!",
    "streak": "{count} Day Streak",
    "warmup": "Start Daily Warmup"
  },
  "Common": {
    "unlocked": "Unlocked",
    "locked": "Locked",
    "buy": "Purchase Course"
  }
}
```

---

## 3. Communication Header & Database Localizer

When the Next.js frontend calls the Standalone Fastify backend:
1. The service layer extracts the active route locale from `next-intl` (using `useLocale()`).
2. Every HTTP request automatically appends this locale signature inside the `Accept-Language` header:
   ```typescript
   // apps/web/src/services/apiClient.ts
   import { useAuthStore } from '../store/authStore';

   export async function apiFetch(path: string, options: RequestInit = {}) {
     const locale = window.location.pathname.split('/')[1] || 'en';
     
     const headers = new Headers(options.headers);
     headers.set('Accept-Language', locale);
     headers.set('Content-Type', 'application/json');

     return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
       ...options,
       headers
     });
   }
   ```
3. The Fastify backend extracts the locale header (`request.headers['accept-language']`) and executes database localization queries with standard fallback models.
