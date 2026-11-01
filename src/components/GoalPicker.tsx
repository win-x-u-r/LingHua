import { useState } from "react";
import GoalIcon, { ReminderIcon } from "@/components/GoalIcon";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_GOAL_MINUTES, GOALS, goalText } from "@/lib/dailyGoal";
import { askNotificationPermission, notificationPermission } from "@/lib/reminders";

/** The four daily goals as a list of choices, 10 minutes marked as recommended */
export const GoalPicker = ({
  value,
  onChange,
  labelledBy,
}: {
  value: number;
  onChange: (minutes: number) => void;
  labelledBy?: string;
}) => {
  const { t, language } = useLanguage();
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={labelledBy}>
      {GOALS.map((g) => {
        const on = value === g.minutes;
        return (
          <button
            key={g.minutes}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(g.minutes)}
            className={`flex items-center gap-3 rounded-[12px] border-2 px-3 py-2.5 text-start ${
              on ? "border-stroke bg-accent shadow-[3px_3px_0_hsl(var(--stamp))]" : "border-border bg-card"
            }`}
          >
            <GoalIcon tier={g.tier} className="w-11 h-11 shrink-0" />
            <span className="flex-1 min-w-0 flex flex-col leading-tight">
              <span className="font-bold text-lg">{goalText(t, language, g.minutes)}</span>
              <span className={on ? "text-foreground" : "text-muted-foreground"}>{t(`goal.${g.tier}`)}</span>
            </span>
            {g.minutes === DEFAULT_GOAL_MINUTES && (
              <span className="shrink-0 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-bold">
                {t("goal.recommended")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/** Daily reminder on/off and the time. Turning it on asks the browser for notifications. */
export const ReminderSetting = ({
  on,
  time,
  onChange,
}: {
  on: boolean;
  time: string;
  onChange: (on: boolean, time: string) => void;
}) => {
  const { t } = useLanguage();
  const [permission, setPermission] = useState(notificationPermission());

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border-2 border-border bg-card p-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <ReminderIcon className="w-10 h-10 shrink-0" />
        <span className="flex-1 font-bold">{t("reminder.label")}</span>
        <Switch
          checked={on}
          onCheckedChange={async (next) => {
            onChange(next, time);
            // Asked straight from the tap, which Safari needs
            if (next) setPermission(await askNotificationPermission());
          }}
        />
      </label>
      {on && (
        <div className="flex flex-col gap-1.5 ps-[52px]">
          <div className="flex items-center gap-3">
            <label htmlFor="reminder-time" className="text-sm text-muted-foreground">
              {t("reminder.at")}
            </label>
            <Input
              id="reminder-time"
              type="time"
              dir="ltr"
              step={900}
              value={time}
              onChange={(e) => e.target.value && onChange(true, e.target.value)}
              className="w-32 font-bold tabular-nums"
            />
          </div>
          {(permission === "denied" || permission === "unsupported") && (
            <span className="text-xs text-muted-foreground">{t("reminder.in_app_only")}</span>
          )}
        </div>
      )}
    </div>
  );
};
