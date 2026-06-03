import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Volume2, VolumeX, Bot, User, Mic, MicOff, Volume1 } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);
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
  const isBusy = voiceStatus === "thinking" || voiceStatus === "speaking";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-coral bg-clip-text text-transparent">
            {t("tutor.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("tutor.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoPlay ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoPlay((v) => !v)}
            className="gap-2"
            title={t("tutor.autoplay")}
          >
            <Volume1 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">{t("tutor.autoplay")}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={clearConversation} className="gap-2 text-muted-foreground">
            <Trash2 className="w-4 h-4" />
            {t("tutor.clear")}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  isUser ? "bg-primary" : "bg-gradient-coral"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`group max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border shadow-soft rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {!isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 transition-opacity ${speakingId === msg.id ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"}`}
                    onClick={() => handleSpeak(msg)}
                    disabled={isBusy && speakingId !== msg.id}
                    title={speakingId === msg.id ? "Stop" : t("tutor.listen")}
                  >
                    {speakingId === msg.id
                      ? <VolumeX className="w-3.5 h-3.5" />
                      : <Volume2 className="w-3.5 h-3.5" />
                    }
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking / speaking indicator */}
        {(voiceStatus === "thinking" || voiceStatus === "speaking") && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-coral flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border shadow-soft rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Live transcript bubble while recording */}
        {isListening && (
          <div className="flex gap-3 flex-row-reverse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm bg-primary/10 border border-primary/20 text-muted-foreground italic min-w-[60px]">
              {liveTranscript || "…"}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </Card>

      {/* Status bar */}
      {statusLabel && (
        <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">{statusLabel}</p>
      )}

      {/* Input row */}
      <div className="mt-2 flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("tutor.placeholder")}
          rows={1}
          className="resize-none flex-1 min-h-[44px] max-h-32 overflow-y-auto"
          disabled={isBusy || isListening}
        />

        {/* Mic language selector */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {micLang === "ar-SA" ? "🎙 AR" : micLang === "zh-CN" ? "🎙 ZH" : "🎙 EN"}
          </p>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {(["ar-SA", "en-US", "zh-CN"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => !isListening && !isBusy && setMicLang(lang)}
                className={`px-2 py-1 transition-colors ${
                  micLang === lang
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                } ${isListening || isBusy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {lang === "ar-SA" ? "ع" : lang === "en-US" ? "EN" : "中"}
              </button>
            ))}
          </div>
        </div>

        {/* Mic button */}
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className={`h-11 w-11 flex-shrink-0 transition-all ${isListening ? "animate-pulse" : ""}`}
          onClick={handleMicToggle}
          disabled={isBusy}
          title={isListening ? t("tutor.recording") : `Speak (${micLang})`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSendTyped}
          disabled={!input.trim() || isBusy || isListening}
          className="bg-gradient-coral h-11 px-4 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Tutor;
