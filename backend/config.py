import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)


class Config:
    """Application configuration loaded from environment variables."""

    # Flask
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    PORT = int(os.getenv("FLASK_PORT", "5000"))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",")

    # Huawei Cloud credentials (shared across all services)
    HUAWEI_AK = os.getenv("HUAWEI_AK", "")
    HUAWEI_SK = os.getenv("HUAWEI_SK", "")

    # Legacy single-region config (fallback)
    HUAWEI_REGION = os.getenv("HUAWEI_REGION", "me-east-1")
    HUAWEI_PROJECT_ID = os.getenv("HUAWEI_PROJECT_ID", "")

    # SIS (Speech) — separate region support
    HUAWEI_SIS_REGION = os.getenv("HUAWEI_SIS_REGION", os.getenv("HUAWEI_REGION", "me-east-1"))
    HUAWEI_SIS_PROJECT_ID = os.getenv("HUAWEI_SIS_PROJECT_ID", os.getenv("HUAWEI_PROJECT_ID", ""))

    # NLP (Translation) — separate region support
    HUAWEI_NLP_REGION = os.getenv("HUAWEI_NLP_REGION", os.getenv("HUAWEI_REGION", "me-east-1"))
    HUAWEI_NLP_PROJECT_ID = os.getenv("HUAWEI_NLP_PROJECT_ID", os.getenv("HUAWEI_PROJECT_ID", ""))

    # Huawei Cloud API endpoints
    @classmethod
    def sis_endpoint(cls):
        """Speech Interaction Service endpoint for TTS and ASR."""
        return f"https://sis-ext.{cls.HUAWEI_SIS_REGION}.myhuaweicloud.com"

    @classmethod
    def nlp_endpoint(cls):
        """NLP Machine Translation endpoint."""
        return f"https://nlp-ext.{cls.HUAWEI_NLP_REGION}.myhuaweicloud.com"

    # Audio settings for PCM conversion
    AUDIO_SAMPLE_RATE = 16000
    AUDIO_CHANNELS = 1
    AUDIO_SAMPLE_WIDTH = 2  # 16-bit

    # Temp directory for audio processing
    TEMP_DIR = os.getenv("TEMP_DIR", "tmp")

    # ────────────────────────────────────────────────────────────────
    # Munsit — Arabic-dialect ASR + TTS (UAE-based regional partner)
    # ────────────────────────────────────────────────────────────────
    MUNSIT_API_KEY = os.getenv("MUNSIT_API_KEY", "")
    MUNSIT_STT_MODEL = os.getenv("MUNSIT_STT_MODEL", "munsit")
    MUNSIT_TTS_MODEL = os.getenv("MUNSIT_TTS_MODEL", "faseeh-mini-v1-preview")
    MUNSIT_TTS_VOICE_ID = os.getenv("MUNSIT_TTS_VOICE_ID", "")  # auto-detected if empty
    MUNSIT_API_BASE = "https://api.munsit.com/api/v1"

    # ────────────────────────────────────────────────────────────────
    # Claude (Anthropic) — AI Tutor
    # ────────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
