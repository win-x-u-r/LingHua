import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { supabase } from "@/integrations/supabase/client";
import { speakText, pronounceAndScore, getBreakdown, type PhonemeSegment, type ScoreResponse } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateWordReview, getDueWords } from "@/lib/spacedRepetition";
import { shouldUpdateStreak } from "@/lib/gamification";
import StrokeOrder from "@/components/StrokeOrder";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import ScoreResult from "@/components/ScoreResult";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";

type Level = "beginner" | "intermediate" | "advanced";
type Mode = Level | "review";

interface VocabWord {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic_translation: string;
  level: Level;
  image_url?: string;
  category?: string;
}

const Flashcards = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [level, setLevel] = useState<Level>("beginner");
  const [mode, setMode] = useState<Mode>("beginner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xp, setXp] = useState(0);
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [cardBreakdown, setCardBreakdown] = useState<PhonemeSegment[]>([]);
  // The last score shows beside the card instead of in a toast, so it stays readable
  const [result, setResult] = useState<(ScoreResponse & { earnedXp: number }) | null>(null);
  const [scoreFailed, setScoreFailed] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

  // Load due word count on mount and when user changes
  useEffect(() => {
    if (user) {
      loadDueCount();
    }
  }, [user]);

  useEffect(() => {
    if (mode === "review") {
      loadReviewWords();
    } else {
      loadVocabulary();
    }
    loadProgress();
  }, [mode, level]);

  // Handle mic errors
  useEffect(() => {
    if (micError) {
      toast({ title: t("common.mic_error"), description: micError, variant: "destructive" });
    }
  }, [micError, toast]);

  // Fetch the clickable phoneme breakdown for the current word so each
  // character/pinyin/tone/Arabic segment on the card back is tap-to-hear.
  useEffect(() => {
    setResult(null);
    setScoreFailed(false);
  }, [vocabulary, currentIndex]);

  useEffect(() => {
    const word = vocabulary[currentIndex];
    if (!word?.hanzi) {
      setCardBreakdown([]);
      return;
    }
    getBreakdown(word.hanzi)
      .then(setCardBreakdown)
      .catch(() => setCardBreakdown([]));
  }, [vocabulary, currentIndex]);

  // Process recorded audio via Huawei ASR + MindSpore scoring
  useEffect(() => {
    if (!audioBlob || !vocabulary[currentIndex]) return;

    const processAudio = async () => {
      setIsScoring(true);
      setResult(null);
      setScoreFailed(false);
      const currentWord = vocabulary[currentIndex];

      try {
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        const result = await pronounceAndScore(file, currentWord.hanzi);

        // Save attempt (linked to user)
        await (supabase as any).from("attempts").insert({
          vocab_id: currentWord.id,
          score: result.score,
          user_id: user?.id,
        });

        // Track spaced repetition review
        if (user) {
          await updateWordReview(supabase, user.id, currentWord.id, result.score);
          loadDueCount();
        }

        // Update XP
        const earnedXp = Math.floor(result.score / 10);
        const newXp = xp + earnedXp;
        setXp(newXp);

        if (user) {
          // Compute completed_words (mastered = scored 85+ at least 3 times) and avg_score
          // from ALL attempts so the dashboard summary stats are accurate.
          const { data: allAttempts } = await (supabase as any)
            .from("attempts")
            .select("vocab_id, score")
            .eq("user_id", user.id);

          const attemptsList = (allAttempts || []) as Array<{ vocab_id: string; score: number }>;
          const validScores = attemptsList.filter((a) => a.score != null);

          const avgScore =
            validScores.length > 0
              ? Math.round(validScores.reduce((sum, a) => sum + a.score, 0) / validScores.length)
              : 0;

          // Count distinct words where best score >= 85 (mastered)
          const wordBestScore: Record<string, number> = {};
          for (const a of validScores) {
            if (!a.vocab_id) continue;
            if (!wordBestScore[a.vocab_id] || a.score > wordBestScore[a.vocab_id]) {
              wordBestScore[a.vocab_id] = a.score;
            }
          }
          const completedWords = Object.values(wordBestScore).filter((s) => s >= 85).length;

          const { data: progressData } = await (supabase as any)
            .from("progress")
            .select("id, current_streak, last_practice_date")
            .eq("user_id", user.id)
            .maybeSingle();

          // Compute new streak based on last practice date
          const streakResult = shouldUpdateStreak(progressData?.last_practice_date ?? null);
          let newStreak = progressData?.current_streak ?? 0;
          if (streakResult.newStreak === -1) {
            // Already practiced today, no change
          } else if (streakResult.streakBroken) {
            newStreak = 1; // Streak was broken, reset to 1
          } else {
            newStreak = newStreak + streakResult.newStreak; // Continue streak
          }

          const updatePayload = {
            total_xp: newXp,
            avg_score: avgScore,
            completed_words: completedWords,
            current_streak: newStreak,
            last_practice_date: new Date().toISOString().slice(0, 10),
          };
          if (progressData) {
            await (supabase as any).from("progress").update(updatePayload).eq("id", progressData.id);
          } else {
            await (supabase as any).from("progress").insert({ user_id: user.id, ...updatePayload });
          }
        }

        setSessionXp((x) => x + earnedXp);
        setResult({ ...result, earnedXp });
      } catch {
        setScoreFailed(true);
        toast({
          title: t("common.error"),
          description: t("flashcards.scoring_failed_desc"),
          variant: "destructive",
        });
      } finally {
        setIsScoring(false);
      }
    };

    processAudio();
  }, [audioBlob]);

  const loadDueCount = async () => {
    if (!user) return;
    const dueWords = await getDueWords(supabase, user.id);
    setDueCount(dueWords.length);
  };

  const loadReviewWords = async () => {
    if (!user) {
      setVocabulary([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const dueWords = await getDueWords(supabase, user.id);
    const mapped: VocabWord[] = dueWords.map((w) => ({
      id: w.id,
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      arabic_translation: w.arabic_translation,
      level: w.level as Level,
      image_url: w.image_url,
      category: w.category,
    }));
    setVocabulary(mapped);
    setDueCount(mapped.length);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFinished(false);
    setLoading(false);
  };

  const loadVocabulary = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vocab")
      .select("*")
      .eq("level", level);

    if (error) {
      toast({ title: t("common.error"), description: "Failed to load vocabulary", variant: "destructive" });
    } else {
      setVocabulary((data as VocabWord[]) || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setFinished(false);
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("progress")
      .select("total_xp")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setXp(data.total_xp);
  };

  const handleStrokeComplete = async () => {
    if (!user) return;
    const earnedXp = 2; // 2 XP per correct stroke completion
    const newXp = xp + earnedXp;
    setXp(newXp);

    const { data: progressData } = await (supabase as any)
      .from("progress")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (progressData) {
      await (supabase as any).from("progress").update({ total_xp: newXp }).eq("id", progressData.id);
    } else {
      await (supabase as any).from("progress").insert({ user_id: user.id, total_xp: newXp });
    }

    toast({
      title: t("flashcards.stroke_complete"),
      description: `+${earnedXp} XP`,
    });
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setResult(null);
      setScoreFailed(false);
      await startRecording();
    }
  };

  const handleSelectMode = (newMode: Mode) => {
    if (newMode === "review") {
      setMode("review");
    } else {
      setLevel(newMode);
      setMode(newMode);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    if (mode === "review") loadReviewWords();
  };

  const handleSpeak = async () => {
    if (!vocabulary[currentIndex] || isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakText(vocabulary[currentIndex].hanzi, "zh");
    } catch {
      toast({ title: t("flashcards.tts_failed"), description: t("flashcards.tts_failed_desc"), variant: "destructive" });
    } finally {
      setIsSpeaking(false);
    }
  };

  const modes: Mode[] = user ? ["beginner", "intermediate", "advanced", "review"] : ["beginner", "intermediate", "advanced"];

  const header = (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{t("flashcards.title")}</h1>
        <span className="px-3 py-1 rounded-full border-2 border-stroke bg-secondary text-secondary-foreground font-bold tabular-nums">
          <span dir="ltr">{xp} XP</span>
        </span>
      </div>

      <div
        role="tablist"
        className={`grid grid-cols-2 ${user ? "sm:grid-cols-4" : "sm:grid-cols-3"} border-2 border-stroke rounded-[10px] overflow-hidden font-bold mb-6 bg-card`}
      >
        {modes.map((m, i) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => handleSelectMode(m)}
            className={`py-2 px-3 border-border ${i % 2 === 0 ? "border-e-2" : ""} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""} ${
              i < modes.length - 1 ? "sm:border-e-2" : "sm:border-e-0"
            } ${mode === m ? "bg-foreground text-background" : ""}`}
          >
            {m === "review" ? t("flashcards.review_due") : t(`common.${m}`)}
            {m === "review" && dueCount > 0 && (
              <span className="ms-2 inline-flex min-w-6 justify-center rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5 tabular-nums">
                {dueCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {header}
        <div className="flex flex-col items-center gap-3 py-16">
          <Lantern mood="thinking" className="w-36 h-36" />
          <p className="text-muted-foreground">{t("flashcards.loading")}</p>
        </div>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {header}
        <Card className="p-8 flex flex-col items-center text-center gap-4">
          <Lantern mood={mode === "review" ? "happy" : "sleepy"} className="w-36 h-36" />
          <p className="text-lg max-w-md">{mode === "review" ? t("flashcards.no_reviews_due") : t("flashcards.no_vocab")}</p>
          {mode === "review" && <Button onClick={() => handleSelectMode(level)}>{t(`common.${level}`)}</Button>}
        </Card>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {header}
        <Card className="p-8 flex flex-col items-center text-center gap-5">
          <Lantern mood="celebrate" className="w-44 h-44" />
          <h2 className="text-3xl font-bold">{mode === "review" ? t("flashcards.done.review") : t("flashcards.done.title")}</h2>
          <dl className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="rounded-[10px] border-2 border-stroke p-3">
              <dt className="text-sm text-muted-foreground">{t("flashcards.done.xp")}</dt>
              <dd className="text-3xl font-bold tabular-nums" dir="ltr">+{sessionXp}</dd>
            </div>
            <div className="rounded-[10px] border-2 border-stroke p-3">
              <dt className="text-sm text-muted-foreground">{t("flashcards.done.words")}</dt>
              <dd className="text-3xl font-bold tabular-nums">{vocabulary.length}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={handleRestart}>{t("flashcards.again")}</Button>
            <Link to="/">
              <Button size="lg" variant="outline">{t("flashcards.back_today")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentWord = vocabulary[currentIndex];
  const progress = ((currentIndex + 1) / vocabulary.length) * 100;
  const isLast = currentIndex === vocabulary.length - 1;

  // The lantern follows each step of saying a word
  const lanternMood: LanternMood = isRecording
    ? "listening"
    : isScoring
      ? "thinking"
      : result
        ? result.score >= 85 ? "celebrate" : result.score >= 60 ? "happy" : "sad"
        : scoreFailed
          ? "sad"
          : "idle";

  const coachLine = isRecording
    ? t("flashcards.listening")
    : isScoring
      ? t("flashcards.thinking")
      : result
        ? t(result.score >= 85 ? "flashcards.result.great" : result.score >= 60 ? "flashcards.result.almost" : "flashcards.result.again")
        : scoreFailed
          ? t("flashcards.scoring_failed_desc")
          : t("flashcards.hint");

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <audio ref={audioRef} className="hidden" />
      {header}

      <div className="flex items-center gap-3 mb-4">
        <Progress value={progress} className="h-3 flex-1" aria-label={t("flashcards.progress")} />
        <span className="text-sm font-bold tabular-nums" dir="ltr">
          {currentIndex + 1} / {vocabulary.length}
        </span>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_17rem] gap-6 items-start">
        <div className="flex flex-col gap-4">
          {/* Flip card: the word on the front, the answer on the back */}
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isFlipped}
            aria-label={t("flashcards.tap_show_answer")}
            className="cursor-pointer rounded-[14px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(!isFlipped)}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFlipped(!isFlipped);
              }
            }}
          >
            <div
              className="relative w-full min-h-[380px] md:min-h-[440px] transition-transform duration-500"
              style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              <Card
                className="absolute inset-0 p-8 flex flex-col items-center justify-center gap-4"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {mode === "review" ? t("flashcards.review_mode") : t(`common.${level}`)}
                </span>
                <span lang="zh" className="font-zh font-bold text-8xl md:text-9xl leading-none">{currentWord.hanzi}</span>
                <span className="text-sm text-muted-foreground mt-4">{t("flashcards.tap_show_answer")}</span>
              </Card>

              <Card
                className="absolute inset-0 p-6 flex flex-col items-center gap-3 overflow-y-auto"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span lang="zh" className="font-zh font-bold text-6xl leading-tight">{currentWord.hanzi}</span>
                <span className="font-pinyin text-2xl font-bold text-primary">{currentWord.pinyin}</span>
                <span lang="ar" dir="rtl" className="text-2xl">{currentWord.arabic_translation}</span>

                {cardBreakdown.length > 0 && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <PronunciationFeedback segments={cardBreakdown} compact />
                  </div>
                )}

                {currentWord.image_url && (
                  <img src={currentWord.image_url} alt={currentWord.pinyin} className="w-24 h-24 object-contain rounded-lg" />
                )}

                <div className="mt-2 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-sm font-bold text-muted-foreground mb-2">{t("flashcards.stroke_order")}</h2>
                  <div className="flex gap-4 justify-center flex-wrap">
                    {[...currentWord.hanzi].map((char, idx) => (
                      <StrokeOrder key={`${currentWord.id}-${char}-${idx}`} character={char} onQuizComplete={handleStrokeComplete} />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <Button size="lg" variant="outline" onClick={handleSpeak} disabled={isSpeaking}>
              <span lang="zh" className="font-zh me-2">听</span>
              {t("flashcards.listen")}
            </Button>
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={handleMicToggle}
              disabled={isScoring}
              aria-pressed={isRecording}
            >
              <span lang="zh" className="font-zh me-2">说</span>
              {isRecording ? t("flashcards.stop") : isScoring ? t("flashcards.scoring") : t("flashcards.pronounce")}
            </Button>
            <Button size="lg" variant="secondary" onClick={handleNext} className="col-span-2 sm:col-span-1">
              {isLast ? t("flashcards.finish") : t("flashcards.next")}
            </Button>
          </div>
        </div>

        {/* Coach: the lantern, what to do next, and the last score */}
        <aside className="flex flex-col gap-4" aria-live="polite">
          <Card className="p-5 flex flex-col items-center text-center gap-3">
            <Lantern mood={lanternMood} className="w-32 h-32 md:w-40 md:h-40" />
            <p className="font-semibold">{coachLine}</p>
          </Card>

          {result && <ScoreResult result={result} earnedXp={result.earnedXp} />}
        </aside>
      </div>
    </div>
  );
};

export default Flashcards;
