import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_GOAL_MINUTES, localSecondsOn, secondsToday, toMinutes } from "@/lib/dailyGoal";

/** Minutes learned today and the daily goal, kept up to date while the page is open. */
export function useTodayMinutes() {
  const { user, prefs } = useAuth();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    secondsToday(user.id).then((s) => alive && setSeconds(s));
    const onLocal = () => setSeconds((s) => Math.max(s, localSecondsOn(user.id)));
    window.addEventListener("linghua-activity", onLocal);
    return () => {
      alive = false;
      window.removeEventListener("linghua-activity", onLocal);
    };
  }, [user]);

  const goal = prefs?.goalMinutes ?? DEFAULT_GOAL_MINUTES;
  const minutes = toMinutes(seconds);
  return { minutes, goal, done: minutes >= goal, left: Math.max(0, goal - minutes) };
}
