"""Who is calling, and how often: protects the paid AI endpoints.

Every call to the tutor, speech, voice or translation endpoints costs real
money (Anthropic, OpenAI, ElevenLabs, Munsit). The API address is in the
public website code, so anyone could call it from a script. This module:

1. Reads the learner's Supabase access token (Authorization: Bearer <token>)
   and asks Supabase who it belongs to. Answers are cached for a few minutes
   so this costs one Supabase call per learner, not one per request.
2. Counts calls per learner (signed in) or per address (not signed in) in a
   small SQLite file shared by all gunicorn workers, and answers 429 once a
   budget is spent.

Needs in the backend environment:
  SUPABASE_URL                 https://<project>.supabase.co (already set for kids' log-in)
  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY   used only as the "apikey" header
Optional:
  RATE_LIMIT_DB                where to keep the counters (default: the system temp folder)
"""

from __future__ import annotations

import base64
import functools
import hashlib
import ipaddress
import json
import logging
import os
import sqlite3
import tempfile
import threading
import time

import requests
from flask import g, jsonify, request

logger = logging.getLogger("linghua.access")

# How long a checked token is trusted before asking Supabase again
TOKEN_CACHE_SECONDS = 300

HOUR = 3600
DAY = 24 * HOUR

# (calls, seconds) budgets. Signed-in learners get their own budget; visitors
# who are not signed in (the public Translator and Mandarin on the Move) share
# one per internet address, so a whole class on one school network still fits.
LIMITS: dict[str, dict[str, tuple[tuple[int, int], ...]]] = {
    # Claude: the most expensive. Only signed-in learners can use the tutor.
    "tutor": {"user": ((60, HOUR), (300, DAY))},
    # ElevenLabs: Hua's voice
    "tutor_tts": {"user": ((150, HOUR), (600, DAY)), "ip": ((150, HOUR), (600, DAY))},
    # Whisper / Munsit: Practice, Flashcards, lessons, Translator mic
    "speech": {"user": ((300, HOUR), (1500, DAY)), "ip": ((300, HOUR), (1500, DAY))},
    # Munsit / Huawei voice for Arabic
    "tts": {"user": ((300, HOUR), (1500, DAY)), "ip": ((300, HOUR), (1500, DAY))},
    # Claude Sonnet translation
    "translate": {"user": ((200, HOUR), (800, DAY)), "ip": ((150, HOUR), (600, DAY))},
}


# ─── Who is calling ──────────────────────────────────────────────────
def _supabase_settings() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return url, key


def configured() -> bool:
    url, key = _supabase_settings()
    return bool(url and key)


def _token_expiry(token: str) -> float | None:
    """The token's own expiry time (not trusted for anything but cache length)."""
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return float(json.loads(base64.urlsafe_b64decode(payload))["exp"])
    except Exception:
        return None


class TokenChecker:
    """Asks Supabase who a token belongs to, and remembers the answer briefly."""

    def __init__(self, clock=time.time, fetch=None):
        self.clock = clock
        self.fetch = fetch or self._ask_supabase
        self._cache: dict[str, tuple[str | None, float]] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _ask_supabase(token: str) -> str | None:
        url, key = _supabase_settings()
        r = requests.get(f"{url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {token}"}, timeout=10)
        if r.status_code in (401, 403):
            return None
        r.raise_for_status()
        return r.json().get("id") or None

    def user_id(self, token: str) -> str | None:
        if not token:
            return None
        key = hashlib.sha256(token.encode()).hexdigest()
        now = self.clock()
        with self._lock:
            hit = self._cache.get(key)
            if hit and hit[1] > now:
                return hit[0]
        uid = self.fetch(token)
        until = now + (TOKEN_CACHE_SECONDS if uid else 60)
        exp = _token_expiry(token)
        if uid and exp:
            until = min(until, exp)
        with self._lock:
            if len(self._cache) > 5000:
                self._cache = {k: v for k, v in self._cache.items() if v[1] > now}
            self._cache[key] = (uid, until)
        return uid


tokens = TokenChecker()


def bearer_token() -> str:
    header = request.headers.get("Authorization", "")
    return header[7:].strip() if header[:7].lower() == "bearer " else ""


def client_ip() -> str:
    """The visitor's address. nginx (on this machine) passes it in X-Real-IP."""
    remote = request.remote_addr or ""
    try:
        local = ipaddress.ip_address(remote).is_loopback
    except ValueError:
        local = False
    if local:
        return request.headers.get("X-Real-IP", "").strip() or remote
    return remote


