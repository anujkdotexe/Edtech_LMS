export interface QuizSummary {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pointValue: number;
  title: string;
  rules: string;
}

export interface SanitizedQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

export interface QuizDetail extends QuizSummary {
  questions: SanitizedQuestion[];
}

export interface QuizSubmissionAnswer {
  questionId: string;
  selectedOption: string;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  newTotalXp: number;
  didLevelUp: boolean;
  newLevel: number;
  currentStreak: number;
  badgesUnlocked: Array<{ badgeId: string; name: string }>;
}
