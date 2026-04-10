"""Ling Hua Backend — Flask API powered by Huawei Cloud AI.

Provides translation, text-to-speech, speech recognition, and
MindSpore-based pronunciation scoring for the Ling Hua educational platform.
"""

import os
import sys
import traceback
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from services.translation import translate_text
from services.tts import text_to_speech
from services.asr import speech_to_text
from services.scoring import score_pronunciation

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
        return send_file(
            BytesIO(audio_bytes),
            mimetype="audio/wav",
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
