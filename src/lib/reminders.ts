import type { Language } from "@/lib/i18n";
import { daysPhrase, minutesPhrase } from "@/lib/dailyGoal";

/*
 * Daily reminders from Hua.
 *
 * On the web Hua can nudge in two ways:
 *  - inside the app, a note from the lantern when you open LingHua after your reminder time
 *    and today's goal is not done yet;
 *  - a system notification at your reminder time, while LingHua is open in a tab or
 *    installed on the home screen.
 *
 * Reminders when the app is fully closed need either web push from the backend or, in the
 * Play Store / App Store app, the phone's own scheduled notifications. Both can reuse
 * `huaMessage` and `nextReminderAt` below, so the wording and timing stay the same.
 */

export interface ReminderContext {
  name: string;
  goal: number; // minutes
  minutes: number; // learned today
  streak: number;
}

type Line = { en: string; ar: string };

// {name}, {goal}, {left} and {streak} are filled in
const NOT_STARTED: Line[] = [
  { en: "Hi {name}, it's Hua. Shall we do your {goalM} together?", ar: "مرحبًا {name}، أنا هوا. هل نقضي {goalM} معًا اليوم؟" },
  { en: "Your lantern is waiting, {name}. Just {goalM} of Mandarin today.", ar: "فانوسك ينتظرك يا {name}. {goalM} فقط من الماندرين اليوم." },
  { en: "A few new words before bed? Hua saved you a spot.", ar: "بعض الكلمات الجديدة قبل النوم؟ هوا حجزت لك مكانًا." },
];
const STREAK: Line[] = [
  { en: "{streak} days in a row, {name}! Keep your streak glowing with {goalM} today.", ar: "سلسلتك وصلت إلى {streakD} يا {name}! حافظ على توهّجها بـ{goalM} اليوم." },
  { en: "Don't let your {streak}-day streak go dark. Hua is ready when you are.", ar: "لا تدع سلسلتك تنطفئ بعد {streakD}. هوا مستعدة متى كنت مستعدًا." },
];
const PARTWAY: Line[] = [
  { en: "Nearly there, {name}! {leftM} more and today's goal is done.", ar: "اقتربت يا {name}! {leftM} أخرى ويكتمل هدف اليوم." },
  { en: "Nice start today. Only {leftM} left with Hua.", ar: "بداية جميلة اليوم. بقيت {leftM} فقط مع هوا." },
];

export const REMINDER_TITLE: Line = { en: "Hua is here", ar: "هوا هنا" };

/** Hua's line for this moment. `seed` picks among lines so they change from day to day. */
export function huaMessage(ctx: ReminderContext, lang: Language, seed = new Date().getDate()): string {
  const left = Math.max(1, ctx.goal - ctx.minutes);
  const pool = ctx.minutes > 0 ? PARTWAY : ctx.streak >= 2 ? STREAK : NOT_STARTED;
  const line = pool[seed % pool.length][lang];
  const name = ctx.name || (lang === "ar" ? "صديقي" : "friend");
  return line
    .replace("{name}", name)
    .replace("{goalM}", minutesPhrase(ctx.goal, lang))
    .replace("{leftM}", minutesPhrase(left, lang))
    .replace("{streakD}", daysPhrase(ctx.streak, lang))
    .replace("{streak}", String(ctx.streak));
}

/** The next moment the reminder should fire, at HH:MM local time (today if still ahead, else tomorrow). */
export function nextReminderAt(time: string, from = new Date()): Date {
  const [h, m] = time.split(":").map(Number);
  const at = new Date(from);
  at.setHours(h, m, 0, 0);
  if (at.getTime() <= from.getTime()) at.setDate(at.getDate() + 1);
  return at;
}

/** True once today's reminder time has passed */
export function reminderTimePassed(time: string, now = new Date()): boolean {
  const [h, m] = time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Ask for permission. Call it straight from a tap, or Safari will refuse. */
export async function askNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a system notification from Hua. Uses the service worker when there is one (needed on Android). */
export async function showHuaNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const options: NotificationOptions = {
    body,
    icon: "/favicon-192.png",
    badge: "/favicon-192.png",
    tag: "hua-daily", // a newer reminder replaces an older one
    data: { url: "/flashcards" },
  };
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
    } else {
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        window.location.assign("/flashcards");
      };
    }
    return true;
  } catch {
    return false;
  }
}

/* Once a day: remember which day Hua already reminded, per learner */
const shownKey = (userId: string) => `linghua-reminded-${userId}`;
export const remindedOn = (userId: string) => localStorage.getItem(shownKey(userId));
export const markReminded = (userId: string, day: string) => localStorage.setItem(shownKey(userId), day);
