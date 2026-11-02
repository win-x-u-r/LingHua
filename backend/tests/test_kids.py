import os

import pytest

os.environ.setdefault("KIDS_LOGIN_SECRET", "test-secret")

from services import kids  # noqa: E402


def test_password_depends_on_secret_handle_and_order():
    a = kids.kid_password("abc", ["panda", "kite", "lotus"])
    assert a == kids.kid_password("abc", ["panda", "kite", "lotus"])
    assert a != kids.kid_password("abc", ["kite", "panda", "lotus"])
    assert a != kids.kid_password("abd", ["panda", "kite", "lotus"])
    assert len(a) == 64


def test_pictures_must_be_three_known_ones():
    assert kids.check_pictures(["panda", "panda", "scroll"]) == ["panda", "panda", "scroll"]
    for bad in (["panda", "kite"], ["panda", "kite", "unicorn"], "panda", None):
        with pytest.raises(kids.KidsError):
            kids.check_pictures(bad)


def test_handle_only_from_kid_addresses():
    assert kids.handle_from_email("kid-1a2b@kids.linghua.app") == "1a2b"
    with pytest.raises(kids.KidsError):
        kids.handle_from_email("someone@gmail.com")


def test_lockout_after_five_wrong_tries_then_unlocks():
    now = [0.0]
    lock = kids.Lockout(max_fails=5, lock_seconds=900, clock=lambda: now[0])
    for left in (4, 3, 2, 1):
        assert lock.fail("k") == left
        assert not lock.locked("k")
    assert lock.fail("k") == 0
    assert lock.locked("k")
    now[0] = 901
    assert not lock.locked("k")


def test_clean_inputs():
    assert kids.clean_code(" ab-12c3 ") == "AB12C3"
    assert kids.clean_name("  Sara   Ali ") == "Sara Ali"


class FakeDb:
    def __init__(self, kids_in_class=()):
        self.kids = list(kids_in_class)
        self.created = []
        self.patched = []

    def classroom(self, code):
        if code != "ABC234":
            raise kids.KidsError("class_not_found", 404)
        return {"id": "room1", "name": "Year 2", "teacher_id": "t1"}

    def kids_in(self, room):
        return self.kids

    def create_user(self, email, password, name, first_name=""):
        self.created.append((email, password, name))
        self.first = first_name
        return "kid1"

    def rest(self, method, table, params=None, body=None, prefer=None):
        self.patched.append((table, params, body))

    def sign_in(self, email, password):
        return {"access_token": "a", "refresh_token": "r"}


def test_join_creates_a_kid_in_the_class():
    db = FakeDb()
    out = kids.join(db, "abc234", "Sara", "lotus", ["panda", "kite", "lotus"])
    assert out["access_token"] == "a"
    email, password, name = db.created[0]
    assert email.endswith("@kids.linghua.app") and name == "Sara"
    assert password == kids.kid_password(kids.handle_from_email(email), ["panda", "kite", "lotus"])
    assert db.patched[0][2] == {"classroom_id": "room1", "avatar_url": "lotus", "kid_login": True}


def test_join_refuses_a_name_already_in_the_class():
    db = FakeDb([{"id": "x", "full_name": "sara", "avatar_url": "panda"}])
    with pytest.raises(kids.KidsError) as e:
        kids.join(db, "ABC234", "Sara", "panda", ["panda", "kite", "lotus"])
    assert e.value.code == "name_taken"


def test_ask_help_flags_only_kids_in_a_class():
    db = FakeDb()
    db.profile = lambda uid: {"id": uid, "kid_login": uid == "kid1", "classroom_id": "room1"}
    kids.ask_help(db, "kid1")
    table, params, body = db.patched[0]
    assert table == "profiles" and params == {"id": "eq.kid1"} and body["kid_help_at"]
    with pytest.raises(kids.KidsError):
        kids.ask_help(db, "grownup")


def test_clear_help_never_breaks_log_in():
    class Broken(FakeDb):
        def rest(self, *a, **k):
            raise RuntimeError("column missing")
    kids.clear_help(Broken(), "kid1")


def test_join_keeps_first_name_for_the_greeting():
    db = FakeDb()
    kids.join(db, "ABC234", "Abdul Rahman Ali", "panda", ["panda", "kite", "lotus"], "Abdul Rahman")
    assert db.created[0][2] == "Abdul Rahman Ali" and db.first == "Abdul Rahman"
    kids.join(db, "ABC234", "Mohammed Saleh", "panda", ["panda", "kite", "lotus"])
    assert db.first == "Mohammed"
