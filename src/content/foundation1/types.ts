// LingHua Foundation 1: the shape of a unit, its lessons and their activities.
//
// The curriculum lives in code (like grammarContent) so a native teacher can
// review it in a pull request before it reaches learners. Learner progress is
// kept separately (src/lib/foundationProgress.ts).

/** Text shown in the learner's language */
export type T = { en: string; ar: string };

/** A piece of Mandarin: characters and pinyin, plus what it means */
export interface Zh {
  zh: string;
  pinyin: string;
}

/** The five steps of every lesson: Hear, Understand, Speak, Use, Remember */
export type StepId = "hear" | "understand" | "speak" | "use" | "remember" | "listening" | "tones" | "reading" | "speaking" | "self";

export interface SceneLine extends Zh {
  /** "hua" speaks in Hua's own voice; anyone else uses the standard Mandarin voice */
  who: "hua" | "a" | "b" | "teacher";
  name: T;
  meaning: T;
}

export type Activity =
  /** A short scene to listen to; the words appear after the first listen */
  | { kind: "scene"; title: T; lines: SceneLine[] }
  /** One word or phrase: meaning, pinyin, Arabic sound guide and a tip */
  | ({ kind: "word"; meaning: T; sound: string; note?: T; bonus?: boolean } & Zh)
  /** An explanation from Hua, with optional examples */
  | { kind: "note"; title: T; body: T; examples?: (Zh & { meaning: T })[] }
  /** The four tones on one syllable, as lines the learner can tap and hear */
  | { kind: "tones" }
  /** Say something; Hua may speak first. nameSlot: the learner adds their own name */
  | ({ kind: "say"; prompt: T; tip?: T; hua?: Zh; nameSlot?: boolean } & Zh)
  /** Hear a syllable, pick its tone */
  | { kind: "tonePick"; items: (Zh & { tone: 1 | 2 | 3 | 4 })[] }
  /** Pick the right answer; `listen` plays Mandarin first */
  | { kind: "choice"; prompt: T; listen?: Zh; options: { label: T | Zh; correct?: boolean }[]; why: T }
  /** Match each word to its meaning */
  | { kind: "match"; pairs: (Zh & { meaning: T })[] }
  /** Put the tiles in order */
  | { kind: "order"; prompt: T; tiles: string[]; pinyin: string; meaning: T }
  /** "I can..." statements the learner rates */
  | { kind: "canDo" };

export interface Step {
  id: StepId;
  activities: Activity[];
}

export interface Lesson {
  key: string;
  title: T;
  zh: string;
  goal: T;
  minutes: number;
  steps: Step[];
  /** The unit check: scored by step, see PASS_MARKS */
  isCheck?: boolean;
}

export interface Unit {
  key: string;
  number: number;
  title: T;
  zh: string;
  outcome: T;
  canDo: T[];
  lessons: Lesson[];
}
