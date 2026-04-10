import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { TrendingUp, Users, Award, AlertCircle, Copy, Calendar, BookOpen, Zap, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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

interface CategoryScore {
  category: string;
  score: number;
  fullMark: number;
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
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [practiceDays, setPracticeDays] = useState<Set<string>>(new Set());
  const [wordsToReview, setWordsToReview] = useState(0);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([]);
  const [studentTotalXp, setStudentTotalXp] = useState(0);
  const [studentStreak, setStudentStreak] = useState(0);
  const [studentWordsLearned, setStudentWordsLearned] = useState(0);
  const [studentAvgScore, setStudentAvgScore] = useState(0);

  const [loading, setLoading] = useState(true);

  const isStudent = profile?.role === "student";

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
          .select("id, hanzi, pinyin, arabic_translation, level, category"),
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

      // 2. Category mastery — join attempts with vocab by vocab_id
      const vocabMap: Record<string, any> = {};
      for (const v of vocab) {
        vocabMap[v.id] = v;
      }
      const categoryMap: Record<string, number[]> = {};
      // Use ALL attempts for category mastery (not just last 30 days)
      const allAttemptsRes = await (supabase as any)
        .from("attempts")
        .select("vocab_id, score")
        .eq("user_id", userId);
      const allAttempts = allAttemptsRes.data || [];
      for (const a of allAttempts) {
        if (a.score == null || !a.vocab_id) continue;
        const v = vocabMap[a.vocab_id];
        if (!v) continue;
        const cat = v.category || "other";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(a.score);
      }
      const catData: CategoryScore[] = Object.entries(categoryMap).map(([category, scores]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        fullMark: 100,
      }));
      setCategoryScores(catData);

      // 3. Streak calendar — practiceDaySet already built above

      // 4. Words to review — count where next_review_date <= today
      const todayStr = new Date().toISOString().slice(0, 10);
      let dueCount = 0;
      for (const r of reviews) {
        if (r.next_review_date && r.next_review_date.slice(0, 10) <= todayStr) {
          dueCount++;
        }
      }
      setWordsToReview(dueCount);

      // 5. Level progress — mastered = scored 85+ at least 3 times
      const vocabAttemptMap: Record<string, number[]> = {};
      for (const a of allAttempts) {
        if (a.score == null || !a.vocab_id) continue;
        if (!vocabAttemptMap[a.vocab_id]) vocabAttemptMap[a.vocab_id] = [];
        vocabAttemptMap[a.vocab_id].push(a.score);
      }
      const levelMap: Record<string, { mastered: number; total: number }> = {};
      for (const v of vocab) {
        const lvl = v.level || "beginner";
        if (!levelMap[lvl]) levelMap[lvl] = { mastered: 0, total: 0 };
        levelMap[lvl].total++;
        const scores = vocabAttemptMap[v.id] || [];
        const highScores = scores.filter((s: number) => s >= 85);
        if (highScores.length >= 3) {
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
  const buildCalendarDays = () => {
    const days: { date: string; label: string; practiced: boolean; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayNum = d.getDate();
      days.push({
        date: iso,
        label: String(dayNum),
        practiced: practiceDays.has(iso),
        isToday: i === 0,
      });
    }
    return days;
  };

  // ──────────────────────────────────────────
  //  Loading state
  // ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-muted-foreground">{t("dashboard.loading")}</p>
      </div>
    );
  }

  // ──────────────────────────────────────────
  //  STUDENT VIEW
  // ──────────────────────────────────────────
  if (isStudent) {
    const calendarDays = buildCalendarDays();

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-lavender bg-clip-text text-transparent">
              {t("dashboard.student.title")}
            </h1>
            <p className="text-muted-foreground">{t("dashboard.student.subtitle")}</p>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("dashboard.total_xp")}</p>
                    <p className="text-3xl font-bold">{studentTotalXp}</p>
                  </div>
                  <Zap className="w-10 h-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("dashboard.current_streak")}</p>
                    <p className="text-3xl font-bold">{studentStreak} <span className="text-base font-normal text-muted-foreground">{t("dashboard.days")}</span></p>
                  </div>
                  <Flame className="w-10 h-10 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("dashboard.words_learned")}</p>
                    <p className="text-3xl font-bold">{studentWordsLearned}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("dashboard.avg_score")}</p>
                    <p className="text-3xl font-bold">{studentAvgScore}%</p>
                  </div>
                  <Award className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 1: Score progress + Category mastery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Score progress chart */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-purple-500" />
                  {t("dashboard.score_progress")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dailyScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, t("dashboard.avg_score_label")]}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ fill: "#a855f7", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    {t("dashboard.score_progress.empty")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 2. Category mastery */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-green-500" />
                  {t("dashboard.category_mastery")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={categoryScores} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#e0e0e0" />
                      <PolarAngleAxis dataKey="category" stroke="#666" fontSize={12} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#999" fontSize={10} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                      <Tooltip formatter={(value: number) => [`${value}%`, "Score"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    {t("dashboard.category_mastery.empty")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Streak calendar + Words to review */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3. Streak calendar */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-orange-500" />
                  {t("dashboard.streak_calendar")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 gap-2">
                  {calendarDays.map((day) => (
                    <div
                      key={day.date}
                      className={`
                        relative w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium
                        transition-colors
                        ${day.practiced
                          ? "bg-green-500 text-white"
                          : "bg-muted/40 text-muted-foreground"
                        }
                        ${day.isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                      `}
                      title={`${day.date} — ${day.practiced ? t("dashboard.streak.practiced") : t("dashboard.streak.missed")}`}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> {t("dashboard.streak.practiced")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-muted/40 inline-block border" /> {t("dashboard.streak.missed")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 4. Words to review widget */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="text-blue-500" />
                  {t("dashboard.words_to_review")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                {wordsToReview > 0 ? (
                  <>
                    <div className="text-6xl font-bold bg-gradient-coral bg-clip-text text-transparent">
                      {wordsToReview}
                    </div>
                    <p className="text-muted-foreground text-center">
                      {t("dashboard.words_due_today")}
                    </p>
                    <Button
                      onClick={() => navigate("/flashcards")}
                      className="bg-gradient-coral text-white px-8"
                    >
                      {t("dashboard.start_review")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-5xl">&#10003;</div>
                    <p className="text-muted-foreground text-center">
                      {t("dashboard.no_reviews_due")}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Level progress */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-purple-500" />
                {t("dashboard.level_progress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {levelProgress.length > 0 ? (
                <div className="space-y-4">
                  {levelProgress.map((lp) => {
                    const pct = lp.total > 0 ? Math.round((lp.mastered / lp.total) * 100) : 0;
                    return (
                      <div key={lp.level} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {t(`common.${lp.level}`)}
                          </span>
                          <span className="text-muted-foreground">
                            {lp.mastered}/{lp.total} {t("dashboard.mastered")}
                          </span>
                        </div>
                        <div className="w-full h-4 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  {t("dashboard.level_progress.empty")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  //  TEACHER VIEW  (original, unchanged)
  // ──────────────────────────────────────────
  if (!classroomCode) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <h1 className="text-2xl font-bold mb-4">{t("dashboard.create_classroom")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("dashboard.create_classroom_desc")}
          </p>
          <Input
            placeholder={t("dashboard.classroom_name_placeholder")}
            value={classroomName}
            onChange={(e) => setClassroomName(e.target.value)}
            className="mb-4"
          />
          <Button onClick={handleCreateClassroom} className="w-full bg-gradient-coral">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-lavender bg-clip-text text-transparent">
              {t("dashboard.teacher.title")}
            </h1>
            <p className="text-muted-foreground">{t("dashboard.teacher.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">{t("dashboard.classroom_code")}:</span>
            <span className="font-mono font-bold text-lg">{classroomCode}</span>
            <Button variant="ghost" size="icon" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("dashboard.active_students")}</p>
                  <p className="text-3xl font-bold">{students.length}</p>
                </div>
                <Users className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("dashboard.avg_score")}</p>
                  <p className="text-3xl font-bold">{avgScore}%</p>
                </div>
                <Award className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("dashboard.total_practice")}</p>
                  <p className="text-3xl font-bold">{totalAttempts}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-purple-500" />
                {t("dashboard.accuracy_over_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="week" stroke="#666" />
                    <YAxis stroke="#666" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#a855f7", r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t("dashboard.no_data")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-green-500" />
                {t("dashboard.sessions_per_student")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={studentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="words" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t("dashboard.no_students")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {difficultWords.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-orange-500" />
                {t("dashboard.most_difficult")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {difficultWords.map((word, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg font-bold text-orange-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{word.hanzi}</p>
                        <p className="text-sm text-muted-foreground">{word.pinyin}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm text-muted-foreground">{word.attempts} {t("dashboard.attempts")}</p>
                      <p className="text-lg font-bold text-orange-500">{word.avgScore}% {t("dashboard.avg_label")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {students.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-purple-500" />
                {t("dashboard.students")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.attempt_count} {t("dashboard.sessions")} | {t("dashboard.avg_label")}: {student.avg_score}%
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-sm bg-gradient-coral bg-clip-text text-transparent">
                        {student.total_xp} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
