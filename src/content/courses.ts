// The courses that use the lesson player, and where each one lives.
import type { Lesson, Unit } from "./foundation1/types";
import { UNIT1 } from "./foundation1/unit1";
import { MOVE_UNIT1 } from "./onTheMove/unit1";

export interface Course {
  id: "foundation1" | "move";
  unit: Unit;
  /** The unit page; lessons live at `${base}/${lesson.key}` */
  base: string;
  /** Where progress is kept on this device */
  store: string;
  /** i18n key for the course name shown above the unit title */
  labelKey: string;
  /** Visitors can try it without an account */
  open?: boolean;
}

export const FOUNDATION1: Course = { id: "foundation1", unit: UNIT1, base: "/learn", store: "foundation1", labelKey: "learn.f1" };
export const ON_THE_MOVE: Course = { id: "move", unit: MOVE_UNIT1, base: "/move", store: "move", labelKey: "move.label", open: true };

const COURSES = [FOUNDATION1, ON_THE_MOVE];

export function findLesson(key: string): { course: Course; lesson: Lesson } | null {
  for (const course of COURSES) {
    const lesson = course.unit.lessons.find((l) => l.key === key);
    if (lesson) return { course, lesson };
  }
  return null;
}
