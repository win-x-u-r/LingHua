import { useState, useRef, useCallback } from "react";

/** Why a recording was not worth sending to the recogniser. */
export type MissReason = "quiet" | "short";

interface UseMicrophoneReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  /** Set instead of audioBlob when the clip was silent or too short to judge. */
  missed: MissReason | null;
  error: string | null;
}

/* Below this many milliseconds there is no word to hear. */
const MIN_DURATION_MS = 400;
/* Loudest moment must pass this level (RMS, 0..1) or it was only room noise. */
const MIN_PEAK_LEVEL = 0.02;

/** A File named after its real format: Whisper picks its decoder from the extension. */
export function recordingFile(blob: Blob): File {
  const type = blob.type || "audio/webm";
  const ext = type.includes("mp4") || type.includes("m4a") || type.includes("aac")
    ? "m4a"
    : type.includes("ogg")
      ? "ogg"
      : type.includes("wav")
        ? "wav"
        : "webm";
  return new File([blob], `recording.${ext}`, { type });
}

export function useMicrophone(): UseMicrophoneReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [missed, setMissed] = useState<MissReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setMissed(null);
    chunksRef.current = [];

    try {
      // Ask the browser to clean up the voice: less echo and background hum,
      // and an even volume whether the learner is close to the mic or not.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Watch the loudness while recording, so a silent clip never gets
      // sent off and "recognised" as something the learner did not say.
      let peak = 0;
      let meterTimer: number | undefined;
      let audioCtx: AudioContext | undefined;
      try {
        const Ctx = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        meterTimer = window.setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          let sum = 0;
          for (const s of samples) sum += s * s;
          peak = Math.max(peak, Math.sqrt(sum / samples.length));
        }, 50);
      } catch {
        peak = 1; // No meter on this browser: let the server decide.
      }

      // Pick a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const releaseMic = () => {
        window.clearInterval(meterTimer);
        audioCtx?.close().catch(() => {});
        stream.getTracks().forEach((track) => track.stop());
      };

      let startedAt = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        releaseMic();
        const duration = performance.now() - startedAt;
        if (duration < MIN_DURATION_MS) {
          setMissed("short");
          return;
        }
        if (peak < MIN_PEAK_LEVEL) {
          setMissed("quiet");
          return;
        }
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
      };

      recorder.onerror = () => {
        setError("Recording failed");
        setIsRecording(false);
        releaseMic();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      startedAt = performance.now();
      setIsRecording(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access.");
      } else {
        setError("Could not access microphone. Please check your device.");
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording, audioBlob, missed, error };
}
