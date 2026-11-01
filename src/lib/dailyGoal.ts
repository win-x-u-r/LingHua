import { supabase } from "@/integrations/supabase/client";

/*
 * Daily learning goal: how many minutes a day someone wants to spend with Hua,
 * and how much of it they have done today.
 *
 * Minutes are counted on the device (see useLearningTimer) and saved to the
 * `daily_activity` table when it exists, so the same numbers can follow the
 * learner to the phone app later. Until the migration is run everything still
 * works from this device's storage.
 */

export type GoalTier = "casual" | "steady" | "focused" | "dedicated";

export const GOALS: { minutes: number; tier: GoalTier }[] = [
  { minutes: 5, tier: "casual" },
  { minutes: 10, tier: "steady" },
  { minutes: 15, tier: "focused" },
  { minutes: 20, tier: "dedicated" },
];

export const DEFAULT_GOAL_MINUTES = 10;
export const DEFAULT_REMINDER_TIME = "19:00";

export function tierFor(minutes: number): GoalTier {
  return (GOALS.find((g) => g.minutes === minutes) ?? GOALS[1]).tier;
}

export function cleanGoal(value: unknown): number {
  const n = Number(value);
  return GOALS.some((g) => g.minutes === n) ? n : DEFAULT_GOAL_MINUTES;
}

export function cleanTime(value: unknown): string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : DEFAULT_REMINDER_TIME;
}

/** Local calendar day, YYYY-MM-DD */
export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ---------- learning settings (goal + reminder) ---------- */

export interface LearningPrefs {
  goalMinutes: number;
  reminderOn: boolean;
  reminderTime: string; // HH:MM, the learner's local time
}

const prefsKey = (userId: string) => `linghua-prefs-${userId}`;

export function readLocalPrefs(userId: string): Partial<LearningPrefs> {
  try {
    return JSON.parse(localStorage.getItem(prefsKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function writeLocalPrefs(userId: string, prefs: LearningPrefs) {
  localStorage.setItem(prefsKey(userId), JSON.stringify(prefs));
}

/** Profile columns win; then what this device remembers; then sign-up metadata; then defaults. */
export function resolvePrefs(
  userId: string,
  profile: Record<string, unknown> | null,
  metadata: Record<string, unknown> | undefined,
): LearningPrefs {
  const local = readLocalPrefs(userId);
  const pick = <T,>(col: string, localVal: T | undefined, metaKey: string) =>
    profile && profile[col] !== undefined && profile[col] !== null
      ? profile[col]
      : localVal !== undefined
        ? localVal
        : metadata?.[metaKey];
  return {
    goalMinutes: cleanGoal(pick("daily_goal_minutes", local.goalMinutes, "daily_goal_minutes")),
    reminderOn: Boolean(pick("reminder_enabled", local.reminderOn, "reminder_enabled") ?? false),
    reminderTime: cleanTime(pick("reminder_time", local.reminderTime, "reminder_time")),
  };
}

/* ---------- minutes learned ---------- */

const activityKey = (userId: string) => `linghua-activity-${userId}`;

type ActivityLog = Record<string, number>; // day -> seconds

function readLog(userId: string): ActivityLog {
  try {
    return JSON.parse(localStorage.getItem(activityKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function addLearningSeconds(userId: string, seconds: number): number {
  const log = readLog(userId);
  const today = dayKey();
  log[today] = (log[today] ?? 0) + seconds;
  // Keep about two months on the device
  const keep = Object.keys(log).sort().slice(-62);
  const trimmed: ActivityLog = {};
  for (const k of keep) trimmed[k] = log[k];
  localStorage.setItem(activityKey(userId), JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent("linghua-activity"));
  return trimmed[today];
}

export function localSecondsOn(userId: string, day = dayKey()): number {
  return readLog(userId)[day] ?? 0;
}

let tableMissing = false;

/** Save today's seconds to Supabase. Quietly does nothing until the migration has been run. */
export async function syncToday(userId: string) {
  if (tableMissing) return;
  const day = dayKey();
  const { error } = await (supabase as any)
    .from("daily_activity")
    .upsert({ user_id: userId, day, seconds: localSecondsOn(userId, day) }, { onConflict: "user_id,day" });
  if (error && (error.code === "42P01" || error.code === "PGRST205" || error.status === 404)) tableMissing = true;
}

/** Seconds learned today, using the larger of this device and the server (another device may have added more). */
export async function secondsToday(userId: string): Promise<number> {
  const local = localSecondsOn(userId);
  if (tableMissing) return local;
  const { data, error } = await (supabase as any)
    .from("daily_activity")
    .select("seconds")
    .eq("user_id", userId)
    .eq("day", dayKey())
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") tableMissing = true;
    return local;
  }
  const remote = data?.seconds ?? 0;
  if (remote > local) {
    // Another device got further today: carry on from there so the next save never goes backwards
    const log = readLog(userId);
    log[dayKey()] = remote;
    localStorage.setItem(activityKey(userId), JSON.stringify(log));
  }
  return Math.max(local, remote);
}

export const toMinutes = (seconds: number) => Math.floor(seconds / 60);

/* Arabic counts change form with the number: 1 دقيقة, 2 دقيقتان, 3 to 10 دقائق, 11 and up دقيقة */
function arCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  return n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;
}

export function minutesPhrase(n: number, lang: "ar" | "en"): string {
  if (lang === "ar") return arCount(n, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة");
  return n === 1 ? "1 minute" : `${n} minutes`;
}

export function daysPhrase(n: number, lang: "ar" | "en"): string {
  if (lang === "ar") return arCount(n, "يوم واحد", "يومان", "أيام", "يومًا");
  return n === 1 ? "1 day" : `${n} days`;
}

/** "4 of 10 min" in the right form for the language */
export function progressText(t: (k: string) => string, lang: "ar" | "en", minutes: number, goal: number) {
  return t("goal.progress")
    .replace("{m}", String(Math.min(minutes, goal)))
    .replace("{gm}", minutesPhrase(goal, lang))
    .replace("{g}", String(goal));
}

export function goalText(t: (k: string) => string, lang: "ar" | "en", goal: number) {
  return t("goal.min").replace("{n}", String(goal)).replace("{m}", minutesPhrase(goal, lang));
}
