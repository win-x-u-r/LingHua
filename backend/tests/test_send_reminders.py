from datetime import date, datetime
from zoneinfo import ZoneInfo

from send_reminders import HUA_LINES, is_due, reminder_kind

RIYADH = ZoneInfo("Asia/Riyadh")


def test_kind_order_matches_the_app():
    assert reminder_kind(minutes=3, due_words=5, streak=9, day_of_month=1) == "progress"
    assert reminder_kind(minutes=0, due_words=2, streak=9, day_of_month=1) == "vocabulary"
    assert reminder_kind(minutes=0, due_words=0, streak=3, day_of_month=1) == "streak"
    assert reminder_kind(minutes=0, due_words=0, streak=0, day_of_month=1) in ("daily", "nudge")


def test_every_line_has_both_languages():
    for line in HUA_LINES.values():
        assert line["en"] and line["ar"]


def test_due_only_just_after_the_reminder_time_and_once_a_day():
    at_7_10 = datetime(2026, 11, 1, 19, 10, tzinfo=RIYADH)
    assert is_due(at_7_10, "19:00", None)
    assert not is_due(at_7_10, "19:00", date(2026, 11, 1))  # already sent today
    assert not is_due(at_7_10, "19:30", None)  # not yet
    assert not is_due(datetime(2026, 11, 1, 21, 0, tzinfo=RIYADH), "19:00", None)  # too late
