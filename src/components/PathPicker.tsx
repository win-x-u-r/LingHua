import PathIcon from "@/components/PathIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEARNING_PATHS, PATH_ZH, type LearningPath } from "@/lib/learningPaths";

/** The four learning paths as a list of choices: icon, name, Chinese name, one short line. */
const PathPicker = ({
  value,
  onChange,
  labelledBy,
}: {
  value: LearningPath;
  onChange: (path: LearningPath) => void;
  labelledBy?: string;
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={labelledBy}>
      {LEARNING_PATHS.map((p) => {
        const on = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p)}
            className={`flex items-center gap-3 rounded-[12px] border-2 p-3 text-start ${
              on ? "border-stroke bg-accent shadow-[3px_3px_0_hsl(var(--stamp))]" : "border-border bg-card"
            }`}
          >
            <PathIcon path={p} className="w-12 h-12" />
            <span className="flex-1 min-w-0">
              <span className="block font-bold leading-tight">{t(`path.${p}`)}</span>
              <span lang="zh" className="block font-zh text-sm text-muted-foreground">{PATH_ZH[p]}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t(`path.${p}.desc`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PathPicker;
