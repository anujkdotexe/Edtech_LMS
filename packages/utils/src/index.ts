// Shared utility functions placeholder
export function formatXP(xp: number): string {
  return `${xp.toLocaleString()} XP`;
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 250) + 1;
}
