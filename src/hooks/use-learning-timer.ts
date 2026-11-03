import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addLearningSeconds, syncToday } from "@/lib/dailyGoal";

// Pages where time counts toward the daily goal
const LEARNING_PATHS = ["/flashcards", "/practice", "/grammar", "/tutor", "/translator", "/learn"];
// Stop counting if nobody has touched, typed or spoken for this long
const IDLE_MS = 90_000;
const TICK_MS = 5_000;
const SYNC_EVERY_TICKS = 12; // about once a minute

/**
 * Counts the minutes someone actually spends learning: only on a learning page,
 * only while the tab is visible, and only while they are active.
 */
export function useLearningTimer() {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const counting = !!user && profile?.role !== "teacher" && LEARNING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!counting || !user) return;
    let lastActive = Date.now();
    let ticks = 0;
    const markActive = () => {
      lastActive = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      // A recording or playing clip counts as active even without touches
      const media = Array.from(document.querySelectorAll("audio, video")).some(
        (m) => !(m as HTMLMediaElement).paused,
      );
      if (!media && Date.now() - lastActive > IDLE_MS) return;
      addLearningSeconds(user.id, TICK_MS / 1000);
      if (++ticks % SYNC_EVERY_TICKS === 0) syncToday(user.id);
    }, TICK_MS);

    const flush = () => {
      if (document.visibilityState === "hidden") syncToday(user.id);
    };
    document.addEventListener("visibilitychange", flush);

    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener("visibilitychange", flush);
      if (ticks > 0) syncToday(user.id);
    };
  }, [counting, user]);
}
