import { supabase } from "@/integrations/supabase/client";

/*
 * Lock-screen reminders on the web (web push).
 *
 * The browser gives us an address for this device; we keep it in `push_subscriptions`
 * and the server (backend/send_reminders.py) sends Hua's reminder there at the learner's
 * reminder time, even when LingHua is closed.
 *
 * Works on Android and desktop browsers. On iPhone and iPad it only works once LingHua
 * has been added to the Home Screen. Needs VITE_VAPID_PUBLIC_KEY in the front-end env.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const flagKey = (userId: string) => `linghua-push-${userId}`;

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window &&
  !!VAPID_PUBLIC_KEY;

/** True when this device is signed up for Hua's lock-screen reminders */
export const hasPush = (userId: string) => localStorage.getItem(flagKey(userId)) === "1";

function keyToBytes(base64url: string): Uint8Array {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// The service worker is not running in local development; don't wait forever for it
async function registration(): Promise<ServiceWorkerRegistration | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.active) return reg;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
}

/** Sign this device up for reminders. Needs notification permission already granted. */
export async function enablePush(userId: string): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await registration();
    if (!reg) return false;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY!) }));
    const json = sub.toJSON();
    const { error } = await (supabase as any).from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: "endpoint" },
    );
    if (error) return false;
    // The server sends at the learner's own local time, in the language they use LingHua in
    const lang = localStorage.getItem("linghua-lang") === "ar" ? "ar" : "en";
    await (supabase as any)
      .from("profiles")
      .update({ reminder_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", language_pref: lang })
      .eq("id", userId);
    localStorage.setItem(flagKey(userId), "1");
    return true;
  } catch {
    return false;
  }
}

/** Stop lock-screen reminders on this device */
export async function disablePush(userId: string) {
  localStorage.removeItem(flagKey(userId));
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await (supabase as any).from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  } catch {
    // Nothing to undo
  }
}
