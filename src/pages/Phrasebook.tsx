import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlayButton } from "@/components/learn/Activities";
import { useLanguage } from "@/contexts/LanguageContext";
import { PHRASE_GROUPS, type Phrase } from "@/content/onTheMove/phrases";
import { cn } from "@/lib/utils";

/** Big characters to hold up for a driver, receptionist or waiter */
const ShowCard = ({ phrase, onClose }: { phrase: Phrase; onClose: () => void }) => {
  const { t, language } = useLanguage();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={phrase.meaning[language]}
      className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center gap-6 p-6 text-center"
    >
      <p lang="zh" className="font-zh font-bold leading-tight text-[clamp(3rem,14vw,8rem)] break-words max-w-full text-balance">
        {phrase.zh}
      </p>
      <p dir="ltr" className="font-pinyin font-bold text-primary text-2xl md:text-3xl">{phrase.pinyin}</p>
      <p className="text-xl text-muted-foreground">{phrase.meaning[language]}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <PlayButton text={phrase.zh.replace("Wi-Fi", "WiFi")} size="lg" />
        <Button size="lg" onClick={onClose} autoFocus>{t("move.phrases.close")}</Button>
      </div>
    </div>
  );
};

/** Mandarin on the Move: survival phrases to hear or show */
const Phrasebook = () => {
  const { t, language } = useLanguage();
  const [groupKey, setGroupKey] = useState(PHRASE_GROUPS[0].key);
  const [showing, setShowing] = useState<Phrase | null>(null);
  const group = PHRASE_GROUPS.find((g) => g.key === groupKey) ?? PHRASE_GROUPS[0];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div>
        <Link to="/move" className="text-sm font-bold text-muted-foreground underline underline-offset-4">
          {t("move.phrases.back")}
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mt-3">
          {t("move.phrases.title")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">常用语</bdi>
        </h1>
        <p className="text-muted-foreground mt-2">{t("move.phrases.intro")}</p>
      </div>

      <div role="tablist" aria-label={t("move.phrases.title")} className="flex flex-wrap gap-2">
        {PHRASE_GROUPS.map((g) => (
          <button
            key={g.key}
            role="tab"
            aria-selected={g.key === group.key}
            onClick={() => setGroupKey(g.key)}
            className={cn(
              "px-3.5 py-1.5 rounded-full border-2 border-stroke font-bold text-sm",
              g.key === group.key ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {g.title[language]} <span lang="zh" className="font-zh font-normal opacity-80">{g.zh}</span>
          </button>
        ))}
      </div>

      <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden" role="tabpanel">
        {group.phrases.map((ph) => (
          <li key={ph.zh} className="border-b-2 border-border last:border-b-0 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-lg leading-tight">{ph.meaning[language]}</span>
              <span lang="zh" dir="ltr" className="block font-zh font-bold text-2xl mt-1">{ph.zh}</span>
              <span dir="ltr" className="block font-pinyin font-bold text-primary">{ph.pinyin}</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                {t("learn.sound")}: <bdi dir="rtl" lang="ar">{ph.sound}</bdi>
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <PlayButton text={ph.zh.replace("Wi-Fi", "WiFi")} />
              <Button type="button" size="sm" onClick={() => setShowing(ph)}>{t("move.phrases.show")}</Button>
            </div>
          </li>
        ))}
      </ul>

      {showing && <ShowCard phrase={showing} onClose={() => setShowing(null)} />}
    </div>
  );
};

export default Phrasebook;
