// Ready-made LingHua learning paths for Teacher's Corner.
//
// A path is an ordered list of lessons built from LingHua's own content: the
// vocab table (by level and topic) and the grammar points in grammarContent.
// Teachers can follow a path, adapt it, or build their own lessons. "Use this
// path" copies its lessons into the class (class_lessons, with source_key), so
// each class gets its own version to change. The paths here never change.
import { supabase } from "@/integrations/supabase/client";
import type { ClassLevel } from "@/lib/classSetup";
import { listLessons, saveLesson, type Lesson } from "@/lib/lessons";

type VocabLevel = "beginner" | "intermediate" | "advanced";
type Text3 = { en: string; ar: string; zh: string };

export interface PathLesson {
  /** Stable id, stored as class_lessons.source_key */
  key: string;
  title: Text3;
  /** Words: this vocab level and these topics, at most `take` words from `skip` on */
  level: VocabLevel;
  categories: string[];
  skip?: number;
  take: number;
  grammarIds: string[];
}

export interface ClassPath {
  id: string;
  title: Text3;
  blurb: { en: string; ar: string };
  /** Class levels this path suits; it is marked as a match for them */
  suits: ClassLevel[];
  lessons: PathLesson[];
}

export const CLASS_PATHS: ClassPath[] = [
  {
    id: "first-steps",
    title: { en: "First steps", ar: "الخطوات الأولى", zh: "起步" },
    blurb: { en: "Greetings, family and numbers, with the first sentence patterns.", ar: "التحيات والعائلة والأرقام، مع أول أنماط الجمل." },
    suits: ["zero", "beginner", "mixed"],
    lessons: [
      { key: "first-steps/hello", title: { en: "Hello!", ar: "مرحبًا!", zh: "你好！" }, level: "beginner", categories: ["greetings"], take: 10, grammarIds: ["ma-questions"] },
      { key: "first-steps/family", title: { en: "My family", ar: "عائلتي", zh: "我的家人" }, level: "beginner", categories: ["family"], take: 10, grammarIds: ["shi-tobe"] },
      { key: "first-steps/numbers", title: { en: "Numbers", ar: "الأرقام", zh: "数字" }, level: "beginner", categories: ["numbers"], take: 12, grammarIds: [] },
      { key: "first-steps/basics-1", title: { en: "Everyday words", ar: "كلمات يومية", zh: "日常词语" }, level: "beginner", categories: ["basics"], take: 12, grammarIds: ["negation-bu-mei"] },
      { key: "first-steps/basics-2", title: { en: "What I did", ar: "ماذا فعلت", zh: "我做了什么" }, level: "beginner", categories: ["basics"], skip: 12, take: 12, grammarIds: ["le-completed"] },
    ],
  },
  {
    id: "everyday",
    title: { en: "Everyday Mandarin", ar: "الصينية اليومية", zh: "日常中文" },
    blurb: { en: "Food, school, time and getting around, with comparisons and 在.", ar: "الطعام والمدرسة والوقت والتنقل، مع المقارنة و在." },
    suits: ["beginner", "intermediate", "mixed"],
    lessons: [
      { key: "everyday/food", title: { en: "Food and drink", ar: "الطعام والشراب", zh: "吃的喝的" }, level: "intermediate", categories: ["food"], take: 12, grammarIds: ["modal-verbs"] },
      { key: "everyday/school", title: { en: "At school", ar: "في المدرسة", zh: "在学校" }, level: "intermediate", categories: ["school"], take: 12, grammarIds: ["zai-progressive"] },
      { key: "everyday/transport", title: { en: "Getting around", ar: "التنقل", zh: "出行" }, level: "intermediate", categories: ["transport"], take: 12, grammarIds: [] },
      { key: "everyday/time-weather", title: { en: "Time and weather", ar: "الوقت والطقس", zh: "时间和天气" }, level: "intermediate", categories: ["time", "weather"], take: 12, grammarIds: ["bi-comparison"] },
      { key: "everyday/animals-colours", title: { en: "Animals and colours", ar: "الحيوانات والألوان", zh: "动物和颜色" }, level: "intermediate", categories: ["animals", "colors"], take: 12, grammarIds: [] },
    ],
  },
  {
    id: "going-further",
    title: { en: "Going further", ar: "خطوة أبعد", zh: "更进一步" },
    blurb: { en: "Daily life, travel, work and feelings, with 把, 被 and 过.", ar: "الحياة اليومية والسفر والعمل والمشاعر، مع 把 و被 و过." },
    suits: ["advanced", "mixed"],
    lessons: [
      { key: "going-further/daily", title: { en: "Daily life", ar: "الحياة اليومية", zh: "日常生活" }, level: "advanced", categories: ["daily"], take: 12, grammarIds: ["ba-construction"] },
      { key: "going-further/travel", title: { en: "Travel", ar: "السفر", zh: "旅行" }, level: "advanced", categories: ["travel"], take: 12, grammarIds: ["guo-experiential"] },
      { key: "going-further/work", title: { en: "Work and business", ar: "العمل والأعمال", zh: "工作与商务" }, level: "advanced", categories: ["business"], take: 12, grammarIds: ["bei-passive"] },
      { key: "going-further/feelings", title: { en: "Feelings", ar: "المشاعر", zh: "情感" }, level: "advanced", categories: ["emotions"], take: 12, grammarIds: [] },
      { key: "going-further/world", title: { en: "Nature and technology", ar: "الطبيعة والتكنولوجيا", zh: "自然与科技" }, level: "advanced", categories: ["nature", "technology"], take: 12, grammarIds: [] },
    ],
  },
];