# ─── How often ───────────────────────────────────────────────────────
class RateLimiter:
    """Fixed-window counters in SQLite, so all gunicorn workers share them.

    If the file can't be used, it falls back to counting in this process
    rather than taking the app down.
    """

    def __init__(self, path: str | None = None, clock=time.time):
        self.path = path or os.getenv("RATE_LIMIT_DB") or os.path.join(tempfile.gettempdir(), "linghua-limits.sqlite3")
        self.clock = clock
        self._local = threading.local()
        self._memory: dict[tuple[str, int], int] = {}
        self._mem_lock = threading.Lock()
        self._last_sweep = 0.0

    def _db(self):
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(self.path, timeout=5, isolation_level=None)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, w INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (k, w))")
            self._local.conn = conn
        return conn

    def _bump(self, key: str, window: int) -> int:
        try:
            conn = self._db()
            row = conn.execute(
                "INSERT INTO hits (k, w, n) VALUES (?, ?, 1) ON CONFLICT (k, w) DO UPDATE SET n = n + 1 RETURNING n",
                (key, window),
            ).fetchone()
            return int(row[0])
        except sqlite3.Error:
            logger.exception("rate limit file unavailable, counting in memory")
            with self._mem_lock:
                n = self._memory.get((key, window), 0) + 1
                self._memory[(key, window)] = n
                return n

    def _sweep(self, now: float) -> None:
        if now - self._last_sweep < HOUR:
            return
        self._last_sweep = now
        try:
            self._db().execute("DELETE FROM hits WHERE w < ?", (int(now) - 2 * DAY,))
        except sqlite3.Error:
            pass
        with self._mem_lock:
            self._memory = {k: v for k, v in self._memory.items() if k[1] >= int(now) - 2 * DAY}

    def hit(self, key: str, budgets: tuple[tuple[int, int], ...]) -> int:
        """Counts one call. Returns 0 if allowed, else seconds until it is."""
        now = self.clock()
        self._sweep(now)
        wait = 0
        for calls, seconds in budgets:
            window = int(now // seconds) * seconds
            if self._bump(f"{key}:{seconds}", window) > calls:
                wait = max(wait, int(window + seconds - now) + 1)
        return wait


limiter = RateLimiter()


def guarded(kind: str, login_required: bool = False):
    """Decorator for a paid endpoint: checks who is calling, then their budget.

    Signed-in callers are counted per learner. Without a valid token the call
    is refused (login_required) or counted per internet address.
    """

    def wrap(view):
        @functools.wraps(view)
        def inner(*args, **kwargs):
            token = bearer_token()
            uid = None
            if token:
                if not configured():
                    logger.error("SUPABASE_URL / key missing: cannot check log-ins")
                    return jsonify({"error": "not_set_up"}), 503
                try:
                    uid = tokens.user_id(token)
                except requests.RequestException:
                    logger.exception("could not reach Supabase to check a log-in")
                    return jsonify({"error": "auth_unavailable"}), 503
            if login_required and not uid:
                return jsonify({"error": "login_required"}), 401

            budgets = LIMITS[kind]
            if uid:
                key, budget = f"{kind}:u:{uid}", budgets["user"]
            else:
                key, budget = f"{kind}:ip:{client_ip()}", budgets["ip"]
            wait = limiter.hit(key, budget)
            if wait:
                logger.warning("rate limited %s", key)
                resp = jsonify({"error": "too_many_requests", "retry_after": wait})
                resp.headers["Retry-After"] = str(wait)
                return resp, 429
            g.user_id = uid
            return view(*args, **kwargs)

        return inner

    return wrap


# ─── Tutor history ───────────────────────────────────────────────────
MAX_TUTOR_MESSAGES = 20
MAX_TUTOR_CHARS = 2000


def clean_tutor_history(messages) -> list[dict] | None:
    """Keeps the last few turns, each cut to a sensible length.

    Returns None if the history is not usable. Claude needs the first message
    to come from the learner, so leading Hua turns are dropped.
    """
    if not isinstance(messages, list):
        return None
    out = []
    for m in messages[-MAX_TUTOR_MESSAGES:]:
        if not isinstance(m, dict) or m.get("role") not in ("user", "assistant"):
            return None
        content = m.get("content")
        if not isinstance(content, str):
            return None
        content = content.strip()[:MAX_TUTOR_CHARS]
        if content:
            out.append({"role": m["role"], "content": content})
    while out and out[0]["role"] != "user":
        out.pop(0)
    return out or None
