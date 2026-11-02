import { useState, useEffect } from "react";
import Lantern from "@/components/lantern/Lantern";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import TeacherDashboard, { CreateClass, type TeacherDashboardData, type ClassStudent, type ClassWord } from "@/components/dashboard/TeacherDashboard";
import StudentDashboard, { type StudentDashboardData, type ToneScore, type MissedWord } from "@/components/dashboard/StudentDashboard";
import type { LearningPath } from "@/lib/learningPaths";

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
  const { user, profile, createClassroom, joinClassroom } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Teacher state
  const [teacherData, setTeacherData] = useState<TeacherDashboardData | null>(null);

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

      if (!classrooms || classrooms.length === 0) {
        setTeacherData(null);
        return;
      }
      const classroom = classrooms[0];

      const { data: studentProfiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .eq("classroom_id", classroom.id)
        .eq("role", "student");
      const profiles: { id: string; full_name: string }[] = studentProfiles || [];
      const studentIds = profiles.map((p) => p.id);
      // Kids who log in with pictures. The kid_login column comes with
      // 20261102_kids_picture_login.sql; until it is run this finds nobody.
      const kidQuery = (cols: string) =>
        (supabase as any).from("profiles").select(cols).eq("classroom_id", classroom.id).eq("kid_login", true);
      let kidRows: { id: string; kid_help_at?: string | null }[] = [];
      if (studentIds.length) {
        // kid_help_at may not exist yet on an older database; fall back to ids only
        const withHelp = await kidQuery("id, kid_help_at");
        const res = withHelp.error ? await kidQuery("id") : withHelp;
        kidRows = res.error ? [] : res.data || [];
      }
      const kidIds = new Set<string>(kidRows.map((k) => k.id));
      const helpIds = new Set<string>(kidRows.filter((k) => k.kid_help_at).map((k) => k.id));

      const [progressRes, attemptRes] = studentIds.length
        ? await Promise.all([
            (supabase as any).from("progress").select("user_id, total_xp").in("user_id", studentIds),
            (supabase as any).from("attempts").select("user_id, score, vocab_id, timestamp").in("user_id", studentIds),
          ])
        : [{ data: [] }, { data: [] }];
      const attempts: { user_id: string; score: number | null; vocab_id: string | null; timestamp: string | null }[] = attemptRes.data || [];

      const vocabIds = [...new Set(attempts.map((a) => a.vocab_id).filter(Boolean))] as string[];
      const { data: vocabData } = vocabIds.length
        ? await supabase.from("vocab").select("id, hanzi, pinyin, arabic_translation").in("id", vocabIds)
        : { data: [] as any[] };
      const vocabMap: Record<string, any> = {};
      for (const v of vocabData || []) vocabMap[v.id] = v;

      // Last 7 days, oldest first, as YYYY-MM-DD
      const today = new Date();
      const weekIso = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });

      const classTone: Record<number, { sum: number; n: number }> = { 1: { sum: 0, n: 0 }, 2: { sum: 0, n: 0 }, 3: { sum: 0, n: 0 }, 4: { sum: 0, n: 0 } };
      const classStudents: ClassStudent[] = profiles.map((sp) => {
        const mine = attempts.filter((a) => a.user_id === sp.id);
        const scores = mine.map((a) => a.score).filter((x): x is number => x != null);
        const days = new Set(mine.map((a) => (a.timestamp ? a.timestamp.slice(0, 10) : "")));
        const tone: Record<number, { sum: number; n: number }> = { 1: { sum: 0, n: 0 }, 2: { sum: 0, n: 0 }, 3: { sum: 0, n: 0 }, 4: { sum: 0, n: 0 } };
        for (const a of mine) {
          if (a.score == null || !a.vocab_id || !vocabMap[a.vocab_id]) continue;
          for (const tn of tonesIn(vocabMap[a.vocab_id].pinyin)) {
            tone[tn].sum += a.score;
            tone[tn].n++;
            classTone[tn].sum += a.score;
            classTone[tn].n++;
          }
        }
        const toneAvgs = ([1, 2, 3, 4] as const).filter((tn) => tone[tn].n > 0).map((tn) => ({ tn, avg: tone[tn].sum / tone[tn].n }));
        const weakest = toneAvgs.length ? toneAvgs.reduce((x, y) => (y.avg < x.avg ? y : x)).tn : null;
        const last = mine.map((a) => a.timestamp).filter(Boolean).sort().pop() ?? null;
        return {
          id: sp.id,
          name: sp.full_name || "?",
          xp: (progressRes.data || []).find((p: any) => p.user_id === sp.id)?.total_xp || 0,
          avgScore: scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null,
          week: weekIso.map((d) => days.has(d)),
          weakestTone: weakest,
          lastActive: last,
          kid: kidIds.has(sp.id),
          needsHelp: helpIds.has(sp.id),
        };
      });

      const weekMap: Record<string, number[]> = {};
      for (const a of attempts) {
        if (a.score == null) continue;
        const d = new Date(a.timestamp || Date.now());
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        (weekMap[key] ||= []).push(a.score);
      }
      const weeklyScores = Object.entries(weekMap)
        .sort(([x], [y]) => x.localeCompare(y))
        .slice(-6)
        .map(([, scores], i) => ({
          week: `${t("teach.week_short")} ${i + 1}`,
          score: Math.round(scores.reduce((x, y) => x + y, 0) / scores.length),
        }));

      const wordScores: Record<string, number[]> = {};
      for (const a of attempts) {
        if (a.score == null || !a.vocab_id || !vocabMap[a.vocab_id]) continue;
        (wordScores[a.vocab_id] ||= []).push(a.score);
      }
      const hardWords: ClassWord[] = Object.entries(wordScores)
        .map(([id, sc]) => ({
          hanzi: vocabMap[id].hanzi,
          pinyin: vocabMap[id].pinyin,
          arabic: vocabMap[id].arabic_translation,
          attempts: sc.length,
          avgScore: Math.round(sc.reduce((x, y) => x + y, 0) / sc.length),
        }))
        .sort((x, y) => x.avgScore - y.avgScore)
        .slice(0, 6);

      setTeacherData({
        className: classroom.name,
        code: classroom.code,
        students: classStudents,
        tones: ([1, 2, 3, 4] as const).map((tn) => ({
          tone: tn,
          score: classTone[tn].n ? Math.round(classTone[tn].sum / classTone[tn].n) : null,
          words: classTone[tn].n,
        })),
        hardWords,
        weeklyScores,
      });
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (name: string, path: LearningPath) => {
    try {
      const code = await createClassroom(name, path);
      toast({ title: t("dashboard.classroom_created"), description: `${t("dashboard.classroom_code")}: ${code}` });
      await loadTeacherData();
    } catch {
      toast({ title: t("dashboard.create_failed"), variant: "destructive" });
    }
  };

  const copyCode = () => {
    if (teacherData?.code) {
      navigator.clipboard.writeText(teacherData.code);
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
    const handleJoin = async (code: string) => {
      try {
        await joinClassroom(code);
        toast({ title: t("class.join.done") });
        return true;
      } catch {
        toast({ title: t("class.join.failed"), description: t("class.join.check"), variant: "destructive" });
        return false;
      }
    };
    return (
      <StudentDashboard
        data={data}
        joinClass={profile?.role === "student" && !profile?.classroom_id ? handleJoin : undefined}
      />
    );
  }

  // ──────────────────────────────────────────
  //  TEACHER VIEW
  // ──────────────────────────────────────────
  if (!teacherData) return <CreateClass onCreate={handleCreateClassroom} />;
  return <TeacherDashboard data={teacherData} onCopy={copyCode} />;
};

export default Dashboard;
