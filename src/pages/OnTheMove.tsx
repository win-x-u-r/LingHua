import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PathIcon from "@/components/PathIcon";
import Seal from "@/components/Seal";
import { TickMark } from "@/components/grammar/GrammarIcons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ON_THE_MOVE, storeFor, unitPath } from "@/content/courses";
import { loadProgress } from "@/lib/foundationProgress";
import { PATH_ZH } from "@/lib/learningPaths";
import { cn } from "@/lib/utils";

const TOOLS = [
  { to: "/move/phrases", seal: "语", titleKey: "move.tool.phrases", descKey: "move.tool.phrases.desc", tone: "red" as const },
  { to: "/move/nearby", seal: "近", titleKey: "move.tool.nearby", descKey: "move.tool.nearby.desc", tone: "gold" as const },
  { to: "/move/trains", seal: "铁", titleKey: "move.tool.trains", descKey: "move.tool.trains.desc", tone: "red" as const },
  { to: "/move/taxi", seal: "车", titleKey: "move.tool.taxi", descKey: "move.tool.taxi.desc", tone: "gold" as const },
  { to: "/move/numbers", seal: "数", titleKey: "move.tool.numbers", descKey: "move.tool.numbers.desc", tone: "red" as const },
  { to: "/move/etiquette", seal: "礼", titleKey: "move.tool.etiquette", descKey: "move.tool.etiquette.desc", tone: "gold" as const },
];

/** Mandarin on the Move: the course for business travellers, open to visitors */
const OnTheMove = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const units = ON_THE_MOVE.units.map((unit) => {
    const done = loadProgress(user?.id, storeFor(unit)).lessons;
    return { unit, done: unit.lessons.filter((l) => done[l.key]).length };
  });
  const next = units.flatMap(({ unit }) => {
    const done = loadProgress(user?.id, storeFor(unit)).lessons;
    return unit.lessons.filter((l) => !done[l.key]).map((l) => ({ unit, lesson: l }));
  })[0];
  const started = units.some((u) => u.done > 0);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-8">
      <header className="flex items-center gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <span lang="zh" className="block font-zh font-bold text-primary text-xl">{PATH_ZH.on_the_move}</span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t("path.on_the_move")}</h1>
          <p className="text-lg text-muted-foreground mt-2">{t("move.hub.sub")}</p>
        </div>
        <PathIcon path="on_the_move" className="w-20 h-20 md:w-28 md:h-28 shrink-0" />
      </header>

      {next && (
        <Link to={`/move/${next.lesson.key}`}>
          <Button size="lg" className="w-full">
            {started ? t("move.hub.continue") : t("move.hub.start")} · {next.lesson.title[language]}
          </Button>
        </Link>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="course">
        <h2 id="course" className="text-2xl font-bold">
          {t("move.hub.course")} <span lang="zh" className="font-zh font-normal text-muted-foreground">· 课程</span>
        </h2>
        <ol className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {units.map(({ unit, done }) => {
            const complete = done === unit.lessons.length;
            const isNext = next?.unit === unit;
            return (
              <li key={unit.key} className="border-b-2 border-border last:border-b-0">
                <Link to={unitPath(ON_THE_MOVE, unit)} className="flex items-center gap-4 p-4">
                  <span
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-full border-2 border-stroke flex items-center justify-center font-bold text-lg",
                      isNext ? "bg-primary text-primary-foreground" : complete ? "bg-sunshine text-sunshine-foreground" : "bg-card",
                    )}
                  >
                    {complete ? <TickMark className="size-7" /> : unit.number}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-bold leading-tight">
                      {unit.title[language]} <bdi lang="zh" dir="ltr" className="font-zh text-primary">{unit.zh}</bdi>
                    </span>
                    <span className="block text-sm text-muted-foreground">{unit.outcome[language]}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-muted-foreground shrink-0">
                    {done}/{unit.lessons.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="toolkit">
        <h2 id="toolkit" className="text-2xl font-bold">
          {t("move.hub.toolkit")} <span lang="zh" className="font-zh font-normal text-muted-foreground">· 工具</span>
        </h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {TOOLS.map((tool) => (
            <li key={tool.to} className="border-b-2 border-border last:border-b-0">
              <Link to={tool.to} className="flex items-center gap-4 p-4">
                <Seal char={tool.seal} tone={tool.tone} />
                <span className="flex-1 min-w-0">
                  <span className="block text-lg font-bold leading-tight">{t(tool.titleKey)}</span>
                  <span className="block text-sm text-muted-foreground">{t(tool.descKey)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!user && (
        <section className="rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("move.save.title")}</h2>
          <p className="text-muted-foreground">{t("move.save.desc")}</p>
          <Link to="/auth?mode=signup&path=on_the_move">
            <Button size="lg" className="w-full">{t("move.save.cta")}</Button>
          </Link>
        </section>
      )}
    </div>
  );
};

export default OnTheMove;
