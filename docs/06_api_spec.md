# 06. API Specifications Document

This document outlines the API endpoints available in the Antigravity LMS Monorepo, covering Authentication, Student, Course/Syllabus, Quiz, Administration CRM, and Developer tools.

---

## 1. Authentication Router

### POST `/api/auth/signup`
Creates a new student account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "avatarUrl": "https://api.dicebear.com/7.x/pixel-art/svg"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    { "success": true, "message": "User registered successfully" }
    ```

### POST `/api/auth/google`
Federated Google OAuth callback simulator that automatically registers new users or merges/authenticates existing email accounts.
- **Request Body**:
  ```json
  {
    "email": "user@gmail.com",
    "name": "Google User",
    "avatarUrl": "https://api.dicebear.com/7.x/pixel-art/svg"
  }
  ```
- **Responses**:
  - `200 OK`: Sets authenticating JWT cookies.

### POST `/api/auth/login`
Authenticates credentials, returns user profile, and sets HTTP-Only cookies.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response Headers**:
  - `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=900`
  - `Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
- **Response Body (`200 OK`)**:
  ```json
  {
    "id": "a9b8c7d6-e5f4-3322-1100-abcdef123456",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "STUDENT",
    "avatarUrl": "https://api.dicebear.com/7.x/pixel-art/svg",
    "forcePasswordReset": false
  }
  ```

---

## 2. Courses & Syllabus Router

### GET `/api/courses`
Returns all courses with their localization meta matched to the requested locale header.
- **Headers**:
  - `Accept-Language: fr` (defaults to `en`)

### POST `/api/courses`
Creates a course catalog item. Restricted to Admin/Developer.

### GET `/api/courses/:id`
Retrieves a detailed course syllabus with modules and lessons.

### PUT `/api/courses/:id`
Updates course metadata.

### DELETE `/api/courses/:id`
Deletes a course and checks active enrollments.

### POST `/api/courses/:id/purchase`
Initiates a mock purchase, registering order states.
- **Request Body**:
  ```json
  {
    "simulatedStatus": "SUCCESS"
  }
  ```

---

## 3. Quizzes Router

### GET `/api/quizzes`
Lists all active quizzes and their rules.

### GET `/api/quizzes/:id`
Retrieves all multiple-choice questions for a specific quiz.

### POST `/api/quizzes/:id/submit`
Validates quiz answers, computes score, increments XP, checks streaks, and awards achievements.

---

## 4. Administrative Control Router

### GET `/api/admin/analytics/dashboard`
Returns revenue overview, active students counter, weekly signup trends, and top streak leaders.

### GET `/api/admin/analytics/courses/:courseId`
Calculates completion rates and drop-off metrics per lesson.
- **Response Body (`200 OK`)**:
  ```json
  {
    "courseId": "course-uuid",
    "enrolledCount": 15,
    "totalLessons": 5,
    "dropoffAnalysis": [
      {
        "lessonId": "lesson-1",
        "position": 1,
        "completionCount": 14,
        "completionRate": 93,
        "dropoffPct": 7
      }
    ]
  }
  ```

### PUT `/api/admin/modules/:moduleId/reorder-lessons`
Updates ordering index sequentially for module lessons.
- **Request Body**:
  ```json
  {
    "orderedLessonIds": ["lesson-uuid-1", "lesson-uuid-2"]
  }
  ```

### POST `/api/admin/students`
Manually adds single student profile and registers an onboarding invitation.

### POST `/api/admin/students/bulk-enroll`
Grants manual zero-cost enrollment to multiple students.
- **Request Body**:
  ```json
  {
    "studentIds": ["id-1", "id-2"],
    "courseId": "course-uuid"
  }
  ```

### POST `/api/admin/students/revoke`
Revokes active course access for a student, setting enrollment state to REFUNDED.
- **Request Body**:
  ```json
  {
    "studentId": "student-uuid",
    "courseId": "course-uuid"
  }
  ```

### POST `/api/admin/students/message`
Mock composes and sends a message/notification to a student, logged in audits.
- **Request Body**:
  ```json
  {
    "studentId": "student-uuid",
    "message": "Hello from LMS support!"
  }
  ```

---

## 5. Developer Control Router

### POST `/api/dev/impersonate`
Allows a developer to takeover a student session for debugging.

### POST `/api/dev/unimpersonate`
Clears active impersonation takeover cookie and returns to developer.

### GET `/api/dev/feature-flags`
Fetches a list of in-app feature flags and current rollout percentages.

### POST `/api/dev/feature-flags/toggle`
Enables/disables a specific feature flag with rollout properties.

### GET `/api/dev/cache`
Lists active in-memory cache keys, TTL, and values.

### DELETE `/api/dev/cache/:key`
Purges a specific cache key instantly.

### GET `/api/dev/reconciliation`
Generates a payment gateway reconciliation report auditing database orders against gateway transaction logs.

### GET `/api/dev/queue`
Streams background jobs status, pending counts, active counts, and retry thresholds.
