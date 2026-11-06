"""Ling Hua Backend — Flask API powered by Huawei Cloud AI.

Provides translation, text-to-speech, speech recognition, and
MindSpore-based pronunciation scoring for the Ling Hua educational platform.
"""

import os
import sys
import time
import logging
import traceback
from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
from io import BytesIO
import json

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ─── Logging ─────────────────────────────────────────────────────────
# stdout goes to journalctl under gunicorn/systemd; keep the format short
# so it's readable in `journalctl -u linghua-backend -f`.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("linghua")

from config import Config
from services.translation import translate_text
from services.tts import text_to_speech, text_to_speech_tutor
from services.asr import transcribe
from services import iflytek_ise
from services.scoring import score_pronunciation, get_breakdown, get_pinyin_display, pinyin_to_arabic
from services.tutor import chat as tutor_chat, chat_stream as tutor_chat_stream
from services import kids
from services.access import guarded, clean_tutor_history

app = Flask(__name__)
# Speech clips are a few seconds long; refuse anything huge before reading it
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
CORS(app, origins=Config.CORS_ORIGINS)


# ─── Per-request access log with duration ────────────────────────────
@app.before_request
def _log_request_in():
    # Skip health checks — they'd flood the log every few seconds
    if request.path == "/health":
        return
    request._t0 = time.perf_counter()
    logger.info("-> %s %s", request.method, request.path)


@app.after_request
def _log_request_out(response):
    if request.path == "/health":
        return response
    elapsed = time.perf_counter() - getattr(request, "_t0", time.perf_counter())
    level = logging.INFO if response.status_code < 400 else logging.WARNING
    logger.log(level, "<- %s %s -> %d in %.2fs", request.method, request.path, response.status_code, elapsed)
    return response


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "linghua-backend",
        "pronunciation": "iflytek" if iflytek_ise.enabled() else "off (iFlytek keys missing)",
    })


@app.route("/translate", methods=["POST"])
@guarded("translate")
def translate():
    """Translate text between Arabic and Chinese.

    Request JSON:
        { "text": str, "source": "ar"|"zh", "target": "ar"|"zh" }

    Response JSON:
        { "translatedText": str }
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    source = data.get("source", "ar")
    target = data.get("target", "zh")

    if not text:
        return jsonify({"translatedText": ""})
    if len(text) > 1000:
        return jsonify({"error": "too_long"}), 413

    try:
        translated = translate_text(text, source, target)
        return jsonify({"translatedText": translated})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500


@app.route("/tts", methods=["POST"])
@guarded("tts")
def tts():
    """Convert text to speech audio.

    Request JSON:
        { "text": str, "lang": "zh"|"ar" }

    Response:
        Audio binary (WAV) with Content-Type: audio/wav
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    lang = data.get("lang", "zh")

    if not text:
        return jsonify({"error": "Empty text"}), 400
    if len(text) > 1500:
        return jsonify({"error": "too_long"}), 413

    try:
        audio_bytes = text_to_speech(text, lang)
        # Detect audio format from magic bytes
        # WAV: starts with "RIFF"; MP3: starts with ID3 tag or sync bytes 0xFF 0xEx
        if audio_bytes[:4] == b"RIFF":
            mimetype = "audio/wav"
        elif audio_bytes[:3] == b"ID3" or (
            len(audio_bytes) >= 2
            and audio_bytes[0] == 0xFF
            and (audio_bytes[1] & 0xE0) == 0xE0
        ):
            mimetype = "audio/mpeg"
        else:
            mimetype = "audio/wav"
        return send_file(
            BytesIO(audio_bytes),
            mimetype=mimetype,
            as_attachment=False,
        )
    except ValueError as e:
        if "BROWSER_TTS_CHINESE" in str(e):
            return jsonify({"use_browser_tts": True, "lang": "zh-CN"}), 200
        traceback.print_exc()
        return jsonify({"error": f"TTS failed: {str(e)}"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"TTS failed: {str(e)}"}), 500


