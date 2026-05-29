import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { tokenPinyin, type GrammarQuestion as GQ } from "@/lib/grammarContent";

interface GrammarQuestionProps {
  question: GQ;
  onAnswered: (correct: boolean) => void;
}

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

const GrammarQuestion = ({ question, onAnswered }: GrammarQuestionProps) => {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>(question.options);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const isReorder = question.type === "reorder";
  const showStimulus = question.type === "mcq_blank" || question.type === "word_bank";
  const explanation = language === "ar" ? question.explanationAr : question.explanation;
  const translation = language === "ar" ? question.translationAr : question.translation;
  const rtl = language === "ar";
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

  // A token (hanzi) with its pinyin shown underneath.
  const renderToken = (text: string) => (
    <span className="flex flex-col items-center leading-tight">
      <span>{text}</span>
      <span className="text-[0.6rem] font-normal text-muted-foreground mt-0.5">{tokenPinyin(text)}</span>
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
        <p className="text-2xl font-bold text-center mb-5" lang="zh" dir="ltr">
          {question.prompt}
        </p>
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
          {question.options.map((opt) => (
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
            {correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {correct ? t("grammar.correct") : t("grammar.incorrect")}
          </div>

          <div className="text-2xl font-bold mt-2 text-center" lang="zh">{question.fullSentence}</div>
          <div className="text-sm text-muted-foreground text-center">{question.pinyin}</div>
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
