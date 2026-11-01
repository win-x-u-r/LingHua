import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { translateText, speakText, speechToText } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";

/* Two opposing arrows, drawn to match the stamped style instead of an icon set */
const SwapIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M4 8h15" />
    <path d="M15 4l4 4-4 4" />
    <path d="M20 16H5" />
    <path d="M9 12l-4 4 4 4" />
  </svg>
);

/** Turns a failed request into a message that says what actually went wrong. */
const describeError = (err: unknown): string => {
  if (err instanceof TypeError) return "Can't reach the LingHua server. Check your connection and try again.";
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
};

const Translator = () => {
  const [arabicText, setArabicText] = useState("");
  const [chineseText, setChineseText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeMicLang, setActiveMicLang] = useState<"ar" | "zh" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

  // Handle mic errors
  useEffect(() => {
    if (micError) {
      toast({ title: "Microphone Error", description: micError, variant: "destructive" });
    }
  }, [micError, toast]);

  // Process recorded audio when blob is ready
  useEffect(() => {
    if (!audioBlob || !activeMicLang) return;

    const processAudio = async () => {
      try {
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        const text = await speechToText(file, activeMicLang);

        if (activeMicLang === "ar") {
          setArabicText(text);
        } else {
          setChineseText(text);
        }

        toast({
          title: "Speech Recognized!",
          description: `Converted speech to text: ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}`,
        });
      } catch {
        toast({
          title: "ASR Failed",
          description: "Please make sure the backend is running",
          variant: "destructive",
        });
      }
      setActiveMicLang(null);
    };

    processAudio();
  }, [audioBlob, activeMicLang, toast]);

  // Cancel any in-flight browser speech (Chinese TTS) on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTranslate = async (from: "ar" | "zh") => {
    setIsTranslating(true);
    try {
      if (from === "ar" && arabicText) {
        const result = await translateText(arabicText, "ar", "zh");
        setChineseText(result);
        toast({ title: "Translation Complete!", description: "Arabic → Chinese translation ready" });
      } else if (from === "zh" && chineseText) {
        const result = await translateText(chineseText, "zh", "ar");
        setArabicText(result);
        toast({ title: "Translation Complete!", description: "Chinese → Arabic translation ready" });
      }
    } catch (err) {
      toast({
        title: "Translation Failed",
        description: describeError(err),
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async (text: string, lang: "ar" | "zh") => {
    if (!text) return;
    try {
      await speakText(text, lang);
      toast({ title: "Playing Audio", description: "Text-to-speech generated successfully" });
    } catch (err) {
      toast({
        title: "TTS Failed",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleMicToggle = async (lang: "ar" | "zh") => {
    if (isRecording) {
      stopRecording();
    } else {
      setActiveMicLang(lang);
      await startRecording();
    }
  };

  const handleSwap = () => {
    const temp = arabicText;
    setArabicText(chineseText);
    setChineseText(temp);
  };

  return (
    <div className="py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary text-balance">
            {t("translator.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("translator.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 md:gap-4">
          {/* Arabic Input */}
          <Card className="p-4 md:p-6 h-full">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold whitespace-nowrap">{t("translator.arabic_label")}</h2>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="icon"
                  variant={isRecording && activeMicLang === "ar" ? "destructive" : "outline"}
                  onClick={() => handleMicToggle("ar")}
                  className={`transition-all ${isRecording && activeMicLang === "ar" ? "animate-pulse" : ""}`}
                >
                  {isRecording && activeMicLang === "ar" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSpeak(arabicText, "ar")}
                  disabled={!arabicText}
                  
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Textarea
              dir="rtl"
              placeholder={t("translator.arabic_placeholder")}
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              className="min-h-[200px] text-lg resize-none"
            />

            <Button
              onClick={() => handleTranslate("ar")}
              disabled={!arabicText || isTranslating}
              className="w-full mt-4"
            >
              {t("translator.to_chinese")}
            </Button>
          </Card>

          {/* Swap button: sits between the two panels, up/down on phones, left/right on wide screens */}
          <div className="flex items-center justify-center">
            <Button
              size="icon"
              onClick={handleSwap}
              aria-label={t("translator.swap")}
              className="rounded-full w-14 h-14 shrink-0"
            >
              <SwapIcon className="!size-6 rotate-90 md:rotate-0" />
            </Button>
          </div>

          {/* Chinese Output */}
          <Card className="p-4 md:p-6 h-full">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold whitespace-nowrap">{t("translator.chinese_label")}</h2>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="icon"
                  variant={isRecording && activeMicLang === "zh" ? "destructive" : "outline"}
                  onClick={() => handleMicToggle("zh")}
                  className={`transition-all ${isRecording && activeMicLang === "zh" ? "animate-pulse" : ""}`}
                >
                  {isRecording && activeMicLang === "zh" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSpeak(chineseText, "zh")}
                  disabled={!chineseText}
                  
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Textarea
              placeholder={t("translator.chinese_placeholder")}
              value={chineseText}
              onChange={(e) => setChineseText(e.target.value)}
              className="min-h-[200px] text-lg resize-none"
            />

            <Button
              onClick={() => handleTranslate("zh")}
              disabled={!chineseText || isTranslating}
              className="w-full mt-4"
            >
              {t("translator.to_arabic")}
            </Button>
          </Card>

        </div>

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

export default Translator;