@app.route("/asr", methods=["POST"])
@guarded("speech")
def asr():
    """Convert speech audio to text.

    Request:
        FormData with 'file' field containing audio file.
        Optional 'lang' field ("zh" or "ar", defaults to "zh").

    Response JSON:
        { "text": str, "unclear": null | "no_speech" | "low_confidence" | "hallucination" }
        When "unclear" is set, "text" is empty: the audio could not be trusted.
    """
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["file"]
    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    lang = request.form.get("lang", "zh")

    try:
        audio_bytes = audio_file.read()
        heard = transcribe(audio_bytes, audio_file.filename, lang)
        return jsonify({"text": heard.text, "unclear": heard.unclear})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"ASR failed: {str(e)}"}), 500


@app.route("/pronounce", methods=["POST"])
@guarded("speech")
def pronounce():
    """Score how a learner said a Chinese phrase, with iFlytek.

    iFlytek listens to the recording against the expected Chinese and scores
    every syllable's sounds and tone. There is no Whisper fallback: if iFlytek
    is not set up or can't score, the answer is an error and the app asks the
    learner to try again.

    Request:
        FormData with 'file' (audio), 'expected' (Chinese text).

    Response JSON:
        { "engine": "iflytek", "score": int, "expected_pinyin": str,
          "segments": [...], "breakdown": {...}, "unclear": null, ... }
        or, when the recording could not be scored (silence, noise), no score:
        { "unclear": "no_speech" | "low_confidence",
          "expected_pinyin": str, "expected_arabic": str }
        Errors: 400 not_chinese, 413 too_long, 503 scoring_unavailable.
    """
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    expected = request.form.get("expected", "").strip()
    if not expected:
        return jsonify({"error": "Missing 'expected' field"}), 400
    if len(expected) > 200:
        return jsonify({"error": "too_long"}), 413
    if not iflytek_ise.clean_text(expected):
        return jsonify({"error": "not_chinese"}), 400
    if not iflytek_ise.enabled():
        logger.error("iFlytek keys are not set: IFLYTEK_APPID / IFLYTEK_API_KEY / IFLYTEK_API_SECRET")
        return jsonify({"error": "scoring_unavailable"}), 503

    try:
        return jsonify(iflytek_ise.score(request.files["file"].read(), expected))
    except Exception as e:
        logger.warning("iFlytek could not score: %s", e)
        return jsonify({"error": "scoring_unavailable"}), 503


@app.route("/score", methods=["POST"])
def score():
    """Score pronunciation accuracy using MindSpore.

    Request JSON:
        { "expected": str, "actual": str }

    Response JSON:
        { "score": int (0-100) }
    """
    data = request.get_json()
    if not data or "expected" not in data or "actual" not in data:
        return jsonify({"error": "Missing 'expected' or 'actual' field"}), 400

    expected = data["expected"].strip()
    actual = data["actual"].strip()

    try:
        result = score_pronunciation(expected, actual)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Scoring failed: {str(e)}"}), 500


