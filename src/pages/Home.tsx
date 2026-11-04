import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Lantern from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import AvatarIcon from "@/components/AvatarIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import PathIcon from "@/components/PathIcon";
import { PATH_ZH, TEACHERS_CORNER_ZH } from "@/lib/learningPaths";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDueWords } from "@/lib/spacedRepetition";
import { useTodayMinutes } from "@/hooks/use-today-minutes";
import GoalIcon from "@/components/GoalIcon";
import { progressText, tierFor } from "@/lib/dailyGoal";
import { listLessons, type Lesson } from "@/lib/lessons";
import { UNIT1 } from "@/content/foundation1/unit1";
import { MOVE_UNIT1 } from "@/content/onTheMove/unit1";
import { loadProgress } from "@/lib/foundationProgress";

const Home = () => {
  const { user } = useAuth();
  return user ? <Today /> : <Landing />;
};

/* Logged out: one real word to show how it works, what you can do, and Hua */
const Landing = () => {
  const { t } = useLanguage();


  const features = [
    { icon: "lotus", titleKey: "home.features.bridge", descKey: "home.features.bridge.desc" },
    { icon: "bamboo", titleKey: "home.features.progress", descKey: "home.features.progress.desc" },
    { icon: "dumpling", titleKey: "home.features.vocab", descKey: "home.features.vocab.desc" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col gap-16 md:gap-20">
      <section className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 items-center">
        <div className="flex flex-col gap-6">
          <span lang="zh" className="font-zh font-bold text-primary text-2xl">灵话</span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">{t("home.hero.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-xl">{t("home.hero.sub")}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/auth">
              <Button size="lg">{t("home.cta")}</Button>
            </Link>
            <Link to="/translator">
              <Button size="lg" variant="outline">{t("home.cta.translator")}</Button>
            </Link>
          </div>
        </div>

        {/* A real flashcard, with the Arabic-letter pronunciation that sets LingHua apart */}
        <Card className="p-6 md:p-8 w-full md:max-w-md md:justify-self-end overflow-hidden grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("home.sample.label")}</span>
            <span lang="zh" className="font-zh font-bold text-6xl leading-tight">你好</span>
            <span className="font-pinyin text-xl font-bold text-primary">Nǐ hǎo</span>
            <span lang="ar" dir="rtl" className="text-2xl self-start">مرحباً</span>
            <div className="mt-3 pt-3 border-t-2 border-border flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("home.sample.sounds")}</span>
              <span lang="ar" dir="rtl" className="text-2xl font-bold self-start">ني هاو</span>
              <span className="text-sm text-muted-foreground">{t("home.sample.bridge")}</span>
            </div>
          </div>
          <div className="lantern-glow [--glow-size:230%] [--glow-y:58%]">
            <Lantern mood="idle" className="w-28 h-28 md:w-36 md:h-36" />
          </div>
        </Card>
      </section>

      {/* Mandarin on the Move is open to visitors: a lesson and the phrasebook, no account needed */}
      <section className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-5 rounded-[14px] border-2 border-stroke bg-card p-5 md:p-6 text-center sm:text-start">
        <PathIcon path="on_the_move" className="w-16 h-16 shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-2xl font-bold">
            {t("move.home.title")} <span lang="zh" className="font-zh text-primary">{PATH_ZH.on_the_move}</span>
          </h2>
          <p className="text-muted-foreground">{t("move.home.desc")}</p>
        </div>
        <Link to="/move" className="shrink-0">
          <Button size="lg" variant="outline">{t("move.home.cta")}</Button>
        </Link>
      </section>

      <section className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("home.features.title")}</h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {features.map((f) => (
            <li key={f.titleKey} className="flex items-center gap-4 p-5 border-b-2 border-border last:border-b-0">
              <AvatarIcon id={f.icon} className="w-12 h-12 shrink-0" />
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">{t(f.titleKey)}</h3>
                <p className="text-muted-foreground">{t(f.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Hua gets his own block so he reads as a character, not a feature line */}
      <section className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card p-6 md:p-8">
        <div className="lantern-glow [--glow-size:200%] [--glow-y:55%] shrink-0">
          <Lantern mood="happy" className="w-28 h-28 md:w-32 md:h-32" />
        </div>
        <div className="flex flex-col gap-3 text-center sm:text-start items-center sm:items-start">
          <h2 className="text-2xl md:text-3xl font-bold text-balance">{t("home.hua.title")}</h2>
          <p className="text-muted-foreground">{t("home.hua.ask")}</p>
          <p className="font-bold text-primary">{t("home.hua.tagline")}</p>
          <Link to="/tutor">
            <Button size="lg">{t("home.hua.cta")}</Button>
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-center text-center gap-4 py-4">
        <h2 className="text-3xl md:text-4xl font-bold text-balance max-w-2xl">{t("home.closing.title")}</h2>
        <p className="text-lg text-muted-foreground max-w-xl">{t("home.closing.desc")}</p>
        <Link to="/auth">
          <Button size="lg">{t("home.closing.cta")}</Button>
        </Link>
      </section>
    </div>
  );
};

/* Logged in: today's goal, one Continue button, and the other activities */
const Today = () => {
  const { t, language } = useLanguage();
  const { user, profile, learningPath } = useAuth();
  const [streak, setStreak] = useState(0);
  const today = useTodayMinutes();
  const [dueCount, setDueCount] = useState(0);
  const [hasPracticed, setHasPracticed] = useState(true);
  // Lessons the teacher picked for this student's class
  const [lessons, setLessons] = useState<Lesson[]>([]);
  useEffect(() => {
    const classId = profile?.role === "student" ? profile.classroom_id : null;
    if (!classId) return setLessons([]);
    listLessons(classId).then(setLessons).catch(() => setLessons([]));
  }, [profile?.role, profile?.classroom_id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: progress }, due] = await Promise.all([
        (supabase as any).from("progress").select("current_streak, completed_words").eq("user_id", user.id).maybeSingle(),
        getDueWords(supabase, user.id),
      ]);
      setStreak(progress?.current_streak ?? 0);
      setHasPracticed((progress?.completed_words ?? 0) > 0);
      setDueCount(due.length);
    })();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "today.morning" : hour < 18 ? "today.afternoon" : "today.evening");
  // Little Lanterns kids give their first name apart ("Abdul Rahman" stays whole)
  const firstName = (user?.user_metadata?.first_name as string | undefined) || (profile?.full_name ?? "").split(" ")[0];
  const goalDone = today.done;
  const isTeacher = profile?.role === "teacher";
  // Foundation 1 is for every learner except HSK Journey, which has its own curriculum
  const showFoundation = !isTeacher && learningPath !== "hsk";
  const unitProgress = loadProgress(user?.id).lessons;
  const unitDone = UNIT1.lessons.filter((l) => unitProgress[l.key]).length;
  const onTheMove = !isTeacher && learningPath === "on_the_move";
  const moveProgress = loadProgress(user?.id, "move").lessons;
  const moveDone = MOVE_UNIT1.lessons.filter((l) => moveProgress[l.key]).length;

  const activities = [
    // Teachers reach My Classroom from the big button above, so the list starts with speaking
    ...(isTeacher
      ? []
      : [{
          to: "/flashcards",
          seal: "复",
          titleKey: "today.review",
          desc: dueCount > 0 ? `${dueCount} ${t("today.review.due")}` : t("today.review.none"),
          count: dueCount,
        }]),
    ...(isTeacher ? [{ to: "/learn", seal: "学", titleKey: "learn.today.teacher", desc: t("learn.today.teacher.desc") }] : []),
    { to: "/tutor", seal: "说", titleKey: "today.speak", desc: t("today.speak.desc") },
    { to: "/grammar", seal: "文", titleKey: "today.grammar", desc: t("today.grammar.desc") },
    { to: "/translator", seal: "译", titleKey: "today.translate", desc: t("today.translate.desc"), tone: "gold" as const },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          {isTeacher && (
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("corner.title")} <span lang="zh" className="font-zh normal-case tracking-normal">· {TEACHERS_CORNER_ZH}</span>
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {greeting}
            {firstName && (language === "ar" ? ` يا ${firstName}` : `, ${firstName}`)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex px-3 py-0.5 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground font-bold text-sm">
              {streak} {t("today.streak")}
            </span>
            {learningPath && (
              <Link
                to="/profile#path"
                className="inline-flex items-center gap-1.5 ps-1 pe-3 py-0.5 rounded-full border-2 border-stroke bg-card font-bold text-sm"
              >
                <PathIcon path={learningPath} className="w-6 h-6" />
                {t(`path.${learningPath}`)}
                <span lang="zh" className="font-zh font-normal text-muted-foreground">{PATH_ZH[learningPath]}</span>
              </Link>
            )}
          </div>
        </div>
        <Lantern mood={goalDone ? "happy" : hasPracticed ? "idle" : "sleepy"} className="w-24 h-24 md:w-28 md:h-28 shrink-0" />
      </div>

      <Card className="p-5 flex flex-col gap-4">
        {!isTeacher && (
          <>
            <div className="flex items-center gap-3">
              <GoalIcon tier={tierFor(today.goal)} className="w-10 h-10 shrink-0" />
              <span className="flex-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("today.goal")}</span>
              <Link to="/profile#goal" className="font-bold tabular-nums">
                {progressText(t, language, today.minutes, today.goal)}
              </Link>
            </div>
            <Progress value={(Math.min(today.minutes, today.goal) / today.goal) * 100} />
          </>
        )}
        {goalDone && <p className="font-semibold text-success-foreground">{t("today.goal.done")}</p>}
        {isTeacher ? (
          <div>
            <p className="text-muted-foreground mb-3">{t("today.class.desc")}</p>
            <Link to="/dashboard">
              <Button size="lg" className="w-full">{t("classroom.mine")}</Button>
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-3">{t("today.continue.desc")}</p>
            <Link to="/flashcards">
              <Button size="lg" className="w-full">
                {hasPracticed ? t("today.continue") : t("today.start")}
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {onTheMove && (
        <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-3" aria-labelledby="on-the-move">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("move.label")}</span>
          <div className="flex items-center gap-4">
            <PathIcon path="on_the_move" className="w-12 h-12 shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 id="on-the-move" className="text-xl font-bold leading-tight">
                {MOVE_UNIT1.title[language]} <span lang="zh" className="font-zh text-primary">{MOVE_UNIT1.zh}</span>
              </h2>
              <p className="text-sm text-muted-foreground">{t("move.today.desc")}</p>
            </div>
          </div>
          <Progress value={(moveDone / MOVE_UNIT1.lessons.length) * 100} aria-label={`${moveDone} / ${MOVE_UNIT1.lessons.length}`} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/move">
              <Button size="lg" className="w-full">{moveDone ? t("learn.continue") : t("move.today.start")}</Button>
            </Link>
            <Link to="/move/phrases">
              <Button size="lg" variant="outline" className="w-full">{t("move.phrases.open")}</Button>
            </Link>
          </div>
        </section>
      )}

      {showFoundation && (
        <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-3" aria-labelledby="first-spark">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("learn.f1")}</span>
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 shrink-0 rounded-full border-2 border-stroke bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              {UNIT1.number}
            </span>
            <div className="flex-1 min-w-0">
              <h2 id="first-spark" className="text-xl font-bold leading-tight">
                {UNIT1.title[language]} <span lang="zh" className="font-zh text-primary">{UNIT1.zh}</span>
              </h2>
              <p className="text-sm text-muted-foreground">{t("learn.today.desc")}</p>
            </div>
          </div>
          <Progress value={(unitDone / UNIT1.lessons.length) * 100} aria-label={`${unitDone} / ${UNIT1.lessons.length}`} />
          <Link to="/learn">
            <Button size="lg" variant={unitDone ? "outline" : "default"} className="w-full">
              {unitDone ? t("learn.today.continue") : t("learn.today.start")}
            </Button>
          </Link>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="from-teacher">
          <h2 id="from-teacher" className="text-xl font-bold">
            {t("lesson.from_teacher")} <span lang="zh" className="font-zh font-normal text-muted-foreground">· 老师布置</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {lessons.map((l) => (
              <li key={l.id} className="rounded-[14px] border-2 border-stroke bg-card p-4 flex flex-col gap-3">
                <span>
                  <span className="block text-lg font-bold leading-tight">{l.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("lesson.count").replace("{w}", String(l.vocabIds.length)).replace("{g}", String(l.grammarIds.length))}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {l.vocabIds.length > 0 && (
                    <Link to={`/flashcards?lesson=${l.id}`}>
                      <Button size="sm">{t("lesson.practise.words")}</Button>
                    </Link>
                  )}
                  {l.grammarIds.length > 0 && (
                    <Link to={`/grammar?lesson=${l.id}`}>
                      <Button size="sm" variant="outline">{t("lesson.practise.grammar")}</Button>
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
        {activities.map((a) => (
          <li key={a.to} className="border-b-2 border-border last:border-b-0">
            <Link to={a.to} className="flex items-center gap-4 p-4 hover:bg-muted">
              <Seal char={a.seal} tone={"tone" in a ? a.tone : "red"} />
              <div className="flex-1 min-w-0">
                <span className="block text-lg font-bold leading-tight">{t(a.titleKey)}</span>
                <span className="block text-sm text-muted-foreground">{a.desc}</span>
              </div>
              {"count" in a && a.count ? (
                <span className="font-bold text-primary tabular-nums text-lg">{a.count}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
