import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import Lantern from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard, { type StudentDashboardData, type ToneScore, type MissedWord } from "@/components/dashboard/StudentDashboard";

/* Tone of each syllable from its pinyin tone mark (neutral tones are skipped) */
const TONE_CHARS: Record<string, 1 | 2 | 3 | 4> = {};
["āēīōūǖ", "áéíóúǘ", "ǎěǐǒǔǚ", "àèìòùǜ"].forEach((chars, i) => {
  for (const ch of chars) TONE_CHARS[ch] = (i + 1) as 1 | 2 | 3 | 4;
});
const tonesIn = (pinyin: string): Set<1 | 2 | 3 | 4> => {
  const found = new Set<1 | 2 | 3 | 4>();
  for (const ch of (pinyin || "").normalize("NFC")) if (TONE_CHARS[ch]) found.add(TONE_CHARS[ch]);
  return found;
};

// ──────────────────────────────────────────
//  Teacher-specific types
// ──────────────────────────────────────────
interface StudentInfo {
  id: string;
  full_name: string;
  total_xp: number;
  attempt_count: number;
  avg_score: number;
}

interface WeeklyScore {
  week: string;
  score: number;
}

interface DifficultWord {
  hanzi: string;
  pinyin: string;
  attempts: number;
  avgScore: number;
}

// ──────────────────────────────────────────
//  Student analytics types
// ──────────────────────────────────────────
interface DailyScore {
  date: string;
  avgScore: number;
}

interface LevelProgress {
  level: string;
  mastered: number;
  total: number;
}