@app.route("/breakdown", methods=["POST"])
def breakdown():
    """Per-character phoneme breakdown for clickable practice (no scoring).

    Request JSON:
        { "text": str }

    Response JSON:
        { "segments": [{"char": str, "pinyin": str, "tone": int, "arabic": str}, ...] }
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"segments": []})

    try:
        return jsonify({"segments": get_breakdown(text)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Breakdown failed: {str(e)}"}), 500


@app.route("/tutor/stream", methods=["POST"])
@guarded("tutor", login_required=True)
def tutor_stream():
    """Streaming AI tutor endpoint — returns Server-Sent Events.

    Request JSON:
        { "messages": [{"role": "user"|"assistant", "content": str}, ...] }

    Response: text/event-stream
        data: {"text": "<chunk>"}\n\n   (repeated)
        data: [DONE]\n\n               (final)
    """
    data = request.get_json()
    if not data or "messages" not in data:
        return jsonify({"error": "Missing 'messages' field"}), 400

    # Only the last few turns, each cut to a sensible length
    messages = clean_tutor_history(data["messages"])
    if not messages:
        return jsonify({"error": "'messages' must be a non-empty array"}), 400

    if not Config.ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY is not configured on the server"}), 503

    def generate():
        try:
            for chunk in tutor_chat_stream(messages):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/tutor/tts", methods=["POST"])
@guarded("tutor_tts")
def tutor_tts():
    """Tutor-only TTS via ElevenLabs (custom Hua voice).

    Kept separate from /tts so the rest of the app (flashcards, practice,
    clickable phonemes, translator) keeps using the original browser/Munsit/Huawei
    routing — ElevenLabs hallucinates on very short input (single characters).

    Request JSON:
        { "text": str }

    Response:
        MP3 audio with Content-Type: audio/mpeg
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"error": "Empty text"}), 400
    if len(text) > 3000:
        return jsonify({"error": "too_long"}), 413

    if not Config.ELEVENLABS_API_KEY:
        return jsonify({"error": "ELEVENLABS_API_KEY is not configured"}), 503

    try:
        audio_bytes = text_to_speech_tutor(text)
        return send_file(
            BytesIO(audio_bytes),
            mimetype="audio/mpeg",
            as_attachment=False,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Tutor TTS failed: {str(e)}"}), 500


@app.route("/tutor/chat", methods=["POST"])
@guarded("tutor", login_required=True)
def tutor():
    """AI tutor conversation endpoint powered by Claude.

    Request JSON:
        { "messages": [{"role": "user"|"assistant", "content": str}, ...] }

    Response JSON:
        { "reply": str }
    """
    data = request.get_json()
    if not data or "messages" not in data:
        return jsonify({"error": "Missing 'messages' field"}), 400

    # Only the last few turns, each cut to a sensible length
    messages = clean_tutor_history(data["messages"])
    if not messages:
        return jsonify({"error": "'messages' must be a non-empty array"}), 400

    if not Config.ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY is not configured on the server"}), 503

    try:
        reply = tutor_chat(messages)
        return jsonify({"reply": reply})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Tutor request failed: {str(e)}"}), 500


# ─── Little Lanterns: picture-password log-in for kids in a class ────
def _kids_call(fn):
    if not kids.configured():
        return jsonify({"error": "not_set_up"}), 503
    try:
        return jsonify(fn(kids.Supabase(), request.get_json(silent=True) or {}) or {"ok": True})
    except kids.KidsError as e:
        return jsonify({"error": e.code}), e.status
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "server_error"}), 500


@app.route("/kids/roster", methods=["POST"])
def kids_roster():
    """{ "code" } -> { "class_name" }"""
    return _kids_call(lambda db, d: kids.roster(db, d.get("code")))


@app.route("/kids/join", methods=["POST"])
def kids_join():
    """{ "code", "name" (full), "first_name", "avatar", "pictures": [3 ids] } -> { "access_token", "refresh_token" }"""
    return _kids_call(lambda db, d: kids.join(db, d.get("code"), d.get("name"), d.get("avatar"), d.get("pictures"), d.get("first_name") or ""))


@app.route("/kids/login", methods=["POST"])
def kids_login():
    """{ "code", "name" (full), "pictures": [3 ids] } -> { "access_token", "refresh_token" }"""
    return _kids_call(lambda db, d: kids.login_by_name(db, d.get("code"), d.get("name"), d.get("pictures")))


@app.route("/kids/help", methods=["POST"])
def kids_help():
    """{ "code", "name" }: the child forgot their pictures; tells their teacher."""
    return _kids_call(lambda db, d: kids.ask_help(db, code=d.get("code"), name=d.get("name")))


@app.route("/kids/reset", methods=["POST"])
def kids_reset():
    """Teacher only (Authorization: Bearer <teacher's token>). { "kid_id", "pictures" }"""
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    return _kids_call(lambda db, d: kids.reset(db, token, str(d.get("kid_id") or ""), d.get("pictures")))



if __name__ == "__main__":
    os.makedirs(Config.TEMP_DIR, exist_ok=True)
    print(f"Ling Hua Backend starting on {Config.HOST}:{Config.PORT}")
    print(f"  SIS Region: {Config.HUAWEI_SIS_REGION} (Speech)")
    print(f"  NLP Region: {Config.HUAWEI_NLP_REGION} (Translation)")
    print(f"  CORS Origins: {Config.CORS_ORIGINS}")
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
    )
