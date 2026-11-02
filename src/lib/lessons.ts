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
});

export async function listLessons(classroomId: string): Promise<Lesson[]> {
  const { data, error } = await (supabase as any)
    .from("class_lessons")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: true });
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const { data, error } = await (supabase as any).from("class_lessons").select("*").eq("id", id).maybeSingle();
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function saveLesson(lesson: Omit<Lesson, "id"> & { id?: string }): Promise<string> {
  const row = {
    classroom_id: lesson.classroomId,
    title: lesson.title,
    vocab_ids: lesson.vocabIds,
    grammar_ids: lesson.grammarIds,
    updated_at: new Date().toISOString(),
  };
  const q = lesson.id
    ? (supabase as any).from("class_lessons").update(row).eq("id", lesson.id).select("id").single()
    : (supabase as any).from("class_lessons").insert(row).select("id").single();
  const { data, error } = await q;
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
  return data.id;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await (supabase as any).from("class_lessons").delete().eq("id", id);
  if (missingTable(error)) throw new LessonsNotSetUp();
  if (error) throw error;
}
