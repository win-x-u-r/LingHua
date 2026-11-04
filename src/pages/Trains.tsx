import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayButton } from "@/components/learn/Activities";
import MoveBack from "@/components/move/MoveBack";
import Seal from "@/components/Seal";
import { useLanguage } from "@/contexts/LanguageContext";
import { TRAIN_TYPES, SEATS, TICKET_PARTS, STATION_STEPS, ROUTES, TRAIN_PHRASES } from "@/content/onTheMove/trains";

/** A small numbered marker that ties a part of the sample ticket to its label */
const Mark = ({ n }: { n: number }) => (
  <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold align-middle shrink-0">
    {n}
  </span>
);

const n = (key: string) => TICKET_PARTS.findIndex((p) => p.key === key) + 1;

/** A booking as the 12306 app shows it, with every part numbered */
const SampleTicket = () => (
  <div dir="ltr" lang="zh" className="rounded-[14px] border-2 border-stroke bg-secondary dark:bg-muted p-4 font-zh flex flex-col gap-3">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
      <span className="flex flex-col items-center gap-1">
        <Mark n={n("from")} />
        <span className="text-xl sm:text-2xl font-bold">北京南</span>
      </span>
      <span className="flex flex-col items-center gap-1">
        <Mark n={n("train")} />
        <span className="text-2xl font-bold text-primary font-sans">G1</span>
        <span className="block w-16 h-0.5 bg-stroke" aria-hidden />
      </span>
      <span className="flex flex-col items-center gap-1">
        <Mark n={n("to")} />
        <span className="text-xl sm:text-2xl font-bold">上海虹桥</span>
      </span>
    </div>
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-lg font-bold border-t-2 border-dashed border-stroke pt-3">
      <span className="flex items-center gap-1.5"><Mark n={n("time")} />11月10日 09:00开</span>
      <span className="flex items-center gap-1.5"><Mark n={n("car")} />05车</span>
      <span className="flex items-center gap-1.5"><Mark n={n("seat")} />12F号 二等座</span>
      <span className="flex items-center gap-1.5"><Mark n={n("gate")} />检票口 A8</span>
    </div>
  </div>
);

/** China's trains for a business traveller: types, seats, tickets, stations, routes and phrases */
const Trains = () => {
  const { t, language } = useLanguage();
  const [shown, setShown] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <MoveBack />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("move.tool.trains")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">坐火车</bdi>
        </h1>
        <p className="text-muted-foreground">{t("move.trains.intro")}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="types">
        <h2 id="types" className="text-2xl font-bold">{t("move.trains.types")}</h2>
        <p className="text-muted-foreground -mt-1">{t("move.trains.types.desc")}</p>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {TRAIN_TYPES.map((tt, i) => (
            <li key={tt.letter} className="border-b-2 border-border last:border-b-0 p-4 flex items-center gap-4">
              <span dir="ltr" className={`min-w-12 h-12 px-2 shrink-0 rounded-[10px] border-2 border-stroke grid place-items-center font-bold text-xl ${i === 0 ? "bg-primary text-primary-foreground" : "bg-sunshine text-sunshine-foreground"}`}>
                {tt.letter}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold leading-tight">
                  {tt.name[language]} <bdi lang="zh" dir="ltr" className="font-zh text-primary">{tt.zh}</bdi>
                </span>
                <span className="block text-sm text-muted-foreground">{tt.speed[language]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="ticket">
        <h2 id="ticket" className="text-2xl font-bold">{t("move.trains.ticket")}</h2>
        <p className="text-muted-foreground -mt-1">{t("move.trains.ticket.desc")}</p>
        <SampleTicket />
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {TICKET_PARTS.map((part, i) => (
            <li key={part.key} className="flex items-center gap-2">
              <Mark n={i + 1} />
              <span lang="zh" className="font-zh font-bold">{part.zh}</span>
              <span dir="ltr" className="font-pinyin text-primary text-sm">{part.pinyin}</span>
              <span className="text-sm text-muted-foreground">{part.name[language]}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="seats">
        <h2 id="seats" className="text-2xl font-bold">{t("move.trains.seats")}</h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {SEATS.map((s) => (
            <li key={s.zh} className="border-b-2 border-border last:border-b-0 p-4 flex items-center gap-3">
              <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold leading-tight">
                  {s.name[language]} <bdi lang="zh" dir="ltr" className="font-zh text-primary">{s.zh}</bdi>
                </span>
                <span className="block text-sm text-muted-foreground">{s.note[language]}</span>
              </span>
              <PlayButton text={s.zh} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="station">
        <h2 id="station" className="text-2xl font-bold">{t("move.trains.station")}</h2>
        <ol className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {STATION_STEPS.map((step, i) => (
            <li key={step.title.en} className="border-b-2 border-border last:border-b-0 p-4 flex gap-4">
              <span className="w-9 h-9 shrink-0 rounded-full border-2 border-stroke bg-card grid place-items-center font-bold">{i + 1}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold leading-tight">{step.title[language]}</span>
                <span className="block text-muted-foreground mt-1">{step.body[language]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="routes">
        <h2 id="routes" className="text-2xl font-bold">{t("move.trains.routes")}</h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {ROUTES.map((r) => (
            <li key={r.fromZh + r.toZh} className="border-b-2 border-border last:border-b-0 p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex-1 min-w-[12rem] font-bold">
                {r.from[language === "ar" ? 1 : 0]} {language === "ar" ? "←" : "→"} {r.to[language === "ar" ? 1 : 0]}
                <bdi lang="zh" dir="ltr" className="block font-zh font-normal text-muted-foreground text-sm">{r.fromZh} → {r.toZh}</bdi>
              </span>
              <span className="font-bold text-primary">{r.time[language === "ar" ? 1 : 0]}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{t("move.trains.routes.note")}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="train-phrases">
        <h2 id="train-phrases" className="text-2xl font-bold flex items-center gap-3">
          <Seal char="说" /> {t("move.trains.phrases")}
        </h2>
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {TRAIN_PHRASES.map((ph) => (
            <li key={ph.zh} className="border-b-2 border-border last:border-b-0 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex-1 min-w-0">
                <span className="block font-bold leading-tight">{ph.meaning[language]}</span>
                <span lang="zh" dir="ltr" className="block font-zh font-bold text-xl mt-1">{ph.zh}</span>
                <span dir="ltr" className="block font-pinyin font-bold text-primary text-sm">{ph.pinyin}</span>
              </span>
              <span className="flex gap-2 shrink-0">
                <PlayButton text={ph.zh} />
                <Button size="sm" onClick={() => setShown(ph.zh)}>{t("move.phrases.show")}</Button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {shown && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center gap-6 p-6 text-center">
          <p lang="zh" className="font-zh font-bold leading-tight text-[clamp(2.5rem,11vw,6rem)] break-words max-w-full">{shown}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <PlayButton text={shown} size="lg" />
            <Button size="lg" onClick={() => setShown(null)} autoFocus>{t("move.phrases.close")}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trains;
