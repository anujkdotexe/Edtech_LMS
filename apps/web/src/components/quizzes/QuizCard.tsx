import React from 'react';
import Link from 'next/link';
import { Trophy, Zap, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface QuizItem {
  id: string;
  title: string;
  rules?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  pointValue?: number;
}

interface QuizCardProps {
  quiz: QuizItem;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const getDifficultyVariant = (diff?: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch ((diff || 'EASY').toUpperCase()) {
      case 'EASY':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HARD':
        return 'error';
      default:
        return 'default';
    }
  };

  const difficultyText = quiz.difficulty || 'EASY';
  const points = quiz.pointValue ?? 50;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={getDifficultyVariant(quiz.difficulty)} size="sm">
            {difficultyText}
          </Badge>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-amber-700" />
            +{points} XP
          </span>
        </div>

        <div>
          <Link href={`/quizzes/${quiz.id}`}>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-primary transition line-clamp-1 hover:underline cursor-pointer">
              {quiz.title}
            </h3>
          </Link>
          {quiz.rules && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {quiz.rules}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <Link href={`/quizzes/${quiz.id}`} className="w-full">
          <Button variant="outline" size="sm" fullWidth>
            <span>Start Quiz</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
