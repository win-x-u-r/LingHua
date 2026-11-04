// A compact way to write Mandarin on the Move lessons. Every lesson follows
// the same cycle as Foundation 1: Hear a scene, Understand the words, Speak,
// Use them in a situation, then Remember by matching.
import type { Activity, Lesson, SceneLine, T, Zh } from "../foundation1/types";

/** English and Arabic, in that order */
export type Pair = [en: string, ar: string];
export const tx = ([en, ar]: Pair): T => ({ en, ar });

export interface WordSpec extends Zh {
  meaning: Pair;
  /** Arabic sound guide */
  sound: string;
  note?: Pair;
  bonus?: boolean;
}

export interface NoteSpec {
  title: Pair;
  body: Pair;
  examples?: (Zh & { meaning: Pair })[];
}

export interface SaySpec extends Zh {
  prompt: Pair;
  tip?: Pair;
  /** Hua speaks first */
  hua?: Zh;
  nameSlot?: boolean;
}

export interface LessonSpec {
  key: string;
  title: Pair;
  zh: string;
  goal: Pair;
  minutes: number;
  scene: { title: Pair; lines: [who: SceneLine["who"], name: Pair, zh: string, pinyin: string, en: string, ar: string][] };
  words: WordSpec[];
  /** Explanations, shown after the words */
  notes?: NoteSpec[];
  say: SaySpec[];
  /** Activities in a situation; a say() here becomes a speaking turn */
  use: (Activity | SaySpec)[];
  /** Which words to match at the end (indexes into words); the first four by default */
  match?: number[];
  /** End with the unit's "I can..." statements */
  canDo?: boolean;
}

export const word = (zh: string, pinyin: string, sound: string, meaning: Pair, note?: Pair, bonus?: boolean): WordSpec => ({
  zh,
  pinyin,
  sound,
  meaning,
  note,
  bonus,
});

export const say = (zh: string, pinyin: string, prompt: Pair, extra: Partial<Pick<SaySpec, "tip" | "hua" | "nameSlot">> = {}): SaySpec => ({
  zh,
  pinyin,
  prompt,
  ...extra,
});

/** Hear a line, pick what it means */
export const listen = (zh: string, pinyin: string, prompt: Pair, options: Pair[], why: Pair): Activity => ({
  kind: "choice",
  prompt: tx(prompt),
  listen: { zh, pinyin },
  options: options.map((o, i) => ({ label: tx(o), correct: i === 0 })),
  why: tx(why),
});

/** Pick the right thing to say; the first option is correct */
export const pickZh = (prompt: Pair, options: Zh[], why: Pair): Activity => ({
  kind: "choice",
  prompt: tx(prompt),
  options: options.map((o, i) => ({ label: o, correct: i === 0 })),
  why: tx(why),
});

/** Pick the right answer in the learner's language; the first option is correct */
export const pick = (prompt: Pair, options: Pair[], why: Pair): Activity => ({
  kind: "choice",
  prompt: tx(prompt),
  options: options.map((o, i) => ({ label: tx(o), correct: i === 0 })),
  why: tx(why),
});

export const order = (prompt: Pair, tiles: string[], pinyin: string, meaning: Pair): Activity => ({
  kind: "order",
  prompt: tx(prompt),
  tiles,
  pinyin,
  meaning: tx(meaning),
});

const sayActivity = (s: SaySpec): Activity => ({
  kind: "say",
  zh: s.zh,
  pinyin: s.pinyin,
  prompt: tx(s.prompt),
  tip: s.tip && tx(s.tip),
  hua: s.hua,
  nameSlot: s.nameSlot,
});

export function lesson(spec: LessonSpec): Lesson {
  const matchWords = (spec.match ?? [0, 1, 2, 3]).map((i) => spec.words[i]).filter(Boolean);
  return {
    key: spec.key,
    title: tx(spec.title),
    zh: spec.zh,
    goal: tx(spec.goal),
    minutes: spec.minutes,
    steps: [
      {
        id: "hear",
        activities: [
          {
            kind: "scene",
            title: tx(spec.scene.title),
            lines: spec.scene.lines.map(([who, name, zh, pinyin, en, ar]) => ({ who, name: tx(name), zh, pinyin, meaning: { en, ar } })),
          },
        ],
      },
      {
        id: "understand",
        activities: [
          ...spec.words.map(
            (w): Activity => ({
              kind: "word",
              zh: w.zh,
              pinyin: w.pinyin,
              sound: w.sound,
              meaning: tx(w.meaning),
              note: w.note && tx(w.note),
              bonus: w.bonus,
            }),
          ),
          ...(spec.notes ?? []).map(
            (n): Activity => ({
              kind: "note",
              title: tx(n.title),
              body: tx(n.body),
              examples: n.examples?.map((e) => ({ zh: e.zh, pinyin: e.pinyin, meaning: tx(e.meaning) })),
            }),
          ),
        ],
      },
      {
        id: "speak",
        activities: spec.say.map(sayActivity),
      },
      { id: "use", activities: spec.use.map((a) => ("kind" in a ? a : sayActivity(a))) },
      {
        id: "remember",
        activities: [{ kind: "match", pairs: matchWords.map((w) => ({ zh: w.zh, pinyin: w.pinyin, meaning: tx(w.meaning) })) }],
      },
      ...(spec.canDo ? [{ id: "self" as const, activities: [{ kind: "canDo" as const }] }] : []),
    ],
  };
}
