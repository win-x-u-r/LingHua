import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Lantern from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { MY_CLASSROOM_ZH } from "@/lib/learningPaths";
import KidsLoginCard from "./KidsLoginCard";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { deleteLesson, listLessons, LessonsNotSetUp, saveOrder, type Lesson } from "@/lib/lessons";
import { pathOfKey } from "@/lib/classPaths";
import ClassSetupFields, { AgePicker, LevelPicker } from "@/components/ClassSetupFields";
import { LEVEL_ZH, type AgeGroup, type ClassLevel } from "@/lib/classSetup";
import PathIcon from "@/components/PathIcon";
import { WEEKLY_GOAL_DAYS, type ToneScore } from "./StudentDashboard";

export interface ClassStudent {
  id: string;
  name: string;
  xp: number;
  avgScore: number | null;
  week: boolean[]; // last 7 days, oldest first
  weakestTone: 1 | 2 | 3 | 4 | null;
  lastActive: string | null; // ISO date
  /** Logs in with the class code and secret pictures (Little Lanterns) */
  kid?: boolean;
  /** Forgot their pictures and asked the teacher for new ones */
  needsHelp?: boolean;
}

export interface ClassWord {
  hanzi: string;
  pinyin: string;
  arabic: string;
  avgScore: number;
  attempts: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  code: string;
  ageGroup: AgeGroup | null;
  level: ClassLevel | null;
}

export interface TeacherDashboardData {
  classId: string;
  className: string;
  code: string;
  ageGroup: AgeGroup | null;
  level: ClassLevel | null;
  /** All of this teacher's classes, for the switcher */
  classes: ClassSummary[];
  students: ClassStudent[];
  tones: ToneScore[];
  hardWords: ClassWord[];
  weeklyScores: { week: string; score: number }[];
}

const TONE_MARK: Record<number, string> = { 1: "ā", 2: "á", 3: "ǎ", 4: "à" };

/* ──────────────────────────────────────────
   No class yet: create one
   ────────────────────────────────────────── */
export const CreateClass = ({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, setup: { ageGroup: AgeGroup; level: ClassLevel }) => Promise<void>;
  /** Set when the teacher already has a class: adding another one */
  onCancel?: () => void;
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [level, setLevel] = useState<ClassLevel | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="p-6 md:p-8 flex flex-col items-center text-center gap-4 overflow-hidden">
        <div className="lantern-glow [--glow-size:220%]">
          <Lantern mood="idle" className="w-24 h-24" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("class.setup")}</h1>
          <p lang="zh" className="font-zh text-muted-foreground">设置你的课堂</p>
        </div>
        {!onCancel && <p className="text-muted-foreground">{t("teacher.welcome.body")}</p>}
        <form
          className="w-full flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !ageGroup || !level) return setMissing(true);
            setBusy(true);
            await onCreate(name.trim(), { ageGroup, level });
            setBusy(false);
          }}
        >
          <ClassSetupFields
            name={name}
            onName={(v) => { setName(v); setMissing(false); }}
            ageGroup={ageGroup}
            onAge={(a) => { setAgeGroup(a); setMissing(false); }}
            level={level}
            onLevel={(l) => { setLevel(l); setMissing(false); }}
          />
          {missing && <p className="text-sm font-bold text-destructive" role="alert">{t("class.pick.required")}</p>}
          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={busy}>
                {t("class.cancel")}
              </Button>
            )}
            <Button type="submit" className="flex-1" size="lg" disabled={busy}>
              {t("teacher.welcome.cta")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

/** "Ages 7 to 9 · Beginners 初级", with Change to edit both in place */
const ClassFacts = ({
  data,
  onUpdate,
}: {
  data: TeacherDashboardData;
  onUpdate: (setup: { ageGroup: AgeGroup | null; level: ClassLevel | null }) => Promise<boolean>;
}) => {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(data.ageGroup);
  const [level, setLevel] = useState<ClassLevel | null>(data.level);
  const [busy, setBusy] = useState(false);

  if (editing) {
    return (
      <div className="flex flex-col gap-4 rounded-[12px] border-2 border-border bg-muted/40 p-4">
        <AgePicker value={ageGroup} onChange={setAgeGroup} />
        <LevelPicker value={level} onChange={setLevel} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={busy}>{t("class.cancel")}</Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (await onUpdate({ ageGroup, level })) setEditing(false);
              setBusy(false);
            }}
          >
            {t("class.save")}
          </Button>
        </div>
      </div>
    );
  }

  const parts = [
    data.ageGroup &&
      (data.ageGroup === "adults" || data.ageGroup === "mixed"
        ? t(`class.age.${data.ageGroup}`)
        : t("class.ages").replace("{age}", t(`class.age.${data.ageGroup}`))),
    data.level && t(`class.level.${data.level}`),
  ].filter(Boolean);
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {parts.length > 0 && (
        <span className="font-bold">
          {parts.join(" · ")}
          {data.level && <span lang="zh" className="font-zh font-normal text-muted-foreground"> {LEVEL_ZH[data.level]}</span>}
        </span>
      )}
      <button
        type="button"
        className="font-bold text-primary underline underline-offset-4"
        onClick={() => {
          setAgeGroup(data.ageGroup);
          setLevel(data.level);
          setEditing(true);
        }}
      >
        {parts.length ? t("class.change") : t("class.level")}
      </button>
    </p>
  );
};

