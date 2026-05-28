import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PronunciationSegment } from "@/lib/linghuaAPI";

// Tone contour arrows: 1=high level, 2=rising, 3=dipping, 4=falling, 5=neutral
const TONE_ARROW: Record<number, string> = { 1: "→", 2: "↗", 3: "∨", 4: "↘", 5: "·" };

interface PronunciationFeedbackProps {
  segments: PronunciationSegment[];
}

interface Row {
  label: string;
  render: (s: PronunciationSegment) => ReactNode;
  ok: (s: PronunciationSegment) => boolean;
  cellClass?: string;
  dir?: "rtl" | "ltr";
  lang?: string;
}

const PronunciationFeedback = ({ segments }: PronunciationFeedbackProps) => {
  const { t } = useLanguage();

  if (!segments || segments.length === 0) return null;

  const color = (ok: boolean) => (ok ? "text-green-500" : "text-red-500");

  const rows: Row[] = [
    { label: t("practice.characters"), render: (s) => s.char, ok: (s) => s.char_correct, cellClass: "text-2xl font-bold", lang: "zh" },
    { label: t("practice.pinyin"), render: (s) => s.pinyin, ok: (s) => s.pinyin_correct, cellClass: "text-base", lang: "zh" },
    { label: t("practice.tones"), render: (s) => TONE_ARROW[s.tone] ?? "·", ok: (s) => s.tone_correct, cellClass: "text-xl font-bold" },
    { label: t("practice.arabic"), render: (s) => s.arabic, ok: (s) => s.pinyin_correct, cellClass: "text-base", dir: "rtl" },
  ];

  return (
    // Force LTR so the per-character columns always read left-to-right,
    // even when the page is in Arabic (RTL) mode.
    <div dir="ltr" className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center">
            <div className="w-24 shrink-0 pr-2 text-right text-xs text-muted-foreground">{row.label}</div>
            {segments.map((s, i) => (
              <div
                key={i}
                dir={row.dir}
                lang={row.lang}
                className={`w-14 shrink-0 text-center py-1 ${row.cellClass ?? ""} ${color(row.ok(s))}`}
              >
                {row.render(s)}
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 pl-24 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
            {t("practice.correct")}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            {t("practice.incorrect")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PronunciationFeedback;
