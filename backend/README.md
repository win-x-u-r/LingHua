# Ling Hua Backend

Flask API backend powered by **Huawei Cloud AI** services and **MindSpore** for the Ling Hua educational platform.

## Huawei Technologies Used

| Feature | Technology |
|---------|-----------|
| Translation (Arabic ↔ Chinese) | Huawei Cloud NLP Machine Translation API |
| Text-to-Speech | Huawei Cloud SIS (Speech Interaction Service) |
| Speech Recognition | Huawei Cloud SIS ASR |
| Pronunciation Scoring | **MindSpore** deep learning framework |
| Model Deployment | **ModelArts** (planned) |

## Setup

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Note:** MindSpore requires Python 3.7-3.9 on most platforms. See [MindSpore installation guide](https://www.mindspore.cn/install/en).

### 2. Configure Huawei Cloud credentials

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required credentials:
- `HUAWEI_AK` — Access Key from Huawei Cloud IAM
- `HUAWEI_SK` — Secret Key from Huawei Cloud IAM
- `HUAWEI_PROJECT_ID` — Project ID for your region
- `HUAWEI_REGION` — Region code (e.g., `me-east-1` for Middle East)

### 3. Run the server

```bash
python app.py
```

The server starts on `http://localhost:5000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/translate` | Translate text (Arabic ↔ Chinese) |
| POST | `/tts` | Text-to-speech audio generation |
| POST | `/asr` | Speech-to-text recognition |
| POST | `/score` | Pronunciation accuracy scoring |

## Architecture

```
app.py (Flask routes)
├── services/
│   ├── translation.py  → Huawei Cloud NLP API
│   ├── tts.py          → Huawei Cloud SIS TTS
│   ├── asr.py          → Huawei Cloud SIS ASR
│   └── scoring.py      → MindSpore model wrapper
├── models/
│   └── pronunciation_model.py  → MindSpore neural scoring
└── utils/
    ├── huawei_auth.py  → IAM token management
    └── audio.py        → Audio format conversion
```
