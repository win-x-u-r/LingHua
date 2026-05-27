import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, ArrowLeftRight, Loader2, Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone } from "@/hooks/use-microphone";
import { useLiveSpeechRecognition } from "@/hooks/use-live-speech-recognition";
import { translateText, speakText, speechToText, transcribeArabicMunsit } from "@/lib/linghuaAPI";
import { useLanguage } from "@/contexts/LanguageContext";

type DialogueStage = "idle" | "listening" | "transcribing" | "translating" | "speaking";

interface DialogueEntry {
  id: string;
  speaker: "ar" | "zh";
  original: string;
  translated: string;
  timestamp: number;
}

const Translator = () => {
  const [arabicText, setArabicText] = useState("");
  const [chineseText, setChineseText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeMicLang, setActiveMicLang] = useState<"ar" | "zh" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

  // ── Dialogue Mode state ─────────────────────────────────────────
  const [dialogueSpeaker, setDialogueSpeaker] = useState<"ar" | "zh" | null>(null);
  const [dialogueStage, setDialogueStage] = useState<DialogueStage>("idle");
  const [dialogueTranscript, setDialogueTranscript] = useState<DialogueEntry[]>([]);

  // Two independent live speech recognisers — one per language.
  // Browser Web Speech API streams interim results so the UI can show the
  // user's speech as it's being recognised, AND returns the final text
  // instantly when stop() is called (no audio upload, no Huawei round trip).
  const arRecognition = useLiveSpeechRecognition({ lang: "ar-SA" });
  const zhRecognition = useLiveSpeechRecognition({ lang: "zh-CN" });

  // Parallel audio recorder used ONLY for Arabic dialogue turns. Web Speech
  // gives instant interim transcription for live display, but Munsit (UAE-built
  // dialect-aware ASR) gives much better final transcripts for Gulf Arabic.
  // We capture the audio blob here and upload it to Munsit after the user
  // stops speaking; Munsit's result replaces the Web Speech text used for
  // translation. The Web Speech text is still what the user sees in the live
  // "Listening live" panel — they only see the upgrade after.
  const dialogueRecorder = useMicrophone();

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Resolves whenever the dialogueRecorder produces a new audioBlob, so the
  // pipeline can `await` the blob landing without polling React state.
  const dialogueBlobResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  useEffect(() => {
    if (dialogueRecorder.audioBlob && dialogueBlobResolverRef.current) {
      dialogueBlobResolverRef.current(dialogueRecorder.audioBlob);
      dialogueBlobResolverRef.current = null;
    }
  }, [dialogueRecorder.audioBlob]);

  /** Wait for the next dialogue audio blob, or timeout after `timeoutMs`. */
  const waitForDialogueAudioBlob = (timeoutMs: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // If a blob is already sitting on the hook from this turn, use it directly.
      if (dialogueRecorder.audioBlob) {
        resolve(dialogueRecorder.audioBlob);
        return;
      }
      dialogueBlobResolverRef.current = resolve;
      setTimeout(() => {
        if (dialogueBlobResolverRef.current === resolve) {
          dialogueBlobResolverRef.current = null;
          resolve(null);
        }
      }, timeoutMs);
    });
  };

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

  // ── Dialogue Mode: surface speech recognition errors as toasts ─────
  useEffect(() => {
    const err = arRecognition.error || zhRecognition.error;
    if (err) {
      toast({
        title: t("common.mic_error"),
        description: err,
        variant: "destructive",
      });
      setDialogueSpeaker(null);
      setDialogueStage("idle");
    }
  }, [arRecognition.error, zhRecognition.error, toast, t]);

  // ── Dialogue Mode: auto-scroll transcript to bottom on new entry ──
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dialogueTranscript]);

  // ── Dialogue Mode: cancel any in-flight browser speech on unmount ──
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

  // ── Dialogue Mode handlers ──────────────────────────────────────
  // Helper: which recognition hook belongs to which language?
  const recognitionFor = (speaker: "ar" | "zh") =>
    speaker === "ar" ? arRecognition : zhRecognition;

  const handleDialogueMic = async (speaker: "ar" | "zh") => {
    // Block clicks unless we're idle, OR currently listening to the SAME speaker (allowing stop)
    if (dialogueStage !== "idle" && dialogueStage !== "listening") return;
    if (dialogueStage === "listening" && dialogueSpeaker !== speaker) return;

    const recognition = recognitionFor(speaker);
    const targetLang: "ar" | "zh" = speaker === "ar" ? "zh" : "ar";

    // Click to stop the current listening turn
    if (recognition.isListening && dialogueSpeaker === speaker) {
      recognition.stop();
      // Also stop the Munsit audio capture if this is an Arabic turn
      if (speaker === "ar") {
        dialogueRecorder.stopRecording();
      }
      // The promise from the earlier .start() call (still awaiting below) will
      // resolve with the final transcript and drive the rest of the pipeline.
      return;
    }

    // Click to start a new listening turn
    if (!recognition.isSupported) {
      toast({
        title: t("translator.dialogue.error_generic"),
        description: "Your browser does not support live speech recognition. Use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    setDialogueSpeaker(speaker);
    setDialogueStage("listening");

    // For Arabic turns ONLY: also capture audio in parallel so we can send it
    // to Munsit afterwards for a higher-accuracy, dialect-aware final transcript.
    if (speaker === "ar") {
      // Fire-and-forget; errors will surface via dialogueRecorder.error
      void dialogueRecorder.startRecording();
    }

    let finalText = "";
    try {
      finalText = (await recognition.start()).trim();
    } catch {
      toast({
        title: t("translator.dialogue.error_generic"),
        variant: "destructive",
      });
      if (speaker === "ar") dialogueRecorder.stopRecording();
      setDialogueSpeaker(null);
      setDialogueStage("idle");
      return;
    }

    // ── Arabic only: upgrade transcript with Munsit ───────────────
    // The Web Speech text is decent for live display, but Munsit's dialect-aware
    // result is what we actually want to translate.
    if (speaker === "ar") {
      // The Web Speech promise resolved when the user clicked stop. The audio
      // blob from MediaRecorder may still be assembling on its onstop callback.
      // Wait briefly for the blob to materialise (max ~3s — typically <100ms).
      setDialogueStage("transcribing");
      const blob = await waitForDialogueAudioBlob(3000);
      if (blob) {
        try {
          const file = new File([blob], "dialogue-ar.webm", { type: blob.type });
          const munsitText = (await transcribeArabicMunsit(file)).trim();
          if (munsitText) {
            finalText = munsitText;
          }
          // If Munsit returns empty, we silently keep the Web Speech text as a fallback
        } catch (err) {
          console.warn("Munsit ASR failed, keeping Web Speech transcript:", err);
          // Soft fail — fall back to Web Speech text already in finalText
        }
      }
    }

    if (!finalText) {
      toast({
        title: t("translator.dialogue.didnt_catch"),
        variant: "destructive",
      });
      setDialogueSpeaker(null);
      setDialogueStage("idle");
      recognition.reset();
      return;
    }

    // Stage: translate via Huawei NLP
    setDialogueStage("translating");
    let translated = "";
    try {
      translated = await translateText(finalText, speaker, targetLang);
    } catch {
      toast({
        title: t("translator.dialogue.error_generic"),
        variant: "destructive",
      });
      setDialogueSpeaker(null);
      setDialogueStage("idle");
      recognition.reset();
      return;
    }

    // Append to transcript BEFORE TTS so the user sees it even if audio fails
    const entry: DialogueEntry = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      speaker,
      original: finalText,
      translated,
      timestamp: Date.now(),
    };
    setDialogueTranscript((prev) => [...prev, entry]);
    recognition.reset();

    // Stage: TTS playback (soft-fail — transcript already in place)
    setDialogueStage("speaking");
    try {
      await speakText(translated, targetLang);
    } catch {
      toast({
        title: t("translator.dialogue.tts_failed"),
        variant: "destructive",
      });
    }

    setDialogueSpeaker(null);
    setDialogueStage("idle");
  };

  const handleClearTranscript = () => {
    setDialogueTranscript([]);
    arRecognition.reset();
    zhRecognition.reset();
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

        {/* Dialogue Mode — live voice-to-voice Arabic ↔ Chinese conversation */}
        <Card className="mt-6 p-5 bg-gradient-to-r from-accent/10 to-sunshine/10 border-2 border-accent/20 bg-primary-foreground">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{t("translator.dialogue.title")}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearTranscript}
              disabled={dialogueStage !== "idle" || dialogueTranscript.length === 0}
              className="h-8"
            >
              <Eraser className="w-3.5 h-3.5 mr-1" />
              {t("translator.dialogue.clear")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {t("translator.dialogue.description")}
          </p>

          <ScrollArea className="h-40 rounded border bg-background/50 p-2 mb-3">
            {dialogueTranscript.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic py-12">
                {t("translator.dialogue.empty_transcript")}
              </p>
            ) : (
              <div className="space-y-2">
                {dialogueTranscript.map((entry) => {
                  const isAr = entry.speaker === "ar";
                  return (
                    <div
                      key={entry.id}
                      className={`flex ${isAr ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 ${
                          isAr ? "bg-primary/10" : "bg-secondary/20"
                        }`}
                      >
                        <Badge
                          variant="outline"
                          className="text-[10px] mb-1 h-4 px-1.5 py-0"
                        >
                          {isAr
                            ? t("translator.dialogue.speaker_arabic")
                            : t("translator.dialogue.speaker_chinese")}
                        </Badge>
                        <p
                          dir={isAr ? "rtl" : "ltr"}
                          className="text-sm font-semibold"
                        >
                          {entry.original}
                        </p>
                        <p
                          dir={isAr ? "ltr" : "rtl"}
                          className="text-xs text-muted-foreground mt-0.5"
                        >
                          {entry.translated}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={transcriptEndRef} />
          </ScrollArea>

          {/* Live interim transcript (shown while user is speaking) */}
          {dialogueStage === "listening" && dialogueSpeaker && (
            <div
              className={`rounded-lg border-2 border-dashed p-3 mb-3 ${
                dialogueSpeaker === "ar"
                  ? "bg-primary/5 border-primary/40"
                  : "bg-secondary/10 border-secondary/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t("translator.dialogue.status_listening")} —{" "}
                  {dialogueSpeaker === "ar"
                    ? t("translator.dialogue.speaker_arabic")
                    : t("translator.dialogue.speaker_chinese")}
                </span>
              </div>
              <p
                dir={dialogueSpeaker === "ar" ? "rtl" : "ltr"}
                className="text-sm font-medium min-h-[1.25rem]"
              >
                {(dialogueSpeaker === "ar"
                  ? arRecognition.liveTranscript
                  : zhRecognition.liveTranscript) || (
                  <span className="text-muted-foreground italic">
                    {t("translator.dialogue.listening_hint")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Stage indicator for non-listening phases */}
          {dialogueStage !== "idle" && dialogueStage !== "listening" && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
              <Loader2 className="animate-spin w-3 h-3" />
              <span>{t(`translator.dialogue.status_${dialogueStage}`)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleDialogueMic("ar")}
              disabled={
                dialogueStage !== "idle" &&
                !(dialogueStage === "listening" && dialogueSpeaker === "ar")
              }
              className={`font-semibold transition-transform ${
                arRecognition.isListening && dialogueSpeaker === "ar"
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-coral hover:scale-105"
              }`}
            >
              {arRecognition.isListening && dialogueSpeaker === "ar" ? (
                <MicOff className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {t("translator.dialogue.speaker_arabic")}
            </Button>
            <Button
              onClick={() => handleDialogueMic("zh")}
              disabled={
                dialogueStage !== "idle" &&
                !(dialogueStage === "listening" && dialogueSpeaker === "zh")
              }
              className={`font-semibold transition-transform ${
                zhRecognition.isListening && dialogueSpeaker === "zh"
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-mint hover:scale-105"
              }`}
            >
              {zhRecognition.isListening && dialogueSpeaker === "zh" ? (
                <MicOff className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {t("translator.dialogue.speaker_chinese")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Translator;
