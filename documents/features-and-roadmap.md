# Líng Huà — Features \& Proposed Development Roadmap

**Prepared for the Huawei ICT Innovation Competition 2025–2026**

\---

## Overview

Líng Huà is an **Arabic-first Mandarin Chinese learning platform** built to serve a learner audience that mainstream language-learning apps overlook: native Arabic speakers studying Mandarin for higher education, business, travel, or personal interest. The platform combines pronunciation practice, vocabulary learning, gamified progression, and classroom tools, and is powered by **four Huawei Cloud technologies**: Speech Interaction Service (SIS), Natural Language Processing (NLP) Machine Translation, MindSpore deep learning framework, and Elastic Cloud Server (ECS) hosting.

The platform is currently live at [**https://linghua.app**](https://linghua.app) and serves higher education students, teachers, independent learners, business professionals, and travellers who need practical Mandarin support for study, work, and communication in China.

This document is divided into two parts:

* **Part 1** describes the features that are **currently implemented** and live in production.
* **Part 2** describes **proposed features** planned for future releases to further strengthen Líng Huà's learning value, accessibility, and technical innovation.

\---

# Part 1 — Implemented Features

## 1.1 User Accounts and Role-Based Dashboards

Líng Huà currently supports two account types, each with a dedicated dashboard tailored to the user's needs.

### Student Account

Students sign up or log in to access Mandarin lessons, pronunciation practice, flashcards, vocabulary review, and progress tracking. The student dashboard focuses on:

* Total XP and current level
* Daily practice streak
* Words learned (mastered) count
* Average pronunciation score
* Score progress chart over the last 30 days
* Per-category mastery (radar chart)
* Streak calendar visualisation
* Words due for review
* Per-difficulty-level progress bars (Beginner, Intermediate, Advanced)

### Teacher Account

Teachers sign up or log in to manage classrooms, monitor student progress, and identify common learning difficulties. The teacher dashboard provides:

* Classroom code generation and sharing
* Active student count and aggregate average score
* Total practice sessions across the classroom
* Pronunciation accuracy chart over time
* Practice sessions per student
* Most difficult words across the classroom
* Per-student leaderboard with XP, attempt count, and average score

## 1.2 Mandarin Pronunciation Scoring with Multi-Dimensional Breakdown

The platform's core feature is a real-time pronunciation scoring system powered by **Huawei SIS Automatic Speech Recognition (ASR)** and a custom **MindSpore-based scoring model** running on the backend ECS instance.

When a learner records a pronunciation attempt, the system returns a detailed 0–100 score broken down into three dimensions:

|Dimension|Weight|Description|
|-|-|-|
|**Character Accuracy**|40%|Did the recogniser identify the correct Chinese characters?|
|**Pinyin Similarity**|35%|Are the syllable sounds correct, independent of tone?|
|**Tone Accuracy**|25%|Are the Mandarin tones (1–4) pronounced correctly?|

The breakdown allows learners to understand *why* they received their score, not just *what* the number was.

## 1.3 Arabic Phonetic Bridge

One of Líng Huà's most distinctive Arabic-first features is the **Arabic phonetic bridge**, which converts Mandarin pinyin into approximate Arabic letter spellings. After every pronunciation attempt, the learner sees:

* The **expected** Mandarin characters with pinyin and Arabic phonetic spelling
* What they **actually said**, with the same three layers

This helps Arabic-speaking learners understand exactly which sounds they got right and where they diverged from the target, using familiar Arabic letters as a bridge between unfamiliar Mandarin phonetics.

## 1.4 Arabic ↔ Chinese Translator

Bidirectional text translation between Arabic and Mandarin Chinese, powered by **Huawei Cloud NLP Machine Translation API** (cn-north-4 region). The translator includes:

* Text-to-text translation in both directions
* Voice input (microphone → ASR → text → translation)
* Voice output (translated text → TTS playback)
* Voice-to-voice mode for real-time conversational translation

## 1.5 Stroke Order Animations and Practice

Every Chinese character on every flashcard includes:

* An animated stroke order playback ("Play")
* A trace-it-yourself practice mode ("Practice") that validates each stroke as the user draws it

Powered by the open-source **HanziWriter** library. Correctly completing the stroke practice mode rewards the learner with bonus XP, encouraging engagement with character writing rather than just pronunciation.

## 1.6 Smart Review System (Spaced Repetition)

Líng Huà uses an **SM-2 spaced repetition algorithm** to schedule word reviews based on each learner's performance:

* Words the learner scores poorly on appear more frequently
* Words the learner has mastered appear less often
* A "Review Due" mode in the Flashcards tab surfaces exactly the words the learner needs to practice today
* A live counter badge shows how many words are due for review

This improves long-term vocabulary retention and ensures learners spend their practice time on the words, tones, and phrases they actually need to improve.

## 1.7 Gamification

To keep learners motivated, Líng Huà includes a comprehensive gamification system:

* **XP (Experience Points)** awarded for every pronunciation attempt and stroke order completion
* **7 Levels** with progression (Seedling → Sprout → Blossom → Bamboo → Dragon → Phoenix → Master)
* **Daily streaks** that track consecutive practice days
* **5 Achievement Badges**: First Words, Tone Master, Week Warrior, Polyglot, Perfect 10
* **Visual streak calendar** displaying the last 30 days of activity

## 1.8 Classroom Mode

Teachers can create classrooms and share a join code with their students. Once joined, all student activity (attempts, scores, XP) is visible on the teacher's dashboard. Students can join classrooms either during sign-up or later through their profile page.

## 1.9 Vocabulary Library

The platform currently includes **520+ vocabulary words** distributed across 17 categories and three difficulty levels:

|Level|Word Count|Categories|
|-|-|-|
|Beginner|\~197|Greetings, Family, Numbers, Basics|
|Intermediate|\~194|School, Food, Colors, Body, Animals, Weather, Time, Clothing, Transport|
|Advanced|\~129|Daily Life, Concepts, Business, Technology, Travel, Emotions, Nature|

## 1.10 Bilingual User Interface

The entire user interface is fully translated and supports:

* **Arabic** (with right-to-left layout)
* **English** (with left-to-right layout)

Language preference is persisted per user and can be toggled instantly from any page via the globe icon in the navigation bar.

\---

# Part 2 — Proposed Features

The following features are planned for future development to further enhance Líng Huà's learning value, accessibility, and technical innovation.

## 2.1 Independent Learner Account Type

In addition to Student and Teacher accounts, Líng Huà will introduce a third account type for independent learners such as business professionals, travellers, and self-directed users learning Mandarin outside a classroom.

The Independent Learner dashboard would focus on self-paced learning with practical, real-world content:

* Travel phrases organised by scenario (airport, hotel, restaurant)
* Business Mandarin (meetings, introductions, negotiations)
* Pronunciation practice tailored to the user's stated goals
* Recommended lessons based on usage patterns
* Personal progress tracking without classroom-related features

This expansion would allow Líng Huà to serve both educational institutions and independent users while keeping the learning experience organised, relevant, and practical for each audience.

## 2.2 AI Tutor / Language Coach

A proposed AI-powered language tutor would act as a personal Mandarin language coach for Arabic-speaking learners. The tutor would support Mandarin input and, where possible, recognise multiple Arabic dialects to make the learning experience more natural for users across the Arab world.

Rather than only providing basic answers, the AI tutor would help learners:

* Practise full conversations in realistic scenarios
* Receive pronunciation corrections in real time
* Get vocabulary explanations in Arabic
* Navigate common travel, business, and classroom situations

The AI tutor would support Arabic-to-Mandarin explanations, Mandarin pronunciation correction, dialect-aware Arabic support, conversational practice, personalised learning suggestions, and grammar explanations adapted to the learner's level.

This would transform Líng Huà from a flashcard and pronunciation app into a genuine interactive language-learning companion.

## 2.3 Visual Color-Coded Pronunciation Feedback

The current pronunciation feedback shows numeric scores broken down by character accuracy, pinyin similarity, and tone accuracy. The proposed enhancement would add **per-element color coding** to make feedback even more transparent.

Each part of the displayed result — Chinese characters, pinyin syllables, individual tones, and Arabic phonetic spellings — would be highlighted in **green** if the learner pronounced it correctly and **red** if they pronounced it incorrectly or weakly.

For example, if the learner correctly pronounces 你 but misses the tone on 好, the system would visually highlight exactly that problem so the learner can identify whether their mistake was in the character sound, the pinyin, the tone, or all three.

This would turn the feedback panel into a visual diagnostic tool rather than just a score display.

## 2.4 Color-Coded Arabic Phonetic Bridge

Building on the proposed color-coded pronunciation feedback, the Arabic phonetic bridge would also receive matching color highlights. When a Mandarin character is marked correct or incorrect, the corresponding Arabic phonetic segment would be highlighted in the same color.

This visually links three pronunciation layers:

* What the Mandarin character looks like
* How it is written in pinyin
* How it can be approximated through Arabic sounds

By tying these layers together visually, the platform would make Mandarin pronunciation easier and less intimidating for Arabic-speaking learners.

## 2.5 Clickable Phoneme-by-Phoneme Practice

The proposed enhancement would make every pronunciation component individually clickable in the speech practice tab:

* Each Chinese character
* Each pinyin segment
* Each tone
* Each Arabic phonetic bridge segment

Clicking on a specific element would play the correct audio for just that sound. This allows learners to practice Mandarin pronunciation **phoneme by phoneme** instead of only hearing the full word at once.

For example, if a learner struggles with one syllable or tone, they can isolate that part, hear it repeated, and rehearse it until improvement. This is especially valuable for Arabic-speaking learners because Mandarin contains tones and consonants (such as the retroflex zh, ch, sh, r) that do not exist directly in Arabic.

## 2.6 Grammar Support in Flashcards

The current flashcard system shows the word, translation, pinyin, Arabic phonetic bridge, and stroke order. The proposed expansion would add a **grammar panel** to each flashcard, including:

* Word type (noun, verb, adjective, classifier, etc.)
* Basic sentence usage examples
* Common grammar patterns the word appears in
* Notes on word order or tone changes when combined with other words

This would help learners understand not only the meaning of a word, but also how to use it correctly in real Mandarin communication.

## 2.7 Advanced Grammar Mode

In addition to in-flashcard grammar support, Líng Huà would introduce a separate **Advanced Mode** tab dedicated to grammar practice. This mode would recycle vocabulary the learner has already encountered and place it into grammar-based exercises rather than introducing entirely new words.

Advanced Mode would include:

* Sentence-building exercises
* Word order activities
* Targeted grammar explanations triggered by mistakes
* Practice sessions using only previously learned vocabulary

This feature would support long-term learning by gradually progressing learners from individual word memorisation into full sentence formation and natural communication.

## 2.8 Personalised Learning Path Enhancements

While Líng Huà already includes spaced repetition (Section 1.6), the proposed enhancement would extend personalisation across the entire learning experience. The system would analyse pronunciation scores, vocabulary accuracy, grammar mistakes, and practice history to recommend targeted exercises.

For example:

* A user who repeatedly struggles with Mandarin tones would receive more tone-based pronunciation drills
* A learner using the app for business communication would be recommended workplace vocabulary, meeting phrases, and professional conversation practice
* A traveller would be guided toward situational phrasebooks and pronunciation of key travel terms

This ensures users do not only follow a fixed learning path, but receive practice tailored to their actual weaknesses, goals, and progress.

\---

## Summary

The implemented features establish Líng Huà as a working, production-grade Arabic-first Mandarin learning platform powered by Huawei Cloud AI services. The proposed features extend the platform into a fuller language-learning ecosystem combining AI tutoring, granular visual pronunciation feedback, grammar instruction, and deeply personalised learning paths.

By combining Mandarin characters, pinyin, tones, Arabic phonetic bridges, speech feedback, scenario-based practice, and future real-time communication tools, Líng Huà will provide a more accessible and practical learning experience for Arabic-speaking users in the UAE and the wider Arab region — and serve as a strong showcase of how Huawei Cloud AI technologies can be applied to solve real, underserved educational problems.

