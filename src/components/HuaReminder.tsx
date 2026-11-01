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
import { disablePush, enablePush, hasPush, pushSupported } from "@/lib/push";
import {
  REMINDER_TITLE,
  huaMessage,
  markReminded,
  nextReminderAt,
  reminderTimePassed,
  remindedOn,
  showHuaNotification,
  askNotificationPermission,
  notificationPermission,
} from "@/lib/reminders";

// No nudges while signing in or while already learning
const QUIET_PATHS = ["/auth", "/flashcards", "/practice", "/grammar", "/tutor"];

/**
 * Hua's daily reminder.
 *  - Lock screen: this device is signed up for web push and the server sends the reminder
 *    at the learner's time, even with LingHua closed (see lib/push.ts).
 *  - Without push (not allowed yet, or not supported), a notification at the reminder time
 *    while LingHua is open in a tab.
 *  - In the app: opening LingHua after the reminder time, goal not done, shows Hua's note once.
 * If notifications have not been allowed yet, Hua asks once a day with a tap-to-allow note.
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
  const [permission, setPermission] = useState(notificationPermission());
  const [askHidden, setAskHidden] = useState(() => !!user && localStorage.getItem(`linghua-push-ask-${user.id}`) === dayKey());

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

  // Permission may have been given elsewhere (the sign-up or profile switch)
  useEffect(() => {
    setPermission(notificationPermission());
  }, [user, prefs?.reminderOn, pathname]);

  // Keep this device signed up for lock-screen reminders while they are on; also refreshes
  // the time zone and language the server uses. Turning reminders off signs it out again.
  useEffect(() => {
    if (!user) return;
    if (active && permission === "granted") enablePush(user.id);
    else if (!prefs?.reminderOn && hasPush(user.id)) disablePush(user.id);
  }, [user, active, prefs?.reminderOn, permission, language]);

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
    // With push the server sends the lock-screen notification, so the tab only shows the in-app note
    if (asNotification && !hasPush(user.id)) {
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

  // Reminders are on but notifications were never allowed: ask, from a tap, once a day
  const askForPermission =
    active && !message && !askHidden && permission === "default" && pushSupported() && !QUIET_PATHS.includes(pathname);
  const hideAsk = () => {
    if (user) localStorage.setItem(`linghua-push-ask-${user.id}`, dayKey());
    setAskHidden(true);
  };

  if (askForPermission) {
    return (
      <HuaNote title={REMINDER_TITLE[language]} body={t("reminder.allow")}>
        <Button
          size="sm"
          onClick={async () => {
            const result = await askNotificationPermission();
            setPermission(result);
            hideAsk();
          }}
        >
          {t("reminder.allow.yes")}
        </Button>
        <Button size="sm" variant="outline" onClick={hideAsk}>
          {t("reminder.allow.no")}
        </Button>
      </HuaNote>
    );
  }

  if (!message) return null;

  return (
    <HuaNote title={REMINDER_TITLE[language]} body={message}>
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
    </HuaNote>
  );
};

/** The lantern's note in the corner of the screen */
const HuaNote = ({ title, body, children }: { title: string; body: string; children: React.ReactNode }) => (
    <div
      role="status"
      className="fixed z-[60] bottom-3 inset-x-3 sm:inset-x-auto sm:end-4 sm:bottom-4 sm:w-[380px] rounded-[14px] border-2 border-stroke bg-card text-card-foreground shadow-[4px_4px_0_hsl(var(--stamp))] p-4 flex items-start gap-3"
    >
      <div className="lantern-glow [--glow-size:190%] [--glow-y:55%] shrink-0">
        <Lantern mood="happy" entering className="w-16 h-16" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <span className="font-bold text-primary">{title}</span>
        <p className="text-sm leading-snug">{body}</p>
        <div className="flex gap-2 mt-1">{children}</div>
      </div>
    </div>
);

export default HuaReminder;
