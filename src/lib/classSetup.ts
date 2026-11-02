// Teacher's Corner class set-up: who is in the class and where it starts.
// The level only sets the starting difficulty of class activities; teachers can
// change it any time, and it never locks a student to a level. School grade is
// deliberately not used for this: a Grade 6 child can be a complete beginner.

export type AgeGroup = "4-6" | "7-9" | "10-12" | "13-15" | "16-18" | "adults";
export const AGE_GROUPS: AgeGroup[] = ["4-6", "7-9", "10-12", "13-15", "16-18", "adults"];

export type ClassLevel = "zero" | "beginner" | "intermediate" | "advanced" | "mixed";
export const CLASS_LEVELS: ClassLevel[] = ["zero", "beginner", "intermediate", "advanced", "mixed"];

export const LEVEL_ZH: Record<ClassLevel, string> = {
  zero: "零基础",
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
  mixed: "混合水平",
};

export interface ClassSetup {
  name: string;
  ageGroup: AgeGroup | null;
  level: ClassLevel | null;
}

export const isAgeGroup = (v: unknown): v is AgeGroup => typeof v === "string" && (AGE_GROUPS as string[]).includes(v);
export const isClassLevel = (v: unknown): v is ClassLevel => typeof v === "string" && (CLASS_LEVELS as string[]).includes(v);
