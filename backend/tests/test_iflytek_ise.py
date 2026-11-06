import base64
import io
import json
import math
import struct
import wave
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

import pytest

from config import Config
from services import iflytek_ise as ise


@pytest.fixture(autouse=True)
def keys(monkeypatch):
    monkeypatch.setattr(Config, "IFLYTEK_APPID", "app123")
    monkeypatch.setattr(Config, "IFLYTEK_API_KEY", "key456")
    monkeypatch.setattr(Config, "IFLYTEK_API_SECRET", "secret789")
    monkeypatch.setattr(Config, "IFLYTEK_ISE_URL", "wss://ise-api-sg.xf-yun.com/v2/ise")


def tone_wav(seconds=1.0, rate=44100, channels=2):
    """A short stereo 44.1 kHz beep, like a browser might send."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(rate)
        n = int(seconds * rate)
        frames = b"".join(
            struct.pack("<h", int(8000 * math.sin(2 * math.pi * 220 * i / rate))) * channels for i in range(n)
        )
        w.writeframes(frames)
    return buf.getvalue()


RESULT_XML = """<?xml version="1.0" ?>
<xml_result>
 <read_sentence lan="cn" type="study" version="7,0,0,1024">
  <rec_paper>
   <read_sentence content="你好吗" except_info="0" is_rejected="false" total_score="78.4"
       phone_score="90.2" tone_score="61.7" fluency_score="80.0" integrity_score="100.0">
    <sentence content="你好吗">
     <word content="你好" symbol="ni3hao3">
      <syll content="sil" rec_node_type="sil" dp_message="0"/>
      <syll content="你" symbol="ni3" dp_message="0" rec_node_type="paper">
       <phone content="n" is_yun="0" perr_msg="0" dp_message="0"/>
       <phone content="i" is_yun="1" perr_msg="0" dp_message="0"/>
      </syll>
      <syll content="好" symbol="hao3" dp_message="0" rec_node_type="paper">
       <phone content="h" is_yun="0" perr_msg="0" dp_message="0"/>
       <phone content="ao" is_yun="1" perr_msg="2" dp_message="0"/>
      </syll>
     </word>
     <word content="吗" symbol="ma0">
      <syll content="吗" symbol="ma0" dp_message="16" rec_node_type="paper"/>
     </word>
    </sentence>
   </read_sentence>
  </rec_paper>
 </read_sentence>
