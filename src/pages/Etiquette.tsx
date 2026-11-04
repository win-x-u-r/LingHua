import { PlayButton } from "@/components/learn/Activities";
import MoveBack from "@/components/move/MoveBack";
import Seal from "@/components/Seal";
import { useLanguage } from "@/contexts/LanguageContext";
import { ETIQUETTE } from "@/content/onTheMove/etiquette";

/** Business etiquette for a trip to China, each tip with a phrase to go with it */
const Etiquette = () => {
  const { t, language } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <MoveBack />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("move.tool.etiquette")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">商务礼仪</bdi>
        </h1>
        <p className="text-muted-foreground">{t("move.etiquette.intro")}</p>
      </div>

      {ETIQUETTE.map((group, gi) => (
        <section key={group.key} className="flex flex-col gap-3" aria-labelledby={`tips-${group.key}`}>
          <h2 id={`tips-${group.key}`} className="text-2xl font-bold flex items-center gap-3">
            <Seal char={group.zh[0]} tone={gi % 2 ? "gold" : "red"} />
            {group.title[language]} <span lang="zh" className="font-zh font-normal text-muted-foreground">{group.zh}</span>
          </h2>
          <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
            {group.tips.map((tip) => (
              <li key={tip.title.en} className="border-b-2 border-border last:border-b-0 p-4 flex flex-col gap-2">
                <h3 className="text-lg font-bold leading-tight">{tip.title[language]}</h3>
                <p className="text-muted-foreground">{tip.body[language]}</p>
                {tip.phrase && (
                  <div className="mt-1 rounded-[12px] border-2 border-border bg-secondary dark:bg-muted p-3 flex flex-wrap items-center gap-3">
                    <span className="flex-1 min-w-0">
                      <span lang="zh" dir="ltr" className="block font-zh font-bold text-xl">{tip.phrase.zh}</span>
                      <span dir="ltr" className="block font-pinyin font-bold text-primary text-sm">{tip.phrase.pinyin}</span>
                      <span className="block text-sm">{tip.phrase.meaning[language]}</span>
                    </span>
                    <PlayButton text={tip.phrase.zh} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default Etiquette;
