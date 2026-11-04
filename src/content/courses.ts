// The courses that use the lesson player, and where each one lives.
import type { Lesson, Unit } from "./foundation1/types";
import { UNIT1 } from "./foundation1/unit1";
import { MOVE_UNIT1 } from "./onTheMove/unit1";
import { MOVE_MORE_UNITS } from "./onTheMove/units";

export interface Course {
  id: "foundation1" | "move";
  units: Unit[];
  /** Lessons live at `${base}/${lesson.key}` */
  base: string;
  /** i18n key for the course name shown above the unit title */
  labelKey: string;
}

export const FOUNDATION1: Course = { id: "foundation1", units: [UNIT1], base: "/learn", labelKey: "learn.f1" };
export const ON_THE_MOVE: Course = { id: "move", units: [MOVE_UNIT1, ...MOVE_MORE_UNITS], base: "/move", labelKey: "move.label" };

const COURSES = [FOUNDATION1, ON_THE_MOVE];

/** Where a unit's progress is kept on this device. Foundation 1 keeps its original key. */
export const storeFor = (unit: Unit) => (unit.key.startsWith("f1.") ? "foundation1" : `move.${unit.key}`);

/** The page that lists a unit's lessons */
export const unitPath = (course: Course, unit: Unit) => (course.id === "foundation1" ? "/learn" : `/move/unit/${unit.key}`);

export function findLesson(key: string): { course: Course; unit: Unit; lesson: Lesson } | null {
  for (const course of COURSES) {
    for (const unit of course.units) {
      const lesson = unit.lessons.find((l) => l.key === key);
      if (lesson) return { course, unit, lesson };
    }
  }
  return null;
}

export const findUnit = (course: Course, key: string) => course.units.find((u) => u.key === key) ?? null;