// ──────────────────────────────────────────
//  Component
// ──────────────────────────────────────────
const Dashboard = () => {
  const { user, profile, createClassroom } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Teacher state
  const [classroomCode, setClassroomCode] = useState<string | null>(null);
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>([]);
  const [difficultWords, setDifficultWords] = useState<DifficultWord[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  // Student analytics state
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([]);
  const [practiceDays, setPracticeDays] = useState<Set<string>>(new Set());
  const [wordsToReview, setWordsToReview] = useState(0);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([]);
  const [studentTotalXp, setStudentTotalXp] = useState(0);
  const [studentStreak, setStudentStreak] = useState(0);
  const [studentWordsLearned, setStudentWordsLearned] = useState(0);
  const [studentAvgScore, setStudentAvgScore] = useState(0);
  const [toneScores, setToneScores] = useState<ToneScore[]>([]);
  const [missedWords, setMissedWords] = useState<MissedWord[]>([]);
  const [hasAnyAttempt, setHasAnyAttempt] = useState(false);

  const [loading, setLoading] = useState(true);

  // Personal-progress view for students AND independent learners; teachers get the classroom view.
  const isStudent = profile?.role !== "teacher";

  useEffect(() => {
    if (user) {
      if (isStudent) {
        loadStudentData();
      } else {
        loadTeacherData();
      }
    }
  }, [user, profile]);

  // ──────────────────────────────────────────
  //  Student data loading
  // ──────────────────────────────────────────
  const loadStudentData = async () => {
    setLoading(true);
    try {
      const userId = user!.id;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Fetch all data in parallel
      const [attemptsRes, progressRes, vocabRes, reviewsRes] = await Promise.all([
        (supabase as any)
          .from("attempts")
          .select("id, vocab_id, score, timestamp")
          .eq("user_id", userId)
          .gte("timestamp", thirtyDaysAgoISO)
          .order("timestamp", { ascending: true }),
        (supabase as any)
          .from("progress")
          .select("total_xp, avg_score, completed_words, current_streak")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("vocab")
          .select("id, hanzi, pinyin, arabic_translation, level"),
        (supabase as any)
          .from("word_reviews" as any)
          .select("id, vocab_id, next_review_date, total_attempts, best_score")
          .eq("user_id", userId),
      ]);

      const attempts = attemptsRes.data || [];
      const progress = progressRes.data;
      const vocab = vocabRes.data || [];
      const reviews = reviewsRes.data || [];

      // Progress summary stats
      if (progress) {
        setStudentTotalXp(progress.total_xp || 0);
        setStudentStreak(progress.current_streak || 0);
        setStudentWordsLearned(progress.completed_words || 0);
        setStudentAvgScore(progress.avg_score || 0);
      }

      // 1. Score progress chart — group by day, avg score per day
      const dayMap: Record<string, number[]> = {};
      const practiceDaySet = new Set<string>();
      for (const a of attempts) {
        if (a.score == null) continue;
        const day = new Date(a.timestamp).toISOString().slice(0, 10);
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(a.score);
        practiceDaySet.add(day);
      }
      const dailyData: DailyScore[] = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, scores]) => ({
          date: date.slice(5), // MM-DD
          avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }));
      setDailyScores(dailyData);
      setPracticeDays(practiceDaySet);

      // 2. Look up vocab by id
      const vocabMap: Record<string, any> = {};
      for (const v of vocab) {
        vocabMap[v.id] = v;
      }
      // All attempts (not just the last 30 days) for mastery, tones and missed words
      const allAttemptsRes = await (supabase as any)
        .from("attempts")
        .select("vocab_id, score")
        .eq("user_id", userId);
      const allAttempts = allAttemptsRes.data || [];

      // 3. Practice days for the weekly ring are in practiceDaySet above

      // 4. Words to review — count where next_review_date <= today
      const todayStr = new Date().toISOString().slice(0, 10);
      let dueCount = 0;
      for (const r of reviews) {
        if (r.next_review_date && r.next_review_date.slice(0, 10) <= todayStr) {
          dueCount++;
        }
      }
      setWordsToReview(dueCount);

      // 5. Level progress — mastered = best score >= 85 on the word
      const vocabBestScore: Record<string, number> = {};
      for (const a of allAttempts) {
        if (a.score == null || !a.vocab_id) continue;
        if (!vocabBestScore[a.vocab_id] || a.score > vocabBestScore[a.vocab_id]) {
          vocabBestScore[a.vocab_id] = a.score;
        }
      }
      const levelMap: Record<string, { mastered: number; total: number }> = {};
      for (const v of vocab) {
        const lvl = v.level || "beginner";
        if (!levelMap[lvl]) levelMap[lvl] = { mastered: 0, total: 0 };
        levelMap[lvl].total++;
        if ((vocabBestScore[v.id] ?? 0) >= 85) {
          levelMap[lvl].mastered++;
        }
      }
      const levelOrder = ["beginner", "intermediate", "advanced"];
      const lvlData: LevelProgress[] = levelOrder
        .filter((lvl) => levelMap[lvl])
        .map((lvl) => ({
          level: lvl,
          mastered: levelMap[lvl].mastered,
          total: levelMap[lvl].total,
        }));
      setLevelProgress(lvlData);
      setHasAnyAttempt(allAttempts.length > 0);

      // 6. Tone accuracy: average score of practised words containing each tone
      const toneMap: Record<number, { sum: number; n: number }> = { 1: { sum: 0, n: 0 }, 2: { sum: 0, n: 0 }, 3: { sum: 0, n: 0 }, 4: { sum: 0, n: 0 } };
      for (const a of allAttempts) {
        if (a.score == null || !a.vocab_id || !vocabMap[a.vocab_id]) continue;
        for (const tone of tonesIn(vocabMap[a.vocab_id].pinyin)) {
          toneMap[tone].sum += a.score;
          toneMap[tone].n++;
        }
      }
      setToneScores(
        ([1, 2, 3, 4] as const).map((tone) => ({
          tone,
          score: toneMap[tone].n ? Math.round(toneMap[tone].sum / toneMap[tone].n) : null,
          words: toneMap[tone].n,
        })),
      );

      // 7. Missed words: practised but best score still under 70, weakest first
      setMissedWords(
        Object.entries(vocabBestScore)
          .filter(([id, best]) => best < 70 && vocabMap[id])
          .sort(([, a], [, b]) => a - b)
          .slice(0, 6)
          .map(([id, best]) => ({
            id,
            hanzi: vocabMap[id].hanzi,
            pinyin: vocabMap[id].pinyin,
            arabic: vocabMap[id].arabic_translation,
            best: Math.round(best),
          })),
      );
    } catch (e) {
      console.error("Student dashboard load error:", e);
    }
    setLoading(false);
  };

  // ──────────────────────────────────────────
  //  Teacher data loading (original logic)
  // ──────────────────────────────────────────
  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const { data: classrooms } = await (supabase as any)
        .from("classrooms")
        .select("*")
        .eq("teacher_id", user!.id)
        .limit(1);

      if (classrooms && classrooms.length > 0) {
        setClassroomCode(classrooms[0].code);
        const classroomId = classrooms[0].id;

        const { data: studentProfiles } = await (supabase as any)
          .from("profiles")
          .select("id, full_name")
          .eq("classroom_id", classroomId)
          .eq("role", "student");

        if (studentProfiles && studentProfiles.length > 0) {
          const studentIds = studentProfiles.map((s: any) => s.id);

          const { data: progressData } = await (supabase as any)
            .from("progress")
            .select("user_id, total_xp")
            .in("user_id", studentIds);

          const { data: attemptData } = await (supabase as any)
            .from("attempts")
            .select("user_id, score, vocab_id, timestamp")
            .in("user_id", studentIds);

          const studentMap: StudentInfo[] = studentProfiles.map((sp: any) => {
            const attempts = (attemptData || []).filter((a: any) => a.user_id === sp.id);
            const prog = (progressData || []).find((p: any) => p.user_id === sp.id);
            const scores = attempts.map((a: any) => a.score).filter((s: any) => s != null);
            return {
              id: sp.id,
              full_name: sp.full_name,
              total_xp: prog?.total_xp || 0,
              attempt_count: attempts.length,
              avg_score: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
            };
          });
          setStudents(studentMap);

          const allAttempts = attemptData || [];
          setTotalAttempts(allAttempts.length);
          const allScores = allAttempts.map((a: any) => a.score).filter((s: any) => s != null);
          setAvgScore(allScores.length > 0 ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) : 0);

          const weekMap: Record<string, number[]> = {};
          for (const a of allAttempts) {
            if (a.score == null) continue;
            const d = new Date(a.timestamp || Date.now());
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = weekStart.toISOString().slice(0, 10);
            if (!weekMap[key]) weekMap[key] = [];
            weekMap[key].push(a.score);
          }
          const weekly = Object.entries(weekMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([, scores], i) => ({
              week: `Week ${i + 1}`,
              score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            }));
          setWeeklyScores(weekly);

          const vocabScores: Record<string, { scores: number[]; vocab_id: string }> = {};
          for (const a of allAttempts) {
            if (a.score == null || !a.vocab_id) continue;
            if (!vocabScores[a.vocab_id]) vocabScores[a.vocab_id] = { scores: [], vocab_id: a.vocab_id };
            vocabScores[a.vocab_id].scores.push(a.score);
          }

          const vocabIds = Object.keys(vocabScores);
          if (vocabIds.length > 0) {
            const { data: vocabData } = await supabase
              .from("vocab")
              .select("id, hanzi, pinyin")
              .in("id", vocabIds);

            if (vocabData) {
              const difficult = vocabData.map((v: any) => {
                const entry = vocabScores[v.id];
                return {
                  hanzi: v.hanzi,
                  pinyin: v.pinyin,
                  attempts: entry.scores.length,
                  avgScore: Math.round(entry.scores.reduce((a: number, b: number) => a + b, 0) / entry.scores.length),
                };
              })
                .sort((a, b) => a.avgScore - b.avgScore)
                .slice(0, 6);
              setDifficultWords(difficult);
            }
          }
        }
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLoading(false);
  };

  // ──────────────────────────────────────────
  //  Teacher actions
  // ──────────────────────────────────────────
  const handleCreateClassroom = async () => {
    if (!classroomName.trim()) return;
    try {
      const code = await createClassroom(classroomName.trim());
      setClassroomCode(code);
      toast({ title: t("dashboard.classroom_created"), description: `${t("dashboard.classroom_code")}: ${code}` });
    } catch {
      toast({ title: t("dashboard.create_failed"), variant: "destructive" });
    }
  };

  const copyCode = () => {
    if (classroomCode) {
      navigator.clipboard.writeText(classroomCode);
      toast({ title: t("dashboard.code_copied") });
    }
  };

  // ──────────────────────────────────────────
  //  Streak calendar helper — last 30 days
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  //  Loading state
  // ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Lantern mood="thinking" className="w-36 h-36" />
        <p className="text-muted-foreground">{t("dashboard.loading")}</p>
      </div>
    );
  }

  // ──────────────────────────────────────────
  //  STUDENT VIEW
  // ──────────────────────────────────────────
  if (isStudent) {
    const today = new Date();
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      return { date: iso, practiced: practiceDays.has(iso), isToday: i === 6 };
    });
    const totalMastered = levelProgress.reduce((n, l) => n + l.mastered, 0);
    const scoredTones = toneScores.filter((x) => x.score != null);
    const data: StudentDashboardData = {
      name: profile?.full_name ?? "",
      totalXp: studentTotalXp,
      streak: studentStreak,
      wordsLearned: studentWordsLearned,
      week,
      tones: toneScores,
      missed: missedWords,
      levels: levelProgress,
      dailyScores,
      wordsToReview,
      badges: [
        { seal: "始", key: "dash2.badge.first", earned: hasAnyAttempt },
        { seal: "七", key: "dash2.badge.streak7", earned: studentStreak >= 7 },
        { seal: "百", key: "dash2.badge.xp100", earned: studentTotalXp >= 100 },
        { seal: "十", key: "dash2.badge.master10", earned: totalMastered >= 10 },
        { seal: "声", key: "dash2.badge.tones", earned: scoredTones.length === 4 && scoredTones.every((x) => (x.score ?? 0) >= 80) },
        { seal: "满", key: "dash2.badge.level", earned: levelProgress.some((l) => l.total > 0 && l.mastered >= l.total) },
      ],
    };
    return <StudentDashboard data={data} />;
  }

  // ──────────────────────────────────────────
  //  TEACHER VIEW
  // ──────────────────────────────────────────
  if (!classroomCode) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card className="p-8 flex flex-col items-center text-center gap-4">
          <Lantern mood="idle" className="w-28 h-28" />
          <h1 className="text-2xl font-bold">{t("dashboard.create_classroom")}</h1>
          <p className="text-muted-foreground">{t("dashboard.create_classroom_desc")}</p>
          <Input
            placeholder={t("dashboard.classroom_name_placeholder")}
            value={classroomName}
            onChange={(e) => setClassroomName(e.target.value)}
          />
          <Button onClick={handleCreateClassroom} className="w-full" size="lg">
            {t("dashboard.create_button")}
          </Button>
        </Card>
      </div>
    );
  }

  const studentChartData = students.map((s) => ({
    name: s.full_name.split(" ")[0],
    words: s.attempt_count,
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{t("dashboard.teacher.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.teacher.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 rounded-[10px] border-2 border-stroke bg-card px-4 py-2">
          <span className="text-sm text-muted-foreground">{t("dashboard.classroom_code")}</span>
          <span className="font-bold text-lg tracking-widest" dir="ltr">{classroomCode}</span>
          <Button variant="outline" size="sm" onClick={copyCode}>{t("dashboard.copy")}</Button>
        </div>
      </div>

      <StatStrip
        stats={[
          { label: t("dashboard.active_students"), value: students.length },
          { label: t("dashboard.avg_score"), value: `${avgScore}%` },
          { label: t("dashboard.total_practice"), value: totalAttempts },
        ]}
      />

      {students.length === 0 && (
        <Card className="p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
          <Lantern mood="sleepy" className="w-28 h-28 shrink-0" />
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">{t("dashboard.no_students")}</h2>
            <p className="text-muted-foreground max-w-md">{t("dashboard.no_students.desc")}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section seal="进" title={t("dashboard.accuracy_over_time")}>
          {weeklyScores.length > 0 ? (
            <div dir="ltr"><ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyScores}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="week" stroke={CHART.axis} fontSize={12} />
                <YAxis stroke={CHART.axis} domain={[0, 100]} fontSize={12} />
                <Tooltip contentStyle={CHART.tooltip} />
                <Line type="monotone" dataKey="score" stroke={CHART.primary} strokeWidth={3} dot={{ fill: CHART.primary, r: 5 }} />
              </LineChart>
            </ResponsiveContainer></div>
          ) : (
            <EmptyNote>{t("dashboard.no_data")}</EmptyNote>
          )}
        </Section>

        <Section seal="练" title={t("dashboard.sessions_per_student")}>
          {studentChartData.length > 0 ? (
            <div dir="ltr"><ResponsiveContainer width="100%" height={250}>
              <BarChart data={studentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} />
                <YAxis stroke={CHART.axis} fontSize={12} />
                <Tooltip contentStyle={CHART.tooltip} cursor={{ fill: CHART.cursor }} />
                <Bar dataKey="words" fill={CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer></div>
          ) : (
            <EmptyNote>{t("dashboard.no_students")}</EmptyNote>
          )}
        </Section>
      </div>

      {difficultWords.length > 0 && (
        <Section seal="难" title={t("dashboard.most_difficult")}>
          <ol className="flex flex-col border-2 border-border rounded-[10px] overflow-hidden">
            {difficultWords.map((word, idx) => (
              <li key={idx} className="flex items-center justify-between gap-4 p-4 border-b-2 border-border last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold tabular-nums">
                    {idx + 1}
                  </span>
                  <div>
                    <p lang="zh" className="font-zh text-2xl font-bold">{word.hanzi}</p>
                    <p className="font-pinyin text-sm text-primary font-bold">{word.pinyin}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm text-muted-foreground">{word.attempts} {t("dashboard.attempts")}</p>
                  <p className="text-lg font-bold">{word.avgScore}% {t("dashboard.avg_label")}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {students.length > 0 && (
        <Section seal="生" title={t("dashboard.students")}>
          <ul className="flex flex-col border-2 border-border rounded-[10px] overflow-hidden">
            {students.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-4 p-3 border-b-2 border-border last:border-b-0">
                <div>
                  <p className="font-bold">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.attempt_count} {t("dashboard.sessions")} · {t("dashboard.avg_label")} {student.avg_score}%
                  </p>
                </div>
                <span className="font-bold text-sm text-primary tabular-nums" dir="ltr">{student.total_xp} XP</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

/* Chart colours come from the theme tokens so they follow light and dark mode */
const CHART = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  cursor: "hsl(var(--muted))",
  tooltip: {
    background: "hsl(var(--card))",
    border: "2px solid hsl(var(--stroke))",
    borderRadius: 10,
    color: "hsl(var(--foreground))",
  },
};

const Section = ({ seal, title, children }: { seal: string; title: string; children: React.ReactNode }) => (
  <Card className="p-5 md:p-6 flex flex-col gap-4">
    <h2 className="flex items-center gap-3 text-xl font-bold">
      <Seal char={seal} size="sm" />
      {title}
    </h2>
    {children}
  </Card>
);

const EmptyNote = ({ children }: { children: React.ReactNode }) => (
  <p className="text-center text-muted-foreground py-10 max-w-sm mx-auto">{children}</p>
);

/* Headline numbers in one strip rather than a row of separate cards */
const StatStrip = ({ stats }: { stats: { label: string; value: number | string; unit?: string }[] }) => (
  <Card className="p-0 overflow-hidden">
    <dl className={`grid grid-cols-2 ${stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`p-4 md:p-5 border-border ${i % 2 === 0 ? "border-e-2" : ""} ${i >= 2 ? "border-t-2 md:border-t-0" : ""} ${
            i < stats.length - 1 ? "md:border-e-2" : "md:border-e-0"
          } ${stats.length === 3 && i === 2 ? "col-span-2 md:col-span-1" : ""}`}
        >
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd className="text-3xl font-bold tabular-nums">
            {s.value}
            {s.unit && <span className="ms-1 text-base font-normal text-muted-foreground">{s.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  </Card>
);

export default Dashboard;
