import { registerSW } from "virtual:pwa-register";

/**
 * Keeps everyone on the latest LingHua. Started from main.tsx before React, so it
 * still works if the page itself fails to draw.
 *  - Checks for a new version when the app opens, every 30 minutes, and when
 *    someone comes back to the tab or the installed app.
 *  - Updates apply by themselves, no button: straight away if found in the first
 *    30 seconds after opening, otherwise at the next page change or when the app
 *    goes to the background (never in the middle of a screen someone is using).
 *  - If an old page asks for a file that no longer exists, it reloads once.
 */
const CHECK_EVERY_MS = 30 * 60 * 1000;
const RECHECK_ON_RETURN_MS = 5 * 60 * 1000;
const QUIET_APPLY_MS = 30 * 1000;
const RECHECK_ON_PAGE_CHANGE_MS = 60 * 1000;
const RELOADED_KEY = "linghua-chunk-reload";

let ready = false;
let applying = false;
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;
let checkNow: (() => void) | undefined;

const apply = () => {
  if (applying || !applyUpdate) return;
  applying = true;
  applyUpdate(true);
};

/** Called by UpdateReady on every page change: a good moment to switch versions. */
export const onPageChange = () => {
  if (ready) apply();
  else checkNow?.();
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
  let lastPageCheck = openedAt;
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

  checkNow = () => {
    if (Date.now() - lastPageCheck < RECHECK_ON_PAGE_CHANGE_MS) return;
    lastPageCheck = Date.now();
    check();
  };

  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true;
      if (Date.now() - openedAt < QUIET_APPLY_MS || document.visibilityState === "hidden") apply();
    },
    onRegisteredSW(_url, reg) {
      registration = reg;
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (ready) apply();
    } else if (Date.now() - lastCheck > RECHECK_ON_RETURN_MS) {
      check();
    }
  });
}
