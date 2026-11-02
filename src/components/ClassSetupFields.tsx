import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { AGE_GROUPS, CLASS_LEVELS, LEVEL_ZH, type AgeGroup, type ClassLevel } from "@/lib/classSetup";

const chip = (on: boolean) =>
  `rounded-[10px] border-2 px-3 py-2 text-sm font-bold ${
    on ? "border-stroke bg-accent shadow-[2px_2px_0_hsl(var(--stamp))]" : "border-border bg-card text-muted-foreground"
  }`;

/** Age group: six chips */
export const AgePicker = ({ value, onChange }: { value: AgeGroup | null; onChange: (a: AgeGroup) => void }) => {
  const { t } = useLanguage();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium mb-1.5">{t("class.age")}</legend>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup">
        {AGE_GROUPS.map((a) => (
          <button key={a} type="button" role="radio" aria-checked={value === a} onClick={() => onChange(a)} className={chip(value === a)}>
            {t(`class.age.${a}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

/** "How familiar are your students with Mandarin?": five levels with a Chinese label and one line */
export const LevelPicker = ({ value, onChange }: { value: ClassLevel | null; onChange: (l: ClassLevel) => void }) => {
  const { t } = useLanguage();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{t("class.level")}</legend>
      <span className="text-xs text-muted-foreground mb-1.5">{t("class.level.hint")}</span>
      <div className="flex flex-col gap-2" role="radiogroup">
        {CLASS_LEVELS.map((l) => {
          const on = value === l;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(l)}
              className={`rounded-[12px] border-2 px-3 py-2.5 text-start ${
                on ? "border-stroke bg-accent shadow-[3px_3px_0_hsl(var(--stamp))]" : "border-border bg-card"
              }`}
            >
              <span className="block font-bold leading-tight">
                {t(`class.level.${l}`)} <span lang="zh" className="font-zh font-normal text-muted-foreground">· {LEVEL_ZH[l]}</span>
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t(`class.level.${l}.desc`)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

/** Class name, age group and level: the whole "Set up your classroom" form */
const ClassSetupFields = ({
  name,
  onName,
  ageGroup,
  onAge,
  level,
  onLevel,
  nameProps,
}: {
  name: string;
  onName: (v: string) => void;
  ageGroup: AgeGroup | null;
  onAge: (a: AgeGroup) => void;
  level: ClassLevel | null;
  onLevel: (l: ClassLevel) => void;
  nameProps?: Partial<React.ComponentProps<typeof Input>>;
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-5 text-start">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="classname">{t("auth.classname")}</Label>
        <Input
          id="classname"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={t("class.name.placeholder")}
          required
          {...nameProps}
        />
      </div>
      <AgePicker value={ageGroup} onChange={onAge} />
      <LevelPicker value={level} onChange={onLevel} />
    </div>
  );
};

export default ClassSetupFields;
