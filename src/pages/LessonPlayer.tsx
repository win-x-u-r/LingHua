import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import { TickMark, CrossMark } from "@/components/grammar/GrammarIcons";
import {
  type ActivityResult,
  SceneActivity,
  WordActivity,
  NoteActivity,
  TonesActivity,
  SayActivity,
  TonePickActivity,
  ChoiceActivity,
  MatchActivity,
  OrderActivity,
  CanDoActivity,
} from "@/components/learn/Activities";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PASS_MARKS } from "@/content/foundation1/unit1";
import { findLesson, storeFor, unitPath, FOUNDATION1 } from "@/content/courses";
import type { Activity, StepId } from "@/content/foundation1/types";
import { loadProgress, saveProgress, type CanDoAnswer, type LessonResult } from "@/lib/foundationProgress";
import { cn } from "@/lib/utils";

interface Flat {
  step: StepId;
  stepIndex: number;
  activity: Activity;
}

/** Plays one Foundation lesson: five steps, one activity at a time */
const LessonPlayer = () => {
  const { key = "" } = useParams();
  const found = findLesson(key);
  const lesson = found?.lesson ?? null;
  const course = found?.course ?? FOUNDATION1;
  const unit = found?.unit ?? course.units[0];
  const store = storeFor(unit);
  const back = unitPath(course, unit);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const flat = useMemo<Flat[]>(
    () => lesson?.steps.flatMap((s, stepIndex) => s.activities.map((activity) => ({ step: s.id, stepIndex, activity }))) ?? [],
    [lesson],
  );
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [scores, setScores] = useState<Record<string, { right: number; total: number }>>({});
  const [spoken, setSpoken] = useState({ done: 0, total: 0 });
  const [pending, setPending] = useState<ActivityResult | undefined>();
  const [finished, setFinished] = useState<LessonResult | null>(null);
  const [canDo, setCanDo] = useState<Record<number, CanDoAnswer>>(() => loadProgress(user?.id, store).canDo);

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link to={back}><Button>{t("learn.back_unit")}</Button></Link>
      </div>
    );
  }

  const current = flat[index];
  const lessonIndex = unit.lessons.findIndex((l) => l.key === lesson.key);
  // After a unit's last lesson, carry on into the next unit
  const nextLesson = unit.lessons[lessonIndex + 1] ?? course.units[course.units.indexOf(unit) + 1]?.lessons[0];

  const onReady = (result?: ActivityResult) => {
    setPending(result);
    setReady(true);
  };

  /** Add this activity's result, then move on or finish */
  const advance = () => {
    const step = current.step;
    const nextScores = { ...scores };
    const nextSpoken = { ...spoken };
    if (pending?.total) {
      const s = nextScores[step] ?? { right: 0, total: 0 };
      nextScores[step] = { right: s.right + (pending.right ?? 0), total: s.total + pending.total };
    }
    if (pending && "spoken" in pending) {
      nextSpoken.total += 1;
      if (pending.spoken) nextSpoken.done += 1;
    }
    setScores(nextScores);
    setSpoken(nextSpoken);
    setPending(undefined);
    setReady(false);

    if (index < flat.length - 1) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }

    const result: LessonResult = { finishedAt: new Date().toISOString(), scores: nextScores, spoken: nextSpoken };
    if (lesson.isCheck) {
      const partsPass = Object.entries(PASS_MARKS).every(([part, mark]) => {
        const s = nextScores[part];
        return !s || s.right / s.total >= (mark ?? 0);
      });
      result.passed = partsPass && nextSpoken.done === nextSpoken.total;
    }
    const progress = loadProgress(user?.id, store);
    // Keep a passed check passed, even if a later practice run goes less well
    const before = progress.lessons[lesson.key];
    progress.lessons[lesson.key] = before?.passed && !result.passed ? { ...result, passed: true } : result;
    progress.canDo = canDo;
    saveProgress(user?.id, progress, store);
    setFinished(result);
    window.scrollTo({ top: 0 });
  };

  const answerCanDo = (i: number, a: CanDoAnswer) => {
    const next = { ...canDo, [i]: a };
    setCanDo(next);
  };

  const renderActivity = (a: Activity) => {
    switch (a.kind) {
      case "scene": return <SceneActivity activity={a} onReady={onReady} />;
      case "word": return <WordActivity activity={a} onReady={onReady} />;
      case "note": return <NoteActivity activity={a} onReady={onReady} />;
      case "tones": return <TonesActivity activity={a} onReady={onReady} />;
      case "say": return <SayActivity activity={a} onReady={onReady} />;
      case "tonePick": return <TonePickActivity activity={a} onReady={onReady} />;
      case "choice": return <ChoiceActivity activity={a} onReady={onReady} />;
      case "match": return <MatchActivity activity={a} onReady={onReady} />;
      case "order": return <OrderActivity activity={a} onReady={onReady} />;
      case "canDo": return <CanDoActivity statements={unit.canDo} answers={canDo} onAnswer={answerCanDo} onReady={() => onReady()} />;
    }
  };

  /* ───────── the end of the lesson ───────── */
  if (finished) {
    const passed = finished.passed;
    const stepsWithScores = lesson.steps.filter((s) => finished.scores[s.id]);
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6 items-center text-center">
        <div className="lantern-glow [--glow-size:200%] [--glow-y:55%]">
          <Lantern mood={lesson.isCheck && !passed ? "happy" : "celebrate"} className="w-32 h-32 md:w-40 md:h-40" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-balance">
          {lesson.isCheck ? (passed ? t("learn.finish.check_pass") : t("learn.not_yet")) : t("learn.finish.title")}
        </h1>
        {lesson.isCheck && !passed && <p className="text-lg text-muted-foreground max-w-md">{t("learn.finish.check_retry")}</p>}
        {lesson.isCheck && passed && <p className="text-lg font-bold text-success-foreground">{t("learn.lit").replace("{n}", String(unit.number))}</p>}

        <ul className="w-full flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden text-start">
          {stepsWithScores.map((s) => {
            const sc = finished.scores[s.id];
            const mark = PASS_MARKS[s.id];
            const ok = !lesson.isCheck || !mark || sc.right / sc.total >= mark;
            return (
              <li key={s.id} className="flex items-center gap-3 p-4 border-b-2 border-border last:border-b-0">
                {lesson.isCheck && (ok ? <TickMark /> : <CrossMark />)}
                <span className="flex-1 font-bold">{t(`step.${s.id}`)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {t("learn.finish.score").replace("{r}", String(sc.right)).replace("{n}", String(sc.total))}
                </span>
              </li>
            );
          })}
          {finished.spoken.total > 0 && (
            <li className="flex items-center gap-3 p-4">
              {lesson.isCheck && (finished.spoken.done === finished.spoken.total ? <TickMark /> : <CrossMark />)}
              <span className="flex-1 font-bold">{t("step.speaking")}</span>
              <span className="text-muted-foreground tabular-nums">
                {t("learn.finish.spoken").replace("{d}", String(finished.spoken.done)).replace("{n}", String(finished.spoken.total))}
              </span>
            </li>
          )}
        </ul>

        <div className="flex flex-wrap justify-center gap-3">
          {nextLesson && (
            <Button size="lg" onClick={() => navigate(`${course.base}/${nextLesson.key}`, { replace: true })}>
              {nextLesson.isCheck ? t("learn.take_check") : t("learn.next")}
            </Button>
          )}
          <Link to={back}>
            <Button size="lg" variant={nextLesson ? "outline" : "default"}>{t("learn.back_unit")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ───────── a lesson in progress ───────── */
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-2xl flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("learn.unit").replace("{n}", String(unit.number))} · {unit.title[language]}
            </span>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              {lesson.title[language]} <bdi lang="zh" dir="ltr" className="font-zh text-primary">{lesson.zh}</bdi>
            </h1>
          </div>
          <Link to={back}>
            <Button variant="ghost" size="sm">{t("learn.exit")}</Button>
          </Link>
        </div>
        {/* The five steps; the current one is filled */}
        <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${lesson.steps.length}, minmax(0, 1fr))` }}>
          {lesson.steps.map((s, i) => (
            <li key={s.id} className="flex flex-col gap-1" aria-current={i === current.stepIndex ? "step" : undefined}>
              <span
                className={cn(
                  "h-2.5 rounded-full border-2 border-stroke",
                  i < current.stepIndex ? "bg-sunshine" : i === current.stepIndex ? "bg-primary" : "bg-card",
                )}
              />
              <span className={cn("text-[11px] sm:text-xs font-bold leading-tight", i === current.stepIndex ? "text-foreground" : "text-muted-foreground")}>
                {t(`step.${s.id}`)}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <main key={index}>{renderActivity(current.activity)}</main>

      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background border-t-2 border-border">
        <Button size="lg" className="w-full" onClick={advance} disabled={!ready}>
          {t("learn.continue")}
        </Button>
      </div>
    </div>
  );
};

/** A fresh player for each lesson, so moving to the next lesson starts clean */
const LessonPlayerRoute = () => {
  const { key = "" } = useParams();
  return <LessonPlayer key={key} />;
};

export default LessonPlayerRoute;
