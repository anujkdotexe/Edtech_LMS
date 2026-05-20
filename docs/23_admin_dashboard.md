# 23. Admin Dashboard Architecture

## 1. Administrative Cockpit (Grid View)

The Admin Home Panel is designed around a responsive, Linear-inspired data grid presenting critical analytics:

```text
 ┌────────────────────────────────────────────────────────┐
 │                   ADMIN TELEMETRY GRID                 │
 ├─────────────────────────┬──────────────────────────────┤
 │  Total Active Students  │        Weekly Revenue        │
 │     1,240 (Active)      │      $12,450.00 (Mocked)     │
 ├─────────────────────────┼──────────────────────────────┤
 │    Course Enrollment    │     Streak Leaders Board     │
 │  Top: French A1 (450)   │    Max: Jane Doe (120 d)     │
 └─────────────────────────┴──────────────────────────────┘
```

---

## 2. Dynamic Drag-and-Drop Course Builder (CMS)

To give admins rapid control over syllabus composition:
- **Interface**: Accordion listing modules. Inside each module, lessons are displayed as drag-and-drop cards.
- **Drag Mechanics**: Utilizes `@hello-pangea/dnd` (or simple lightweight list order helpers) to rearrange lessons within and across modules.
- **Sync Trigger**: Drag endings instantly update state and call PUT `/api/admin/lessons/reorder` to update database columns:
  ```typescript
  // Inbound API request payload
  interface LessonReorderInput {
    moduleId: string;
    orderedLessonIds: string[]; // Sequential IDs mapping new order indices
  }
  ```

---

## 3. Student CRM & CSV Import Interface

### The Registry Directory
- **Registry Grid**: Paginated list containing: Dicebear Avatar, Student Name, Email, Level, Active Streak, and Registered Date.
- **Actions Menu**: Hover commands allow password resets, direct course assignments, account suspension, or complete deletion.

### The CSV Import Protocol
- **UI Element**: Standard dropzone field that accepts `.csv` files.
- **Client Parsing**: Evaluates structures before uploading, showing validation warnings for duplicate email addresses.
- **Form Submission**: Sends a `multipart/form-data` payload containing the file.
- **Temporary Password Onboarding**:
  1. The server generates random 8-character string passwords for imported users.
  2. Users are flags as `force_password_reset = TRUE`.
  3. Credentials are saved via `bcrypt` hashes.
  4. The Fastify server prints the list to the terminal console logs, allowing admins to easily view, copy, or distribute them:
     ```text
     [IMPORT SUCCESS] Onboarded 3 users:
       - email: john@example.com, temp_pass: Temp_aX8b
       - email: mary@example.com, temp_pass: Temp_wP2q
     ```
