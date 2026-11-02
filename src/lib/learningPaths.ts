import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/contexts/AuthContext";

/*
 * LingHua's learning paths. A path is how a learner moves through the shared
 * content; the account role (student, teacher, independent) stays separate.
 *
 * - Sign-up starts with the path. Teachers pick Teacher's Corner and then a
 *   path for their class (classrooms.learning_path).
 * - Students who join with a class code follow their class's path.
 * - Everyone else keeps the path they picked. It stays fixed; another path
 *   means another account. My Mandarin Journey's freedom is inside the path:
 *   any card set or grammar point, in any order.
 *
 * A learner's own pick lives in the sign-up details (user_metadata).
 */
export type LearningPath = "little_lanterns" | "hsk" | "my_mandarin" | "on_the_move";

export const LEARNING_PATHS: LearningPath[] = ["hsk", "my_mandarin", "on_the_move", "little_lanterns"];

/** Chinese names: localisation labels, shown alongside the English or Arabic name */
export const PATH_ZH: Record<LearningPath, string> = {
  little_lanterns: "小灯笼",
  hsk: "HSK备考之路",
  my_mandarin: "我的中文之旅",
  on_the_move: "实用中文",
};

export const TEACHERS_CORNER_ZH = "教师天地";
export const MY_CLASSROOM_ZH = "我的课堂";

export const DEFAULT_PATH: LearningPath = "my_mandarin";

export function isLearningPath(v: unknown): v is LearningPath {
  return typeof v === "string" && (LEARNING_PATHS as string[]).includes(v);
}

/** The path this account follows, or null for teachers. classPath: the path of the learner's class. */
export function pathFor(
  user: User | null,
  role: UserRole | undefined,
  classroomId?: string | null,
  classPath?: LearningPath | null,
): LearningPath | null {
  if (!user || role === "teacher") return null;
  if (role === "student" && classroomId) return classPath ?? "little_lanterns";
  const chosen = user.user_metadata?.learning_path;
  return isLearningPath(chosen) ? chosen : DEFAULT_PATH;
}
