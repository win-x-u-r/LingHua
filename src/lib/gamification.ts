// XP thresholds for each level
export const LEVELS = [
  { level: 1, title: "Seedling", titleAr: "بذرة", xp: 0 },
  { level: 2, title: "Sprout", titleAr: "برعم", xp: 50 },
  { level: 3, title: "Blossom", titleAr: "زهرة", xp: 150 },
  { level: 4, title: "Bamboo", titleAr: "خيزران", xp: 350 },
  { level: 5, title: "Dragon", titleAr: "تنين", xp: 600 },
  { level: 6, title: "Phoenix", titleAr: "عنقاء", xp: 1000 },
  { level: 7, title: "Master", titleAr: "أستاذ", xp: 1500 },
];

export function getCurrentLevel(totalXp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.xp) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(totalXp: number) {
  for (const level of LEVELS) {
    if (totalXp < level.xp) return level;
  }
  return null; // Max level
}

export function getXpProgress(totalXp: number): number {
  const current = getCurrentLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 100;
  const range = next.xp - current.xp;
  const progress = totalXp - current.xp;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function calculateXpEarned(score: number): number {
  return Math.floor(score / 10);
}

export function shouldUpdateStreak(lastPracticeDate: string | null): {
  newStreak: number;
  streakBroken: boolean;
} {
  if (!lastPracticeDate) return { newStreak: 1, streakBroken: false };

  const last = new Date(lastPracticeDate);
  const today = new Date();
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { newStreak: -1, streakBroken: false }; // Already practiced today
  if (diffDays === 1) return { newStreak: 1, streakBroken: false };  // Consecutive day: +1
  return { newStreak: 1, streakBroken: true };                       // Streak broken, reset to 1
}
