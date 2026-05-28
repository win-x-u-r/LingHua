import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Volume2, Bot, User, Mic, MicOff, Volume1 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { tutorChat, speakText, speechToText, type TutorMessage } from "@/lib/linghuaAPI";
import { useMicrophone } from "@/hooks/use-microphone";

interface Message extends TutorMessage {
  id: number;
}

type VoiceStatus = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "",
  recording: "tutor.recording",
  transcribing: "tutor.transcribing",
  thinking: "tutor.thinking",
  speaking: "tutor.speaking",
};

const Tutor = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, startRecording, stopRecording, audioBlob, error: micError } = useMicrophone();

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
  const isBusy = voiceStatus !== "idle";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, voiceStatus]);

  useEffect(() => {
    if (micError) {
      toast({ title: t("tutor.mic_error"), description: micError, variant: "destructive" });
      setVoiceStatus("idle");
    }
  }, [micError]);

  // When a recording finishes, transcribe then send
  useEffect(() => {
    if (!audioBlob) return;

    const transcribeAndSend = async () => {
      setVoiceStatus("transcribing");
      try {
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
        const transcript = await speechToText(file, "zh");
        if (transcript.trim()) {
          await sendText(transcript);
        } else {
          setVoiceStatus("idle");
        }
      } catch {
        toast({ title: t("tutor.error"), description: t("tutor.transcribe_error"), variant: "destructive" });
        setVoiceStatus("idle");
      }
    };

    transcribeAndSend();
  }, [audioBlob]);

  const sendText = useCallback(async (text: string) => {
    const userMsg: Message = { id: nextId.current++, role: "user", content: text };

    setMessages((prev) => {
      const updated = [...prev, userMsg];

      const history: TutorMessage[] = updated
        .filter((m) => m.id !== 0)
        .map(({ role, content }) => ({ role, content }));

      setVoiceStatus("thinking");

      tutorChat(history)
        .then(async (reply) => {
          const assistantMsg: Message = { id: nextId.current++, role: "assistant", content: reply };
          setMessages((p) => [...p, assistantMsg]);

          if (autoPlay) {
            setVoiceStatus("speaking");
            try { await speakText(reply, "zh"); } catch { /* ignore TTS errors */ }
          }
        })
        .catch(() => {
          toast({ title: t("tutor.error"), description: t("tutor.error_desc"), variant: "destructive" });
        })
        .finally(() => setVoiceStatus("idle"));

      return updated;
    });
  }, [autoPlay, t, toast]);

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
    if (isRecording) {
      stopRecording();
      // voiceStatus transitions to "transcribing" via the audioBlob useEffect
    } else {
      setVoiceStatus("recording");
      await startRecording();
    }
  };

  const handleSpeak = async (msg: Message) => {
    setSpeakingId(msg.id);
    try { await speakText(msg.content, "zh"); } catch { /* ignore */ }
    finally { setSpeakingId(null); }
  };

  const clearConversation = () => {
    nextId.current = 1;
    setMessages([{ ...welcomeMessage, id: 0 }]);
    setInput("");
    setVoiceStatus("idle");
  };

  const statusLabel = STATUS_LABELS[voiceStatus] ? t(STATUS_LABELS[voiceStatus]) : "";

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
          {/* Auto-play toggle */}
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
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleSpeak(msg)}
                    disabled={speakingId === msg.id || isBusy}
                    title={t("tutor.listen")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
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
          disabled={isBusy}
        />

        {/* Mic button */}
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className={`h-11 w-11 flex-shrink-0 transition-all ${isRecording ? "animate-pulse" : ""}`}
          onClick={handleMicToggle}
          disabled={voiceStatus === "transcribing" || voiceStatus === "thinking" || voiceStatus === "speaking"}
          title={isRecording ? t("tutor.recording") : "Speak"}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSendTyped}
          disabled={!input.trim() || isBusy}
          className="bg-gradient-coral h-11 px-4 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Tutor;
