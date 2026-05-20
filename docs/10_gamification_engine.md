# 10. Gamification Engine Design Document

This document defines the mathematical models and logical flows governing the gamification loop.

---

## 1. XP Progression & Level-Up Models

Students earn Experience Points (XP) through active interaction with courses and quizzes. 

### XP Award Values
- **Lesson Completed**: `+20 XP` (capped at 5 lessons per day to prevent farming).
- **Quiz Passed**: `+50 XP` standard completion bonus, plus `+5 XP` for each correct question.
- **Daily Warmup**: `+10 XP` awarded once daily on first vocabulary warmup completion.

### Level Threshold Model
A level-up occurs every **250 XP**. The level is computed in real-time or updated on write using the following simple formula:

$$\text{Level} = \left\lfloor \frac{\text{Total XP}}{250} \right\rfloor + 1$$

*Example*:
- XP = 0 $\rightarrow$ Level 1
- XP = 249 $\rightarrow$ Level 1
- XP = 250 $\rightarrow$ Level 2
- XP = 1250 $\rightarrow$ Level 6

---

## 2. Streak Engine Algorithm

Streaks measure consecutive days of active engagement. The streak state is evaluated on every user API request and verified by a daily cron process running at midnight UTC.

### Active Check Logic
When a student logs an activity:
1. **Compare** the `current_date` with `last_active_date` (expressed in the user's localized timezone):
   - **Difference = 0 days** (Same day): Ignore streak increment. Update last active details.
   - **Difference = 1 day** (Consecutive day): Increment `current_streak` by 1. Update `last_active_date = current_date`. Check and update `longest_streak = max(current_streak, longest_streak)`.
   - **Difference > 1 day** (Streak broken): Reset `current_streak` to 1. Update `last_active_date = current_date`.

### Daily Cron Sweep
A background cron job runs every night at UTC 00:00:
```sql
-- Reset streaks for users who failed to log any activity yesterday
UPDATE user_streaks
SET current_streak = 0
WHERE last_active_date IS NULL 
   OR CURRENT_DATE - last_active_date > 1;
```

---

## 3. Achievement Badges Blueprint

The platform ships with **7 core badges**. A central evaluator function hooks into all XP-earning routes, scanning for eligibility:

```typescript
export interface BadgeDefinition {
  id: string;
  name: string;
  conditionDescription: string;
  evaluator: (stats: {
    quizAttempts: number;
    completedLessons: number;
    level: number;
    streak: number;
    perfectQuizzes: number;
    unlockedCourses: number;
  }) => boolean;
}

export const BADGE_REGISTRY: BadgeDefinition[] = [
  {
    id: "first_steps",
    name: "First Steps",
    conditionDescription: "Complete your first quiz attempt",
    evaluator: (stats) => stats.quizAttempts >= 1,
  },
  {
    id: "polyglot",
    name: "Polyglot",
    conditionDescription: "Read 10 full PDF lessons",
    evaluator: (stats) => stats.completedLessons >= 10,
  },
  {
    id: "scholar",
    name: "Scholar",
    conditionDescription: "Reach Level 5 (1,000 XP total)",
    evaluator: (stats) => stats.level >= 5,
  },
  {
    id: "fire_starter",
    name: "Fire Starter",
    conditionDescription: "Maintain a 3-day active learning streak",
    evaluator: (stats) => stats.streak >= 3,
  },
  {
    id: "centurion",
    name: "Centurion",
    conditionDescription: "Maintain a 30-day active learning streak",
    evaluator: (stats) => stats.streak >= 30,
  },
  {
    id: "mastermind",
    name: "Mastermind",
    conditionDescription: "Score 100% on a Medium or Hard difficulty quiz",
    evaluator: (stats) => stats.perfectQuizzes >= 1,
  },
  {
    id: "completionist",
    name: "Completionist",
    conditionDescription: "Unlock all 8 courses in the platform",
    evaluator: (stats) => stats.unlockedCourses >= 8,
  }
];
```

---

## 4. Leaderboard Ranking Strategy
- **Rankings View**: Fetches the top 100 students from `user_xp` joined with `users` (name, avatar, level, streak), sorted by `total_xp DESC`.
- **User Index Highlights**: The API resolves the current student's absolute rank using a fast window function:
  ```sql
  SELECT rank FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
    FROM user_xp
  ) ranked WHERE user_id = $1;
  ```
- **Empty States**: If a user is not ranked yet (0 XP), they are appended at the bottom with a motivational tip callout card.
