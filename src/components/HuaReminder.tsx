import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTodayMinutes } from "@/hooks/use-today-minutes";
import { supabase } from "@/integrations/supabase/client";
import { dayKey } from "@/lib/dailyGoal";
import { getDueWords } from "@/lib/spacedRepetition";
import {
  REMINDER_TITLE,
  huaMessage,
  markReminded,
  nextReminderAt,
  reminderTimePassed,
  remindedOn,
  showHuaNotification,
} from "@/lib/reminders";

// No nudges while signing in or while already learning
const QUIET_PATHS = ["/auth", "/flashcards", "/practice", "/grammar", "/tutor"];

/**
 * Hua's daily reminder. At the learner's reminder time, if today's goal is not done yet,
 * Hua sends a notification (when the tab is in the background) or pops up in the corner.
 * Opening the app later that day without having learned brings up the same note once.
 */
const HuaReminder = () => {
  const { user, profile, prefs } = useAuth();
  const { language, t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { minutes, goal, done } = useTodayMinutes();
  const [streak, setStreak] = useState(0);
  const [dueWords, setDueWords] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const active = !!user && !!prefs?.reminderOn && profile?.role !== "teacher";

  useEffect(() => {
    if (!active || !user) return;
    (supabase as any)
      .from("progress")
      .select("current_streak")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { current_streak: number } | null }) => setStreak(data?.current_streak ?? 0));
    getDueWords(supabase, user.id).then((words) => setDueWords(words.length));
  }, [active, user]);

  // Read the latest numbers inside timers without restarting them every minute
  const latest = useRef({ minutes, goal, done, streak, dueWords, language, pathname });
  latest.current = { minutes, goal, done, streak, dueWords, language, pathname };

  const remind = (asNotification: boolean) => {
    if (!user) return;
    const today = dayKey();
    const now = latest.current;
    if (now.done || remindedOn(user.id) === today) return;
    const body = huaMessage(
      { name: (profile?.full_name ?? "").split(" ")[0], goal: now.goal, minutes: now.minutes, streak: now.streak, dueWords: now.dueWords },
      now.language,
    );
    markReminded(user.id, today);
    if (asNotification) {
      showHuaNotification(REMINDER_TITLE[now.language], body).then((sent) => !sent && setMessage(body));
    } else if (!QUIET_PATHS.includes(now.pathname)) {
      setMessage(body);
    }
  };

  // Opening the app after the reminder time, goal not done: one note in the corner
  useEffect(() => {
    if (!active || !prefs || done || QUIET_PATHS.includes(pathname)) return;
    if (!reminderTimePassed(prefs.reminderTime)) return;
    // Give the minutes a moment to load from the server first
    const wait = window.setTimeout(() => remind(false), 2500);
    return () => window.clearTimeout(wait);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, prefs?.reminderTime, pathname, done]);

  // At the reminder time itself
  useEffect(() => {
    if (!active || !prefs) return;
    let timer: number;
    const arm = () => {
      const ms = Math.min(nextReminderAt(prefs.reminderTime).getTime() - Date.now(), 2 ** 31 - 1);
      timer = window.setTimeout(() => {
        remind(document.visibilityState === "hidden");
        arm();
      }, ms);
    };
    arm();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, prefs?.reminderTime]);

  useEffect(() => {
    if (done) setMessage(null);
  }, [done]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed z-[60] bottom-3 inset-x-3 sm:inset-x-auto sm:end-4 sm:bottom-4 sm:w-[380px] rounded-[14px] border-2 border-stroke bg-card text-card-foreground shadow-[4px_4px_0_hsl(var(--stamp))] p-4 flex items-start gap-3"
    >
      <div className="lantern-glow [--glow-size:190%] [--glow-y:55%] shrink-0">
        <Lantern mood="happy" entering className="w-16 h-16" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <span className="font-bold text-primary">{REMINDER_TITLE[language]}</span>
        <p className="text-sm leading-snug">{message}</p>
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            onClick={() => {
              setMessage(null);
              navigate("/flashcards");
            }}
          >
            {t("reminder.go")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMessage(null)}>
            {t("reminder.later")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HuaReminder;