/* ──────────────────────────────────────────
   Class view
   ────────────────────────────────────────── */
const TeacherDashboard = ({
  data,
  onCopy,
  onSwitch,
  onNewClass,
  onUpdate,
}: {
  data: TeacherDashboardData;
  onCopy: () => void;
  onSwitch: (classId: string) => void;
  onNewClass: () => void;
  onUpdate: (setup: { ageGroup: AgeGroup | null; level: ClassLevel | null }) => Promise<boolean>;
}) => {
  // Kids who forgot their pictures; taken off the list once the teacher helps
  const [helpedIds, setHelpedIds] = useState<string[]>([]);
  const [helpFor, setHelpFor] = useState<{ id: string; n: number } | null>(null);
  const kidsList = data.students
    .filter((s) => s.kid)
    .map((s) => ({ ...s, needsHelp: s.needsHelp && !helpedIds.includes(s.id) }));
  const needHelp = kidsList.filter((s) => s.needsHelp);
  const { t, language } = useLanguage();
  const total = data.students.length;
  const onTrack = data.students.filter((s) => s.week.filter(Boolean).length >= WEEKLY_GOAL_DAYS).length;
  const activeThisWeek = data.students.filter((s) => s.week.some(Boolean)).length;
  const quiet = data.students.filter((s) => !s.week.some(Boolean));
  const scored = data.students.filter((s) => s.avgScore != null);
  const classAvg = scored.length ? Math.round(scored.reduce((n, s) => n + (s.avgScore ?? 0), 0) / scored.length) : null;

  const dateFmt = new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
  const sorted = [...data.students].sort((a, b) => b.week.filter(Boolean).length - a.week.filter(Boolean).length || b.xp - a.xp);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col gap-6">
      {/* Several classes: pick one, or add another */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t("class.yours")}>
        {data.classes.length > 1 &&
          data.classes.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === data.classId}
              onClick={() => c.id !== data.classId && onSwitch(c.id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${
                c.id === data.classId ? "border-stroke bg-foreground text-background" : "border-border bg-card"
              }`}
            >
              {c.name}
            </button>
          ))}
        <Button variant="outline" size="sm" className="ms-auto" onClick={onNewClass}>
          <span aria-hidden="true">+</span>
          <span>{t("class.new")}</span>
        </Button>
      </div>

      {/* Class header: name, the code to share, and this week in one sentence */}
      <Card className="p-6 md:p-8 overflow-hidden grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("classroom.mine")} <span lang="zh" className="font-zh normal-case tracking-normal">· {MY_CLASSROOM_ZH}</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-bold">{data.className || t("dashboard.teacher.title")}</h1>
          <ClassFacts key={data.classId} data={data} onUpdate={onUpdate} />
          <p className="text-muted-foreground">
            {total === 0
              ? t("teach.week.empty")
              : t("teach.week.summary")
                  .replace("{active}", String(activeThisWeek))
                  .replace("{total}", String(total))
                  .replace("{track}", String(onTrack))}
          </p>
          {classAvg != null && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-1">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">{t("dashboard.avg_score")}</dt>
                <dd className="font-bold tabular-nums">{classAvg}%</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">{t("teach.students")}</dt>
                <dd className="font-bold tabular-nums">{total}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* The code, big enough to read from the back of a classroom */}
        <div className="flex flex-col items-center gap-2 rounded-[14px] border-2 border-stroke bg-secondary px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">{t("dashboard.classroom_code")}</span>
          <span className="flex gap-1.5" dir="ltr">
            {data.code.split("").map((c, i) => (
              <span key={i} className="w-10 h-12 rounded-[10px] border-2 border-stroke bg-card grid place-items-center text-2xl font-bold">
                {c}
              </span>
            ))}
          </span>
          <Button variant="outline" size="sm" onClick={onCopy}>{t("dashboard.copy")}</Button>
          <span className="text-xs text-secondary-foreground text-center max-w-[16rem]">{t("teach.code.hint")}</span>
        </div>
      </Card>

      {/* Teachers decide what to teach: the class's lessons */}
      <LessonsSection classId={data.classId} />

      {total === 0 ? (
        <Card className="p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
          <Lantern mood="sleepy" className="w-28 h-28 shrink-0" />
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">{t("dashboard.no_students")}</h2>
            <p className="text-muted-foreground max-w-md">{t("teach.empty.desc")}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Kids locked out: the one thing in Little Lanterns log-in that needs the teacher */}
          {needHelp.length > 0 && (
            <Card className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              <PathIcon path="little_lanterns" className="w-10 h-10 shrink-0" />
              <p className="flex-1 min-w-[12rem]">
                <span className="font-bold">{t("teach.kids.help")}</span>{" "}
                {needHelp.map((s) => s.name.split(" ")[0]).join(language === "ar" ? "، " : ", ")}
              </p>
              <Button size="sm" onClick={() => setHelpFor((h) => ({ id: needHelp[0].id, n: (h?.n ?? 0) + 1 }))}>
                {t("teach.kids.help.cta")}
              </Button>
            </Card>
          )}

          {/* Who needs a nudge */}
          {quiet.length > 0 && (
            <Card className="p-5 flex items-center gap-4 bg-accent">
              <Seal char="催" size="md" />
              <p className="text-accent-foreground">
                <span className="font-bold">{t("teach.quiet.title").replace("{n}", String(quiet.length))}</span>{" "}
                {quiet.slice(0, 4).map((s) => s.name.split(" ")[0]).join(language === "ar" ? "، " : ", ")}
                {quiet.length > 4 ? ` +${quiet.length - 4}` : ""}
              </p>
            </Card>
          )}

          {/* Roster */}
          <Section seal="生" title={t("teach.roster.title")} note={t("teach.roster.note")}>
            {/* Phones: one row per student, details on a second line */}
            <ul className="sm:hidden flex flex-col divide-y-2 divide-border">
              {sorted.map((s) => {
                const days = s.week.filter(Boolean).length;
                return (
                  <li key={s.id} className="py-3 flex flex-col gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="w-8 h-8 shrink-0 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground grid place-items-center font-bold">
                        {s.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="font-bold leading-tight flex-1 min-w-0 truncate">{s.name}</span>
                      <span className={cn("font-bold tabular-nums", s.avgScore != null && s.avgScore < 60 && "text-primary")}>
                        {s.avgScore != null ? `${s.avgScore}%` : "–"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 ps-[42px]" dir="ltr">
                      {s.week.map((on, i) => (
                        <span key={i} className={cn("w-3 h-3 rounded-full border-2", on ? "bg-primary border-primary" : "border-border")} />
                      ))}
                      {days >= WEEKLY_GOAL_DAYS && <Seal char="好" size="sm" tone="gold" className="ms-1 w-5 h-5 text-xs" />}
                    </span>
                    <span className="ps-[42px] text-xs text-muted-foreground">
                      {s.weakestTone ? `${t("teach.col.tone")}: ${t("teach.tone.short").replace("{n}", String(s.weakestTone))} · ` : ""}
                      {s.lastActive ? dateFmt.format(new Date(s.lastActive)) : t("teach.never")}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="hidden sm:block overflow-x-auto -mx-1">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-start text-muted-foreground border-b-2 border-border">
                    <th className="text-start font-medium py-2 px-1">{t("teach.col.student")}</th>
                    <th className="text-start font-medium py-2 px-1">{t("teach.col.week")}</th>
                    <th className="text-end font-medium py-2 px-1">{t("teach.col.score")}</th>
                    <th className="text-center font-medium py-2 px-1">{t("teach.col.tone")}</th>
                    <th className="text-end font-medium py-2 px-1">{t("teach.col.last")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const days = s.week.filter(Boolean).length;
                    return (
                      <tr key={s.id} className="border-b-2 border-border last:border-b-0">
                        <td className="py-3 px-1">
                          <span className="flex items-center gap-2.5">
                            <span className="w-8 h-8 shrink-0 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground grid place-items-center font-bold">
                              {s.name.trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="flex flex-col">
                              <span className="font-bold leading-tight">{s.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{s.xp} XP</span>
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-1">
                          <span className="flex items-center gap-1" dir="ltr" aria-label={`${days} / 7`}>
                            {s.week.map((on, i) => (
                              <span key={i} className={cn("w-3.5 h-3.5 rounded-full border-2", on ? "bg-primary border-primary" : "border-border")} />
                            ))}
                            {days >= WEEKLY_GOAL_DAYS && <Seal char="好" size="sm" tone="gold" className="ms-1.5 w-6 h-6 text-sm" />}
                          </span>
                        </td>
                        <td className={cn("py-3 px-1 text-end font-bold tabular-nums", s.avgScore != null && s.avgScore < 60 && "text-primary")}>
                          {s.avgScore != null ? `${s.avgScore}%` : "–"}
                        </td>
                        <td className="py-3 px-1 text-center">
                          {s.weakestTone ? (
                            <span className="font-pinyin font-bold" title={t(`dash2.tone${s.weakestTone}`)}>
                              {t("teach.tone.short").replace("{n}", String(s.weakestTone))} <span className="text-muted-foreground font-normal">m{TONE_MARK[s.weakestTone]}</span>
                            </span>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="py-3 px-1 text-end text-muted-foreground">
                          {s.lastActive ? dateFmt.format(new Date(s.lastActive)) : t("teach.never")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Class tone accuracy */}
            <Section seal="声" title={t("teach.tones.title")} note={t("teach.tones.note")}>
              <ul className="flex flex-col gap-3">
                {data.tones.map((tone) => (
                  <li key={tone.tone} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold">
                        {t(`dash2.tone${tone.tone}`)} <span className="font-pinyin font-normal text-muted-foreground" dir="ltr">m{TONE_MARK[tone.tone]}</span>
                      </span>
                      <div className="h-3 rounded-full border-2 border-stroke bg-muted overflow-hidden" dir="ltr">
                        <div
                          className={cn("h-full", tone.score != null && tone.score >= 80 ? "bg-success" : "bg-primary")}
                          style={{ width: `${tone.score ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-end font-bold tabular-nums">{tone.score != null ? `${tone.score}%` : "–"}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Hardest words for the class */}
            <Section seal="难" title={t("dashboard.most_difficult")} note={t("teach.words.note")}>
              {data.hardWords.length > 0 ? (
                <ul className="flex flex-col divide-y-2 divide-border">
                  {data.hardWords.map((w) => (
                    <li key={w.hanzi} className="flex items-center gap-4 py-2">
                      <span lang="zh" className="font-zh font-bold text-2xl min-w-14 whitespace-nowrap">{w.hanzi}</span>
                      <span className="flex flex-col min-w-0">
                        <span className="font-pinyin font-bold text-primary" dir="ltr">{w.pinyin}</span>
                        <span lang="ar" dir="rtl" className="text-sm text-muted-foreground truncate">{w.arabic}</span>
                      </span>
                      <span className="ms-auto text-end">
                        <span className="block font-bold tabular-nums">{w.avgScore}%</span>
                        <span className="block text-xs text-muted-foreground">
                          {w.attempts} {t("dashboard.attempts")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t("dashboard.no_data")}</p>
              )}
            </Section>
          </div>

          <Section seal="进" title={t("dashboard.accuracy_over_time")}>
            {data.weeklyScores.length > 0 ? (
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.weeklyScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "2px solid hsl(var(--stroke))",
                        borderRadius: 10,
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t("dashboard.no_data")}</p>
            )}
          </Section>
        </>
      )}
      <KidsLoginCard
        code={data.code}
        kids={kidsList}
        focus={helpFor}
        onReset={(id) => setHelpedIds((ids) => [...ids, id])}
      />
    </div>
  );
};

/** A small drawn chevron for the lesson order buttons */
const Chevron = ({ up }: { up?: boolean }) => (
  <svg viewBox="0 0 24 24" className={cn("w-4 h-4", up && "rotate-180")} aria-hidden="true">
    <path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * My Classroom: the lessons this class practises, in the teacher's order.
 * Teachers can follow a LingHua path, adapt its lessons (edit, reorder,
 * delete), or add their own, and switch between these at any time.
 */
const LessonsSection = ({ classId }: { classId: string }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);

  useEffect(() => {
    setLessons(null);
    listLessons(classId)
      .then(setLessons)
      .catch((e) => {
        setNotSetUp(e instanceof LessonsNotSetUp);
        setLessons([]);
      });
  }, [classId]);

  const remove = async (l: Lesson) => {
    if (!window.confirm(t("lesson.delete.confirm"))) return;
    try {
      await deleteLesson(l.id);
      setLessons((ls) => (ls ?? []).filter((x) => x.id !== l.id));
    } catch {
      toast({ title: t("lesson.failed"), variant: "destructive" });
    }
  };

  const move = async (i: number, by: -1 | 1) => {
    const list = [...(lessons ?? [])];
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const before = lessons;
    setLessons(list.map((l, k) => ({ ...l, position: k })));
    try {
      if (!(await saveOrder(list.map((l) => l.id)))) throw new Error("order");
    } catch {
      setLessons(before);
      toast({ title: t("lesson.failed"), variant: "destructive" });
    }
  };

  return (
    <Section seal="课" title={t("lesson.title")} note={t("lesson.note")}>
      <div className="flex flex-col gap-3">
        {notSetUp ? (
          <p className="text-sm text-muted-foreground">{t("lesson.not_set_up")}</p>
        ) : lessons && lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("lesson.none")}</p>
        ) : (
          <ul className="flex flex-col divide-y-2 divide-border">
            {(lessons ?? []).map((l, i, all) => {
              const path = pathOfKey(l.sourceKey);
              return (
              <li key={l.id} className="py-3 flex items-center gap-3">
                <span className="flex flex-col gap-1 shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("lesson.up")} title={t("lesson.up")} className="w-7 h-6 rounded-md border-2 border-stroke bg-card grid place-items-center disabled:opacity-30">
                    <Chevron up />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === all.length - 1} aria-label={t("lesson.down")} title={t("lesson.down")} className="w-7 h-6 rounded-md border-2 border-stroke bg-card grid place-items-center disabled:opacity-30">
                    <Chevron />
                  </button>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold">{l.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("lesson.count").replace("{w}", String(l.vocabIds.length)).replace("{g}", String(l.grammarIds.length))}
                  </span>
                  {path && (
                    <span className="mt-1 inline-block rounded-full border-2 border-border px-2 text-xs font-bold text-muted-foreground">
                      {t("lesson.from_path").replace("{path}", path.title[language === "ar" ? "ar" : "en"])}
                    </span>
                  )}
                </span>
                <span className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link to={`/lessons/${l.id}`}>
                    <Button variant="outline" size="sm">{t("lesson.edit")}</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => remove(l)}>{t("lesson.delete")}</Button>
                </span>
              </li>
              );
            })}
          </ul>
        )}
        {!notSetUp && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/lessons/new?class=${classId}`}>
              <Button size="sm">
                <span aria-hidden="true">+</span>
                <span>{t("lesson.new")}</span>
              </Button>
            </Link>
            <Link to={`/lessons/paths?class=${classId}`}>
              <Button size="sm" variant="outline">{t("paths.add")}</Button>
            </Link>
          </div>
        )}
      </div>
    </Section>
  );
};

const Section = ({ seal, title, note, children }: { seal: string; title: string; note?: string; children: React.ReactNode }) => (
  <Card className="p-5 md:p-6 overflow-hidden flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <Seal char={seal} size="sm" />
        {title}
      </h2>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
    {children}
  </Card>
);

export default TeacherDashboard;
