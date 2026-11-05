import type { Language } from "@/lib/i18n";

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
  dueWords: number; // words waiting for review today
}

type Line = { en: string; ar: string };

// Zoha's wording, one line per kind of reminder
export const HUA_LINES = {
  daily: { en: "Ready for a little Mandarin today?", ar: "مستعد لقليل من الماندرين اليوم؟" },
  streak: { en: "You're building a lovely streak. Keep it going!", ar: "أنت تبني سلسلة رائعة. استمر!" },
  vocabulary: { en: "Hua has a new word for you!", ar: "لدى هُوا كلمة جديدة لك!" },
  progress: { en: "Look how far you've come!", ar: "انظر كم تقدّمت!" },
  nudge: { en: "A few minutes of Mandarin? Hua is here!", ar: "بضع دقائق من الماندرين؟ هُوا هنا!" },
} satisfies Record<string, Line>;

export type ReminderKind = keyof typeof HUA_LINES;

// Days with nothing special to say rotate through these
const EVERYDAY: ReminderKind[] = ["daily", "nudge"];

export const REMINDER_TITLE: Line = { en: "Hua", ar: "هُوا" };

/**
 * Which reminder fits right now, first match wins: already started today = progress,
 * words due for review = new word, a streak of two days or more = streak, otherwise
 * the everyday lines in turn. `seed` changes the everyday line from day to day.
 */
export function reminderKind(ctx: ReminderContext, seed = new Date().getDate()): ReminderKind {
  if (ctx.minutes > 0) return "progress";
  if (ctx.dueWords > 0) return "vocabulary";
  if (ctx.streak >= 2) return "streak";
  return EVERYDAY[seed % EVERYDAY.length];
}

export function huaMessage(ctx: ReminderContext, lang: Language, seed = new Date().getDate()): string {
  return HUA_LINES[reminderKind(ctx, seed)][lang];
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
