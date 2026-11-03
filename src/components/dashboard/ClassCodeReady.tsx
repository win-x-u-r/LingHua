import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seal from "@/components/Seal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import { useLanguage } from "@/contexts/LanguageContext";

/** The class code, big. On the board it is sized to be read from the back of the room. */
const CodeTiles = ({ code, big = false }: { code: string; big?: boolean }) => (
  <span className={`flex ${big ? "gap-3 md:gap-5" : "gap-1.5"}`} dir="ltr">
    {code.split("").map((c, i) => (
      <span
        key={i}
        className={`rounded-[12px] border-2 border-stroke bg-card grid place-items-center font-bold ${
          big ? "w-[13vw] h-[16vw] max-w-40 max-h-48 text-[9vw] md:text-8xl border-4" : "w-11 h-14 text-3xl"
        }`}
      >
        {c}
      </span>
    ))}
  </span>
);

/**
 * Teacher onboarding, after "Welcome, teacher!": the new class code with Copy and a
 * full-screen "Show on the board" view, then on to My Classroom. Shown once per class.
 */
const ClassCodeReady = ({
  classId,
  code,
  className,
  onCopy,
  onDone,
}: {
  classId: string;
  code: string;
  className: string;
  onCopy: () => void;
  onDone: () => void;
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [board, setBoard] = useState(false);
  const [makeYours, setMakeYours] = useState(false);
  const go = (to: string) => {
    onDone();
    navigate(to);
  };
  const url = `${window.location.host}/kids`;
  const how = t("teach.ready.how").replace("{url}", url);
  const [before, after] = how.split(url);
  const link = (
    <>
      {before}
      <bdi className="font-bold text-foreground" dir="ltr">{url}</bdi>
      {after}
    </>
  );

  if (board) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center gap-8 p-6 text-center" role="dialog" aria-modal="true" aria-label={t("teach.ready.board")}>
        <p className="text-2xl md:text-4xl font-bold">{className}</p>
        <CodeTiles code={code} big />
        <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl">{link}</p>
        <Button size="lg" variant="outline" onClick={() => setBoard(false)}>{t("teach.ready.close")}</Button>
      </div>
    );
  }

  // Two ways to start: follow a LingHua path, or build lessons from scratch.
  // Adapting a path happens later in My Classroom; both stay open there.
  if (makeYours) {
    const options = [
      { seal: "路", key: "way.path", zh: "跟随学习路线", to: `/lessons/paths?class=${classId}` },
      { seal: "创", key: "way.own", zh: "自定义课程", to: `/lessons/new?class=${classId}` },
    ] as const;
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Card className="p-6 sm:p-8 flex flex-col items-center text-center gap-5 overflow-hidden">
          <div className="lantern-glow [--glow-size:220%]">
            <Lantern mood="delight" entering className="w-24 h-24" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-balance">{t("way.title")}</h1>
            <p lang="zh" className="font-zh text-muted-foreground">你的课堂，你做主。</p>
          </div>
          <p className="text-muted-foreground">{t("way.sub")}</p>
          <div className="w-full flex flex-col gap-3 text-start">
            {options.map((o) => (
              <div key={o.key} className="rounded-[12px] border-2 border-stroke bg-card p-4 flex flex-col gap-3 shadow-[3px_3px_0_hsl(var(--stamp))]">
                <div className="flex items-start gap-3">
                  <Seal char={o.seal} size="md" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">{t(o.key)}</h2>
                    <p lang="zh" className="font-zh text-sm text-muted-foreground">{o.zh}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t(`${o.key}.desc`)}</p>
                  </div>
                </div>
                <Button onClick={() => go(o.to)}>{t(`${o.key}.cta`)}</Button>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("way.later")}</p>
          <button type="button" onClick={onDone} className="text-sm font-bold text-primary underline underline-offset-4">
            {t("way.skip")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="p-8 flex flex-col items-center text-center gap-5 overflow-hidden">
        <div className="lantern-glow [--glow-size:220%]">
          <Lantern mood="celebrate" entering className="w-28 h-28" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-balance">{t("teach.ready.title")}</h1>
          <p lang="zh" className="font-zh text-muted-foreground">你的班级码</p>
          <p className="font-bold mt-2">{className}</p>
        </div>
        <CodeTiles code={code} />
        <p className="text-muted-foreground">{link}</p>
        <div className="w-full flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={onCopy}>{t("dashboard.copy")}</Button>
            <Button variant="outline" size="lg" onClick={() => setBoard(true)}>{t("teach.ready.board")}</Button>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setMakeYours(true);
              window.scrollTo({ top: 0 });
            }}
          >
            {t("goal.next")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ClassCodeReady;
