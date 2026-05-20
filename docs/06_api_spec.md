# 06. API Specifications Document

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

### POST `/api/auth/refresh`
Exchanges a valid refresh token cookie for a new short-lived access token cookie.
- **Responses**:
  - `200 OK`: Sets a fresh `token` cookie.
  - `401 Unauthorized`: Redirect to login.

---

## 2. Courses & Syllabus Router

### GET `/api/courses`
Returns all courses with their localization meta matched to the requested locale header.
- **Headers**:
  - `Accept-Language: fr` (defaults to `en`)
- **Response Body (`200 OK`)**:
  ```json
  [
    {
      "id": "e3e3e3e3-c3c3-4c4c-acac-d3d3d3d3d3d3",
      "cefrLevel": "A1",
      "price": 0.00,
      "isPremium": false,
      "isUnlocked": true,
      "title": "Français Élémentaire",
      "description": "Apprenez les bases du français."
    }
  ]
  ```

### POST `/api/courses/:id/purchase`
Initiates a mock purchase, registering order states.
- **Request Body**:
  ```json
  {
    "simulatedStatus": "SUCCESS" -- or "FAILED" to mock checkout outcomes
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "orderId": "b1b1b1b1-1111-2222-3333-444444444444",
    "status": "SUCCESS",
    "message": "Course successfully unlocked"
  }
  ```

---

## 3. Quizzes Router

### GET `/api/quizzes`
Lists all active quizzes and their rules according to localization header configurations.

### GET `/api/quizzes/:id`
Retrieves all multiple-choice questions for a specific quiz (14 cards).
- **Response Body (`200 OK`)**:
  ```json
  {
    "quizId": "q1q1q1q1-2222-3333-4444-555555555555",
    "title": "French Present Tense Vocab",
    "questions": [
      {
        "id": "question-uuid-1",
        "questionText": "What is the translation for 'The Bread'?",
        "optionA": "La Pomme",
        "optionB": "Le Pain",
        "optionC": "Le Vin",
        "optionD": "L'Eau",
        "orderIndex": 1
      }
    ]
  }
  ```

### POST `/api/quizzes/:id/submit`
Validates student quiz answers, computes score, increments XP, checks streaks, and awards achievements.
- **Request Body**:
  ```json
  {
    "answers": [
      { "questionId": "question-uuid-1", "selectedOption": "B" }
    ]
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "score": 100,
    "passed": true,
    "xpEarned": 50,
    "newTotalXp": 450,
    "didLevelUp": false,
    "newLevel": 2,
    "currentStreak": 5,
    "badgesUnlocked": [
      { "badgeId": "scholar_1", "name": "Scholar Level 1" }
    ]
  }
  ```

---

## 4. Administrative Control Router

### POST `/api/admin/students/import`
Processes CSV bulk onboarding, generating credentials and printing passwords to standard logs.
- **Content-Type**: `multipart/form-data`
- **Request File**: `students.csv` (contains columns `name,email`)
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "importedCount": 45,
    "message": "Credentials printed to standard system logs. Force-reset scheduled."
  }
  ```

---

## 5. Developer Control Router

### POST `/api/dev/impersonate`
Authorizes developer taking control of a specific user.
- **Security Check**: Restricted to `role = 'DEVELOPER'` on backend session.
- **Request Body**:
  ```json
  {
    "studentEmail": "target_student@example.com"
  }
  ```
- **Response Headers**:
  - `Set-Cookie: impersonationToken=<jwt-signed-target>; HttpOnly; Secure; SameSite=Lax`
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "impersonating": "target_student@example.com",
    "message": "Session switched successfully. Impersonation warning banner activated."
  }
  ```
