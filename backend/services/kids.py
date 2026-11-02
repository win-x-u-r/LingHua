"""Picture-password log-in for Little Lanterns (kids in a class).

Kids never give an email. A child types the class code, taps their name and
taps 3 secret pictures. Behind the scenes each child is a normal Supabase
account with a made-up address (kid-<handle>@kids.linghua.app) and a password
that only this server can work out: an HMAC of the handle and the pictures
with KIDS_LOGIN_SECRET. So the 3 pictures are useless outside this server,
and every guess goes through the lockout below.

Needs in the backend environment:
  SUPABASE_URL                 https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY    Supabase > Settings > API > service_role
  KIDS_LOGIN_SECRET            any long random string (keep it the same forever)
"""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import threading
import time
from datetime import datetime, timezone

import requests

# The 9 pictures a child can pick from, in grid order. The app draws them.
PICTURES = ("panda", "dragon", "dumpling", "cat", "lotus", "bamboo", "kite", "lantern", "scroll")
PICTURE_COUNT = 3
KID_EMAIL_DOMAIN = "kids.linghua.app"
AVATARS = ("panda", "dragon", "dumpling", "cat", "lotus", "bamboo")

# Lockout: 5 wrong tries in a row lock that child for 15 minutes
MAX_FAILS = 5
LOCK_SECONDS = 15 * 60


class KidsError(Exception):
    """A problem to show the child or teacher. `code` is stable for the app."""

    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code = code
        self.status = status


def configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY") and os.getenv("KIDS_LOGIN_SECRET"))


def clean_code(code) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(code or "").upper())[:8]


def clean_name(name) -> str:
    name = re.sub(r"\s+", " ", str(name or "")).strip()
    return name[:48]


def check_pictures(pictures) -> list[str]:
    if not isinstance(pictures, list) or len(pictures) != PICTURE_COUNT:
        raise KidsError("bad_pictures")
    if any(p not in PICTURES for p in pictures):
        raise KidsError("bad_pictures")
    return list(pictures)


def kid_password(handle: str, pictures: list[str]) -> str:
    secret = os.environ["KIDS_LOGIN_SECRET"].encode()
    msg = f"{handle}:{'-'.join(pictures)}".encode()
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()


def handle_from_email(email: str) -> str:
    m = re.fullmatch(r"kid-([a-z0-9]+)@" + re.escape(KID_EMAIL_DOMAIN), email or "")
    if not m:
        raise KidsError("not_a_kid", 404)
    return m.group(1)


class Lockout:
    """Counts wrong pictures per child, in memory (one backend process)."""

    def __init__(self, max_fails: int = MAX_FAILS, lock_seconds: int = LOCK_SECONDS, clock=time.monotonic):
        self.max_fails = max_fails
        self.lock_seconds = lock_seconds
        self.clock = clock
        self._fails: dict[str, tuple[int, float]] = {}
        self._lock = threading.Lock()

    def locked(self, key: str) -> bool:
        with self._lock:
            count, since = self._fails.get(key, (0, 0.0))
            if count >= self.max_fails:
                if self.clock() - since < self.lock_seconds:
                    return True
                self._fails.pop(key, None)
            return False

    def fail(self, key: str) -> int:
        """Records a wrong try and returns how many tries are left."""
        with self._lock:
            count, _ = self._fails.get(key, (0, 0.0))
            count += 1
            self._fails[key] = (count, self.clock())
            return max(0, self.max_fails - count)

    def clear(self, key: str) -> None:
        with self._lock:
            self._fails.pop(key, None)


lockout = Lockout()


