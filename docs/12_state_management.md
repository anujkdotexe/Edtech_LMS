# 12. State Management Design Document

## Zustand Store Topology

The Next.js 14 frontend keeps UI state fully stateless at the page layer, utilizing **Zustand** stores for shared state slices. 

```text
       ZUSTAND CENTRAL STATE COCKPIT
                     ├── authSlice (Credentials, Impersonation state, Avatar)
                     ├── quizSlice (Active question index, Selected answers, Time limits)
                     └── courseSlice (Syllabus checklist, Active lesson reading nodes)
```

---

## 1. Authentication Store (`authStore`)

Synchronizes student session states and monitors active developer takeover sessions:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
  avatarUrl: string | null;
  impersonatedBy?: string; // Presence activates Impersonation Warnings
}

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  setSession: (user: UserSession | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) => set({ user, isAuthenticated: !!user }),
      clearSession: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'lms-auth-session', // Saved in localStorage to prevent loss on reload
    }
  )
);
```

---

## 2. Interactive Quiz Store (`quizStore`)

Governs multiple-choice question card positions and handles the exit pop-up alert flag:

```typescript
interface QuizState {
  activeQuizId: string | null;
  activeQuestionIndex: number;
  selectedAnswers: Record<string, string>; // Maps questionId -> choice ('A', 'B', 'C', 'D')
  isQuizInProgress: boolean;
  
  startQuiz: (quizId: string) => void;
  selectOption: (questionId: string, option: string) => void;
  nextQuestion: (totalQuestions: number) => boolean; // Returns true if complete
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  activeQuizId: null,
  activeQuestionIndex: 0,
  selectedAnswers: {},
  isQuizInProgress: false,

  startQuiz: (quizId) => set({ 
    activeQuizId: quizId, 
    activeQuestionIndex: 0, 
    selectedAnswers: {}, 
    isQuizInProgress: true 
  }),

  selectOption: (questionId, option) => set((state) => ({
    selectedAnswers: { ...state.selectedAnswers, [questionId]: option }
  })),

  nextQuestion: (totalQuestions) => {
    let complete = false;
    set((state) => {
      if (state.activeQuestionIndex + 1 >= totalQuestions) {
        complete = true;
        return {};
      }
      return { activeQuestionIndex: state.activeQuestionIndex + 1 };
    });
    return complete;
  },

  resetQuiz: () => set({ 
    activeQuizId: null, 
    activeQuestionIndex: 0, 
    selectedAnswers: {}, 
    isQuizInProgress: false 
  }),
}));
```

---

## 3. Course syllabus Store (`courseStore`)

Tracks active lesson states during learning:
- **Active Course Nodes**: Captures the current lesson ID being read in the PDF deck to resume exactly where the student left off.
- **Toggle Sidebar**: Visual expand/collapse configurations for navigation layouts.
