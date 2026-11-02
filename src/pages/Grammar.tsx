import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getLesson, type Lesson } from "@/lib/lessons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Lantern from "@/components/lantern/Lantern";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateXpEarned, shouldUpdateStreak } from "@/lib/gamification";
import {
  topicsByLevel, allQuestions, topicFocus, GRAMMAR_TOPICS,
  type GrammarLevel, type GrammarTopic, type GrammarQuestion as GQ,
} from "@/lib/grammarContent";
import { recordGrammarAnswer, getWeakQuestionIds, getWeakCount } from "@/lib/grammarReview";
import GrammarFlashcard from "@/components/grammar/GrammarFlashcard";
import GrammarQuestion from "@/components/grammar/GrammarQuestion";

type View = "topics" | "learn" | "practice" | "complete";
const LEVELS: GrammarLevel[] = ["beginner", "intermediate", "advanced"];

const Grammar = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [view, setView] = useState<View>("topics");
  const [level, setLevel] = useState<GrammarLevel>("beginner");
  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [questions, setQuestions] = useState<GQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [weakCount, setWeakCount] = useState(0);
  // ?lesson=<id>: only the grammar points a teacher picked for the class
  const [params, setParams] = useSearchParams();
  const lessonId = params.get("lesson");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => {
    if (!lessonId) return setLesson(null);
    getLesson(lessonId).then(setLesson).catch(() => setLesson(null));
  }, [lessonId]);

  useEffect(() => {
    if (view === "topics" || view === "complete") setWeakCount(getWeakCount());
  }, [view]);

  const startPractice = (qs: GQ[]) => {
    setQuestions(qs);
    setQIdx(0);
    setCorrectCount(0);
    setAnsweredCurrent(false);
    setView("practice");
  };

  const startTopic = (tp: GrammarTopic) => {
    setTopic(tp);
    setCardIdx(0);
    setView("learn");
  };

  const startReview = () => {
    const weakIds = getWeakQuestionIds();
    if (weakIds.length === 0) return;
    const all = allQuestions();
    const weak = all.filter((q) => weakIds.includes(q.id));
    const fresh = all.filter((q) => !weakIds.includes(q.id)).sort(() => Math.random() - 0.5).slice(0, 3);
    setTopic(null);
    startPractice([...weak, ...fresh].sort(() => Math.random() - 0.5));
  };

  const handleAnswered = (correct: boolean) => {
    recordGrammarAnswer(questions[qIdx].id, correct);
    if (correct) setCorrectCount((c) => c + 1);
    setAnsweredCurrent(true);
  };

  const awardXp = async (xp: number) => {
    if (!user || xp <= 0) return;
    try {
      const { data: progressData } = await (supabase as any)
        .from("progress")
        .select("id, total_xp, current_streak, last_practice_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const streakResult = shouldUpdateStreak(progressData?.last_practice_date ?? null);
      let newStreak = progressData?.current_streak ?? 0;
      if (streakResult.newStreak === -1) {
        // already practiced today — keep streak
      } else if (streakResult.streakBroken) {
        newStreak = 1;
      } else {
        newStreak = newStreak + streakResult.newStreak;
      }

      const payload = {
        total_xp: (progressData?.total_xp ?? 0) + xp,
        current_streak: newStreak,
        last_practice_date: new Date().toISOString().slice(0, 10),
      };
      if (progressData) {
        await (supabase as any).from("progress").update(payload).eq("id", progressData.id);
      } else {
        await (supabase as any).from("progress").insert({ user_id: user.id, ...payload });
      }
    } catch {
      /* XP is best-effort; never block the UI on it */
    }
  };

  const handleNextQuestion = async () => {
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
      setAnsweredCurrent(false);
      return;
    }
    const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    const xp = calculateXpEarned(pct);
    setEarnedXp(xp);
    setView("complete");
    await awardXp(xp);
  };

  const backToTopics = () => {
    setView("topics");
    setTopic(null);
  };

  // ── Topic picker ──────────────────────────────────────────────────────
  if (view === "topics") {
    const topics = lessonId
      ? GRAMMAR_TOPICS.filter((g) => lesson?.grammarIds.includes(g.id))
      : topicsByLevel(level);
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 text-primary">
            {t("grammar.title")}
          </h1>
          <p className="text-muted-foreground">{t("grammar.subtitle")}</p>
        </div>

        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {LEVELS.map((lvl) => (
            <Button
              key={lvl}
              onClick={() => {
                setLevel(lvl);
                if (lessonId) setParams({});
              }}
              variant={!lessonId && level === lvl ? "default" : "outline"}
              className={!lessonId && level === lvl ? "bg-foreground text-background" : ""}
            >
              {t(`common.${lvl}`)}
            </Button>
          ))}
          {weakCount > 0 && (
            <Button onClick={startReview} variant="outline" className="border-primary/40">
              {t("grammar.review_weak")}
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] justify-center">
                {weakCount}
              </Badge>
            </Button>
          )}
        </div>

        {lessonId && lesson && (
          <p className="mb-4 rounded-[12px] border-2 border-stroke bg-accent px-4 py-2 font-bold">
            {t("lesson.from_teacher")}: {lesson.title}
          </p>
        )}

        <div className="space-y-3">
          {topics.length === 0 && (
            <p className="text-center text-muted-foreground py-12">{t("grammar.no_topics")}</p>
          )}
          {topics.map((tp) => (
            <Card
              key={tp.id}
              className="p-4 flex items-center justify-between gap-4 hover:shadow-soft transition-shadow cursor-pointer"
              onClick={() => startTopic(tp)}
            >
              <div>
                <h3 className="text-lg font-bold" lang="zh">{language === "ar" ? tp.titleAr : tp.title}</h3>
                <p className="text-sm text-muted-foreground" dir={language === "ar" ? "rtl" : "ltr"}>
                  {language === "ar" ? tp.blurbAr : tp.blurb}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Learn (flashcards) ────────────────────────────────────────────────
  if (view === "learn" && topic) {
    const card = topic.cards[cardIdx];
    const isLast = cardIdx === topic.cards.length - 1;
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" size="sm" onClick={backToTopics} className="mb-4">
          {t("grammar.topics")}
        </Button>

        <div className="mb-3">
          <h2 className="text-xl font-bold" lang="zh">{language === "ar" ? topic.titleAr : topic.title}</h2>
        </div>
        <Progress value={((cardIdx + 1) / topic.cards.length) * 100} className="h-2 mb-4" />

        <GrammarFlashcard key={cardIdx} card={card} focus={topicFocus(topic)} />

        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={() => setCardIdx((i) => Math.max(0, i - 1))} disabled={cardIdx === 0}>
            {t("grammar.prev")}
          </Button>
          {isLast ? (
            <Button onClick={() => startPractice(topic.questions)} className="bg-gradient-coral">
              {t("grammar.practice")}
            </Button>
          ) : (
            <Button onClick={() => setCardIdx((i) => i + 1)} className="bg-gradient-coral">
              {t("grammar.next")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Practice (selection questions) ────────────────────────────────────
  if (view === "practice" && questions.length > 0) {
    const q = questions[qIdx];
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" size="sm" onClick={backToTopics} className="mb-4">
          {t("grammar.topics")}
        </Button>

        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{t("grammar.practice")}</span>
          <span>{qIdx + 1} / {questions.length}</span>
        </div>
        <Progress value={((qIdx + 1) / questions.length) * 100} className="h-2 mb-4" />

        <GrammarQuestion key={q.id} question={q} onAnswered={handleAnswered} />

        <div className="flex justify-end mt-4">
          <Button onClick={handleNextQuestion} disabled={!answeredCurrent} className="bg-gradient-coral">
            {qIdx < questions.length - 1 ? t("grammar.next") : t("grammar.finish")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Session complete ──────────────────────────────────────────────────
  if (view === "complete") {
    const total = questions.length;
    const pct = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <Lantern mood={pct >= 60 ? "celebrate" : "happy"} className="w-36 h-36 mx-auto mb-2" />
        <h2 className="text-2xl font-bold mb-2">{t("grammar.session_complete")}</h2>
        <p className="text-4xl font-bold mb-2">{correctCount} / {total}</p>
        <p className="text-muted-foreground mb-4">{pct}%</p>
        {earnedXp > 0 && (
          <div className="text-lg font-medium text-primary mb-6">+{earnedXp} XP</div>
        )}
        <div className="flex flex-col gap-3">
          {weakCount > 0 && (
            <Button onClick={startReview} className="bg-gradient-coral">
              {t("grammar.review_weak")} ({weakCount})
            </Button>
          )}
          <Button variant="outline" onClick={backToTopics}>{t("grammar.back_to_topics")}</Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Grammar;