class Supabase:
    """The few Supabase calls this needs, with the service role key."""

    def __init__(self):
        self.url = os.environ["SUPABASE_URL"].rstrip("/")
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.key = key
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def rest(self, method: str, table: str, params: dict | None = None, body=None, prefer: str | None = None):
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer
        r = requests.request(method, f"{self.url}/rest/v1/{table}", headers=headers, params=params, json=body, timeout=20)
        r.raise_for_status()
        return r.json() if r.content else None

    def classroom(self, code: str) -> dict:
        rows = self.rest("GET", "classrooms", {"select": "id,name,teacher_id", "code": f"eq.{code}", "limit": "1"})
        if not rows:
            raise KidsError("class_not_found", 404)
        return rows[0]

    def kids_in(self, classroom_id: str) -> list[dict]:
        return self.rest(
            "GET",
            "profiles",
            {
                "select": "id,full_name,avatar_url",
                "classroom_id": f"eq.{classroom_id}",
                "kid_login": "eq.true",
                "order": "full_name.asc",
            },
        )

    def profile(self, user_id: str) -> dict | None:
        rows = self.rest("GET", "profiles", {"select": "id,full_name,classroom_id,kid_login", "id": f"eq.{user_id}"})
        return rows[0] if rows else None

    def create_user(self, email: str, password: str, name: str, first_name: str = "") -> str:
        r = requests.post(
            f"{self.url}/auth/v1/admin/users",
            headers=self.headers,
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": name, "first_name": first_name or name.split(" ")[0], "role": "student", "learning_path": "little_lanterns", "kid": True},
            },
            timeout=20,
        )
        r.raise_for_status()
        return r.json()["id"]

    def get_user(self, user_id: str) -> dict:
        r = requests.get(f"{self.url}/auth/v1/admin/users/{user_id}", headers=self.headers, timeout=20)
        if r.status_code == 404:
            raise KidsError("not_a_kid", 404)
        r.raise_for_status()
        return r.json()

    def set_password(self, user_id: str, password: str) -> None:
        r = requests.put(f"{self.url}/auth/v1/admin/users/{user_id}", headers=self.headers, json={"password": password}, timeout=20)
        r.raise_for_status()

    def sign_in(self, email: str, password: str) -> dict | None:
        r = requests.post(
            f"{self.url}/auth/v1/token",
            params={"grant_type": "password"},
            headers={"apikey": self.key, "Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=20,
        )
        if r.status_code in (400, 401):
            return None
        r.raise_for_status()
        data = r.json()
        return {"access_token": data["access_token"], "refresh_token": data["refresh_token"]}

    def user_for_token(self, token: str) -> dict | None:
        r = requests.get(f"{self.url}/auth/v1/user", headers={"apikey": self.key, "Authorization": f"Bearer {token}"}, timeout=20)
        return r.json() if r.ok else None


def roster(db: Supabase, code: str) -> dict:
    room = db.classroom(clean_code(code))
    kids = [{"id": k["id"], "name": k["full_name"], "avatar": k.get("avatar_url") or "panda"} for k in db.kids_in(room["id"])]
    return {"class_name": room["name"], "kids": kids}


def join(db: Supabase, code: str, name: str, avatar: str, pictures, first_name: str = "") -> dict:
    room = db.classroom(clean_code(code))
    name = clean_name(name)
    if not name:
        raise KidsError("name_needed")
    pictures = check_pictures(pictures)
    if avatar not in AVATARS:
        avatar = "panda"
    taken = {k["full_name"].casefold() for k in db.kids_in(room["id"])}
    if name.casefold() in taken:
        raise KidsError("name_taken", 409)

    handle = secrets.token_hex(8)
    email = f"kid-{handle}@{KID_EMAIL_DOMAIN}"
    password = kid_password(handle, pictures)
    # Hua greets the child by first name ("Abdul Rahman" stays whole)
    first = clean_name(first_name)
    if not first or not name.casefold().startswith(first.casefold()):
        first = name.split(" ")[0]
    user_id = db.create_user(email, password, name, first)
    # The sign-up trigger made the profile; put the child in the class
    db.rest(
        "PATCH",
        "profiles",
        {"id": f"eq.{user_id}"},
        {"classroom_id": room["id"], "avatar_url": avatar, "kid_login": True},
    )
    session = db.sign_in(email, password)
    if not session:
        raise KidsError("server_error", 500)
    return session


def login(db: Supabase, kid_id: str, pictures) -> dict:
    pictures = check_pictures(pictures)
    if lockout.locked(kid_id):
        raise KidsError("locked", 429)
    user = db.get_user(kid_id)
    handle = handle_from_email(user.get("email", ""))
    session = db.sign_in(user["email"], kid_password(handle, pictures))
    if not session:
        left = lockout.fail(kid_id)
        raise KidsError("locked" if left == 0 else "wrong_pictures", 429 if left == 0 else 401)
    lockout.clear(kid_id)
    clear_help(db, kid_id)
    return session


def clear_help(db: Supabase, kid_id: str) -> None:
    """Takes the child off the teacher's "needs help" list. Never blocks a log-in."""
    try:
        db.rest("PATCH", "profiles", {"id": f"eq.{kid_id}", "kid_help_at": "not.is.null"}, {"kid_help_at": None})
    except Exception:
        pass


def ask_help(db: Supabase, kid_id: str) -> None:
    """A child who forgot their pictures asks their teacher for new ones."""
    kid = db.profile(kid_id)
    if not kid or not kid.get("kid_login") or not kid.get("classroom_id"):
        raise KidsError("not_a_kid", 404)
    db.rest("PATCH", "profiles", {"id": f"eq.{kid_id}"}, {"kid_help_at": datetime.now(timezone.utc).isoformat()})


def reset(db: Supabase, teacher_token: str, kid_id: str, pictures) -> None:
    """A teacher gives a child in their class new secret pictures."""
    pictures = check_pictures(pictures)
    teacher = db.user_for_token(teacher_token or "")
    if not teacher:
        raise KidsError("not_allowed", 403)
    kid = db.profile(kid_id)
    if not kid or not kid.get("kid_login") or not kid.get("classroom_id"):
        raise KidsError("not_a_kid", 404)
    rooms = db.rest("GET", "classrooms", {"select": "id", "id": f"eq.{kid['classroom_id']}", "teacher_id": f"eq.{teacher['id']}"})
    if not rooms:
        raise KidsError("not_allowed", 403)
    user = db.get_user(kid_id)
    handle = handle_from_email(user.get("email", ""))
    db.set_password(kid_id, kid_password(handle, pictures))
    clear_help(db, kid_id)
    lockout.clear(kid_id)
