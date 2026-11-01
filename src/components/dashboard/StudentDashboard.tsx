import { useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export const WEEKLY_GOAL_DAYS = 5;

export interface WeekDay {
  date: string; // YYYY-MM-DD
  practiced: boolean;
  isToday: boolean;
}

export interface ToneScore {
  tone: 1 | 2 | 3 | 4;
  score: number | null; // average, null when no words with this tone were practised
  words: number;
}

export interface MissedWord {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
  best: number;
}

export interface LevelStep {
  level: string;
  mastered: number;
  total: number;
}

export interface Badge {
  seal: string;
  key: string; // i18n key prefix: <key>.title and <key>.hint
  earned: boolean;
}

export interface StudentDashboardData {
  name: string;
  totalXp: number;
  streak: number;
  wordsLearned: number;
  week: WeekDay[];
  tones: ToneScore[];
  missed: MissedWord[];
  levels: LevelStep[];
  badges: Badge[];
  dailyScores: { date: string; avgScore: number }[];
  wordsToReview: number;
}

/* Tone contour drawn the way teachers sketch it: high flat, rising, dip, falling */
const TONE_PATH: Record<number, string> = {
  1: "M4 6 L36 6",
  2: "M4 22 L36 4",
  3: "M4 12 L18 24 L36 6",
  4: "M4 4 L36 24",
};
const TONE_MARK: Record<number, string> = { 1: "mā", 2: "má", 3: "mǎ", 4: "mà" };

const StudentDashboard = ({ data }: { data: StudentDashboardData }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const daysThisWeek = data.week.filter((d) => d.practiced).length;
  const goalMet = daysThisWeek >= WEEKLY_GOAL_DAYS;
  const hasPractised = data.dailyScores.length > 0 || data.wordsLearned > 0;
  const mood: LanternMood = goalMet ? "celebrate" : daysThisWeek > 0 ? "happy" : hasPractised ? "idle" : "sleepy";

  const weekdayFmt = new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", { weekday: "narrow" });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col gap-6">
      {/* This week: the goal ring, the lantern, and the headline numbers in one sentence-like row */}
      <Card className="p-6 md:p-8 overflow-hidden grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center">
        <GoalRing
          week={data.week}
          days={daysThisWeek}
          labelFor={(iso) => weekdayFmt.format(new Date(iso + "T12:00:00"))}
          caption={t("dash2.week.of").replace("{n}", String(WEEKLY_GOAL_DAYS))}
        />
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("dash2.week.title")}</span>
          <h1 className="text-2xl md:text-3xl font-bold">
            {goalMet
              ? t("dash2.week.done")
              : daysThisWeek === 0
                ? t("dash2.week.none")
                : WEEKLY_GOAL_DAYS - daysThisWeek === 1
                  ? t("dash2.week.left1")
                  : t("dash2.week.left").replace("{n}", String(WEEKLY_GOAL_DAYS - daysThisWeek))}
          </h1>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <InlineStat label={t("dashboard.current_streak")} value={`${data.streak} ${t("dashboard.days")}`} />
            <InlineStat label={t("dashboard.total_xp")} value={data.totalXp} />
            <InlineStat label={t("dashboard.words_learned")} value={data.wordsLearned} />
          </dl>
          {data.wordsToReview > 0 ? (
            <Button className="self-start mt-1" onClick={() => navigate("/flashcards")}>
              {t("dash2.review").replace("{n}", String(data.wordsToReview))}
            </Button>
          ) : (
            !goalMet && (
              <Button className="self-start mt-1" onClick={() => navigate("/flashcards")}>
                {t("dash2.practise_now")}
              </Button>
            )
          )}
        </div>
        <div className="hidden md:block lantern-glow [--glow-size:200%] [--glow-y:55%]">
          <Lantern mood={mood} className="w-32 h-32" />
        </div>
      </Card>

      {/* Lantern path: one lantern per level, lit as words are mastered */}
      <Section seal="级" title={t("dash2.path.title")} note={t("dash2.path.note")}>
        <LanternPath levels={data.levels} t={t} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* Tone accuracy */}
        <Section seal="声" title={t("dash2.tones.title")} note={t("dash2.tones.note")}>
          <ul className="flex flex-col gap-4">
            {data.tones.map((tone) => (
              <li key={tone.tone} className="grid grid-cols-[3.5rem_minmax(0,1fr)_3rem] items-center gap-3">
                <span className="flex items-center gap-2" dir="ltr">
                  <svg viewBox="0 0 40 28" className="w-8 h-6 text-primary" aria-hidden="true">
                    <path d={TONE_PATH[tone.tone]} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold">
                    {t(`dash2.tone${tone.tone}`)} <span className="font-pinyin font-normal text-muted-foreground" dir="ltr">{TONE_MARK[tone.tone]}</span>
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
          <div className="mt-auto"><ToneTip tones={data.tones} t={t} /></div>
        </Section>

        {/* Missed words */}
        <Section seal="错" title={t("dash2.missed.title")} note={t("dash2.missed.note")}>
          {data.missed.length > 0 ? (
            <>
              <ul className="flex flex-col divide-y-2 divide-border">
                {data.missed.map((w) => (
                  <li key={w.id} className="flex items-center gap-4 py-2.5">
                    <span lang="zh" className="font-zh font-bold text-3xl min-w-16 whitespace-nowrap shrink-0">{w.hanzi}</span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-pinyin font-bold text-primary" dir="ltr">{w.pinyin}</span>
                      <span lang="ar" dir="rtl" className="text-sm text-muted-foreground truncate">{w.arabic}</span>
                    </span>
                    <span className="ms-auto font-bold tabular-nums">{w.best}%</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="self-start" onClick={() => navigate("/flashcards")}>
                {t("dash2.missed.cta")}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Lantern mood={hasPractised ? "happy" : "sleepy"} className="w-20 h-20" />
              <p className="text-muted-foreground max-w-xs">
                {hasPractised ? t("dash2.missed.none") : t("dash2.missed.empty")}
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* Seal badges */}
      <Section seal="印" title={t("dash2.badges.title")} note={t("dash2.badges.note")}>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
          {data.badges.map((b) => (
            <li key={b.key} className="flex items-center gap-3">
              {b.earned ? (
                <Seal char={b.seal} size="lg" className="-rotate-6" />
              ) : (
                <span
                  lang="zh"
                  aria-hidden="true"
                  className="inline-grid place-items-center w-14 h-14 shrink-0 rounded-xl border-2 border-dashed border-muted-foreground/50 font-zh font-bold text-3xl text-muted-foreground/50"
                >
                  {b.seal}
                </span>
              )}
              <span className="flex flex-col">
                <span className={cn("font-bold leading-tight", !b.earned && "text-muted-foreground")}>{t(`${b.key}.title`)}</span>
                <span className="text-xs text-muted-foreground">{b.earned ? t("dash2.badges.earned") : t(`${b.key}.hint`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Scores over time, kept for learners who like the detail */}
      <Section seal="进" title={t("dashboard.score_progress")}>
        {data.dailyScores.length > 0 ? (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "2px solid hsl(var(--stroke))",
                    borderRadius: 10,
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value}%`, t("dashboard.avg_score_label")]}
                />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t("dashboard.score_progress.empty")}</p>
        )}
      </Section>
    </div>
  );
};

/* ──────────────────────────────────────────
   Pieces
   ────────────────────────────────────────── */

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

const InlineStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-baseline gap-1.5">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-bold tabular-nums">{value}</dd>
  </div>
);

/* Seven segments, one per day; the goal is any five of them */
const GoalRing = ({
  week,
  days,
  labelFor,
  caption,
}: {
  week: WeekDay[];
  days: number;
  labelFor: (iso: string) => string;
  caption: string;
}) => {
  const size = 168;
  const c = size / 2;
  const r = 62;
  const gap = 7; // degrees between segments
  const seg = 360 / week.length;
  const arc = (i: number) => {
    const a0 = ((i * seg + gap / 2 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - gap / 2 - 90) * Math.PI) / 180;
    return `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`;
  };
  const labelPos = (i: number) => {
    const a = (((i + 0.5) * seg - 90) * Math.PI) / 180;
    return { x: c + (r + 0) * Math.cos(a), y: c + (r + 0) * Math.sin(a) };
  };

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} dir="ltr">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${days} / ${WEEKLY_GOAL_DAYS}`}>
        {week.map((d, i) => (
          <path
            key={d.date}
            d={arc(i)}
            fill="none"
            strokeLinecap="round"
            strokeWidth={18}
            className={d.practiced ? "stroke-primary" : "stroke-muted"}
          />
        ))}
        {week.map((d, i) => {
          const p = labelPos(i);
          return (
            <text
              key={d.date + "l"}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="700"
              className={cn(d.practiced ? "fill-primary-foreground" : "fill-muted-foreground", d.isToday && "underline")}
            >
              {labelFor(d.date)}
            </text>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums leading-none">{days}</span>
        <span className="text-xs text-muted-foreground mt-1">{caption}</span>
      </div>
    </div>
  );
};

/* A row of hanging lanterns on one string; each fills with light as its level is mastered */
const LanternPath = ({ levels, t }: { levels: LevelStep[]; t: (k: string) => string }) => {
  const current = levels.findIndex((l) => l.total > 0 && l.mastered < l.total);
  return (
    <div className="relative pt-2">
      {/* the string */}
      <div className="absolute inset-x-6 top-2 h-1 rounded-full bg-sunshine" aria-hidden="true" />
      <ol className="relative grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(levels.length, 1)}, minmax(0, 1fr))` }}>
        {levels.map((l, i) => {
          const pct = l.total > 0 ? l.mastered / l.total : 0;
          const done = l.total > 0 && l.mastered >= l.total;
          const isCurrent = i === (current === -1 ? levels.length - 1 : current);
          return (
            <li key={l.level} className="flex flex-col items-center gap-2 text-center">
              <PathLantern fill={pct} lit={done || isCurrent} current={isCurrent} />
              <span className={cn("font-bold", !isCurrent && !done && "text-muted-foreground")}>{t(`common.${l.level}`)}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                <span dir="ltr">{l.mastered}/{l.total}</span> {t("dashboard.mastered")}
              </span>
              {isCurrent && !done && (
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("dash2.path.here")}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const PathLantern = ({ fill, lit, current }: { fill: number; lit: boolean; current: boolean }) => {
  const id = `pl${Math.round(fill * 1000)}${current ? "c" : ""}${lit ? "l" : ""}`;
  const top = 22 + 52 * (1 - fill); // body spans y 22..74
  return (
    <div className={cn(current && "lantern-glow [--glow-size:190%] [--glow-y:55%]")}>
      <svg viewBox="0 0 60 104" className={cn("h-24 w-auto", current && "h-28")} aria-hidden="true">
        <line x1="30" y1="0" x2="30" y2="14" className="stroke-sunshine" strokeWidth="3" />
        <rect x="18" y="12" width="24" height="9" rx="3" className={lit ? "fill-sunshine" : "fill-muted"} stroke="hsl(var(--stroke))" strokeWidth="2.5" />
        <clipPath id={id}>
          <rect x="0" y={top} width="60" height="80" />
        </clipPath>
        <ellipse cx="30" cy="48" rx="26" ry="27" className="fill-muted" />
        <ellipse cx="30" cy="48" rx="26" ry="27" className="fill-primary" clipPath={`url(#${id})`} />
        <ellipse cx="30" cy="48" rx="26" ry="27" fill="none" stroke="hsl(var(--stroke))" strokeWidth="2.5" />
        <ellipse cx="30" cy="48" rx="11" ry="27" fill="none" stroke="hsl(var(--stroke))" strokeWidth="1.5" opacity="0.35" />
        <rect x="18" y="74" width="24" height="9" rx="3" className={lit ? "fill-sunshine" : "fill-muted"} stroke="hsl(var(--stroke))" strokeWidth="2.5" />
        <path d="M26 84 h8 l3 16 h-14 z" className={lit ? "fill-sunshine" : "fill-muted"} stroke="hsl(var(--stroke))" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const ToneTip = ({ tones, t }: { tones: ToneScore[]; t: (k: string) => string }) => {
  const scored = tones.filter((x) => x.score != null);
  if (scored.length === 0) return <p className="text-sm text-muted-foreground">{t("dash2.tones.empty")}</p>;
  const weakest = scored.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a));
  return (
    <p className="text-sm rounded-[10px] bg-accent text-accent-foreground px-3 py-2">
      {t(`dash2.tone${weakest.tone}.tip`)}
    </p>
  );
};

export default StudentDashboard;
