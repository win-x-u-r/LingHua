import { useState } from "react";
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
const ClassCodeReady = ({ code, className, onCopy, onDone }: { code: string; className: string; onCopy: () => void; onDone: () => void }) => {
  const { t } = useLanguage();
  const [board, setBoard] = useState(false);
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
          <Button size="lg" onClick={onDone}>{t("teach.ready.go")}</Button>
        </div>
      </Card>
    </div>
  );
};

export default ClassCodeReady;
