import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlayButton } from "@/components/learn/Activities";
import MoveBack from "@/components/move/MoveBack";
import { useLanguage } from "@/contexts/LanguageContext";
import type { T } from "@/content/foundation1/types";
import { cn } from "@/lib/utils";

const PLACES: { zh: string; pinyin: string; name: T }[] = [
  { zh: "机场", pinyin: "jīchǎng", name: { en: "Airport", ar: "المطار" } },
  { zh: "火车站", pinyin: "huǒchē zhàn", name: { en: "Train station", ar: "محطة القطار" } },
  { zh: "高铁站", pinyin: "gāotiě zhàn", name: { en: "High-speed rail station", ar: "محطة القطار السريع" } },
  { zh: "地铁站", pinyin: "dìtiě zhàn", name: { en: "Metro station", ar: "محطة المترو" } },
  { zh: "会展中心", pinyin: "huìzhǎn zhōngxīn", name: { en: "Exhibition centre", ar: "مركز المعارض" } },
  { zh: "清真寺", pinyin: "qīngzhēnsì", name: { en: "Mosque", ar: "المسجد" } },
  { zh: "医院", pinyin: "yīyuàn", name: { en: "Hospital", ar: "المستشفى" } },
  { zh: "阿联酋大使馆", pinyin: "Āliánqiú dàshǐguǎn", name: { en: "UAE Embassy", ar: "سفارة الإمارات" } },
];

const SAVED = "linghua.move.taxi";

/** A card to show a taxi driver: where to, in big characters */
const TaxiCard = () => {
  const { t, language } = useLanguage();
  const [mine, setMine] = useState(() => {
    try {
      return localStorage.getItem(SAVED) ?? "";
    } catch {
      return "";
    }
  });
  const [showing, setShowing] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED, mine);
    } catch {
      // Not saved; the card still works for this visit
    }
  }, [mine]);

  useEffect(() => {
    if (!showing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowing(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showing]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <MoveBack />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("move.tool.taxi")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">打车卡</bdi>
        </h1>
        <p className="text-muted-foreground">{t("move.taxi.intro")}</p>
      </div>

      <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-3" aria-labelledby="my-place">
        <label id="my-place" htmlFor="my-place-input" className="text-lg font-bold">{t("move.taxi.mine")}</label>
        <p className="text-sm text-muted-foreground -mt-2">{t("move.taxi.mine.help")}</p>
        <Textarea
          id="my-place-input"
          lang="zh"
          value={mine}
          onChange={(e) => setMine(e.target.value)}
          placeholder="北京市朝阳区…"
          className="font-zh text-lg min-h-20"
        />
        <Button size="lg" disabled={!mine.trim()} onClick={() => setShowing(mine.trim())}>{t("move.taxi.show")}</Button>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="places">
        <h2 id="places" className="text-xl font-bold">{t("move.taxi.places")}</h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {PLACES.map((pl) => (
            <li key={pl.zh} className="border-b-2 border-border last:border-b-0 p-4 flex items-center gap-3">
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-lg leading-tight">{pl.name[language]}</span>
                <span lang="zh" dir="ltr" className="font-zh font-bold">{pl.zh}</span>{" "}
                <span dir="ltr" className="font-pinyin text-primary text-sm">{pl.pinyin}</span>
              </span>
              <Button size="sm" onClick={() => setShowing(pl.zh)}>{t("move.phrases.show")}</Button>
            </li>
          ))}
        </ul>
      </section>

      {showing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("move.tool.taxi")}
          className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center gap-5 p-6 text-center"
        >
          <p lang="zh" className="font-zh font-bold text-2xl md:text-3xl">师傅，您好！请带我去：</p>
          <p
            lang="zh"
            className={cn(
              "font-zh font-bold leading-tight text-primary break-words max-w-full",
              showing.length > 12 ? "text-[clamp(1.75rem,7vw,3.5rem)]" : "text-[clamp(3rem,14vw,7rem)]",
            )}
          >
            {showing}
          </p>
          <p lang="zh" className="font-zh font-bold text-2xl md:text-3xl">谢谢！</p>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <PlayButton text={`师傅，您好！请带我去${showing}。谢谢！`} size="lg" />
            <Button size="lg" onClick={() => setShowing(null)} autoFocus>{t("move.phrases.close")}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxiCard;
