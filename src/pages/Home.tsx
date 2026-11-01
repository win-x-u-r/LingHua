import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Lantern from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import AvatarIcon from "@/components/AvatarIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateXpEarned } from "@/lib/gamification";
import { getDueWords } from "@/lib/spacedRepetition";

const DAILY_GOAL_XP = 30;

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

      {/* Hua gets her own block so she reads as a character, not a feature line */}
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
  const { user, profile } = useAuth();
  const [streak, setStreak] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [hasPracticed, setHasPracticed] = useState(true);

  useEffect(() => {
    if (!user) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    (async () => {
      const [{ data: progress }, { data: attempts }, due] = await Promise.all([
        (supabase as any).from("progress").select("current_streak, completed_words").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("attempts").select("score").eq("user_id", user.id).gte("timestamp", startOfDay.toISOString()),
        getDueWords(supabase, user.id),
      ]);
      setStreak(progress?.current_streak ?? 0);
      setHasPracticed((progress?.completed_words ?? 0) > 0);
      setXpToday((attempts ?? []).reduce((sum: number, a: { score: number }) => sum + calculateXpEarned(a.score), 0));
      setDueCount(due.length);
    })();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "today.morning" : hour < 18 ? "today.afternoon" : "today.evening");
  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const goalDone = xpToday >= DAILY_GOAL_XP;
  const isTeacher = profile?.role === "teacher";

  const activities = [
    isTeacher
      ? { to: "/dashboard", seal: "师", titleKey: "today.class", desc: t("today.class.desc") }
      : {
          to: "/flashcards",
          seal: "复",
          titleKey: "today.review",
          desc: dueCount > 0 ? `${dueCount} ${t("today.review.due")}` : t("today.review.none"),
          count: dueCount,
        },
    { to: "/tutor", seal: "说", titleKey: "today.speak", desc: t("today.speak.desc") },
    { to: "/grammar", seal: "文", titleKey: "today.grammar", desc: t("today.grammar.desc") },
    { to: "/translator", seal: "译", titleKey: "today.translate", desc: t("today.translate.desc"), tone: "gold" as const },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {greeting}
            {firstName && (language === "ar" ? ` يا ${firstName}` : `, ${firstName}`)}
          </h1>
          <span className="inline-flex mt-2 px-3 py-0.5 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground font-bold text-sm">
            {streak} {t("today.streak")}
          </span>
        </div>
        <Lantern mood={goalDone ? "happy" : hasPracticed ? "idle" : "sleepy"} className="w-24 h-24 md:w-28 md:h-28 shrink-0" />
      </div>

      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("today.goal")}</span>
          <span dir="ltr" className="font-bold tabular-nums">
            {Math.min(xpToday, DAILY_GOAL_XP)} / {DAILY_GOAL_XP} XP
          </span>
        </div>
        <Progress value={(Math.min(xpToday, DAILY_GOAL_XP) / DAILY_GOAL_XP) * 100} />
        {goalDone && <p className="font-semibold text-success-foreground">{t("today.goal.done")}</p>}
        <div>
          <p className="text-muted-foreground mb-3">{t("today.continue.desc")}</p>
          <Link to="/flashcards">
            <Button size="lg" className="w-full">
              {hasPracticed ? t("today.continue") : t("today.start")}
            </Button>
          </Link>
        </div>
      </Card>

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
