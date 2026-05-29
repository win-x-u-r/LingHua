// Grammar Mode spaced-repetition + "Weak Grammar Pool", persisted in localStorage.
// Reuses the same SM-2 math as vocabulary (calculateNextReview) so behavior matches
// the rest of the app; only the persistence layer differs (localStorage, not Supabase).

import { calculateNextReview } from "@/lib/spacedRepetition";

const STORAGE_KEY = "linghua.grammar.reviews";

interface GrammarReviewState {
  ease: number;
  interval: number;
  reps: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastScore: number;
  bestScore: number;
  attempts: number;
}

type ReviewMap = Record<string, GrammarReviewState>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function load(): ReviewMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as ReviewMap;
  } catch {
    return {};
  }
}

function save(map: ReviewMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota/availability errors */
  }
}

/**
 * Record an answer for a question and update its review schedule.
 * Correct = score 100, incorrect = 0 (which resets the interval → resurfaces soon).
 */
export function recordGrammarAnswer(questionId: string, correct: boolean): void {
  const map = load();
  const prev = map[questionId];
  const score = correct ? 100 : 0;

  const { ease, interval, repetitions } = calculateNextReview(
    score,
    prev?.ease ?? 2.5,
    prev?.interval ?? 0,
    prev?.reps ?? 0,
  );

  map[questionId] = {
    ease,
    interval,
    reps: repetitions,
    nextReviewDate: addDays(interval),
    lastScore: score,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
  };
  save(map);
}

/** Question IDs the learner got wrong last time or that are due for review. */
export function getWeakQuestionIds(): string[] {
  const map = load();
  const t = today();
  return Object.entries(map)
    .filter(([, s]) => s.lastScore < 60 || s.nextReviewDate <= t)
    .map(([id]) => id);
}

export function getWeakCount(): number {
  return getWeakQuestionIds().length;
}

/** Lightweight stats for the Grammar page header. */
export function getGrammarStats(): { attempted: number; mastered: number } {
  const map = load();
  const values = Object.values(map);
  return {
    attempted: values.length,
    mastered: values.filter((s) => s.bestScore >= 85).length,
  };
}
