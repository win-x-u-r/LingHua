import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayButton } from "@/components/learn/Activities";
import { TickMark, CrossMark } from "@/components/grammar/GrammarIcons";
import MoveBack from "@/components/move/MoveBack";
import { playZh } from "@/components/learn/audio";
import { useLanguage } from "@/contexts/LanguageContext";
import { chineseNumber } from "@/lib/chineseNumbers";
import { cn } from "@/lib/utils";

const BLOCKS: [number, string, string][] = [
  [1, "一", "yī"], [2, "二", "èr"], [3, "三", "sān"], [4, "四", "sì"], [5, "五", "wǔ"],
  [6, "六", "liù"], [7, "七", "qī"], [8, "八", "bā"], [9, "九", "jiǔ"], [10, "十", "shí"],
  [100, "百", "bǎi"], [1000, "千", "qiān"], [10000, "万", "wàn"],
];

const fmt = (n: number) => n.toLocaleString("en-US");

/** A realistic price or order size, from tens to hundreds of thousands */
function randomAmount(): number {
  const shapes = [
    () => (Math.floor(Math.random() * 9) + 1) * 10 + Math.floor(Math.random() * 10),
    () => (Math.floor(Math.random() * 9) + 1) * 100 + Math.floor(Math.random() * 10) * 10,
    () => (Math.floor(Math.random() * 9) + 1) * 1000 + Math.floor(Math.random() * 10) * 100,
    () => (Math.floor(Math.random() * 9) + 1) * 10000 + Math.floor(Math.random() * 10) * 1000,
    () => (Math.floor(Math.random() * 9) + 1) * 100000,
  ];
  return shapes[Math.floor(Math.random() * shapes.length)]();
}

/** Three wrong answers that test the usual slips: the wrong power of ten, or digits swapped */
function choicesFor(n: number): number[] {
  const swapped = Number(String(n).split("").reverse().join(""));
  const sameLength = String(swapped).length === String(n).length;
  const pool = [n * 10, Math.round(n / 10), sameLength ? swapped : n * 100, n + (n >= 1000 ? 1000 : 10)].filter((x) => x !== n && x >= 10);
  const wrong = Array.from(new Set(pool)).slice(0, 3);
  return [n, ...wrong].sort(() => Math.random() - 0.5);
}

const PriceQuiz = () => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(randomAmount);
  const choices = useMemo(() => choicesFor(amount), [amount]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const { zh, pinyin } = chineseNumber(amount);

  const choose = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    setScore((s) => ({ right: s.right + (n === amount ? 1 : 0), total: s.total + 1 }));
  };
  const next = () => {
    const a = randomAmount();
    setAmount(a);
    setPicked(null);
    playZh(`${chineseNumber(a).zh}块`).catch(() => {});
  };

  return (
    <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-4" aria-labelledby="quiz">
      <div className="flex items-center justify-between gap-3">
        <h2 id="quiz" className="text-xl font-bold">{t("move.numbers.quiz")}</h2>
        <span className="font-bold tabular-nums text-muted-foreground">
          {t("move.numbers.score").replace("{r}", String(score.right)).replace("{n}", String(score.total))}
        </span>
      </div>
      <p className="text-muted-foreground -mt-2">{t("move.numbers.quiz.desc")}</p>
      <PlayButton text={`${zh}块`} size="lg" variant="default" />
      <div className="grid grid-cols-2 gap-3" dir="ltr">
        {choices.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => choose(c)}
            disabled={picked !== null}
            className={cn(
              "rounded-[12px] border-2 border-stroke p-3 text-xl font-bold tabular-nums",
              picked === null ? "bg-card" : c === amount ? "bg-success-soft text-success-foreground" : c === picked ? "bg-destructive/15" : "bg-card opacity-60",
            )}
          >
            ¥{fmt(c)}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className={cn("flex items-start gap-2 font-semibold", picked === amount ? "text-success-foreground" : "text-destructive")}>
            {picked === amount ? <TickMark /> : <CrossMark />}
            <span>{picked === amount ? t("learn.right") : t("move.numbers.was").replace("{n}", fmt(amount))}</span>
          </p>
          <p dir="ltr" className="text-center">
            <span lang="zh" className="font-zh font-bold text-2xl">{zh}块</span>
            <span className="block font-pinyin font-bold text-primary">{pinyin} kuài</span>
          </p>
          <Button size="lg" onClick={next}>{t("move.numbers.next")}</Button>
        </div>
      )}
    </section>
  );
};

/** Numbers and prices: the building blocks, any number in Chinese, and a listening quiz */
const Numbers = () => {
  const { t } = useLanguage();
  const [typed, setTyped] = useState("8888");
  const value = Number(typed.replace(/[^\d]/g, ""));
  const shown = typed.trim() && Number.isFinite(value) && value < 100_000_000 ? chineseNumber(value) : null;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <MoveBack />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("move.tool.numbers")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">数字和价格</bdi>
        </h1>
        <p className="text-muted-foreground">{t("move.numbers.intro")}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="blocks">
        <h2 id="blocks" className="text-xl font-bold">{t("move.numbers.blocks")}</h2>
        <div className="flex flex-wrap gap-2" dir="ltr">
          {BLOCKS.map(([n, zh, py]) => (
            <button
              key={n}
              type="button"
              onClick={() => playZh(zh).catch(() => {})}
              className="rounded-[12px] border-2 border-stroke bg-card px-3 py-2 flex flex-col items-center min-w-[4.25rem]"
              aria-label={`${fmt(n)}: ${zh} ${py}`}
            >
              <span lang="zh" className="font-zh font-bold text-2xl leading-tight">{zh}</span>
              <span className="font-pinyin font-bold text-primary text-sm">{py}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{fmt(n)}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t("move.numbers.wan")}</p>
      </section>

      <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-3" aria-labelledby="any">
        <label id="any" htmlFor="any-number" className="text-xl font-bold">{t("move.numbers.any")}</label>
        <Input
          id="any-number"
          inputMode="numeric"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="h-12 text-xl font-bold tabular-nums"
          dir="ltr"
        />
        {shown && (
          <div className="flex flex-wrap items-center gap-3" dir="ltr">
            <span className="flex-1 min-w-0">
              <span lang="zh" className="block font-zh font-bold text-3xl break-words">{shown.zh}</span>
              <span className="block font-pinyin font-bold text-primary">{shown.pinyin}</span>
            </span>
            <PlayButton text={shown.zh} />
          </div>
        )}
      </section>

      <PriceQuiz />
    </div>
  );
};

export default Numbers;
