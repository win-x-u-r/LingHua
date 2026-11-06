import { playAudioUrl, speakText, speakTutorText } from "@/lib/linghuaAPI";
import type { SceneLine } from "@/content/foundation1/types";

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

/**
 * Recorded scene lines, one voice per character (see src/assets/scenes/README.md).
 * Drop a file in src/assets/scenes/ named after the lesson and line, such as
 * m1-u1-l1-01.mp3 for line 1 of lesson m1.u1.l1, and it is used from the next
 * build. Lines without a file keep the device voice (or Hua's voice).
 */
const RECORDED = import.meta.glob("/src/assets/scenes/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** The file name for a scene line: lesson key with dashes, then the line number from 01 */
export const sceneFileName = (lessonKey: string, index: number) =>
  `${lessonKey.replace(/\./g, "-")}-${String(index + 1).padStart(2, "0")}.mp3`;

export const sceneRecording = (lessonKey: string, index: number): string | undefined =>
  RECORDED[`/src/assets/scenes/${sceneFileName(lessonKey, index)}`];

/** Play one scene line: its recording if there is one, otherwise the live voice */
export async function playSceneLine(lessonKey: string, index: number, line: SceneLine) {
  const url = sceneRecording(lessonKey, index);
  if (url) {
    try {
      return await playAudioUrl(url);
    } catch {
      /* fall through to the live voice */
    }
  }
  return line.who === "hua" ? playHua(line.zh) : playZh(line.zh);
}
