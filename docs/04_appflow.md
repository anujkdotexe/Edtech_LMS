# 04. User Flow & Appflow Document

This document traces the exact navigation loops and state transitions across the Student, Admin, and Developer portals.

---

## 1. The Student Journey

```mermaid
graph TD
    Start[Registration / Login] --> Onboarding[Dicebear Avatar Select]
    Onboarding --> Dashboard[Home Dashboard]
    Dashboard --> Warmup[30-Sec Warmup Vocabulary]
    Dashboard --> Catalog[Course Catalog]
    Dashboard --> Quizzes[Quiz Directory]
    Dashboard --> Board[Full Leaderboard]
    
    Catalog --> |Lock Icon| Purchase[Mock Checkout Sheet]
    Purchase --> |Choose Success| CourseSyllabus[Syllabus View]
    CourseSyllabus --> PDFPlayer[PDF Document Reader]
    PDFPlayer --> |Complete Lesson| XPGain[XP Level-Up Check]
    
    Quizzes --> PlayQuiz[14-Card Quiz Board]
    PlayQuiz --> |Back Arrow Click| ExitConfirm{Show Warning Pop-up?}
    ExitConfirm -->|Stay| PlayQuiz
    ExitConfirm -->|Exit| Quizzes
    PlayQuiz --> |Submit Answers| ResultScreen[Score Board & XP Awarded]
    ResultScreen --> Dashboard
```

### Steps Description
1. **Onboarding**: The student registers, types credentials, and selects a Dicebear avatar.
2. **Dashboard**: The central hub displaying Time-based greetings, Current Streak (orange flame), current XP progression bar, and top 3 Leaderboard ranking cards.
3. **Mock Checkout**: If a student clicks an unpurchased course, a premium checkout drawer slides open. The student clicks a simulated "Complete Purchase" button (Success or Fail options). A successful response immediately unlocks the syllabus.
4. **Lesson Player**: A clean split-pane window featuring a full-width PDF viewer on the left and a progress-tracking checklist on the right.
5. **Quiz Play**: A single-question card slider. If the student clicks the back arrow mid-quiz, a modal halts progress and warns that their attempt history will be lost.

---

## 2. The Admin Operations Journey

```mermaid
graph TD
    AdminLogin[Admin Login] --> AdminDash[Admin Overview Dashboard]
    AdminDash --> CourseManager[Course CMS]
    AdminDash --> StudentRegistry[Student CRM]
    AdminDash --> QuizCMS[Quiz Builder]
    
    CourseManager --> CreateCourse[Create Course & Price]
    CreateCourse --> ModuleAdder[Add Modules]
    ModuleAdder --> PDFUpload[Upload Lesson PDF to local storage]
    PDFUpload --> ReorderDrag[Drag & Drop Reorder interface]
    
    StudentRegistry --> CSVImport[Upload Student CSV name,email]
    CSVImport --> TempPass[Auto-Generate secure Temp Passwords]
    TempPass --> EmailLog[Print login credentials to system console logs]
```

### Steps Description
1. **Course CMS**: Admins can edit modules and courses. They can drag lessons to reorder their layout which triggers instant backend order index updates.
2. **Student CRM**: Contains lists of active students. CSV imports are triggered here. The admin uploads a `.csv` with `name,email` columns. The server responds with temporary credentials printed into the system terminal logs.

---

## 3. The Developer System-Inspection Journey

```mermaid
graph TD
    DevLogin[Developer Login] --> DevDash[Developer Control Hub]
    DevDash --> AdminInherited[Admin CRM & CMS Views]
    DevDash --> SysLogs[Live Latency & Log Streams]
    DevDash --> Impersonation[Student Impersonation Tool]
    
    Impersonation --> SelectUser[Search Student Email]
    SelectUser --> TriggerTakeover[Generate Impersonation Token]
    TriggerTakeover --> TakeoverState[Redirect to Student view + Impersonation Warning Banner]
    TakeoverState --> |Perform Actions| LogAudit[Write entry in audit_logs table]
    TakeoverState --> |Click Stop| Revert[Clear cookies & Restore Developer Role Session]
```

### Steps Description
1. **Impersonation Protocol**: The developer enters a student's email, which initiates the impersonation flow.
2. **Audit Logging**: During impersonation, all requests must contain the `x-impersonated-by` header, ensuring audit logging records exactly who initiated the action.
3. **Revert Switch**: An absolute floating banner allows the developer to terminate the session instantly, returning the developer to the developer cockpit.