</xml_result>"""


def test_off_without_keys(monkeypatch):
    monkeypatch.setattr(Config, "IFLYTEK_API_SECRET", "")
    assert not ise.enabled()


def test_clean_text():
    assert ise.clean_text("你好！") == "你好"
    assert ise.clean_text("我叫 Zoha。") is None
    assert ise.clean_text("") is None


def test_signed_url_matches_iflytek_recipe():
    now = datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)
    url = urlparse(ise.signed_url(now))
    q = {k: v[0] for k, v in parse_qs(url.query).items()}
    assert url.scheme == "wss" and url.netloc == "ise-api-sg.xf-yun.com" and url.path == "/v2/ise"
    assert q["date"] == "Fri, 06 Nov 2026 12:00:00 GMT"
    assert q["host"] == "ise-api-sg.xf-yun.com"
    auth = base64.b64decode(q["authorization"]).decode()
    assert auth.startswith('api_key="key456", algorithm="hmac-sha256", headers="host date request-line", signature="')
    import hashlib, hmac
    origin = "host: ise-api-sg.xf-yun.com\ndate: Fri, 06 Nov 2026 12:00:00 GMT\nGET /v2/ise HTTP/1.1"
    sig = base64.b64encode(hmac.new(b"secret789", origin.encode(), hashlib.sha256).digest()).decode()
    assert f'signature="{sig}"' in auth


def test_frames_order_and_status():
    fs = ise.frames(b"\x00" * (ise.CHUNK_BYTES * 2 + 10), "你好")
    assert fs[0]["business"]["cmd"] == "ssb" and fs[0]["data"]["status"] == 0
    assert fs[0]["business"]["text"] == "﻿你好"
    assert fs[0]["business"]["category"] == "read_sentence"
    assert [f["business"]["aus"] for f in fs[1:]] == [1, 2, 4]
    assert [f["data"]["status"] for f in fs[1:]] == [1, 1, 2]
    assert ise.frames(b"\x00" * 100, "好")[0]["business"]["category"] == "read_syllable"
    # one short chunk is still split into a first and a last frame
    assert [f["business"]["aus"] for f in ise.frames(b"\x00" * 100, "好")[1:]] == [1, 4]


def test_decode_browser_audio_to_16k_mono():
    pcm = ise.to_pcm16k(tone_wav(1.0))
    assert abs(len(pcm) - ise.BYTES_PER_SECOND) < 2000


def test_decode_webm_opus():
    av = pytest.importorskip("av")
    buf = io.BytesIO()
    with av.open(buf, mode="w", format="webm") as out:
        stream = out.add_stream("libopus", rate=48000)
        import numpy as np
        samples = (np.sin(np.arange(48000) * 2 * np.pi * 220 / 48000) * 8000).astype("int16").reshape(1, -1)
        frame = av.AudioFrame.from_ndarray(samples, format="s16", layout="mono")
        frame.sample_rate = 48000
        for packet in stream.encode(frame):
            out.mux(packet)
        for packet in stream.encode(None):
            out.mux(packet)
    pcm = ise.to_pcm16k(buf.getvalue())
    assert abs(len(pcm) - ise.BYTES_PER_SECOND) < 4000


def test_garbage_audio_is_an_iflytek_error():
    with pytest.raises(ise.IflytekError):
        ise.to_pcm16k(b"not audio at all")


def test_parse_scores_and_syllables():
    r = ise.parse(RESULT_XML, "你好吗")
    assert r["engine"] == "iflytek" and r["unclear"] is None
    assert r["score"] == 78
    assert r["breakdown"]["character"]["score"] == 100
    assert r["breakdown"]["pinyin"]["score"] == 90
    assert r["breakdown"]["tone"]["score"] == 62
    ni, hao, ma = r["segments"]
    assert ni["char"] == "你" and ni["pinyin_correct"] and ni["tone_correct"] and ni["heard_pinyin"] == "nǐ"
    assert hao["pinyin_correct"] and not hao["tone_correct"] and "heard_pinyin" not in hao
    assert not ma["char_correct"] and ma["heard_pinyin"] == ""
    assert r["expected_pinyin"]


def test_parse_silence_and_rejected():
    silent = RESULT_XML.replace('except_info="0"', 'except_info="28673"')
    assert ise.parse(silent, "你好吗")["unclear"] == "no_speech"
    rejected = RESULT_XML.replace('is_rejected="false"', 'is_rejected="true"')
    assert ise.parse(rejected, "你好吗")["unclear"] == "low_confidence"


class FakeSocket:
    def __init__(self, replies):
        self.sent = []
        self.replies = list(replies)
        self.closed = False

    def send(self, data):
        self.sent.append(json.loads(data))

    def recv(self):
        return json.dumps(self.replies.pop(0))

    def close(self):
        self.closed = True


def fake_ws(monkeypatch, sock):
    import websocket
    monkeypatch.setattr(websocket, "create_connection", lambda url, timeout: sock)


def test_score_end_to_end_with_fake_iflytek(monkeypatch):
    xml = base64.b64encode(RESULT_XML.encode()).decode()
    sock = FakeSocket([
        {"code": 0, "sid": "s1", "data": {"status": 1}},
        {"code": 0, "sid": "s1", "data": {"status": 2, "data": xml}},
    ])
    fake_ws(monkeypatch, sock)
    r = ise.score(tone_wav(1.0), "你好吗？")
    assert r["score"] == 78 and len(r["segments"]) == 3
    assert sock.closed and sock.sent[0]["common"]["app_id"] == "app123"


def test_iflytek_error_code_raises(monkeypatch):
    sock = FakeSocket([{"code": 10163, "message": "bad frame", "sid": "s2"}])
    fake_ws(monkeypatch, sock)
    with pytest.raises(ise.IflytekError):
        ise.score(tone_wav(1.0), "你好")
    assert sock.closed


def test_too_short_is_no_speech(monkeypatch):
    fake_ws(monkeypatch, FakeSocket([]))
    assert ise.score(tone_wav(0.1), "你好")["unclear"] == "no_speech"
