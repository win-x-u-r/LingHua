# Líng Huà

**Press & Media Brief — Huawei ICT Innovation Competition 2025–2026 Global Final**

---

## About Líng Huà

**Líng Huà** ("intelligent language" in Mandarin) is an **Arabic-first Mandarin Chinese learning platform** built specifically for native Arabic speakers studying Mandarin for higher education, business, travel, or personal interest. Mainstream language-learning apps assume an English-speaking learner, leaving Arabic-speaking students to translate twice — first from Arabic to English, then from English to Mandarin. Líng Huà removes that barrier by treating Arabic as a first-class learner language, including a unique **Arabic phonetic bridge** that maps Mandarin pronunciation onto familiar Arabic letters.

The platform is live in production at **[https://linghua.app](https://linghua.app)** and is powered end-to-end by Huawei Cloud technologies.

---

## The Team

**Hazim Kaloub** and **Zoha Farooq**, students at the **American University of Ras Al Khaimah (AURAK)**, are representing the **United Arab Emirates** in the global final of the Huawei ICT Innovation Competition 2025–2026 with Líng Huà. The team secured **first place in the Middle East & Central Asia regional final** earlier in the competition, advancing them to the global stage.

Their motivation is grounded in the rapid expansion of UAE–China educational and economic ties: as more UAE students pursue Mandarin for university programs, business careers, and life in China, there is no language-learning tool built for them. Líng Huà aims to fill that gap.

---

## Features Powered by Huawei Cloud

Líng Huà integrates **four Huawei Cloud technologies** in a single production application:

### Huawei SIS (Speech Interaction Service) — Speech & Audio
- **Real-Time Text-to-Speech (RTTS)** over WebSocket delivers natural-sounding Arabic and English audio for vocabulary, dialogue, and pronunciation models.
- **Short Audio Recognition (ASR)** processes student voice recordings and returns recognised text used for pronunciation evaluation.

### Huawei Cloud NLP — Translation
- **NLP Machine Translation API** powers bidirectional Arabic ↔ Chinese translation across both text and voice modes, including the platform's voice-to-voice conversational translator.

### Huawei MindSpore — AI Pronunciation Scoring
- A custom **MindSpore-based pronunciation scoring model** runs on the application backend, evaluating each student's voice attempt across **three dimensions**: character accuracy (40%), pinyin similarity (35%), and tone accuracy (25%). The model uses MindSpore character embeddings and cosine similarity to provide students with a detailed breakdown of *why* they received their score, not just the final number.

### Huawei Elastic Cloud Server (ECS) — Hosting
- The full-stack production application — frontend, backend API, gunicorn workers, and nginx reverse proxy with HTTPS — runs on a **Huawei ECS instance** in the Bangkok region, delivering the live `linghua.app` service to users worldwide.

---

## Other Core Features

In addition to the Huawei-powered services above, Líng Huà includes:

- **520+ vocabulary words** across 17 categories and three difficulty levels (beginner / intermediate / advanced).
- **Stroke order animations** for every Chinese character, with a "trace it yourself" practice mode that rewards XP for correct completion.
- **SM-2 spaced repetition system** that schedules word reviews based on each learner's actual performance — words you struggle with come back sooner.
- **Gamification system** with seven progression levels (Seedling → Master), daily streaks, and achievement badges.
- **Classroom mode** allowing teachers to create classes, share join codes with students, and monitor pronunciation accuracy, practice frequency, and the most-difficult words across their entire class.
- **Bilingual interface** with full Arabic (right-to-left) and English (left-to-right) support, instantly switchable from any page.
- **Personalised analytics dashboard** showing score progress, category mastery via radar chart, streak calendar, and per-level mastery progress.

---

## Proposed Features (Roadmap)

Líng Huà's roadmap focuses on deepening the Arabic-first thesis with deeper AI integration:

- **AI Tutor / Language Coach** — an AI-powered Mandarin coach with Arabic dialect awareness that practises full conversations, corrects pronunciation in real time, and explains vocabulary in Arabic.
- **Color-coded pronunciation feedback** — every character, pinyin syllable, tone, and Arabic phonetic segment will be highlighted green or red based on the learner's actual pronunciation, turning the feedback panel into a visual diagnostic tool.
- **Clickable phoneme-by-phoneme practice** — every individual sound becomes independently clickable so learners can isolate and rehearse just the syllables or tones they struggle with.
- **Grammar support and Advanced Grammar Mode** — sentence-building, word-order, and fill-in-the-blank exercises that recycle previously learned vocabulary.
- **Independent Learner account type** — a third user role (alongside Student and Teacher) tailored to business professionals, travellers, and self-directed learners with curated travel and business Mandarin content.
- **Personalised learning paths** — extending the existing spaced repetition system to recommend targeted exercises based on each learner's specific weaknesses (tones, retroflex consonants, vocabulary gaps).
