import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PronunciationFeedback from "@/components/PronunciationFeedback";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ScoreResponse } from "@/lib/linghuaAPI";

interface ScoreResultProps {
  result: ScoreResponse;
  earnedXp?: number;
  compact?: boolean;
}

/* One pronunciation score: total, the three part scores, what was heard, and each sound */
const ScoreResult = ({ result, earnedXp, compact = true }: ScoreResultProps) => {
  const { t } = useLanguage();

  const parts = [
    { label: t("practice.characters"), value: result.breakdown.character.score },
    { label: t("practice.pinyin"), value: result.breakdown.pinyin.score },
    { label: t("practice.tones"), value: result.breakdown.tone.score },
  ];

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2" dir="ltr">
        <span className="text-4xl font-bold tabular-nums">
          {result.score}
          <span className="text-base text-muted-foreground">/100</span>
        </span>
        {earnedXp !== undefined && <span className="font-bold text-success-foreground">+{earnedXp} XP</span>}
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0">{part.label}</span>
            <Progress value={part.value} className="h-2 flex-1" />
            <span className="w-10 text-end tabular-nums font-bold" dir="ltr">
              {part.value}%
            </span>
          </li>
        ))}
      </ul>

      {result.recognized && (
        <p className="text-sm flex flex-wrap items-baseline gap-x-2">
          <span className="text-muted-foreground">{t("flashcards.result.heard")}:</span>
          <span lang="zh" className="font-zh font-bold">{result.recognized}</span>
          {result.recognized_pinyin && <span className="font-pinyin font-bold text-primary">{result.recognized_pinyin}</span>}
          {result.recognized_arabic && (
            <span lang="ar" dir="rtl" className="font-bold">{result.recognized_arabic}</span>
          )}
        </p>
      )}

      {result.segments && result.segments.length > 0 && (
        <PronunciationFeedback segments={result.segments} compact={compact} />
      )}
    </Card>
  );
};

export default ScoreResult;
