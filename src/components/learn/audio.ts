import { speakText, speakTutorText } from "@/lib/linghuaAPI";

/** Model Mandarin: the standard voice, which keeps tones exact on single syllables */
export const playZh = (text: string) => speakText(text, "zh");

/** Hua's own voice (ElevenLabs). Falls back to the standard voice if it can't play. */
export async function playHua(text: string) {
  try {
    await speakTutorText(text);
  } catch {
    await playZh(text);
  }
}
