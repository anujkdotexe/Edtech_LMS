import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
  todayStr: string;
}

export function getCalendarDayDiff(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export async function updateStreakInTx(
  tx: any,
  userId: string,
  todayStr: string = new Date().toISOString().split('T')[0]
): Promise<StreakResult> {
  const streakRecord = await tx
    .select()
    .from(schema.userStreaks)
    .where(eq(schema.userStreaks.userId, userId))
    .limit(1);

  let currentStreak = streakRecord.length > 0 ? streakRecord[0].currentStreak : 0;
  let longestStreak = streakRecord.length > 0 ? streakRecord[0].longestStreak : 0;
  const lastActiveDate = streakRecord.length > 0 ? streakRecord[0].lastActiveDate : null;
  let streakIncremented = false;

  if (!lastActiveDate) {
    currentStreak = 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    streakIncremented = true;
  } else if (lastActiveDate === todayStr) {
    // Already active today; streak remains unchanged
    streakIncremented = false;
  } else {
    const diffDays = getCalendarDayDiff(lastActiveDate, todayStr);
    if (diffDays === 1) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      streakIncremented = true;
    } else {
      // Inactivity broke the streak
      currentStreak = 1;
      streakIncremented = true;
    }
  }

  if (streakRecord.length > 0) {
    await tx
      .update(schema.userStreaks)
      .set({
        currentStreak,
        longestStreak,
        lastActiveDate: todayStr,
        updatedAt: new Date(),
      })
      .where(eq(schema.userStreaks.userId, userId));
  } else {
    await tx.insert(schema.userStreaks).values({
      userId,
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr,
    });
  }

  return {
    currentStreak,
    longestStreak,
    streakIncremented,
    todayStr,
  };
}
