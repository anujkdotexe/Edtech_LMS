# 21. Entity Relationship (ER) Diagram

This document contains a complete Entity Relationship layout detailing key tables, relations, fields, and enums mapped using Mermaid syntax.

---

## 1. Physical ER Schema

```mermaid
erDiagram
    users ||--|| user_xp : "has level"
    users ||--|| user_streaks : "tracks activity"
    users ||--o{ quiz_attempts : "submits"
    users ||--o{ orders : "places"
    users ||--o{ audit_logs : "executes"
    
    courses ||--o{ course_translations : "localized by"
    courses ||--o{ modules : "contains"
    courses ||--o{ orders : "purchased via"
    
    modules ||--o{ module_translations : "localized by"
    modules ||--o{ lessons : "contains"
    
    lessons ||--o{ lesson_translations : "localized by"
    
    quizzes ||--o{ quiz_translations : "localized by"
    quizzes ||--o{ quiz_questions : "contains"
    quizzes ||--o{ quiz_attempts : "evaluated via"

    users {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        user_role role
        varchar avatar_url
        boolean force_password_reset
        timestamp created_at
    }

    user_xp {
        uuid user_id PK, FK
        integer total_xp
        integer level
        timestamp updated_at
    }

    user_streaks {
        uuid user_id PK, FK
        integer current_streak
        integer longest_streak
        date last_active_date
    }

    courses {
        uuid id PK
        cefr_level cefr_level
        numeric price
        boolean is_premium
        boolean is_published
    }

    course_translations {
        uuid id PK
        uuid course_id FK
        varchar locale
        varchar title
        text description
    }

    modules {
        uuid id PK
        uuid course_id FK
        integer order_index
    }

    lessons {
        uuid id PK
        uuid module_id FK
        varchar file_path
        integer order_index
    }

    quizzes {
        uuid id PK
        difficulty_level difficulty
        integer point_value
    }

    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        varchar option_a
        varchar option_b
        varchar option_c
        varchar option_d
        char correct_option
        integer order_index
    }

    quiz_attempts {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        integer score
        boolean passed
        timestamp attempted_at
    }

    orders {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        order_status status
        varchar transaction_id
        numeric amount
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK "Action Executer"
        uuid impersonated_by FK "Developer UID"
        varchar action
        text details
        timestamp created_at
    }
```

---

## 2. Cardinality Explanations

1. **User Stats & Streaks (`1:1`)**: Each user record is linked to precisely one row in `user_xp` and one row in `user_streaks` generated automatically at signup via database triggers or transaction loops in Fastify.
2. **Dynamic Localization (`1:N`)**: Entities like `courses`, `modules`, `lessons`, and `quizzes` have a **one-to-many** relationship with their translation helper tables. This prevents duplicates and supports infinite localized variations.
3. **Course Syllabus Composition (`1:N`)**: A course contains multiple modules, which in turn contain multiple lessons. Sequential orders are maintained using `order_index` integers.
4. **Quiz attempts log (`1:N`)**: A user can submit infinite attempts for any given quiz, capturing learning history in `quiz_attempts`.
