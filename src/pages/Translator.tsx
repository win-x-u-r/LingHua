import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { translateText, speakText, speechToText } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";

const Translator = () => {
  const [arabicText, setArabicText] = useState("");
  const [chineseText, setChineseText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeMicLang, setActiveMicLang] = useState<"ar" | "zh" | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
    } catch {
      toast({
        title: "Translation Failed",
        description: "Please make sure the backend is running on localhost:5000",
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
    } catch {
      toast({
        title: "TTS Failed",
        description: "Please make sure the backend is running on localhost:5000",
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
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl bg-[#f9f5f5]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-coral bg-clip-text text-transparent">
            {t("translator.title")}
          </h1>
          <p className="text-muted-foreground" dir="rtl">
            {t("translator.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative">
          {/* Arabic Input */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t("translator.arabic_label")}</h2>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant={isRecording && activeMicLang === "ar" ? "destructive" : "outline"}
                  onClick={() => handleMicToggle("ar")}
                  className={`hover:scale-110 transition-all ${isRecording && activeMicLang === "ar" ? "animate-pulse" : ""}`}
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
                  className="hover:bg-primary/10 hover:scale-110 transition-all"
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
              className="w-full mt-4 bg-gradient-coral hover:scale-105 transition-transform"
            >
              {t("translator.to_chinese")}
            </Button>
          </Card>

          {/* Swap Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <Button
              size="icon"
              onClick={handleSwap}
              className="rounded-full w-14 h-14 bg-gradient-coral shadow-glow hover:scale-110 hover:rotate-180 transition-all"
            >
              <ArrowLeftRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Chinese Output */}
          <Card className="p-6 bg-gradient-to-br from-secondary/5 to-transparent border-2 border-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t("translator.chinese_label")}</h2>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant={isRecording && activeMicLang === "zh" ? "destructive" : "outline"}
                  onClick={() => handleMicToggle("zh")}
                  className={`hover:scale-110 transition-all ${isRecording && activeMicLang === "zh" ? "animate-pulse" : ""}`}
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
                  className="hover:bg-secondary/10 hover:scale-110 transition-all"
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
              className="w-full mt-4 bg-gradient-mint hover:scale-105 transition-transform"
            >
              {t("translator.to_arabic")}
            </Button>
          </Card>

          {/* Mobile Swap Button */}
          <div className="md:hidden col-span-full flex justify-center">
            <Button
              size="icon"
              onClick={handleSwap}
              className="rounded-full w-12 h-12 bg-gradient-coral shadow-glow"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} className="hidden" />

        {/* Voice-to-Voice Mode */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-accent/10 to-sunshine/10 border-2 border-accent/20 bg-primary-foreground">
          <h3 className="text-xl font-bold mb-4 text-center">
            {t("translator.voice_mode")}
          </h3>
          <p className="text-center text-muted-foreground mb-4">
            {t("translator.voice_desc")}
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`transition-transform font-semibold ${
                isRecording && activeMicLang === "ar"
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-lavender hover:scale-105"
              }`}
              onClick={() => handleMicToggle("ar")}
            >
              {isRecording && activeMicLang === "ar" ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  {t("translator.stop_recording")}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  {t("translator.start_voice")}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Translator;
