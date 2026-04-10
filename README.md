<div align="center">
  <img src="public/favicon-512.png" alt="Líng Huà" width="120" />

# Líng Huà · 灵话


**A Mandarin Chinese learning platform built for Arabic speakers, powered by Huawei Cloud AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Huawei Cloud](https://img.shields.io/badge/Huawei%20Cloud-AI-FF0000?logo=huawei&logoColor=white)](https://www.huaweicloud.com/intl/en-us/)
[![MindSpore](https://img.shields.io/badge/MindSpore-2.3-00A4EF)](https://www.mindspore.cn)

</div>

---

## About

**Líng Huà** (灵话, "intelligent language") is a web app that helps Arabic-speaking students learn Mandarin Chinese. It was built for the **Huawei ICT Competition 2025–2026** to address a real gap: the lack of Mandarin learning tools designed for the Arabic phonetic and educational context.

Most language learning apps assume an English-speaking learner. Líng Huà flips that — every feature is designed around how Arabic speakers actually approach Mandarin: tone confusion, retroflex consonants (zh / ch / sh), and unfamiliar character forms. Pronunciation feedback even includes **Arabic phonetic transliteration** so students can map Mandarin sounds onto familiar letters.

The app combines **four Huawei Cloud technologies** in a single product:

| Service | Used for |
|---|---|
| **MindSpore** | Local pronunciation scoring model (character + pinyin + tone) |
| **SIS (Speech Interaction Service)** | Real-time TTS and ASR via WebSocket / REST |
| **NLP Machine Translation** | Arabic ↔ Chinese translation |
| **ECS** | Hosting (this repo includes a one-shot deploy script) |

---

## Features

### Core learning
- **Smart Flashcards** — 520+ vocabulary words across 17 categories (greetings, family, food, colors, business, etc.) at three difficulty levels
- **Pronunciation Practice** — record your voice, get a 0–100 score with a per-dimension breakdown (character accuracy, pinyin similarity, tone accuracy)
- **Arabic Phonetic Feedback** — every pronunciation result shows what you said in Arabic letters so you can see *exactly* where the sounds diverged from the target
- **Stroke Order Animations** — animated stroke order for every Chinese character on the back of each flashcard, with a "trace it yourself" practice mode (powered by HanziWriter)
- **Arabic ↔ Chinese Translator** — text and voice translation in both directions
- **Authentic TTS** — Huawei SIS Real-Time TTS for Arabic + browser Web Speech for Chinese (since SIS Chinese voices aren't available in international regions)

### Spaced repetition
- **SM-2 algorithm** tracks each user's mastery of every word
- Words you score low on come back sooner; words you've mastered are scheduled further out
- "Review Due" mode in the flashcards page surfaces exactly the words you need to practice today

### Gamification & progress
- **XP system** with 7 levels (Seedling → Master)
- **Daily streaks** with a 30-day calendar visualization
- **5 achievement badges** (First Words, Tone Master, Week Warrior, Polyglot, Perfect 10)
- **Per-category mastery** shown as a radar chart on the dashboard

### Classroom mode (for teachers)
- Teachers create classrooms and share a join code with students
- **Teacher dashboard** shows aggregate analytics: avg pronunciation accuracy over time, practice sessions per student, most-difficult words across the class, and a per-student leaderboard
- **Student dashboard** shows score progress, category mastery radar, streak calendar, words due for review, and level progress bars

### Bilingual UI
- Full **Arabic and English** localization with RTL/LTR layout switching
- Persisted language preference per user

---

## Architecture

```
┌──────────────┐         ┌────────────────┐         ┌─────────────────────┐
│   Browser    │  HTTPS  │     Nginx      │  proxy  │  Flask + Gunicorn   │
│  (React SPA) │ ◄─────► │  (reverse-     │ ◄─────► │  (port 5000)        │
│              │         │   proxy + TLS) │         │                     │
└──────┬───────┘         └────────────────┘         └──────────┬──────────┘
       │                                                       │
       │ Auth + DB                                             │ Huawei SDK
       ▼                                                       ▼
┌──────────────┐                              ┌────────────────────────────┐
│   Supabase   │                              │   Huawei Cloud Services    │
│  (Postgres,  │                              │  • SIS RTTS  (me-east-1)   │
│   Auth, RLS) │                              │  • SIS ASR   (me-east-1)   │
└──────────────┘                              │  • NLP MT    (cn-north-4)  │
                                              │  • MindSpore (local infer) │
                                              └────────────────────────────┘
```

### Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, recharts, HanziWriter |
| **Backend** | Python 3, Flask, Gunicorn, MindSpore, pypinyin, websocket-client |
| **Cloud** | Huawei Cloud (ECS, SIS, NLP, EIP, DNS), Supabase (auth + DB) |
| **i18n** | Custom lightweight i18n with Arabic + English |

---

## Repository structure

```
.
├── README.md                       ← you are here
├── deploy.sh                       ← one-shot deployment script for Ubuntu
├── start.bat                       ← Windows local-dev launcher
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
│
├── src/                            ← React frontend
│   ├── pages/                      ← Home, Flashcards, Practice, Translator, Dashboard, Profile, Auth, About
│   ├── components/                 ← Navbar, Footer, StrokeOrder, BadgeDisplay, XPBar, etc.
│   ├── contexts/                   ← Auth + Language providers
│   ├── lib/                        ← linghuaAPI, spacedRepetition, gamification, i18n
│   ├── hooks/                      ← use-microphone
│   └── integrations/supabase/      ← Supabase client
│
├── backend/                        ← Flask API
│   ├── app.py                      ← Routes: /tts, /asr, /score, /pronounce, /translate, /health
│   ├── config.py
│   ├── requirements.txt
│   ├── services/
│   │   ├── tts.py                  ← Huawei SIS Real-Time TTS (WebSocket)
│   │   ├── asr.py                  ← Huawei SIS Short Audio Recognition
│   │   ├── translation.py          ← Huawei NLP Machine Translation
│   │   └── scoring.py              ← MindSpore-based pronunciation scoring
│   ├── models/
│   │   └── pronunciation_model.py  ← Character / pinyin / tone scoring
│   └── utils/
│       ├── huawei_auth.py          ← AK/SK + IAM token caching
│       └── audio.py                ← PCM conversion helpers
│
└── supabase/migrations/            ← Database schema (vocab, attempts, progress, profiles,
                                       classrooms, badges, user_badges, word_reviews)
```

---

## Local development

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- A **Huawei Cloud** account with:
  - SIS enabled in `me-east-1` (ME-Riyadh) — for TTS / ASR
  - NLP enabled in `cn-north-4` (CN-North-Beijing4) — for translation
  - AK / SK credentials
- A **Supabase** project with the migrations from `supabase/migrations/` applied

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/win-x-u-r/LingHua.git
cd LingHua

# 2. Frontend
npm install

# 3. Frontend env
cp .env.example .env  # then edit and fill in your Supabase keys
# (or create .env manually with VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE)

# 4. Backend
cd backend
python -m venv venv
source venv/bin/activate          # on Windows: venv\Scripts\activate
pip install -r requirements.txt

# 5. Backend env
cp .env.example .env              # then edit and fill in your Huawei AK/SK + project IDs
```

### Running

**Quick start (Windows)** — double-click [`start.bat`](start.bat). It launches the backend (port 5000) and frontend (port 8080) in two windows and opens your browser.

**Manual:**

```bash
# Terminal 1 — backend
cd backend
python app.py        # serves on http://localhost:5000

# Terminal 2 — frontend
npm run dev          # serves on http://localhost:8080
```

Open <http://localhost:8080>.

---

## Deployment

### One-shot deploy to Huawei ECS

The repo includes [`deploy.sh`](deploy.sh) — a single Bash script that provisions a fresh Ubuntu 22.04 server with everything needed: nginx, Python venv, gunicorn systemd service, certbot (Let's Encrypt SSL), and the React build.

**Prerequisites:**

1. A Huawei ECS instance (Ubuntu 22.04, 2 vCPU / 2 GB RAM minimum) with:
   - An attached EIP (Elastic IP)
   - Security group allowing inbound ports 22, 80, 443
2. A domain pointing to your EIP via an A record
3. Your Huawei AK / SK and Supabase keys ready to paste when prompted

**Deploy:**

```bash
# SSH into your server
ssh root@<your-eip>

# Download the script and run it
curl -fsSL https://raw.githubusercontent.com/win-x-u-r/LingHua/main/deploy.sh -o deploy.sh
sudo bash deploy.sh yourdomain.com you@example.com
```

The script:

1. Installs system dependencies (Python 3, Node.js 20, nginx, certbot)
2. Clones this repo to `/opt/linghua`
3. Sets up a Python venv with all backend deps + Huawei SDKs
4. Creates a `linghua-backend.service` systemd unit (gunicorn, 4 workers, auto-restart)
5. Builds the React frontend with the production API URL
6. Configures nginx as a reverse proxy (`/` → frontend, `/api/` → backend)
7. Issues a free SSL cert via Let's Encrypt
8. Enables UFW with ports 22, 80, 443 open

**Re-deploy after pushing new code:**

```bash
cd /opt/linghua && sudo bash deploy.sh yourdomain.com you@example.com
```

The script is idempotent — it pulls the latest code, rebuilds, and restarts everything in place.

---

## Database schema

The Supabase database has these tables (see [`supabase/migrations/`](supabase/migrations) for the full SQL):

| Table | Purpose |
|---|---|
| `vocab` | Vocabulary words (hanzi, pinyin, arabic_translation, level, category) |
| `attempts` | Every pronunciation attempt with score and timestamp |
| `progress` | Per-user XP, streak, words learned |
| `profiles` | User profile linked to Supabase Auth (full_name, role, classroom_id, language_pref) |
| `classrooms` | Classrooms created by teachers (with join code) |
| `badges` | Achievement definitions |
| `user_badges` | Badges earned by each user |
| `word_reviews` | SM-2 spaced repetition state per (user, word) |

Row-level security is enabled on all user-scoped tables.

---

## Why it's competition-relevant

This project hits all four judging criteria:

- **Innovation** — combines four Huawei AI services (SIS, NLP, MindSpore + ECS) into a single product targeting an underserved niche (Arabic-speaking Mandarin learners). The pronunciation scorer uses MindSpore for character-level embeddings and the Arabic phonetic transliteration is a novel feedback mechanism.
- **Application Value** — UAE–China trade and educational links are growing rapidly; there's real demand for Mandarin tools tailored to Arab learners. The classroom mode makes it deployable in real schools.
- **Completeness & Demonstrability** — full working app with auth, gamification, dashboards, and live demo flow (record → score → see breakdown → earn XP).
- **Performance** — the combined `/pronounce` endpoint cuts pronunciation feedback latency in half by merging ASR and scoring into a single round trip.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgments

- **Huawei Cloud** — for the SIS, NLP, and MindSpore services that power the AI features
- **HanziWriter** — for the beautiful stroke order animations
- **Supabase** — for the auth + Postgres backend
- **shadcn/ui** — for the React component library
- The **Huawei ICT Competition** organizers for the opportunity
