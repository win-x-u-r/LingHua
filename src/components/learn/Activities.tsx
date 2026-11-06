// The activity types of a Foundation lesson. Each one tells the player when
// the learner may continue, and what they scored (first try only).
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import ScoreResult from "@/components/ScoreResult";
import { TickMark, CrossMark } from "@/components/grammar/GrammarIcons";
import ToneLine from "@/components/learn/ToneLine";
import { playHua, playSceneLine, playZh } from "@/components/learn/audio";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMicrophone, recordingFile } from "@/hooks/use-microphone";
import { pronounceAndScore, isUnclear, type ScoreResponse } from "@/lib/linghuaAPI";
import { missLineKey, type Miss } from "@/lib/missedSpeech";
import type { Activity, T, Zh, SceneLine } from "@/content/foundation1/types";
import type { CanDoAnswer } from "@/lib/foundationProgress";
import { cn } from "@/lib/utils";

export interface ActivityResult {
  right?: number;
  total?: number;
  /** For speaking: did Hua understand it */
  spoken?: boolean;
}

export interface ActivityProps<K extends Activity["kind"]> {
  activity: Extract<Activity, { kind: K }>;
  /** Call once the learner may continue */
  onReady: (result?: ActivityResult) => void;
}

/* ───────────────────────────── shared bits ───────────────────────────── */

export const useText = () => {
  const { language } = useLanguage();
  return (text: T) => text[language];
};

const isZh = (label: T | Zh): label is Zh => "zh" in label;

/** A play button that says what it plays and can't be pressed twice at once */
export const PlayButton = ({ text, hua = false, label, size = "sm", variant = "outline" }: {
  text: string;
  hua?: boolean;
  label?: string;
  size?: "sm" | "lg" | "default";
  variant?: "outline" | "default";
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [playing, setPlaying] = useState(false);
  const play = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      await (hua ? playHua(text) : playZh(text));
    } catch {
      toast({ title: t("flashcards.tts_failed"), description: t("flashcards.tts_failed_desc"), variant: "destructive" });
    } finally {
      setPlaying(false);
    }
  };
  return (
    <Button type="button" size={size} variant={variant} onClick={play} disabled={playing} aria-label={`${label ?? t("learn.listen")}: ${text}`}>
      <span lang="zh" className="font-zh me-1.5">听</span>
      {label ?? t("learn.listen")}
    </Button>
  );
};

/** Mandarin with its pinyin underneath */
export const ZhText = ({ zh, pinyin, size = "md" }: Zh & { size?: "sm" | "md" | "lg" | "xl" }) => (
  <span className="inline-flex flex-col items-center" dir="ltr">
    <span
      lang="zh"
      className={cn(
        "font-zh font-bold leading-tight",
        { sm: "text-xl", md: "text-3xl", lg: "text-5xl", xl: "text-6xl md:text-7xl" }[size],
      )}
    >
      {zh}
    </span>
    <span className={cn("font-pinyin font-bold text-primary", size === "xl" || size === "lg" ? "text-2xl" : "text-base")}>{pinyin}</span>
  </span>
);

/** Hua speaking: the lantern and a speech bubble */
export const HuaSays = ({ mood = "happy", children }: { mood?: LanternMood; children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <Lantern mood={mood} className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
    <div className="flex-1 rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card px-4 py-3">{children}</div>
  </div>
);

/** One-line feedback with a drawn tick or cross */
const Feedback = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <p className={cn("flex items-start gap-2 font-semibold", ok ? "text-success-foreground" : "text-destructive")} aria-live="polite">
    {ok ? <TickMark /> : <CrossMark />}
    <span>{children}</span>
  </p>
);

/* ───────────────────────────── Hear ───────────────────────────── */

const speakerTone: Record<SceneLine["who"], string> = {
  hua: "bg-sunshine text-sunshine-foreground",
  a: "bg-card",
  b: "bg-secondary dark:bg-muted",
  teacher: "bg-primary text-primary-foreground",
};

