import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { tokenPinyin, type GrammarQuestion as GQ } from "@/lib/grammarContent";
import { glossOf, segment } from "@/lib/grammarGloss";
import { TickMark, CrossMark } from "@/components/grammar/GrammarIcons";

interface GrammarQuestionProps {
  question: GQ;
  onAnswered: (correct: boolean) => void;
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle until the order differs from `avoid` (when that is possible). */
function shuffledAwayFrom(items: string[], avoid: string[]): string[] {
  if (new Set(items).size < 2) return [...items];
  for (let tries = 0; tries < 10; tries++) {
    const s = shuffled(items);
    if (!arraysEqual(s, avoid)) return s;
  }
  return [...items].reverse();
}

// The Chinese line of a fill-the-blank question, without the English hint
// some prompts carry in brackets, e.g. "我 ___ 学中文。(want to)".
function chineseLine(prompt: string): string {
  return prompt.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// Sentence pieces for display. Punctuation rides on the word before it, so a
// full stop never wraps onto a line of its own.
function sentenceParts(prompt: string) {
  const parts: { text: string; word: boolean; tail?: string }[] = [];
  for (const seg of segment(chineseLine(prompt))) {
    const text = seg.text.trim();
    if (!text) continue;
    const prev = parts[parts.length - 1];
    if (!seg.word && !text.includes("_") && prev) {
      prev.tail = (prev.tail ?? "") + text;
      continue;
    }
    parts.push({ text, word: seg.word });
  }
  return parts;
}

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

const GrammarQuestion = ({ question, onAnswered }: GrammarQuestionProps) => {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const isReorder = question.type === "reorder";
  // Answers come in a fresh order every time. The authored data lists the
  // right answer first, so without this the first button was always correct.
  // Tap-the-word keeps its order, because its tokens are the sentence itself.
  const [choices] = useState<string[]>(() =>
    question.type === "tap_correct"
      ? question.options
      : isReorder
        ? shuffledAwayFrom(question.options, question.answer as string[])
        : shuffledAwayFrom(question.options, question.options),
  );
  const [bank, setBank] = useState<string[]>(choices);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const showStimulus = question.type === "mcq_blank" || question.type === "word_bank";
  const explanation = language === "ar" ? question.explanationAr : question.explanation;
  const translation = language === "ar" ? question.translationAr : question.translation;
  const rtl = language === "ar";
  const lang = rtl ? "ar" : "en";
  // MCQ / word-bank put the Chinese sentence (with the blank) below as the stimulus, so the
  // instruction line is a generic helper. Tap / reorder have no separate sentence, so the
  // authored per-question prompt ("Tap the question particle", "Arrange: …") IS the question.
  const instruction = showStimulus
    ? t(`grammar.instr_${question.type}`)
    : rtl ? question.promptAr : question.prompt;

  const finish = (isCorrect: boolean) => {
    setAnswered(true);
    setCorrect(isCorrect);
    onAnswered(isCorrect);
  };

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    finish(opt === question.answer);
  };

  const tapBank = (idx: number) => {
    if (answered) return;
    setBuilt([...built, bank[idx]]);
    setBank(bank.filter((_, i) => i !== idx));
  };

  const tapBuilt = (idx: number) => {
    if (answered) return;
    setBank([...bank, built[idx]]);
    setBuilt(built.filter((_, i) => i !== idx));
  };

  const checkReorder = () => {
    if (answered || built.length === 0) return;
    finish(arraysEqual(built, question.answer as string[]));
  };

  // Color a selectable option after the answer is locked in.
  const optClass = (opt: string) => {
    if (!answered) return "";
    if (opt === question.answer) return "border-green-500 bg-green-500/10 text-green-700";
    if (opt === selected) return "border-red-500 bg-red-500/10 text-red-700";
    return "opacity-50";
  };

  // Self-contained classes for tap-the-word tokens (rendered as a sentence).
  const tapClass = (opt: string) => {
    if (!answered) return "border-border bg-muted/60 hover:border-primary/60 hover:bg-primary/10";
    if (opt === question.answer) return "border-green-500 bg-green-500/10 text-green-700";
    if (opt === selected) return "border-red-500 bg-red-500/10 text-red-700";
    return "border-border/60 opacity-50";
  };

  // A token (hanzi) with its pinyin and meaning underneath.
  const renderToken = (text: string) => (
    <span className="flex flex-col items-center leading-tight">
      <span>{text}</span>
      <span className="font-pinyin text-xs font-normal text-muted-foreground mt-1">{tokenPinyin(text)}</span>
      <span className="text-xs font-normal text-foreground/80 mt-0.5 max-w-[7rem] whitespace-normal" lang={lang} dir={rtl ? "rtl" : "ltr"}>
        {glossOf(text, lang)}
      </span>
    </span>
  );

  return (
    <Card className="p-6 shadow-soft border-2 border-primary/10">
      {/* The question: a generic helper for MCQ (sentence shown below), or the
          specific authored prompt for tap / reorder (which have no separate sentence). */}
      <p
        className={`mb-4 ${showStimulus ? "text-sm text-muted-foreground" : "text-base font-semibold text-foreground"}`}
        dir={rtl ? "rtl" : "ltr"}
      >
        {instruction}
      </p>

      {/* Stimulus: the Chinese sentence with a blank (MCQ / word-bank) */}
      {showStimulus && (
        <>
          <p className="text-center text-base font-semibold mb-3" dir={rtl ? "rtl" : "ltr"}>
            {translation}
          </p>
          <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-2 mb-6" dir="ltr">
            {sentenceParts(question.prompt).map((seg, i) => {
              if (seg.word) {
                return (
                  <span key={i} className="flex flex-col items-center leading-tight">
                    <span className="relative text-2xl font-bold" lang="zh">
                      {seg.text}
                      {seg.tail && <span className="absolute start-full">{seg.tail}</span>}
                    </span>
                    <span className="font-pinyin text-xs text-muted-foreground mt-1">{tokenPinyin(seg.text)}</span>
                    <span className="text-xs text-foreground/80 mt-0.5" lang={lang} dir={rtl ? "rtl" : "ltr"}>
                      {glossOf(seg.text, lang)}
                    </span>
                  </span>
                );
              }
              if (seg.text.includes("_")) {
                return (
                  <span key={i} className="relative">
                  <span
                    aria-label={t("grammar.blank")}
                    className={`mt-1 inline-block h-9 min-w-[3.5rem] rounded-md border-2 border-dashed px-2 text-2xl font-bold ${
                      answered ? "border-green-500 text-green-700" : "border-primary/50"
                    }`}
                    lang="zh"
                  >
                    {answered ? (question.answer as string) : ""}
                  </span>
                  {seg.tail && <span className="absolute start-full top-0 text-2xl font-bold" lang="zh">{seg.tail}</span>}
                  </span>
                );
              }
              return <span key={i} className="text-2xl font-bold" lang="zh">{seg.text}</span>;
            })}
          </div>
        </>
      )}

      {/* Selection UI */}
      {question.type === "tap_correct" ? (
        // Render the tokens in order as a tappable sentence (tap the grammar word).
        <div className="flex flex-wrap gap-2 justify-center text-2xl font-bold py-3" lang="zh">
          {question.options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`px-3 py-2 rounded-lg border-2 shadow-sm transition-colors disabled:cursor-default ${tapClass(opt)}`}
            >
              {renderToken(opt)}
            </button>
          ))}
        </div>
      ) : !isReorder ? (
        <div className="flex flex-wrap gap-3 justify-center" lang="zh">
          {choices.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={`h-auto py-3 px-5 text-lg ${optClass(opt)}`}
            >
              {renderToken(opt)}
            </Button>
          ))}
        </div>
      ) : (
        <>
          {/* Build tray */}
          <div
            className="min-h-[3.25rem] border-2 border-dashed border-primary/30 rounded-lg p-2 flex flex-wrap gap-2 justify-center items-center mb-3"
            lang="zh"
          >
            {built.length === 0 ? (
              <span className="text-sm text-muted-foreground">{t("grammar.tap_to_build")}</span>
            ) : (
              built.map((tok, i) => (
                <Button key={`${tok}-${i}`} variant="secondary" disabled={answered} onClick={() => tapBuilt(i)} className="h-auto text-lg">
                  {renderToken(tok)}
                </Button>
              ))
            )}
          </div>
          {/* Word bank */}
          <div className="flex flex-wrap gap-2 justify-center mb-4" lang="zh">
            {bank.map((tok, i) => (
              <Button key={`${tok}-${i}`} variant="outline" disabled={answered} onClick={() => tapBank(i)} className="h-auto text-lg">
                {renderToken(tok)}
              </Button>
            ))}
          </div>
          {!answered && (
            <div className="flex justify-center">
              <Button onClick={checkReorder} disabled={built.length === 0} className="bg-gradient-coral">
                {t("grammar.check")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Feedback */}
      {answered && (
        <div
          className={`mt-5 p-4 rounded-lg border ${
            correct ? "bg-green-500/10 border-green-500/40" : "bg-red-500/10 border-red-500/40"
          }`}
        >
          <div className={`flex items-center gap-2 font-bold ${correct ? "text-green-600" : "text-red-600"}`}>
            {correct ? <TickMark /> : <CrossMark />}
            {correct ? t("grammar.correct") : t("grammar.incorrect")}
          </div>

          <div className="text-2xl font-bold mt-2 text-center" lang="zh">{question.fullSentence}</div>
          <div className="font-pinyin text-sm text-muted-foreground text-center">{question.pinyin}</div>
          <div className="text-sm text-center" dir={rtl ? "rtl" : "ltr"}>{translation}</div>

          {!correct && (
            <div className="text-sm mt-2" dir={rtl ? "rtl" : "ltr"}>
              {t("grammar.correct_answer")}:{" "}
              <span className="font-bold text-green-700" lang="zh">
                {isReorder ? (question.answer as string[]).join("") : (question.answer as string)}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2" dir={rtl ? "rtl" : "ltr"}>{explanation}</p>
        </div>
      )}
    </Card>
  );
};

export default GrammarQuestion;
