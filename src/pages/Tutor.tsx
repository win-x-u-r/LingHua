import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import AvatarIcon from "@/components/AvatarIcon";
import { MicIcon, StopIcon, SendIcon, GongIcon, ScrollIcon } from "@/components/TutorIcons";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { tutorStream, speakTutorText, stopSpeakText, type TutorMessage } from "@/lib/linghuaAPI";
import { useLiveSpeechRecognition } from "@/hooks/use-live-speech-recognition";

interface Message extends TutorMessage {
  id: number;
}

/** Detect the dominant language of a text snippet. */
function detectLang(text: string): string {
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[؀-ۿ]/.test(text)) return "ar";
  return "en";
}

type VoiceStatus = "idle" | "recording" | "thinking" | "speaking";

const Tutor = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { profile } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [micLang, setMicLang] = useState<"ar-SA" | "en-US" | "zh-CN">("en-US");

  const {
    isListening,
    liveTranscript,
    error: speechError,
    isSupported: speechSupported,
    start: startSpeech,
    stop: stopSpeech,
    reset: resetSpeech,
  } = useLiveSpeechRecognition({ lang: micLang, continuous: false });

  const welcomeMessage: Message = {
    id: 0,
    role: "assistant",
    content: t("tutor.welcome"),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [autoPlay, setAutoPlay] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const nextId = useRef(1);
  // Hua smiles for a moment after each reply
  const [justReplied, setJustReplied] = useState(false);
  const isBusy = voiceStatus === "thinking" || voiceStatus === "speaking";

  useEffect(() => {
    if (!justReplied) return;
    const timer = setTimeout(() => setJustReplied(false), 3000);
    return () => clearTimeout(timer);
  }, [justReplied]);

  // Keep the newest message in view, scrolling only the chat box
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, voiceStatus, liveTranscript]);

  useEffect(() => {
    if (speechError) {
      toast({ title: t("tutor.mic_error"), description: speechError, variant: "destructive" });
      setVoiceStatus("idle");
    }
  }, [speechError]);

  const sendText = useCallback(async (text: string) => {
    const userMsg: Message = { id: nextId.current++, role: "user", content: text };
    const assistantId = nextId.current++;

    const history: TutorMessage[] = messages
      .filter((m) => m.id !== 0)
      .map(({ role, content }) => ({ role, content }));
    history.push({ role: "user", content: text });

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setVoiceStatus("thinking");
    setJustReplied(false);

    try {
      let firstChunk = true;
      const reply = await tutorStream(history, (chunk) => {
        if (firstChunk) { setVoiceStatus("idle"); firstChunk = false; }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      });
      setJustReplied(true);

      if (autoPlay) {
        setVoiceStatus("speaking");
        try { await speakTutorText(reply); } catch { /* ignore */ }
        setVoiceStatus("idle");
      }
    } catch {
      toast({ title: t("tutor.error"), description: t("tutor.error_desc"), variant: "destructive" });
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setVoiceStatus("idle");
    }
  }, [autoPlay, t, toast, messages]); // eslint-disable-line

  const handleSendTyped = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    sendText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendTyped();
    }
  };

  const handleMicToggle = async () => {
    if (isListening) {
      stopSpeech();
    } else {
      if (!speechSupported) {
        toast({ title: t("tutor.mic_error"), description: "Speech recognition not supported. Use Chrome.", variant: "destructive" });
        return;
      }
      resetSpeech();
      setVoiceStatus("recording");
      try {
        const transcript = await startSpeech();
        setVoiceStatus("idle");
        if (transcript.trim()) await sendText(transcript.trim());
      } catch {
        setVoiceStatus("idle");
      }
    }
  };

  const handleSpeak = async (msg: Message) => {
    if (speakingId === msg.id) {
      stopSpeakText();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(msg.id);
    try { await speakTutorText(msg.content); } catch { /* ignore */ }
    finally { setSpeakingId(null); }
  };

  const clearConversation = () => {
    stopSpeakText();
    nextId.current = 1;
    setMessages([{ ...welcomeMessage, id: 0 }]);
    setInput("");
    setVoiceStatus("idle");
    resetSpeech();
  };

  const statusLabel = (() => {
    if (voiceStatus === "thinking") return t("tutor.thinking");
    if (voiceStatus === "speaking") return t("tutor.speaking");
    if (isListening) return t("tutor.recording");
    return "";
  })();

  const huaMood: LanternMood = isListening
    ? "listening"
    : voiceStatus === "thinking"
      ? "thinking"
      : voiceStatus === "speaking" || justReplied
        ? "happy"
        : "idle";

  const huaAvatar = (
    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
      <Lantern still className="w-8 h-8" />
    </span>
  );

  const userAvatar = (
    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-card border-2 border-border flex items-center justify-center overflow-hidden">
      <AvatarIcon id={profile?.avatar_url} className="w-7 h-7" />
    </span>
  );

  const micLangs = [
    { id: "ar-SA", short: "ع", name: "العربية" },
    { id: "en-US", short: "EN", name: "English" },
    { id: "zh-CN", short: "中", name: "中文" },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl flex flex-col gap-4">
      {/* Header: Hua, what Hua is doing, and the chat controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Lantern mood={huaMood} label={statusLabel || t("tutor.title")} className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">{t("tutor.title")}</h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {statusLabel || t("tutor.subtitle")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setAutoPlay((v) => !v)}
            aria-pressed={autoPlay}
            className={`gap-2 ${autoPlay ? "border-primary bg-primary/10" : ""}`}
          >
            <GongIcon sounding={autoPlay} />
            <span>{autoPlay ? t("tutor.autoplay_on") : t("tutor.autoplay")}</span>
          </Button>
          <Button variant="outline" onClick={clearConversation} className="gap-2">
            <ScrollIcon />
            <span>{t("tutor.clear")}</span>
          </Button>
        </div>
      </div>

      {/* Messages: the box grows with the chat, then scrolls */}
      <Card
        ref={chatRef}
        className="min-h-[11rem] max-h-[58vh] md:max-h-[62vh] overflow-y-auto p-3 sm:p-4 space-y-4"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-2 sm:gap-3 ${isUser ? "justify-end" : ""}`}>
              {!isUser && huaAvatar}

              <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-se-sm"
                      : "bg-muted/60 border-2 border-border rounded-ss-sm"
                  }`}
                >
                  {msg.content || (voiceStatus === "thinking" ? t("tutor.thinking") : "")}
                </div>

                {!isUser && msg.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-1.5 px-2 text-xs ${speakingId === msg.id ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => handleSpeak(msg)}
                    disabled={isBusy && speakingId !== msg.id}
                  >
                    {speakingId === msg.id ? <StopIcon className="!size-4" /> : <GongIcon className="!size-4" />}
                    {speakingId === msg.id ? t("flashcards.stop") : t("tutor.listen")}
                  </Button>
                )}
              </div>
              {isUser && userAvatar}
            </div>
          );
        })}

        {/* Live transcript bubble while recording */}
        {isListening && (
          <div className="flex gap-2 sm:gap-3 justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-se-sm px-4 py-2.5 text-sm sm:text-base bg-primary/10 border-2 border-primary/30 text-muted-foreground italic min-w-[60px]">
              {liveTranscript || t("tutor.recording")}
            </div>
            {userAvatar}
          </div>
        )}
      </Card>

      {/* Input: which language the mic hears, then the message box */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("tutor.speak_in")}</span>
          <div role="radiogroup" aria-label={t("tutor.speak_in")} className="flex border-2 border-stroke rounded-[10px] overflow-hidden font-bold">
            {micLangs.map((lang) => (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={micLang === lang.id}
                aria-label={lang.name}
                onClick={() => setMicLang(lang.id)}
                disabled={isListening || isBusy}
                className={`px-3 py-1 border-border [&:not(:last-child)]:border-e-2 disabled:opacity-50 ${
                  micLang === lang.id ? "bg-foreground text-background" : "bg-card"
                }`}
              >
                {lang.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("tutor.placeholder")}
            aria-label={t("tutor.placeholder")}
            rows={1}
            className="resize-none flex-1 min-w-0 min-h-[48px] max-h-32 overflow-y-auto text-base"
            disabled={isBusy || isListening}
          />

          <Button
            variant="outline"
            size="icon"
            className={`h-12 w-12 flex-shrink-0 ${isListening ? "border-primary bg-primary/10" : ""}`}
            onClick={handleMicToggle}
            disabled={isBusy}
            aria-pressed={isListening}
            aria-label={isListening ? t("tutor.recording") : t("tutor.speak")}
          >
            {isListening ? <StopIcon /> : <MicIcon />}
          </Button>

          <Button
            size="icon"
            onClick={handleSendTyped}
            disabled={!input.trim() || isBusy || isListening}
            className="h-12 w-12 flex-shrink-0"
            aria-label={t("tutor.send")}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
