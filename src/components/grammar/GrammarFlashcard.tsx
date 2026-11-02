import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GrammarCard as GrammarCardData } from "@/lib/grammarContent";

interface GrammarFlashcardProps {
  card: GrammarCardData;
  /** The grammar word(s) this topic teaches, e.g. ["了"] or ["不", "没"]. */
  focus?: string[];
}

const CARD_LABEL_KEY: Record<GrammarCardData["type"], string> = {
  rule: "grammar.card_rule",
  pattern: "grammar.card_pattern",
  example: "grammar.card_example",
};

const MARK = "text-primary font-extrabold bg-primary/10 rounded px-1";

// Wrap every occurrence of the focus words in a highlight.
function highlightWords(text: string, focus: string[]) {
  const words = focus.filter(Boolean);
  if (words.length === 0) return text;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(re).map((part, i) =>
    words.includes(part) ? <span key={i} className={MARK}>{part}</span> : <span key={i}>{part}</span>,
  );
}

// Pattern cards line up hanzi and pinyin as "我 + 吃 + 了 + 饭" / "wǒ + chī + le + fàn".
// Highlight the pinyin pieces that sit under a highlighted hanzi piece.
function highlightPinyin(hanzi: string, pinyin: string, focus: string[]) {
  const sep = /(\s*[+/]\s*)/;
  const h = hanzi.split(sep);
  const p = pinyin.split(sep);
  if (h.length < 2 || h.length !== p.length) return pinyin;
  return p.map((piece, i) =>
    i % 2 === 0 && focus.some((f) => h[i].includes(f))
      ? <span key={i} className={MARK}>{piece}</span>
      : <span key={i}>{piece}</span>,
  );
}

const GrammarFlashcard = ({ card, focus = [] }: GrammarFlashcardProps) => {
  const { t, language } = useLanguage();
  const text = language === "ar" ? card.textAr : card.text;
  const marks = card.highlight ? [card.highlight] : focus;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20 shadow-soft border-2 border-primary/10 flex flex-col items-center justify-center text-center min-h-[260px]">
      <Badge variant="outline" className="mb-4">
        {t(CARD_LABEL_KEY[card.type])}
      </Badge>

      {card.hanzi && (
        <div className="text-4xl font-bold mb-3 leading-relaxed" lang="zh">
          {highlightWords(card.hanzi, marks)}
        </div>
      )}
      {card.pinyin && (
        <div className="font-pinyin text-lg text-muted-foreground mb-2">
          {card.hanzi ? highlightPinyin(card.hanzi, card.pinyin, marks) : card.pinyin}
        </div>
      )}

      <p
        className="text-lg font-medium max-w-prose"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {highlightWords(text, marks)}
      </p>

      {card.translation && language !== "en" && (
        <p className="text-sm text-muted-foreground mt-2">{card.translation}</p>
      )}
    </Card>
  );
};

export default GrammarFlashcard;
