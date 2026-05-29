import { useCallback, useEffect, useRef, useState } from "react";

interface UseLiveSpeechRecognitionOptions {
  /** BCP-47 language tag, e.g. "ar-SA", "zh-CN", "en-US" */
  lang: string;
  /** If false (default for voice mode), browser auto-stops after silence. If true, keeps listening until stop() is called. */
  continuous?: boolean;
}

interface UseLiveSpeechRecognitionReturn {
  /** True if recognition is currently running */
  isListening: boolean;
  /** The live transcript built up so far (interim + final concatenated) */
  liveTranscript: string;
  /** Error message if recognition failed (permission denied, network, etc.) */
  error: string | null;
  /** Whether the browser supports the Web Speech Recognition API at all */
  isSupported: boolean;
  /** Start a new recognition session. Resolves with the final transcript when stopped. */
  start: () => Promise<string>;
  /** Stop the in-flight recognition session. Triggers the start() promise to resolve. */
  stop: () => void;
  /** Clear the liveTranscript state (call between turns) */
  reset: () => void;
}

/**
 * Live speech-to-text via the browser's Web Speech Recognition API.
 *
 * Streams interim results into `liveTranscript` as the user speaks, so the UI
 * can show what's being recognised in real time. When `stop()` is called, the
 * Promise returned from `start()` resolves with the final concatenated transcript.
 *
 * Used by the Translator's Dialogue Mode for low-latency turn-taking.
 *
 * Note: only Chromium-based browsers (Chrome, Edge, Opera) and Safari support
 * this API today. Firefox does not.
 */
export function useLiveSpeechRecognition({
  lang,
  continuous = true,
}: UseLiveSpeechRecognitionOptions): UseLiveSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const resolverRef = useRef<((text: string) => void) | null>(null);
  const rejecterRef = useRef<((reason: Error) => void) | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionCtor: any =
    typeof window !== "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionCtor;

  const reset = useCallback(() => {
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  }, []);

  const start = useCallback((): Promise<string> => {
    if (!SpeechRecognitionCtor) {
      const err = new Error("Browser does not support speech recognition");
      setError(err.message);
      return Promise.reject(err);
    }

    // If a previous session is still alive, force-stop it first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    reset();

    return new Promise<string>((resolve, reject) => {
      resolverRef.current = resolve;
      rejecterRef.current = reject;

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;   // give us partial results live
      recognition.maxAlternatives = 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let finalAddition = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalAddition += text;
          } else {
            interim += text;
          }
        }
        if (finalAddition) {
          finalTranscriptRef.current = (finalTranscriptRef.current + " " + finalAddition).trim();
        }
        const combined = (finalTranscriptRef.current + " " + interim).trim();
        setLiveTranscript(combined);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        const code = event?.error ?? "unknown";
        // "no-speech" and "aborted" aren't really errors worth showing — they
        // happen when the user stays silent or stops the session normally.
        if (code !== "no-speech" && code !== "aborted") {
          setError(code);
        }
        // Let onend handle the resolve/reject so we always converge to the same path
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        const finalText = finalTranscriptRef.current.trim();
        resolverRef.current?.(finalText);
        resolverRef.current = null;
        rejecterRef.current = null;
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to start recognition");
        setError(err.message);
        reject(err);
        resolverRef.current = null;
        rejecterRef.current = null;
      }
    });
  }, [SpeechRecognitionCtor, lang, reset]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      // onend fires asynchronously and resolves the Promise
    } catch {
      // ignore
    }
  }, []);

  // Make sure we always stop on unmount so we don't leave a mic open
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    liveTranscript,
    error,
    isSupported,
    start,
    stop,
    reset,
  };
}
