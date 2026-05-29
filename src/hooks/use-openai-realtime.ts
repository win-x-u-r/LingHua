import { useCallback, useRef, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export type RealtimeStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface UseOpenAIRealtimeOptions {
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string, done: boolean) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
  onError?: (msg: string) => void;
}

export function useOpenAIRealtime({
  onUserTranscript,
  onAssistantTranscript,
  onStatusChange,
  onError,
}: UseOpenAIRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);

  const pcRef   = useRef<RTCPeerConnection | null>(null);
  const dcRef   = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  const assistantBufRef  = useRef("");
  const instructionsRef  = useRef("");

  // Keep callback refs fresh so closures never go stale
  const onUserTranscriptRef       = useRef(onUserTranscript);
  const onAssistantTranscriptRef  = useRef(onAssistantTranscript);
  const onStatusChangeRef         = useRef(onStatusChange);
  const onErrorRef                = useRef(onError);
  useEffect(() => { onUserTranscriptRef.current      = onUserTranscript; },      [onUserTranscript]);
  useEffect(() => { onAssistantTranscriptRef.current = onAssistantTranscript; }, [onAssistantTranscript]);
  useEffect(() => { onStatusChangeRef.current        = onStatusChange; },        [onStatusChange]);
  useEffect(() => { onErrorRef.current               = onError; },               [onError]);

  const setStatus = useCallback((s: RealtimeStatus) => {
    onStatusChangeRef.current?.(s);
  }, []);

  /* ── Data-channel event handler ── */
  const handleEvent = useCallback((ev: Record<string, unknown>) => {
    switch (ev.type) {
      case "input_audio_buffer.speech_started":
        // User interrupted — mute playback immediately
        if (audioRef.current) {
          try { audioRef.current.pause(); } catch {}
        }
        setStatus("listening");
        break;

      case "response.created":
        setStatus("thinking");
        assistantBufRef.current = "";
        break;

      case "response.audio.delta":
        // Audio arrives via the WebRTC track; just update status
        setStatus("speaking");
        break;

      case "response.audio_transcript.delta": {
        const delta = ev.delta as string | undefined;
        if (delta) {
          assistantBufRef.current += delta;
          onAssistantTranscriptRef.current?.(assistantBufRef.current, false);
        }
        break;
      }

      case "response.audio_transcript.done":
        onAssistantTranscriptRef.current?.(assistantBufRef.current, true);
        assistantBufRef.current = "";
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const transcript = (ev.transcript as string | undefined)?.trim();
        if (transcript) onUserTranscriptRef.current?.(transcript);
        break;
      }

      case "response.done":
        setStatus("listening");
        break;

      case "error": {
        const err = ev.error as { message?: string } | undefined;
        onErrorRef.current?.(err?.message ?? "Realtime error");
        break;
      }
    }
  }, [setStatus]);

  /* ── Connect ── */
  const connect = useCallback(async () => {
    if (pcRef.current) return;
    setStatus("connecting");

    try {
      /* 1. Grab microphone */
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      /* 2. Create peer connection */
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      /* 3. Remote audio → <audio> element (model's voice) */
      pc.ontrack = (e) => {
        if (!audioRef.current) {
          audioRef.current = document.createElement("audio");
          audioRef.current.autoplay = true;
          document.body.appendChild(audioRef.current); // must be in DOM for autoplay
        }
        audioRef.current.srcObject = e.streams[0];
      };

      /* 4. Add mic track */
      pc.addTrack(stream.getAudioTracks()[0]);

      /* 5. Create data channel BEFORE the offer so it's included in SDP */
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        /* Configure session: voice, instructions, transcription, VAD */
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            voice: "shimmer",
            instructions: instructionsRef.current,
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
            },
          },
        }));
        setIsConnected(true);
        setStatus("listening");
      };

      dc.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data as string)); } catch { /* ignore parse errors */ }
      };

      dc.onclose = () => {
        setIsConnected(false);
        setStatus("idle");
      };

      /* 6. Generate SDP offer */
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      /* 7. Backend forwards offer → OpenAI, returns SDP answer + instructions */
      const res = await fetch(`${API_BASE}/tutor/realtime-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: "gpt-realtime-2025-08-28",
        }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.error ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }

      const payload = await res.json() as { sdp: string; instructions?: string };
      instructionsRef.current = payload.instructions ?? "";

      /* 8. Complete WebRTC handshake */
      await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });

    } catch (e) {
      onErrorRef.current?.((e as Error).message);
      setStatus("idle");
      // Clean up failed attempt
      pcRef.current?.close();
      pcRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [handleEvent, setStatus]);

  /* ── Disconnect ── */
  const disconnect = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) {
      try { audioRef.current.srcObject = null; } catch { /* ignore */ }
      audioRef.current.remove();
      audioRef.current = null;
    }
    setIsConnected(false);
    setStatus("idle");
  }, [setStatus]);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { connect, disconnect, isConnected };
}
