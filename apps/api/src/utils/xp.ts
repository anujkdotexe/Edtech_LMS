export const XP_PER_LEVEL = 250;

export interface XpStats {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

export function calculateLevelStats(totalXp: number): XpStats {
  const safeTotalXp = Math.max(0, totalXp);
  const level = Math.floor(safeTotalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = safeTotalXp % XP_PER_LEVEL;
  const xpNeededForNextLevel = XP_PER_LEVEL;
  const progressPercent = Math.round((xpInLevel / xpNeededForNextLevel) * 100);

  return {
    totalXp: safeTotalXp,
    level,
    xpInLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
}

export function didUserLevelUp(oldXp: number, newXp: number): { didLevelUp: boolean; oldLevel: number; newLevel: number } {
  const oldLevel = Math.floor(Math.max(0, oldXp) / XP_PER_LEVEL) + 1;
  const newLevel = Math.floor(Math.max(0, newXp) / XP_PER_LEVEL) + 1;
  return {
    didLevelUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
}
