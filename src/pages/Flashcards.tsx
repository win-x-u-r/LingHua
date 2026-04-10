import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Volume2, ChevronRight, Star, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { supabase } from "@/integrations/supabase/client";
import { speakText, pronounceAndScore } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateWordReview, getDueWords } from "@/lib/spacedRepetition";
import StrokeOrder from "@/components/StrokeOrder";

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
  const [dueCount, setDueCount] = useState(0);
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

  // Process recorded audio via Huawei ASR + MindSpore scoring
  useEffect(() => {
    if (!audioBlob || !vocabulary[currentIndex]) return;

    const processAudio = async () => {
      setIsScoring(true);
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
        }

        // Detailed feedback with breakdown
        const { breakdown } = result;
        const details = [
          `Characters: ${breakdown.character.score}%`,
          `Pinyin: ${breakdown.pinyin.score}%`,
          `Tones: ${breakdown.tone.score}%`,
        ].join(" | ");

        let feedback = "";
        let variant: "default" | "destructive" = "default";
        if (result.score >= 85) {
          feedback = `${t("flashcards.perfect")} (${details})`;
        } else if (result.score >= 60) {
          feedback = `${t("flashcards.almost_there")} (${details})`;
        } else {
          feedback = `${t("flashcards.keep_practicing_toast")} (${details})`;
          variant = "destructive";
        }

        if (result.recognized) {
          feedback += ` — Heard: "${result.recognized}"`;
        }

        toast({ title: `Score: ${result.score}/100 (+${earnedXp} XP)`, description: feedback, variant });
      } catch {
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

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
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
    } else if (mode === "review") {
      toast({ title: t("flashcards.review_complete"), description: t("flashcards.review_complete_desc") });
    } else {
      toast({ title: t("flashcards.level_complete"), description: t("flashcards.level_complete_desc") });
    }
  };

  const handleSpeak = async () => {
    if (!vocabulary[currentIndex]) return;
    try {
      await speakText(vocabulary[currentIndex].hanzi, "zh");
    } catch {
      toast({ title: t("flashcards.tts_failed"), description: t("flashcards.tts_failed_desc"), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-muted-foreground">{t("flashcards.loading")}</p>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">
          {mode === "review" ? t("flashcards.no_reviews_due") : t("flashcards.no_vocab")}
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          {(["beginner", "intermediate", "advanced"] as Level[]).map((lvl) => (
            <Button key={lvl} onClick={() => handleSelectMode(lvl)} variant="outline">
              {t(`common.${lvl}`)}
            </Button>
          ))}
          {user && (
            <Button
              onClick={() => handleSelectMode("review")}
              variant={mode === "review" ? "default" : "outline"}
              className={mode === "review" ? "bg-gradient-coral" : ""}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("flashcards.review_due")}
              {dueCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] justify-center">
                  {dueCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentWord = vocabulary[currentIndex];
  const progress = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <audio ref={audioRef} className="hidden" />

        {/* Header with XP */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-mint bg-clip-text text-transparent">
            {t("flashcards.title")}
          </h1>
          <div className="flex items-center gap-2 bg-sunshine/20 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-sunshine-foreground" fill="currentColor" />
            <span className="font-bold text-sunshine-foreground">{xp} XP</span>
          </div>
        </div>

        {/* Level Selector + Review Due */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {(["beginner", "intermediate", "advanced"] as Level[]).map((lvl) => (
            <Button
              key={lvl}
              onClick={() => handleSelectMode(lvl)}
              variant={mode === lvl ? "default" : "outline"}
              className={mode === lvl ? "bg-gradient-mint" : ""}
            >
              {t(`common.${lvl}`)}
            </Button>
          ))}
          {user && (
            <Button
              onClick={() => handleSelectMode("review")}
              variant={mode === "review" ? "default" : "outline"}
              className={mode === "review" ? "bg-gradient-coral" : ""}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("flashcards.review_due")}
              {dueCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] justify-center">
                  {dueCount}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{t("flashcards.progress")}</span>
            <span>{currentIndex + 1} / {vocabulary.length}</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* 3D Flip Card */}
        <div
          className="flashcard-container mb-6 cursor-pointer overflow-hidden"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`flashcard-inner relative w-full min-h-[400px] transition-transform duration-500`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front: Hanzi */}
            <Card
              className="absolute inset-0 p-8 bg-gradient-to-br from-card to-muted/20 shadow-glow border-2 border-primary/10 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary">
                {mode === "review" ? t("flashcards.review_mode") : level}
              </Badge>
              <div className="text-7xl font-bold mb-4 mt-2 text-foreground animate-bounce-in">
                {currentWord.hanzi}
              </div>
              <div className="flex gap-4 mb-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="lg"
                  onClick={handleSpeak}
                  className="bg-gradient-lavender hover:scale-105 transition-transform"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  {t("flashcards.listen")}
                </Button>
                <Button
                  size="lg"
                  onClick={handleMicToggle}
                  disabled={isScoring}
                  className={`transition-transform ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-gradient-coral hover:scale-105"
                  }`}
                >
                  {isRecording ? (
                    <><MicOff className="w-5 h-5 mr-2" />{t("flashcards.stop")}</>
                  ) : isScoring ? (
                    t("flashcards.scoring")
                  ) : (
                    <><Mic className="w-5 h-5 mr-2" />{t("flashcards.try_pronunciation")}</>
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">{t("flashcards.tap_show_answer")}</p>
            </Card>

            {/* Back: Pinyin + Arabic + Actions */}
            <Card
              className="absolute inset-0 p-8 bg-gradient-to-br from-card to-muted/20 shadow-glow border-2 border-secondary/10 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-5xl font-bold mb-4 text-foreground">{currentWord.hanzi}</div>
              <div className="text-2xl text-muted-foreground mb-2">{currentWord.pinyin}</div>
              <div className="text-xl font-medium mb-6" dir="rtl">{currentWord.arabic_translation}</div>

              {currentWord.image_url && (
                <img
                  src={currentWord.image_url}
                  alt={currentWord.pinyin}
                  className="w-24 h-24 object-contain mb-4 rounded-lg"
                />
              )}

              {/* Stroke Order */}
              <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  {t("flashcards.stroke_order")}
                </h4>
                <div className="flex gap-4 justify-center flex-wrap">
                  {[...currentWord.hanzi].map((char, idx) => (
                    <StrokeOrder key={`${currentWord.id}-${char}-${idx}`} character={char} />
                  ))}
                </div>
              </div>

              <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="lg"
                  onClick={handleSpeak}
                  className="bg-gradient-lavender hover:scale-105 transition-transform"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  {t("flashcards.listen")}
                </Button>

                <Button
                  size="lg"
                  onClick={handleMicToggle}
                  disabled={isScoring}
                  className={`transition-transform ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-coral hover:scale-105"
                  }`}
                >
                  {isRecording ? (
                    <><MicOff className="w-5 h-5 mr-2" />{t("flashcards.stop")}</>
                  ) : isScoring ? (
                    t("flashcards.scoring")
                  ) : (
                    <><Mic className="w-5 h-5 mr-2" />{t("flashcards.pronounce")}</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {t("flashcards.keep_practicing")}
          </div>
          <Button
            onClick={handleNext}
            disabled={currentIndex === vocabulary.length - 1}
            className="bg-gradient-coral hover:scale-105 transition-transform"
          >
            {t("flashcards.next")}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Feedback Legend */}
        <Card className="mt-8 p-6 bg-muted/30">
          <h3 className="font-bold mb-4">{t("flashcards.feedback_title")}</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{t("flashcards.great")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>{t("flashcards.almost")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{t("flashcards.try_again")}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Flashcards;
