"""Ling Hua Backend — Flask API powered by Huawei Cloud AI.

Provides translation, text-to-speech, speech recognition, and
MindSpore-based pronunciation scoring for the Ling Hua educational platform.
"""

import os
import sys
import traceback
from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
from io import BytesIO
import json

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from services.translation import translate_text
from services.tts import text_to_speech, text_to_speech_tutor
from services.asr import speech_to_text
from services.scoring import score_pronunciation, get_breakdown
from services.tutor import chat as tutor_chat, chat_stream as tutor_chat_stream

app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS)


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "linghua-backend"})


@app.route("/translate", methods=["POST"])
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

    try:
        translated = translate_text(text, source, target)
        return jsonify({"translatedText": translated})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500


@app.route("/tts", methods=["POST"])
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
def asr():
    """Convert speech audio to text.

    Request:
        FormData with 'file' field containing audio file.
        Optional 'lang' field ("zh" or "ar", defaults to "zh").

    Response JSON:
        { "text": str }
    """
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["file"]
    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    lang = request.form.get("lang", "zh")

    try:
        audio_bytes = audio_file.read()
        recognized_text = speech_to_text(audio_bytes, audio_file.filename, lang)
        return jsonify({"text": recognized_text})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"ASR failed: {str(e)}"}), 500


@app.route("/pronounce", methods=["POST"])
def pronounce():
    """Combined ASR + pronunciation scoring in a single request.

    Request:
        FormData with 'file' (audio), 'expected' (text), optional 'lang'.

    Response JSON:
        { "score": int, "recognized": str, "expected_pinyin": str,
          "recognized_pinyin": str, "breakdown": {...} }
    """
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    expected = request.form.get("expected", "").strip()
    if not expected:
        return jsonify({"error": "Missing 'expected' field"}), 400

    audio_file = request.files["file"]
    lang = request.form.get("lang", "zh")

    try:
        audio_bytes = audio_file.read()
        recognized_text = speech_to_text(audio_bytes, audio_file.filename, lang)
        result = score_pronunciation(expected, recognized_text)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Pronunciation scoring failed: {str(e)}"}), 500


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


@app.route("/tutor/realtime-session", methods=["POST"])
def tutor_realtime_session():
    """WebRTC SDP signaling for OpenAI Realtime GA API.

    Accepts a WebRTC SDP offer from the browser, forwards it to OpenAI with
    the server-side API key, and returns the SDP answer plus session config.

    Request JSON:
        { "sdp": "<offer SDP string>", "model": str (optional), "voice": str (optional) }

    Response JSON:
        { "sdp": "<answer SDP string>", "instructions": str }
    """
    import requests as http_req
    from services.tutor import SYSTEM_PROMPT

    if not Config.OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY is not configured"}), 503

    data = request.get_json()
    if not data or "sdp" not in data:
        return jsonify({"error": "Missing 'sdp' field"}), 400

    model = data.get("model", "gpt-realtime-2025-08-28")
    sdp_offer = data["sdp"]

    # voice is NOT a valid query param for the GA API — set it via session.update
    # after the data channel opens (handled on the frontend)
    resp = http_req.post(
        f"https://api.openai.com/v1/realtime?model={model}",
        headers={
            "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
            "Content-Type": "application/sdp",
        },
        data=sdp_offer,
        timeout=30,
    )

    if not resp.ok:
        return jsonify({"error": resp.text}), resp.status_code

    return jsonify({"sdp": resp.text, "instructions": SYSTEM_PROMPT})


@app.route("/tutor/stream", methods=["POST"])
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

    messages = data["messages"]
    if not isinstance(messages, list) or not messages:
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

    messages = data["messages"]
    if not isinstance(messages, list) or not messages:
        return jsonify({"error": "'messages' must be a non-empty array"}), 400

    if not Config.ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY is not configured on the server"}), 503

    try:
        reply = tutor_chat(messages)
        return jsonify({"reply": reply})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Tutor request failed: {str(e)}"}), 500


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
