import React from 'react';
import Link from 'next/link';
import { BookOpen, Lock, Unlock, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface CourseItem {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
}

interface CourseCardProps {
  course: CourseItem;
  onPurchaseClick?: (course: CourseItem) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPurchaseClick }) => {
  const getLevelVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'A1':
      case 'A2':
        return 'success';
      case 'B1':
      case 'B2':
        return 'primary';
      case 'C1':
      case 'C2':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isAccessGranted = course.isUnlocked || !course.isPremium;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={getLevelVariant(course.cefrLevel)} size="sm">
            {course.cefrLevel}
          </Badge>
          <div className="flex items-center gap-1.5">
            {course.isPremium ? (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                ${course.price}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Free
              </span>
            )}
            {isAccessGranted ? (
              <span title="Unlocked">
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              </span>
            ) : (
              <span title="Locked">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-primary transition line-clamp-1">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        {isAccessGranted ? (
          <Link href={`/courses/${course.id}`} className="w-full">
            <Button variant="primary" size="sm" fullWidth>
              <span>Continue Learning</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onPurchaseClick && onPurchaseClick(course)}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Unlock for ${course.price}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
