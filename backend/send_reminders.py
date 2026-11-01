"""
Hua's daily reminders on the lock screen (web push).

Runs every 15 minutes (GitHub Actions: .github/workflows/hua-reminders.yml, or cron on the
server). For each learner with reminders on whose local reminder time has just passed and
who has not reached today's goal, it sends one notification to every device they allowed.
Each learner gets at most one reminder a day.

Needs these environment variables (secrets, never in the repo):
  SUPABASE_URL                 https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY    service role key (Supabase > Settings > API)
  VAPID_PRIVATE_KEY            private half of the VAPID key pair
  VAPID_SUBJECT                mailto: address for the push services, e.g. mailto:team@linghua.app
Without them it prints a note and exits, so the schedule is harmless until set up.

Hua's lines must match HUA_LINES in src/lib/reminders.ts.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import requests

HUA_LINES = {
    "daily": {"en": "Ready for a little Mandarin today?", "ar": "مستعد لقليل من الماندرين اليوم؟"},
    "streak": {"en": "You're building a lovely streak. Keep it going!", "ar": "أنت تبني سلسلة رائعة. استمر!"},
    "vocabulary": {"en": "Hua has a new word for you!", "ar": "لدى هوا كلمة جديدة لك!"},
    "progress": {"en": "Look how far you've come!", "ar": "انظر كم تقدّمت!"},
    "nudge": {"en": "A few minutes of Mandarin? Hua is here!", "ar": "بضع دقائق من الماندرين؟ هوا هنا!"},
}
TITLE = {"en": "Hua", "ar": "هوا"}
EVERYDAY = ["daily", "nudge"]

# Don't send a reminder more than this long after the chosen time (e.g. if the job was down)
LATE_LIMIT = timedelta(minutes=90)


def reminder_kind(minutes: int, due_words: int, streak: int, day_of_month: int) -> str:
    """Same order as reminderKind in src/lib/reminders.ts."""
    if minutes > 0:
        return "progress"
    if due_words > 0:
        return "vocabulary"
    if streak >= 2:
        return "streak"
    return EVERYDAY[day_of_month % len(EVERYDAY)]


def is_due(now_local: datetime, reminder_time: str, last_sent: date | None) -> bool:
    """True when the local reminder time passed within LATE_LIMIT and nothing was sent today."""
    if last_sent == now_local.date():
        return False
    try:
        h, m = (int(x) for x in reminder_time.split(":"))
    except ValueError:
        h, m = 19, 0
    at = now_local.replace(hour=h, minute=m, second=0, microsecond=0)
    return timedelta(0) <= now_local - at <= LATE_LIMIT


class Supabase:
    def __init__(self, url: str, key: str):
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def get(self, table: str, params: dict) -> list[dict]:
        r = requests.get(f"{self.base}/{table}", headers=self.headers, params=params, timeout=20)
        r.raise_for_status()
        return r.json()

    def patch(self, table: str, params: dict, body: dict) -> None:
        r = requests.patch(f"{self.base}/{table}", headers=self.headers, params=params, json=body, timeout=20)
        r.raise_for_status()

    def delete(self, table: str, params: dict) -> None:
        requests.delete(f"{self.base}/{table}", headers=self.headers, params=params, timeout=20)


def main() -> int:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    vapid_key = os.environ.get("VAPID_PRIVATE_KEY")
    subject = os.environ.get("VAPID_SUBJECT", "mailto:team@linghua.app")
    if not (url and key and vapid_key):
        print("Hua reminders are not set up yet (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY). Nothing sent.")
        return 0

    from pywebpush import WebPushException, webpush

    db = Supabase(url, key)
    learners = db.get(
        "profiles",
        {
            "select": "id,language_pref,daily_goal_minutes,reminder_time,reminder_timezone,reminder_last_sent",
            "reminder_enabled": "eq.true",
            "role": "neq.teacher",
        },
    )

    sent = 0
    for p in learners:
        try:
            tz = ZoneInfo(p.get("reminder_timezone") or "UTC")
        except Exception:
            tz = ZoneInfo("UTC")
        now_local = datetime.now(tz)
        last = date.fromisoformat(p["reminder_last_sent"]) if p.get("reminder_last_sent") else None
        if not is_due(now_local, p.get("reminder_time") or "19:00", last):
            continue

        uid = p["id"]
        today = now_local.date().isoformat()
        devices = db.get("push_subscriptions", {"select": "endpoint,p256dh,auth", "user_id": f"eq.{uid}"})
        # Mark the day first, so a slow or failed send never turns into two reminders
        db.patch("profiles", {"id": f"eq.{uid}"}, {"reminder_last_sent": today})
        if not devices:
            continue

        activity = db.get("daily_activity", {"select": "seconds", "user_id": f"eq.{uid}", "day": f"eq.{today}"})
        minutes = (activity[0]["seconds"] // 60) if activity else 0
        if minutes >= (p.get("daily_goal_minutes") or 10):
            continue  # goal already reached today
        progress = db.get("progress", {"select": "current_streak", "user_id": f"eq.{uid}"})
        streak = progress[0]["current_streak"] if progress else 0
        due = db.get("word_reviews", {"select": "id", "user_id": f"eq.{uid}", "next_review_date": f"lte.{today}", "limit": "1"})

        lang = "ar" if p.get("language_pref") == "ar" else "en"
        kind = reminder_kind(minutes, len(due), streak or 0, now_local.day)
        payload = json.dumps({"title": TITLE[lang], "body": HUA_LINES[kind][lang], "lang": lang, "url": "/flashcards"})

        for d in devices:
            try:
                webpush(
                    subscription_info={"endpoint": d["endpoint"], "keys": {"p256dh": d["p256dh"], "auth": d["auth"]}},
                    data=payload,
                    vapid_private_key=vapid_key,
                    vapid_claims={"sub": subject},
                    ttl=3 * 60 * 60,
                )
                sent += 1
            except WebPushException as e:
                status = getattr(e.response, "status_code", None)
                if status in (404, 410):  # the browser dropped this address: forget it
                    db.delete("push_subscriptions", {"endpoint": f"eq.{d['endpoint']}"})
                else:
                    print(f"Push failed ({status}) for one device: {e}", file=sys.stderr)

    print(f"Checked {len(learners)} learners, sent {sent} reminders.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
