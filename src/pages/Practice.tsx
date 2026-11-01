import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { supabase } from "@/integrations/supabase/client";
import { pronounceAndScore, getBreakdown, speakText, type PhonemeSegment, type ScoreResponse } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import ScoreResult from "@/components/ScoreResult";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";

type Level = "beginner" | "intermediate" | "advanced";

interface PhraseOption {
  id: string;
  hanzi: string;
  arabic_translation: string;
}

const Practice = () => {
  const [level, setLevel] = useState<Level>("beginner");
  const [phrases, setPhrases] = useState<PhraseOption[]>([]);
  const [expectedText, setExpectedText] = useState("");
  const [ownText, setOwnText] = useState("");
  const [breakdownSegments, setBreakdownSegments] = useState<PhonemeSegment[]>([]);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [scoreFailed, setScoreFailed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

  // Handle mic errors
  useEffect(() => {
    if (micError) {
      toast({ title: t("common.mic_error"), description: micError, variant: "destructive" });
    }
  }, [micError, toast]);

  // Learners pick a phrase from the word list instead of having to type Chinese
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vocab").select("id, hanzi, arabic_translation").eq("level", level);
      const list = (data as PhraseOption[]) || [];
      setPhrases(list);
      if (list.length > 0) choosePhrase(list[0].hanzi);
    })();
  }, [level]);

  // Fetch a clickable phoneme breakdown for the chosen phrase (debounced for typed phrases),
  // so they can tap each character/pinyin/tone/Arabic segment to hear it.
  useEffect(() => {
    const text = expectedText.trim();
    if (!text) {
      setBreakdownSegments([]);
      return;
    }
    const handle = setTimeout(() => {
      getBreakdown(text)
        .then(setBreakdownSegments)
        .catch(() => setBreakdownSegments([]));
    }, 400);
    return () => clearTimeout(handle);
  }, [expectedText]);

  // Process recorded audio when blob is ready
  useEffect(() => {
    if (!audioBlob || !expectedText.trim()) return;

    const processAudio = async () => {
      setIsProcessing(true);
      try {
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        setResult(await pronounceAndScore(file, expectedText));
      } catch {
        setScoreFailed(true);
        toast({ title: t("common.error"), description: t("flashcards.scoring_failed_desc"), variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };

    processAudio();
  }, [audioBlob]);

  const choosePhrase = (text: string) => {
    setExpectedText(text);
    setResult(null);
    setScoreFailed(false);
  };

  const handleMicToggle = async () => {
    if (!expectedText.trim()) return;
    if (isRecording) {
      stopRecording();
    } else {
      setResult(null);
      setScoreFailed(false);
      await startRecording();
    }
  };

  const handleListen = async () => {
    if (!expectedText.trim() || isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakText(expectedText, "zh");
    } catch {
      toast({ title: t("flashcards.tts_failed"), description: t("flashcards.tts_failed_desc"), variant: "destructive" });
    } finally {
      setIsSpeaking(false);
    }
  };

  const lanternMood: LanternMood = isRecording
    ? "listening"
    : isProcessing
      ? "thinking"
      : result
        ? result.score >= 85 ? "celebrate" : result.score >= 60 ? "happy" : "sad"
        : scoreFailed
          ? "sad"
          : "idle";

  const coachLine = isRecording
    ? t("flashcards.listening")
    : isProcessing
      ? t("flashcards.thinking")
      : result
        ? t(result.score >= 85 ? "flashcards.result.great" : result.score >= 60 ? "flashcards.result.almost" : "flashcards.result.again")
        : scoreFailed
          ? t("flashcards.scoring_failed_desc")
          : t("flashcards.hint");

  const pinyin = breakdownSegments.map((s) => s.pinyin).join(" ");
  const arabicSounds = breakdownSegments.map((s) => s.arabic).join(" ");
  const meaning = phrases.find((p) => p.hanzi === expectedText)?.arabic_translation;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{t("practice.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("practice.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_17rem] gap-6 items-start">
        <div className="flex flex-col gap-4">
          {/* Choose what to say */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t("practice.choose")}</h2>
              <div role="tablist" className="flex border-2 border-stroke rounded-[10px] overflow-hidden text-sm font-bold">
                {(["beginner", "intermediate", "advanced"] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    role="tab"
                    aria-selected={level === lvl}
                    onClick={() => setLevel(lvl)}
                    className={`px-3 py-1.5 border-border [&:not(:last-child)]:border-e-2 ${
                      level === lvl ? "bg-foreground text-background" : "bg-card"
                    }`}
                  >
                    {t(`common.${lvl}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-0.5">
              {phrases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={expectedText === p.hanzi}
                  onClick={() => choosePhrase(p.hanzi)}
                  className={`flex items-baseline gap-2 rounded-[10px] border-2 px-3 py-1.5 ${
                    expectedText === p.hanzi ? "border-stroke bg-foreground text-background" : "border-border bg-card"
                  }`}
                >
                  <span lang="zh" className="font-zh font-bold text-lg">{p.hanzi}</span>
                  <span lang="ar" dir="rtl" className="text-sm opacity-80">{p.arabic_translation}</span>
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (ownText.trim()) choosePhrase(ownText.trim());
              }}
            >
              <Label htmlFor="own">{t("practice.own")}</Label>
              <div className="flex gap-2">
                <Input
                  id="own"
                  lang="zh"
                  value={ownText}
                  onChange={(e) => setOwnText(e.target.value)}
                  placeholder={t("practice.example")}
                  className="font-zh"
                />
                <Button type="submit" variant="outline" disabled={!ownText.trim()}>
                  {t("practice.use")}
                </Button>
              </div>
            </form>
          </Card>

          {/* The phrase, how it sounds, and the buttons to hear and say it */}
          {expectedText && (
            <Card className="p-6 flex flex-col items-center text-center gap-2">
              <span lang="zh" className="font-zh font-bold text-6xl md:text-7xl leading-tight">{expectedText}</span>
              {pinyin && <span className="font-pinyin text-2xl font-bold text-primary">{pinyin}</span>}
              {meaning && <span lang="ar" dir="rtl" className="text-xl">{meaning}</span>}
              {arabicSounds && (
                <span className="text-sm text-muted-foreground">
                  {t("home.sample.sounds")} <span lang="ar" dir="rtl" className="font-bold text-foreground">{arabicSounds}</span>
                </span>
              )}

              {breakdownSegments.length > 0 && (
                <div className="mt-3">
                  <PronunciationFeedback segments={breakdownSegments} compact />
                </div>
              )}

              {/* On phones the lantern sits right above the buttons, so it stays in view while recording */}
              <div className="md:hidden flex flex-col items-center gap-1 mt-3" aria-live="polite">
                <Lantern mood={lanternMood} className="w-24 h-24" />
                <p className="font-semibold">{coachLine}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <Button size="lg" variant="outline" onClick={handleListen} disabled={isSpeaking}>
                  <span lang="zh" className="font-zh me-2">听</span>
                  {t("flashcards.listen")}
                </Button>
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  onClick={handleMicToggle}
                  disabled={isProcessing}
                  aria-pressed={isRecording}
                >
                  <span lang="zh" className="font-zh me-2">说</span>
                  {isRecording ? t("flashcards.stop") : isProcessing ? t("flashcards.scoring") : t("flashcards.pronounce")}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Coach: the lantern, what to do next, and the last score */}
        <aside className="flex flex-col gap-4">
          <Card className={`p-5 flex-col items-center text-center gap-3 ${expectedText ? "hidden md:flex" : "flex"}`}>
            <Lantern mood={lanternMood} className="w-32 h-32 md:w-40 md:h-40" />
            <p className="font-semibold" aria-live="polite">{coachLine}</p>
          </Card>

          {result && <ScoreResult result={result} />}

          <Card className="p-5">
            <h2 className="font-bold mb-2">{t("practice.tips_title")}</h2>
            <ul className="flex flex-col gap-1.5 text-sm list-disc ps-5 marker:text-primary">
              <li>{t("practice.tip1")}</li>
              <li>{t("practice.tip2")}</li>
              <li>{t("practice.tip3")}</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Practice;
