// API Base URL - reads from env var, falls back to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export interface TranslateResponse {
  translatedText: string;
}

export interface ASRResponse {
  text: string;
}

export interface ScoreBreakdown {
  score: number;
  weight: number;
  label: string;
}

export interface ScoreResponse {
  score: number;
  recognized: string;
  expected_pinyin: string;
  expected_arabic: string;
  recognized_pinyin: string;
  recognized_arabic: string;
  breakdown: {
    character: ScoreBreakdown;
    pinyin: ScoreBreakdown;
    tone: ScoreBreakdown;
  };
}

/**
 * Translate text between Arabic and Chinese
 */
export async function translateText(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const response = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, target }),
  });

  if (!response.ok) throw new Error(`Translation failed: ${response.statusText}`);

  const data: TranslateResponse = await response.json();
  return data.translatedText;
}

/**
 * Speak text aloud using Huawei Cloud TTS via the backend.
 */
// Keep a reference to prevent garbage collection during playback
let _currentAudio: HTMLAudioElement | null = null;

// Pre-load browser voices for Chinese TTS fallback
let _voices: SpeechSynthesisVoice[] = [];
function _loadVoices() {
  _voices = window.speechSynthesis?.getVoices() ?? [];
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  _loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", _loadVoices);
}

/**
 * Speak text aloud.
 * - Arabic/English: Huawei Cloud SIS RTTS (me-east-1)
 * - Chinese: Browser Web Speech API (Google zh-CN voice) since
 *   Huawei SIS international doesn't offer Chinese TTS voices.
 */
export async function speakText(text: string, lang: string): Promise<void> {
  const response = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });

  if (!response.ok) throw new Error(`TTS failed: ${response.statusText}`);

  const contentType = response.headers.get("content-type") || "";

  // Backend signals to use browser TTS for Chinese
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (data.use_browser_tts) {
      return browserSpeak(text, data.lang || "zh-CN");
    }
    throw new Error(data.error || "TTS failed");
  }

  // Huawei audio response
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.volume = 1.0;
    _currentAudio = audio;
    audio.onended = () => { _currentAudio = null; resolve(); };
    audio.onerror = () => { _currentAudio = null; reject(new Error("Audio playback failed")); };
    audio.play().catch(reject);
  });
}

function browserSpeak(text: string, langTag: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!window.speechSynthesis) {
      return reject(new Error("Browser does not support speech synthesis"));
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langTag;
    utterance.rate = 0.85;
    utterance.volume = 1;

    // Pick a matching voice
    const voice = _voices.find((v) => v.lang.startsWith(langTag.split("-")[0]));
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(`Speech failed: ${e.error}`));

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Combined ASR + pronunciation scoring in a single request.
 * Faster than calling speechToText then scorePronunciation separately.
 */
export async function pronounceAndScore(
  file: File,
  expected: string,
  lang: string = "zh"
): Promise<ScoreResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expected", expected);
  formData.append("lang", lang);

  const response = await fetch(`${API_BASE}/pronounce`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`Pronunciation scoring failed: ${response.statusText}`);

  return await response.json();
}

/**
 * Convert speech to text using Huawei Cloud ASR via the backend.
 */
export async function speechToText(file: File, lang: string = "zh"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lang", lang);

  const response = await fetch(`${API_BASE}/asr`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`ASR failed: ${response.statusText}`);

  const data: ASRResponse = await response.json();
  return data.text;
}

/**
 * Score pronunciation accuracy (0-100) using the backend MindSpore scorer.
 */
export async function scorePronunciation(
  expected: string,
  actual: string
): Promise<ScoreResponse> {
  const response = await fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expected, actual }),
  });

  if (!response.ok) throw new Error(`Scoring failed: ${response.statusText}`);

  return await response.json();
}
