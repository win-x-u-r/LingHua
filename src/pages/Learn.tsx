import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import { TickMark } from "@/components/grammar/GrammarIcons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { UNIT1 } from "@/content/foundation1/unit1";
import { loadProgress } from "@/lib/foundationProgress";
import { cn } from "@/lib/utils";

/** Foundation 1, Unit 1: the three lessons and the unit check */
const Learn = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const progress = loadProgress(user?.id);
  const unit = UNIT1;
  const check = progress.lessons["f1.u1.check"];
  const lit = !!check?.passed;
  const nextKey = unit.lessons.find((l) => !progress.lessons[l.key])?.key;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("learn.f1")}</span>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {t("learn.unit").replace("{n}", String(unit.number))} · {unit.title[language]}
          </h1>
          <span lang="zh" className="font-zh font-bold text-primary text-xl">{unit.zh}</span>
        </div>
        <div className={cn(lit && "lantern-glow [--glow-size:200%] [--glow-y:55%]")}>
          <Lantern mood={lit ? "celebrate" : "idle"} className="w-24 h-24 md:w-28 md:h-28 shrink-0" />
        </div>
      </div>

      {lit && <p className="font-bold text-success-foreground">{t("learn.lit")}</p>}

      <section className="rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card p-5 flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("learn.outcome")}</h2>
        <p className="text-lg font-semibold">{unit.outcome[language]}</p>
      </section>

      <ol className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
        {unit.lessons.map((l, i) => {
          const result = progress.lessons[l.key];
          const isNext = l.key === nextKey;
          const status = result ? (l.isCheck ? (result.passed ? t("learn.passed") : t("learn.not_yet")) : t("learn.done")) : null;
          return (
            <li key={l.key} className="border-b-2 border-border last:border-b-0 p-4 flex items-center gap-4">
              <span
                className={cn(
                  "w-10 h-10 shrink-0 rounded-full border-2 border-stroke flex items-center justify-center font-bold",
                  isNext ? "bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {result && (!l.isCheck || result.passed) ? <TickMark className="size-7" /> : l.isCheck ? <span lang="zh" className="font-zh">考</span> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-lg font-bold leading-tight">{l.title[language]}</span>
                <span className="block text-sm text-muted-foreground">
                  <bdi lang="zh" dir="ltr" className="font-zh">{l.zh}</bdi> · {t("learn.min").replace("{n}", String(l.minutes))}
                  {status && <> · <span className="font-bold text-foreground">{status}</span></>}
                </span>
              </div>
              <Link to={`/learn/${l.key}`}>
                <Button size="sm" variant={isNext ? "default" : "outline"}>
                  {result ? t("learn.again") : l.isCheck ? t("learn.take_check") : t("learn.start")}
                </Button>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Learn;
