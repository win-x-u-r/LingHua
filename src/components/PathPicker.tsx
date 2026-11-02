import PathIcon from "@/components/PathIcon";
import RoleIcon from "@/components/RoleIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEARNING_PATHS, PATH_ZH, TEACHERS_CORNER_ZH, type LearningPath } from "@/lib/learningPaths";

/** A learning path, or Teacher's Corner for teachers (sign-up only) */
export type PathChoice = LearningPath | "teacher";

/** The learning paths as a list of choices: icon, name, Chinese name, one short line. */
const PathPicker = <T extends PathChoice = LearningPath>({
  value,
  onChange,
  labelledBy,
  withTeacher = false,
  paths = LEARNING_PATHS,
}: {
  value: T;
  onChange: (path: T) => void;
  labelledBy?: string;
  /** Adds Teacher's Corner at the end */
  withTeacher?: boolean;
  paths?: LearningPath[];
}) => {
  const { t } = useLanguage();
  const choices: PathChoice[] = withTeacher ? [...paths, "teacher"] : paths;
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={labelledBy}>
      {choices.map((p) => {
        const on = value === p;
        const teacher = p === "teacher";
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p as T)}
            className={`flex items-center gap-3 rounded-[12px] border-2 p-3 text-start ${
              on ? "border-stroke bg-accent shadow-[3px_3px_0_hsl(var(--stamp))]" : "border-border bg-card"
            }`}
          >
            {teacher ? <RoleIcon role="teacher" className="w-12 h-12" /> : <PathIcon path={p} className="w-12 h-12" />}
            <span className="flex-1 min-w-0">
              <span className="block font-bold leading-tight">{t(teacher ? "corner.title" : `path.${p}`)}</span>
              <span lang="zh" className="block font-zh text-sm text-muted-foreground rtl:text-right">{teacher ? TEACHERS_CORNER_ZH : PATH_ZH[p]}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t(teacher ? "corner.desc" : `path.${p}.desc`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PathPicker;
