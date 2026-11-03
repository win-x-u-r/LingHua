// Teacher's Corner lessons: teachers decide what to teach, LingHua helps
// students learn it. A lesson is a set of vocabulary words and grammar points
// for one class (table class_lessons, 20261102_class_lessons.sql).
import { supabase } from "@/integrations/supabase/client";

export interface Lesson {
  id: string;
  classroomId: string;
  title: string;
  vocabIds: string[];
  grammarIds: string[];
  /** Lesson order in the class (lower first); null before the path migration */
  position: number | null;
  /** The LingHua path lesson this was copied from, or null for the teacher's own */
  sourceKey: string | null;
}

/** The table doesn't exist yet: the migration hasn't been run */
export class LessonsNotSetUp extends Error {}

const missingTable = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /class_lessons/.test(error.message ?? ""));

const fromRow = (r: any): Lesson => ({
  id: r.id,
  classroomId: r.classroom_id,
  title: r.title,
  vocabIds: r.vocab_ids ?? [],
  grammarIds: r.grammar_ids ?? [],
  position: r.position ?? null,
  sourceKey: r.source_key ?? null,
});

/** The position/source_key columns aren't there yet (20261103_class_lesson_paths.sql not run) */
const missingPathColumns = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42703" || error.code === "PGRST204" || /position|source_key/.test(error.message ?? ""));

/** Class order: the teacher's order first, then oldest first */
const byOrder = (a: Lesson, b: Lesson) =>
  (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);

export async function listLessons(classroomId: string): Promise<Lesson[]> {
  const { data, error } = await (supabase as any)
    .from("class_lessons")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: true });
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return (data ?? []).map(fromRow).sort(byOrder);
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const { data, error } = await (supabase as any).from("class_lessons").select("*").eq("id", id).maybeSingle();
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function saveLesson(
  lesson: Omit<Lesson, "id" | "position" | "sourceKey"> & { id?: string; position?: number | null; sourceKey?: string | null },
): Promise<string> {
  const row: Record<string, unknown> = {
    classroom_id: lesson.classroomId,
    title: lesson.title,
    vocab_ids: lesson.vocabIds,
    grammar_ids: lesson.grammarIds,
    updated_at: new Date().toISOString(),
  };
  if (lesson.position !== undefined) row.position = lesson.position;
  if (lesson.sourceKey !== undefined) row.source_key = lesson.sourceKey;
  const send = (r: Record<string, unknown>) =>
    lesson.id
      ? (supabase as any).from("class_lessons").update(r).eq("id", lesson.id).select("id").single()
      : (supabase as any).from("class_lessons").insert(r).select("id").single();
  let { data, error } = await send(row);
  if (missingPathColumns(error)) {
    // Older database: save the lesson without its order and origin
    const { position: _p, source_key: _s, ...plain } = row;
    ({ data, error } = await send(plain));
  }
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return data.id;
}

/** Save a new lesson order for the class. Returns false on an older database without the column. */
export async function saveOrder(ids: string[]): Promise<boolean> {
  const results = await Promise.all(
    ids.map((id, i) => (supabase as any).from("class_lessons").update({ position: i }).eq("id", id)),
  );
  const failed = results.find((r: any) => r.error);
  if (failed && missingPathColumns(failed.error)) return false;
  if (failed) throw failed.error;
  return true;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await (supabase as any).from("class_lessons").delete().eq("id", id);
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
}
