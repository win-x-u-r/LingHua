// Foundation 1 progress for one learner, kept on this device for now.
// Moving it to the learner's account (a lesson_progress table) comes with
// the teacher's view of the unit.

export type CanDoAnswer = "not_yet" | "with_help" | "yes";

export interface LessonResult {
  finishedAt: string;
  /** First-try answers, by step */
  scores: Record<string, { right: number; total: number }>;
  /** Speaking turns Hua understood / all speaking turns */
  spoken: { done: number; total: number };
  passed?: boolean;
}

export interface FoundationProgress {
  lessons: Record<string, LessonResult>;
  canDo: Record<number, CanDoAnswer>;
}

/** Each course keeps its own progress: "foundation1" or "move" */
const keyFor = (userId: string | undefined, store = "foundation1") => `linghua.${store}.${userId ?? "guest"}`;

export function loadProgress(userId: string | undefined, store?: string): FoundationProgress {
  try {
    const raw = localStorage.getItem(keyFor(userId, store));
    if (raw) return { lessons: {}, canDo: {}, ...JSON.parse(raw) };
  } catch {
    // Private window or blocked storage: start fresh
  }
  return { lessons: {}, canDo: {} };
}

export function saveProgress(userId: string | undefined, progress: FoundationProgress, store?: string) {
  try {
    localStorage.setItem(keyFor(userId, store), JSON.stringify(progress));
  } catch {
    // Nothing to do: progress stays for this visit only
  }
}
