import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GrammarCard as GrammarCardData } from "@/lib/grammarContent";

interface GrammarFlashcardProps {
  card: GrammarCardData;
}

const CARD_LABEL_KEY: Record<GrammarCardData["type"], string> = {
  rule: "grammar.card_rule",
  pattern: "grammar.card_pattern",
  example: "grammar.card_example",
};

// Render hanzi with the grammar token emphasized in brand color.
function renderHanzi(hanzi: string, highlight?: string) {
  if (!highlight || !hanzi.includes(highlight)) return hanzi;
  const parts = hanzi.split(highlight);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="text-primary font-extrabold bg-primary/10 rounded px-1">{highlight}</span>
      )}
    </span>
  ));
}

const GrammarFlashcard = ({ card }: GrammarFlashcardProps) => {
  const { t, language } = useLanguage();
  const text = language === "ar" ? card.textAr : card.text;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20 shadow-soft border-2 border-primary/10 flex flex-col items-center justify-center text-center min-h-[260px]">
      <Badge variant="outline" className="mb-4">
        {t(CARD_LABEL_KEY[card.type])}
      </Badge>

      {card.hanzi && (
        <div className="text-4xl font-bold mb-3 leading-relaxed" lang="zh">
          {renderHanzi(card.hanzi, card.highlight)}
        </div>
      )}
      {card.pinyin && <div className="text-lg text-muted-foreground mb-2">{card.pinyin}</div>}

      <p
        className="text-lg font-medium max-w-prose"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {text}
      </p>

      {card.translation && language !== "en" && (
        <p className="text-sm text-muted-foreground mt-2">{card.translation}</p>
      )}
    </Card>
  );
};

export default GrammarFlashcard;
