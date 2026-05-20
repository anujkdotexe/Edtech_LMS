# 22. React Component Architecture

This document describes the key presentation components on the Next.js frontend, establishing clean typings and composition boundaries.

---

## 1. Course Player Split-Pane (`CoursePlayer`)

A professional reading platform that displays structured course outlines alongside the PDF viewer:

```typescript
// apps/web/src/components/CoursePlayer/types.ts

export interface LessonNode {
  id: string;
  title: string;
  filePath: string;
  orderIndex: number;
  isCompleted: boolean;
}

export interface ModuleNode {
  id: string;
  title: string;
  lessons: LessonNode[];
}

export interface CoursePlayerProps {
  courseId: string;
  courseTitle: string;
  modules: ModuleNode[];
  initialActiveLessonId?: string;
}
```

### Layout Composition
- **Left Side Sidebar**: Responsive accordion cards mapping the course's modules and individual lesson checklist nodes. Clicking a lesson node loads its PDF on the right pane and commits active learning positions to the store.
- **Right Side Reading Pane**: Clean in-browser viewer displaying the static PDF file. Includes a top task bar featuring standard zoom sliders, search fields, and a prominent "Mark as Completed" button.

---

## 2. Interactive MCQ Slide Deck (`QuizBoard`)

Governs question animations, answer choices selection, and sound triggers:

```typescript
// apps/web/src/components/QuizBoard/types.ts

export interface QuestionCard {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

export interface QuizBoardProps {
  quizId: string;
  quizTitle: string;
  questions: QuestionCard[];
  onComplete: (score: number, answers: Record<string, string>) => void;
}
```

### Layout Composition
- **Top Task Bar**: Animates dynamic widths (`question_index / total_questions * 100%`) using Framer Motion. Contains a prominent exit close button (X) that triggers the exit-warning modal.
- **Card deck Slider**: Animates slide-in exits on question transitions (`x: -300` on next, `x: 300` on previous).
- **Inline Option Selectors**: Clickable HSL color-coded selector cards with active scale bounce effects.

---

## 3. Top Navigation Cockpit (`Navbar`)
- **Visuals**: Modern Notion-styled light-mode navbar featuring a glassmorphic border (`backdrop-blur-md bg-white/75 border-b border-slate-200`).
- **Indicators**: Current XP level and glowing amber daily streak counter flames.
- **Dropdown Profile**: Dicebear avatar picker, Settings navigation, Impersonate-Revert switches (developers only), and standard Sign Out.