export const SceneActivity = ({ activity, onReady, lessonKey }: ActivityProps<"scene"> & { lessonKey: string }) => {
  const { t } = useLanguage();
  const tx = useText();
  const { toast } = useToast();
  const [showWords, setShowWords] = useState(false);
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const stop = useRef(false);

  useEffect(() => {
    onReady();
    return () => {
      stop.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playLine = (l: SceneLine) => playSceneLine(lessonKey, activity.lines.indexOf(l), l);

  const playAll = async () => {
    stop.current = false;
    try {
      for (let i = 0; i < activity.lines.length; i++) {
        if (stop.current) break;
        setPlayingLine(i);
        await playLine(activity.lines[i]);
        await new Promise((r) => setTimeout(r, 350));
      }
      setShowWords(true);
    } catch {
      toast({ title: t("flashcards.tts_failed"), description: t("flashcards.tts_failed_desc"), variant: "destructive" });
    } finally {
      setPlayingLine(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{tx(activity.title)}</h2>
      <HuaSays mood={playingLine !== null ? "listening" : "idle"}>
        <p>{t("learn.scene.hint")}</p>
      </HuaSays>
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={playAll} disabled={playingLine !== null}>
          <span lang="zh" className="font-zh me-2">听</span>
          {t("learn.scene.play")}
        </Button>
        {!showWords && (
          <Button size="lg" variant="outline" onClick={() => setShowWords(true)}>
            {t("learn.scene.words")}
          </Button>
        )}
      </div>
      <ol className="flex flex-col gap-2">
        {activity.lines.map((l, i) => (
          <li
            key={i}
            className={cn(
              "rounded-[14px] border-2 p-3 flex items-center gap-3",
              playingLine === i ? "border-primary" : "border-stroke",
              "bg-card",
            )}
          >
            <span className={cn("shrink-0 rounded-full border-2 border-stroke px-2.5 py-0.5 text-sm font-bold", speakerTone[l.who])}>
              {tx(l.name)}
            </span>
            {showWords ? (
              <span className="flex-1 min-w-0 flex flex-col">
                <span lang="zh" dir="ltr" className="font-zh font-bold text-xl text-start">{l.zh}</span>
                <span dir="ltr" className="font-pinyin text-primary font-bold text-start">{l.pinyin}</span>
                <span className="text-sm text-muted-foreground">{tx(l.meaning)}</span>
              </span>
            ) : (
              <span className="flex-1 h-3 rounded-full bg-muted" aria-hidden="true" />
            )}
            {showWords && (
              <Button size="sm" variant="outline" onClick={() => playLine(l).catch(() => {})} aria-label={`${t("learn.listen")}: ${l.zh}`}>
                <span lang="zh" className="font-zh">听</span>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

/* ───────────────────────────── Understand ───────────────────────────── */

export const WordActivity = ({ activity, onReady }: ActivityProps<"word">) => {
  const { t, language } = useLanguage();
  const tx = useText();
  const [showSound, setShowSound] = useState(false);
  useEffect(() => onReady(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border-2 border-stroke bg-card p-6 flex flex-col items-center text-center gap-2">
        {activity.bonus && (
          <span className="rounded-full border-2 border-stroke bg-sunshine text-sunshine-foreground px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
            {t("learn.bonus")}
          </span>
        )}
        <ZhText zh={activity.zh} pinyin={activity.pinyin} size="xl" />
        <span lang="ar" dir="rtl" className="text-2xl font-bold">{activity.meaning.ar}</span>
        {language === "en" && <span className="text-muted-foreground">{activity.meaning.en}</span>}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <PlayButton text={activity.zh} size="lg" variant="default" />
        </div>
        <div className="mt-3 pt-3 border-t-2 border-border w-full flex flex-col items-center gap-1">
          {showSound ? (
            <>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("learn.sound")}</span>
              <span lang="ar" dir="rtl" className="text-2xl font-bold">{activity.sound}</span>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowSound(true)}>
              {t("learn.sound.show")}
            </Button>
          )}
        </div>
      </div>
      {activity.note && (
        <HuaSays>
          <p>{tx(activity.note)}</p>
        </HuaSays>
      )}
    </div>
  );
};

export const NoteActivity = ({ activity, onReady }: ActivityProps<"note">) => {
  const tx = useText();
  useEffect(() => onReady(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{tx(activity.title)}</h2>
      <HuaSays>
        <p>{tx(activity.body)}</p>
      </HuaSays>
      {activity.examples && (
        <ul className="flex flex-col gap-2">
          {activity.examples.map((ex) => (
            <li key={ex.zh} className="rounded-[14px] border-2 border-stroke bg-card p-4 flex items-center gap-3">
              <span className="flex-1 min-w-0 flex flex-col items-start" dir="ltr">
                <span lang="zh" className="font-zh font-bold text-2xl">{ex.zh}</span>
                <span className="font-pinyin font-bold text-primary">{ex.pinyin}</span>
              </span>
              <span className="text-end text-muted-foreground">{tx(ex.meaning)}</span>
              <PlayButton text={ex.zh} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TONE_SAMPLES: { tone: 1 | 2 | 3 | 4; zh: string; pinyin: string; meaningKey: string }[] = [
  { tone: 1, zh: "妈", pinyin: "mā", meaningKey: "learn.tones.mother" },
  { tone: 2, zh: "麻", pinyin: "má", meaningKey: "learn.tones.hemp" },
  { tone: 3, zh: "马", pinyin: "mǎ", meaningKey: "learn.tones.horse" },
  { tone: 4, zh: "骂", pinyin: "mà", meaningKey: "learn.tones.scold" },
];

export const TonesActivity = ({ onReady }: ActivityProps<"tones">) => {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState<number | null>(null);
  useEffect(() => onReady(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const play = async (tone: number, zh: string) => {
    setPlaying(tone);
    await playZh(zh).catch(() => {});
    setPlaying(null);
  };
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{t("learn.tones.tap")}</h2>
      <ul className="grid grid-cols-2 gap-3">
        {TONE_SAMPLES.map((s) => (
          <li key={s.tone}>
            <button
              type="button"
              onClick={() => play(s.tone, s.zh)}
              className={cn(
                "w-full rounded-[14px] border-2 bg-card p-3 flex flex-col items-center gap-1 text-center",
                playing === s.tone ? "border-primary" : "border-stroke",
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("learn.tone.n").replace("{n}", String(s.tone))}
              </span>
              <ToneLine tone={s.tone} className="max-w-[9rem]" />
              <ZhText zh={s.zh} pinyin={s.pinyin} />
              <span className="text-sm font-semibold">{t(`learn.tone.${s.tone}`)}</span>
              <span className="text-sm text-muted-foreground">{t(s.meaningKey)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ───────────────────────────── Speak ───────────────────────────── */

/** Strip punctuation and spaces so "你好！" matches "你好" */
const bare = (s: string) => s.replace(/[\s,，.。!！?？、]/g, "");

export const SayActivity = ({ activity, onReady }: ActivityProps<"say">) => {
  const { t } = useLanguage();
  const tx = useText();
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording, audioBlob, missed, error: micError } = useMicrophone();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [miss, setMiss] = useState<Miss | null>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  const [ok, setOk] = useState(false);
  const huaPlayed = useRef(false);

  // Hua speaks first when the activity opens (browsers may block this; the button is there too)
  useEffect(() => {
    if (activity.hua && !huaPlayed.current) {
      huaPlayed.current = true;
      playHua(activity.hua.zh).catch(() => {});
    }
  }, [activity.hua]);

  useEffect(() => {
    if (micError) toast({ title: t("common.mic_error"), description: micError, variant: "destructive" });
  }, [micError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (missed) setMiss(missed);
  }, [missed]);

  // The recording goes to the scorer and is then dropped. Nothing is stored.
  useEffect(() => {
    if (!audioBlob) return;
    (async () => {
      setProcessing(true);
      try {
        const scored = await pronounceAndScore(recordingFile(audioBlob), activity.zh);
        setTries((n) => n + 1);
        if (isUnclear(scored)) {
          setMiss(scored.unclear);
          return;
        }
        setResult(scored);
        const heard = bare(scored.recognized || "");
        const understood = activity.nameSlot ? heard.startsWith(bare(activity.zh)) || scored.score >= 60 : heard.includes(bare(activity.zh)) || scored.score >= 70;
        if (understood) {
          setOk(true);
          onReady({ spoken: true });
        }
      } catch {
        setFailed(true);
        setTries((n) => n + 1);
      } finally {
        setProcessing(false);
      }
    })();
  }, [audioBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    if (isRecording) return stopRecording();
    setResult(null);
    setMiss(null);
    setFailed(false);
    await startRecording();
  };

  const mood: LanternMood = isRecording ? "listening" : processing ? "thinking" : ok ? "celebrate" : result || miss || failed ? "idle" : "happy";
  const say = activity.nameSlot ? `${activity.zh} … (${t("learn.say.name")})` : activity.zh;

  return (
    <div className="flex flex-col gap-4">
      {activity.hua ? (
        <HuaSays mood={mood}>
          <span className="flex items-center gap-3">
            <span className="flex-1 min-w-0 flex flex-col items-start" dir="ltr">
              <span lang="zh" className="font-zh font-bold text-2xl">{activity.hua.zh}</span>
              <span className="font-pinyin font-bold text-primary">{activity.hua.pinyin}</span>
            </span>
            <PlayButton text={activity.hua.zh} hua />
          </span>
        </HuaSays>
      ) : null}
      <h2 className="text-2xl font-bold">{tx(activity.prompt)}</h2>

      <div className="rounded-[14px] border-2 border-stroke bg-card p-6 flex flex-col items-center text-center gap-3">
        {!activity.hua && <Lantern mood={mood} className="w-20 h-20" />}
        <span className="inline-flex flex-col items-center" dir="ltr">
          <span lang="zh" className="font-zh font-bold text-5xl leading-tight">{say}</span>
          <span className="font-pinyin font-bold text-primary text-xl">{activity.pinyin}{activity.nameSlot ? " …" : ""}</span>
        </span>
        {activity.tip && <p className="text-muted-foreground">{tx(activity.tip)}</p>}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <PlayButton text={activity.zh} size="lg" />
          <Button size="lg" variant={isRecording ? "destructive" : "default"} onClick={toggle} disabled={processing} aria-pressed={isRecording}>
            <span lang="zh" className="font-zh me-2">说</span>
            {isRecording ? t("learn.stop") : processing ? t("learn.checking") : t("learn.say")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("learn.say.private")}</p>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {ok && <Feedback ok>{t("learn.say.ok")}</Feedback>}
        {!ok && result && <Feedback ok={false}>{t("learn.say.again")}</Feedback>}
        {miss && <p className="font-semibold">{t(missLineKey(miss))}</p>}
        {failed && <p className="font-semibold">{t("learn.say.failed")}</p>}
        {result && <ScoreResult result={result} />}
      </div>

      {!ok && (
        <div className="flex flex-wrap gap-2">
          {tries >= 2 || failed ? (
            <Button variant="outline" onClick={() => onReady({ spoken: false })}>{t("learn.say.anyway")}</Button>
          ) : (
            <Button variant="ghost" onClick={() => onReady({ spoken: false })}>{t("learn.say.skip")}</Button>
          )}
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────── Use and Remember ───────────────────────────── */

export const TonePickActivity = ({ activity, onReady }: ActivityProps<"tonePick">) => {
  const { t } = useLanguage();
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [missedRound, setMissedRound] = useState(false);
  const right = useRef(0);
  const item = activity.items[round];
  const last = round === activity.items.length - 1;
  const correct = picked === item.tone;

  useEffect(() => {
    playZh(item.zh).catch(() => {});
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (tone: number) => {
    if (correct) return;
    setPicked(tone);
    if (tone === item.tone) {
      if (!missedRound) right.current += 1;
      if (last) onReady({ right: right.current, total: activity.items.length });
    } else {
      setMissedRound(true);
      playZh(item.zh).catch(() => {});
    }
  };

  const next = () => {
    setRound((r) => r + 1);
    setPicked(null);
    setMissedRound(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{t("learn.tone.which")}</h2>
        <span className="font-bold text-muted-foreground tabular-nums">
          {t("learn.round").replace("{i}", String(round + 1)).replace("{n}", String(activity.items.length))}
        </span>
      </div>
      <div className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col items-center gap-3">
        <Lantern mood={picked === null ? "listening" : correct ? "happy" : "sad"} className="w-20 h-20" />
        {correct ? <ZhText zh={item.zh} pinyin={item.pinyin} size="lg" /> : <span className="font-zh text-5xl font-bold text-muted-foreground" aria-hidden="true">?</span>}
        <PlayButton text={item.zh} label={t("learn.tone.play")} />
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([1, 2, 3, 4] as const).map((tone) => (
          <li key={tone}>
            <button
              type="button"
              onClick={() => pick(tone)}
              aria-pressed={picked === tone}
              className={cn(
                "w-full rounded-[14px] border-2 bg-card p-3 flex flex-col items-center gap-1",
                picked === tone && tone === item.tone && "border-success bg-success-soft",
                picked === tone && tone !== item.tone && "border-destructive",
                picked !== tone && (correct && tone === item.tone ? "border-success" : "border-stroke"),
              )}
            >
              <span className="font-bold">{t("learn.tone.n").replace("{n}", String(tone))}</span>
              <ToneLine tone={tone} className="max-w-[7rem]" />
              <span className="text-xs text-muted-foreground">{t(`learn.tone.${tone}`)}</span>
            </button>
          </li>
        ))}
      </ul>
      {picked !== null &&
        (correct ? (
          <Feedback ok>{t("learn.tone.right").replace("{n}", String(item.tone))}</Feedback>
        ) : (
          <Feedback ok={false}>
            {t("learn.tone.wrong").replace("{n}", String(item.tone)).replace("{desc}", t(`learn.tone.${item.tone}`).toLowerCase())}
          </Feedback>
        ))}
      {correct && !last && (
        <Button size="lg" variant="outline" onClick={next} className="self-start">
          {t("learn.round.next")}
        </Button>
      )}
    </div>
  );
};

export const ChoiceActivity = ({ activity, onReady }: ActivityProps<"choice">) => {
  const { t } = useLanguage();
  const tx = useText();
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (activity.listen) playZh(activity.listen.zh).catch(() => {});
  }, [activity]);

  const pick = (i: number) => {
    if (done) return;
    if (activity.options[i].correct) {
      setDone(true);
      onReady({ right: wrong.length === 0 ? 1 : 0, total: 1 });
    } else if (!wrong.includes(i)) {
      setWrong((w) => [...w, i]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{tx(activity.prompt)}</h2>
      {activity.listen && (
        <div className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col items-center gap-3">
          <Lantern mood={done ? "happy" : "listening"} className="w-20 h-20" />
          {done && <ZhText zh={activity.listen.zh} pinyin={activity.listen.pinyin} />}
          <PlayButton text={activity.listen.zh} label={t("learn.tone.play")} />
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {activity.options.map((o, i) => {
          const isWrong = wrong.includes(i);
          const isRight = done && o.correct;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(i)}
                className={cn(
                  "w-full rounded-[14px] border-2 bg-card p-4 flex items-center gap-3 text-start",
                  isRight ? "border-success bg-success-soft" : isWrong ? "border-destructive opacity-70" : "border-stroke",
                )}
              >
                {isRight ? <TickMark /> : isWrong ? <CrossMark /> : <span className="size-6 shrink-0 rounded-full border-2 border-stroke" aria-hidden="true" />}
                {isZh(o.label) ? (
                  <span className="flex flex-col items-start" dir="ltr">
                    <span lang="zh" className="font-zh font-bold text-xl">{o.label.zh}</span>
                    <span className="font-pinyin text-primary font-bold text-sm">{o.label.pinyin}</span>
                  </span>
                ) : (
                  <span className="font-bold text-lg">{tx(o.label)}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {wrong.length > 0 && !done && <Feedback ok={false}>{tx(activity.why)}</Feedback>}
      {done && <Feedback ok>{t("learn.right")} {wrong.length > 0 ? "" : tx(activity.why)}</Feedback>}
    </div>
  );
};

/** A stable shuffle, so the order doesn't jump around while the learner taps */
function shuffled<X>(items: X[], seed: number): X[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never leave the meanings lined up with their words
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

export const MatchActivity = ({ activity, onReady }: ActivityProps<"match">) => {
  const { t } = useLanguage();
  const tx = useText();
  const meanings = useMemo(() => shuffled(activity.pairs.map((p, i) => ({ ...p, i })), activity.pairs.length * 7), [activity]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [slipped, setSlipped] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);

  const pickMeaning = (i: number) => {
    if (selected === null || matched.includes(i)) return;
    if (i === selected) {
      const next = [...matched, i];
      setMatched(next);
      setSelected(null);
      if (next.length === activity.pairs.length) {
        onReady({ right: activity.pairs.filter((_, k) => !slipped.includes(k)).length, total: activity.pairs.length });
      }
    } else {
      setSlipped((s) => (s.includes(selected) ? s : [...s, selected]));
      setFlash(i);
      setTimeout(() => setFlash(null), 600);
    }
  };

  const tile = "w-full rounded-[14px] border-2 p-3 min-h-16 flex flex-col items-center justify-center text-center";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{t("learn.match.title")}</h2>
      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-2">
          {activity.pairs.map((p, i) => (
            <li key={p.zh}>
              <button
                type="button"
                disabled={matched.includes(i)}
                aria-pressed={selected === i}
                onClick={() => {
                  setSelected(i);
                  playZh(p.zh).catch(() => {});
                }}
                className={cn(
                  tile,
                  matched.includes(i) ? "border-success bg-success-soft" : selected === i ? "border-primary bg-secondary" : "border-stroke bg-card",
                )}
              >
                <ZhText zh={p.zh} pinyin={p.pinyin} size="sm" />
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-2">
          {meanings.map((m) => (
            <li key={m.zh}>
              <button
                type="button"
                disabled={matched.includes(m.i)}
                onClick={() => pickMeaning(m.i)}
                className={cn(
                  tile,
                  "font-bold",
                  matched.includes(m.i) ? "border-success bg-success-soft" : flash === m.i ? "border-destructive" : "border-stroke bg-card",
                )}
              >
                {tx(m.meaning)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {matched.length === activity.pairs.length && <Feedback ok>{t("learn.right")}</Feedback>}
    </div>
  );
};

export const OrderActivity = ({ activity, onReady }: ActivityProps<"order">) => {
  const { t } = useLanguage();
  const tx = useText();
  const bank = useMemo(() => shuffled(activity.tiles.map((zh, i) => ({ zh, i })), 3), [activity]);
  const [answer, setAnswer] = useState<number[]>([]);
  const [wrongTries, setWrongTries] = useState(0);
  const [checked, setChecked] = useState<"right" | "wrong" | null>(null);
  const full = answer.length === activity.tiles.length;

  const check = () => {
    const isRight = answer.every((tileIndex, pos) => activity.tiles[tileIndex] === activity.tiles[pos]);
    if (isRight) {
      setChecked("right");
      onReady({ right: wrongTries === 0 ? 1 : 0, total: 1 });
      playZh(activity.tiles.join("")).catch(() => {});
    } else {
      setChecked("wrong");
      setWrongTries((n) => n + 1);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{tx(activity.prompt)}</h2>
      <div dir="ltr" className="min-h-20 rounded-[14px] border-2 border-dashed border-stroke bg-card p-3 flex flex-wrap items-center gap-2">
        {answer.map((tileIndex, pos) => (
          <button
            key={pos}
            type="button"
            disabled={checked === "right"}
            onClick={() => {
              setAnswer((a) => a.filter((_, k) => k !== pos));
              setChecked(null);
            }}
            className="rounded-[10px] border-2 border-stroke bg-secondary px-3 py-2 font-zh font-bold text-2xl"
            lang="zh"
          >
            {activity.tiles[tileIndex]}
          </button>
        ))}
        {checked === "right" && <span lang="zh" className="font-zh font-bold text-2xl">？</span>}
      </div>
      <div dir="ltr" className="flex flex-wrap gap-2">
        {bank.map(({ zh, i }) => (
          <button
            key={i}
            type="button"
            disabled={answer.includes(i)}
            onClick={() => {
              setAnswer((a) => [...a, i]);
              setChecked(null);
            }}
            className={cn("rounded-[10px] border-2 border-stroke bg-card px-3 py-2 font-zh font-bold text-2xl", answer.includes(i) && "opacity-30")}
            lang="zh"
          >
            {zh}
          </button>
        ))}
      </div>
      {checked === "right" ? (
        <Feedback ok>
          <span dir="ltr" className="font-pinyin">{activity.pinyin}</span> · {tx(activity.meaning)}
        </Feedback>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={check} disabled={!full}>{t("learn.order.check")}</Button>
          {answer.length > 0 && (
            <Button variant="outline" onClick={() => { setAnswer([]); setChecked(null); }}>{t("learn.order.clear")}</Button>
          )}
        </div>
      )}
      {checked === "wrong" && <Feedback ok={false}>{t("learn.order.wrong")}</Feedback>}
    </div>
  );
};

export const CanDoActivity = ({ statements, answers, onAnswer, onReady }: {
  statements: T[];
  answers: Record<number, CanDoAnswer>;
  onAnswer: (i: number, a: CanDoAnswer) => void;
  onReady: () => void;
}) => {
  const { t } = useLanguage();
  const tx = useText();
  useEffect(() => onReady(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const choices: CanDoAnswer[] = ["not_yet", "with_help", "yes"];
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{t("learn.cando.title")}</h2>
      <ul className="flex flex-col gap-3">
        {statements.map((s, i) => (
          <li key={i} className="rounded-[14px] border-2 border-stroke bg-card p-4 flex flex-col gap-3">
            <span className="font-semibold">{tx(s)}</span>
            <span role="radiogroup" aria-label={tx(s)} className="grid grid-cols-3 gap-2">
              {choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={answers[i] === c}
                  onClick={() => onAnswer(i, c)}
                  className={cn(
                    "rounded-[10px] border-2 px-2 py-2 text-sm font-bold",
                    answers[i] === c ? "border-stroke bg-foreground text-background" : "border-border bg-card",
                  )}
                >
                  {t(`learn.cando.${c}`)}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
