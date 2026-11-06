import { registerSW } from "virtual:pwa-register";

/**
 * Keeps everyone on the latest LingHua. Started from main.tsx before React, so it
 * still works if the page itself fails to draw.
 *  - Checks for a new version when the app opens, every 30 minutes, and when
 *    someone comes back to the tab or the installed app.
 *  - An update found in the first few seconds after opening is applied straight
 *    away, so most people simply get the new version on open.
 *  - Later, UpdateReady shows a small "New update ready" note with Refresh, so
 *    nobody loses a lesson half way through.
 *  - If an old page asks for a file that no longer exists, it reloads once.
 */
const CHECK_EVERY_MS = 30 * 60 * 1000;
const RECHECK_ON_RETURN_MS = 5 * 60 * 1000;
const QUIET_APPLY_MS = 8 * 1000;
const RELOADED_KEY = "linghua-chunk-reload";

let ready = false;
const listeners = new Set<() => void>();
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;

export const updateReady = () => ready;
export const onUpdateReady = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const refreshToUpdate = () => {
  if (applyUpdate) applyUpdate(true);
  else window.location.reload();
};

export function startUpdateChecks() {
  // An old page asked for a file from a build that has since been replaced
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    let reloaded = false;
    try {
      reloaded = sessionStorage.getItem(RELOADED_KEY) === "1";
      sessionStorage.setItem(RELOADED_KEY, "1");
    } catch {
      /* storage blocked */
    }
    if (!reloaded) window.location.reload();
  });
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(RELOADED_KEY);
    } catch {
      /* storage blocked */
    }
  }, 10_000);

  if (!("serviceWorker" in navigator)) return;

  const openedAt = Date.now();
  let lastCheck = openedAt;
  let registration: ServiceWorkerRegistration | undefined;

  const check = async () => {
    if (!registration || registration.installing || !navigator.onLine) return;
    lastCheck = Date.now();
    try {
      await registration.update();
    } catch {
      /* offline or server busy: try again next time */
    }
  };

  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (Date.now() - openedAt < QUIET_APPLY_MS) {
        applyUpdate?.(true);
        return;
      }
      ready = true;
      listeners.forEach((listener) => listener());
    },
    onRegisteredSW(_url, reg) {
      registration = reg;
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastCheck > RECHECK_ON_RETURN_MS) check();
  });
}
