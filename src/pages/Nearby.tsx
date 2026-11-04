import { useState } from "react";
import { Button } from "@/components/ui/button";
import MoveBack from "@/components/move/MoveBack";
import Lantern from "@/components/lantern/Lantern";
import { useLanguage } from "@/contexts/LanguageContext";
import { findNearby, mapLinks, placeName, type Place, type PlaceKind } from "@/lib/nearby";
import { cn } from "@/lib/utils";

const KINDS: { kind: PlaceKind; zh: string; en: string; titleKey: string }[] = [
  { kind: "halal", zh: "清真餐厅", en: "halal restaurant", titleKey: "move.nearby.halal" },
  { kind: "money", zh: "外币兑换", en: "currency exchange", titleKey: "move.nearby.money" },
  { kind: "mosque", zh: "清真寺", en: "mosque", titleKey: "move.nearby.mosque" },
];

type Status = "idle" | "locating" | "searching" | "done" | "denied" | "failed";

const metres = (m: number, language: "en" | "ar") =>
  m < 1000 ? `${Math.round(m / 10) * 10} ${language === "ar" ? "م" : "m"}` : `${(m / 1000).toFixed(1)} ${language === "ar" ? "كم" : "km"}`;

const MapLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-sm font-bold underline underline-offset-4">
    {children}
  </a>
);

/** Halal food, money exchange and mosques near the learner */
const Nearby = () => {
  const { t, language } = useLanguage();
  const [kind, setKind] = useState<PlaceKind>("halal");
  const [status, setStatus] = useState<Status>("idle");
  const [at, setAt] = useState<{ lat: number; lon: number } | undefined>();
  const [places, setPlaces] = useState<Place[]>([]);
  const current = KINDS.find((k) => k.kind === kind)!;
  const list = places.filter((p) => p.kind === kind).slice(0, 15);
  const search = mapLinks.search(current.zh, current.en, at);

  const locate = () => {
    if (!("geolocation" in navigator)) return setStatus("failed");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setAt(here);
        setStatus("searching");
        try {
          setPlaces(await findNearby(here.lat, here.lon));
          setStatus("done");
        } catch {
          setStatus("failed");
        }
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <MoveBack />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {t("move.tool.nearby")} <bdi lang="zh" dir="ltr" className="font-zh text-primary">附近</bdi>
        </h1>
        <p className="text-muted-foreground">{t("move.nearby.intro")}</p>
      </div>

      <div role="tablist" aria-label={t("move.tool.nearby")} className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            role="tab"
            aria-selected={k.kind === kind}
            onClick={() => setKind(k.kind)}
            className={cn(
              "px-3.5 py-1.5 rounded-full border-2 border-stroke font-bold text-sm",
              k.kind === kind ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {t(k.titleKey)} <span lang="zh" className="font-zh font-normal opacity-80">{k.zh}</span>
          </button>
        ))}
      </div>

      {status !== "done" && (
        <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col items-center text-center gap-3">
          <Lantern mood={status === "locating" || status === "searching" ? "thinking" : status === "failed" || status === "denied" ? "sad" : "happy"} className="w-20 h-20" />
          <p className="font-bold text-lg">
            {status === "locating"
              ? t("move.nearby.locating")
              : status === "searching"
                ? t("move.nearby.searching")
                : status === "denied"
                  ? t("move.nearby.denied")
                  : status === "failed"
                    ? t("move.nearby.failed")
                    : t("move.nearby.ask")}
          </p>
          <Button size="lg" onClick={locate} disabled={status === "locating" || status === "searching"} className="w-full sm:w-auto">
            {status === "idle" ? t("move.nearby.use") : t("move.nearby.retry")}
          </Button>
          <p className="text-xs text-muted-foreground max-w-md">{t("move.nearby.privacy")}</p>
        </section>
      )}

      {status === "done" && (
        <section className="flex flex-col gap-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t("move.nearby.closest")}</h2>
            <Button size="sm" variant="outline" onClick={locate}>{t("move.nearby.refresh")}</Button>
          </div>
          {list.length === 0 ? (
            <p className="rounded-[14px] border-2 border-stroke bg-card p-4 text-muted-foreground">{t("move.nearby.none")}</p>
          ) : (
            <ol className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
              {list.map((p) => {
                const { main, zh } = placeName(p.tags, language);
                const label = main || zh || t(current.titleKey);
                const links = mapLinks.place(p, zh || main || current.zh);
                const street = [p.tags["addr:street"], p.tags["addr:housenumber"]].filter(Boolean).join(" ");
                return (
                  <li key={p.id} className="border-b-2 border-border last:border-b-0 p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="block text-lg font-bold leading-tight">{label}</span>
                        {zh && main && <bdi lang="zh" dir="ltr" className="block font-zh text-muted-foreground">{zh}</bdi>}
                        {p.kind === "money" && (
                          <span className="block text-sm text-muted-foreground">
                            {p.tags.amenity === "bank" ? t("move.nearby.bank") : t("move.nearby.exchange")}
                          </span>
                        )}
                        {street && <span className="block text-sm text-muted-foreground">{street}</span>}
                      </span>
                      <span className="font-bold text-primary tabular-nums shrink-0" dir="ltr">{metres(p.distance, language)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <MapLink href={links.amap}>{t("move.nearby.amap")}</MapLink>
                      <MapLink href={links.apple}>Apple Maps</MapLink>
                      <MapLink href={links.google}>Google Maps</MapLink>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-xs text-muted-foreground">{t("move.nearby.source")}</p>
        </section>
      )}

      <section className="rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card p-5 flex flex-col gap-3" aria-labelledby="in-maps">
        <h2 id="in-maps" className="text-lg font-bold">{t("move.nearby.maps")}</h2>
        <p className="text-sm text-muted-foreground -mt-2">{t("move.nearby.maps.desc")}</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={search.amap} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">{t("move.nearby.amap")}</Button></a>
          <a href={search.baidu} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">{t("move.nearby.baidu")}</Button></a>
          <a href={search.apple} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">Apple Maps</Button></a>
          <a href={search.google} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">Google Maps</Button></a>
        </div>
      </section>
    </div>
  );
};

export default Nearby;