export const pathOfKey = (key: string | null) => (key ? CLASS_PATHS.find((p) => key.startsWith(`${p.id}/`)) ?? null : null);

/** The words for each lesson of a path, read from the vocab table in a fixed order */
async function wordsFor(path: ClassPath): Promise<Map<string, string[]>> {
  const levels = [...new Set(path.lessons.map((l) => l.level))];
  const cats = [...new Set(path.lessons.flatMap((l) => l.categories))];
  const { data, error } = await (supabase as any)
    .from("vocab")
    .select("id, level, category, pinyin")
    .in("level", levels)
    .in("category", cats);
  if (error) throw error;
  const rows: { id: string; level: string; category: string; pinyin: string }[] = data ?? [];
  rows.sort((a, b) => a.pinyin.localeCompare(b.pinyin) || a.id.localeCompare(b.id));
  const out = new Map<string, string[]>();
  for (const l of path.lessons) {
    const pool = rows.filter((r) => r.level === l.level && l.categories.includes(r.category));
    out.set(l.key, pool.slice(l.skip ?? 0, (l.skip ?? 0) + l.take).map((r) => r.id));
  }
  return out;
}

/**
 * Add a path's lessons to a class, after the lessons it already has. Lessons
 * from this path that the class already has are left as they are, so a
 * teacher's changes are never overwritten. Returns how many were added.
 */
export async function addPathToClass(classroomId: string, path: ClassPath, lang: "en" | "ar"): Promise<number> {
  const existing: Lesson[] = await listLessons(classroomId);
  const have = new Set(existing.map((l) => l.sourceKey).filter(Boolean));
  const todo = path.lessons.filter((l) => !have.has(l.key));
  if (todo.length === 0) return 0;
  const words = await wordsFor(path);
  let pos = existing.reduce((m, l) => Math.max(m, l.position ?? -1), existing.length - 1) + 1;
  for (const l of todo) {
    await saveLesson({
      classroomId,
      title: l.title[lang],
      vocabIds: words.get(l.key) ?? [],
      grammarIds: l.grammarIds,
      position: pos++,
      sourceKey: l.key,
    });
  }
  return todo.length;
}
