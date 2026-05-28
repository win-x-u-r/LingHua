import { useState, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { speakText, type PhonemeSegment } from "@/lib/linghuaAPI";

// Tone contour arrows: 1=high level, 2=rising, 3=dipping, 4=falling, 5=neutral
const TONE_ARROW: Record<number, string> = { 1: "→", 2: "↗", 3: "∨", 4: "↘", 5: "·" };

// Correctness is optional: present in post-attempt feedback, absent when the
// component is used as a standalone clickable breakdown (explore-any-word mode).
interface FeedbackSegment extends PhonemeSegment {
  char_correct?: boolean;
  pinyin_correct?: boolean;
  tone_correct?: boolean;
}

interface PronunciationFeedbackProps {
  segments: FeedbackSegment[];
  // compact = smaller footprint for tight spaces like the flashcard back.
  compact?: boolean;
}

type RowKind = "char" | "pinyin" | "tone" | "arabic";

interface Row {
  key: RowKind;
  label: string;
  render: (s: FeedbackSegment) => ReactNode;
  ok: (s: FeedbackSegment) => boolean | undefined;
  speak: (s: FeedbackSegment) => { text: string; lang: "zh" | "ar" };
  dir?: "rtl" | "ltr";
  lang?: string;
}

const PronunciationFeedback = ({ segments, compact = false }: PronunciationFeedbackProps) => {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState<string | null>(null);

  if (!segments || segments.length === 0) return null;

  const hasScores = segments.some(
    (s) => s.char_correct !== undefined || s.pinyin_correct !== undefined || s.tone_correct !== undefined,
  );

  // Size tokens
  const labelW = compact ? "w-16" : "w-24";
  const labelPad = compact ? "pl-16" : "pl-24";
  const cellW = compact ? "w-10" : "w-14";
  const pad = compact ? "py-0.5" : "py-1";
  const fontFor: Record<RowKind, string> = {
    char: compact ? "text-lg font-bold" : "text-2xl font-bold",
    pinyin: compact ? "text-xs" : "text-base",
    tone: compact ? "text-base font-bold" : "text-xl font-bold",
    arabic: compact ? "text-xs" : "text-base",
  };

  // Green/red when we have a verdict; neutral (tappable) when just exploring.
  const colorClass = (ok: boolean | undefined) =>
    ok === undefined ? "text-foreground" : ok ? "text-green-500" : "text-red-500";

  const handlePlay = async (id: string, text: string, lang: "zh" | "ar") => {
    if (!text || playing) return;
    setPlaying(id);
    try {
      await speakText(text, lang);
    } catch {
      /* ignore playback errors */
    } finally {
      setPlaying(null);
    }
  };

  const rows: Row[] = [
    { key: "char", label: t("practice.characters"), render: (s) => s.char, ok: (s) => s.char_correct, speak: (s) => ({ text: s.char, lang: "zh" }), lang: "zh" },
    { key: "pinyin", label: t("practice.pinyin"), render: (s) => s.pinyin, ok: (s) => s.pinyin_correct, speak: (s) => ({ text: s.char, lang: "zh" }), lang: "zh" },
    { key: "tone", label: t("practice.tones"), render: (s) => TONE_ARROW[s.tone] ?? "·", ok: (s) => s.tone_correct, speak: (s) => ({ text: s.char, lang: "zh" }) },
    { key: "arabic", label: t("practice.arabic"), render: (s) => s.arabic, ok: (s) => s.pinyin_correct, speak: (s) => ({ text: s.arabic, lang: "ar" }), dir: "rtl" },
  ];

  return (
    // Force LTR so the per-character columns always read left-to-right,
    // even when the page is in Arabic (RTL) mode.
    <div dir="ltr" className="overflow-x-auto">
      <p className={`text-[11px] text-muted-foreground mb-1 ${labelPad}`}>{t("practice.tap_hint")}</p>
      <div className="inline-block min-w-full">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center">
            <div className={`${labelW} shrink-0 pr-2 text-right text-xs text-muted-foreground`}>{row.label}</div>
            {segments.map((s, i) => {
              const id = `${row.key}-${i}`;
              const { text, lang } = row.speak(s);
              return (
                <button
                  key={i}
                  type="button"
                  dir={row.dir}
                  lang={row.lang}
                  onClick={() => handlePlay(id, text, lang)}
                  disabled={playing !== null && playing !== id}
                  title={t("practice.tap_hint")}
                  className={`${cellW} shrink-0 text-center ${pad} rounded-md transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 ${
                    playing === id ? "bg-primary/10 animate-pulse" : ""
                  } ${fontFor[row.key]} ${colorClass(row.ok(s))}`}
                >
                  {row.render(s)}
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend (only meaningful when we have correct/incorrect verdicts) */}
        {hasScores && (
          <div className={`flex items-center gap-4 mt-2 ${labelPad} text-xs text-muted-foreground`}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              {t("practice.correct")}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
              {t("practice.incorrect")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationFeedback;
