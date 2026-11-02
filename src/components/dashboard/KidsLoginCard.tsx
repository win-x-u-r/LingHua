import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import PathIcon from "@/components/PathIcon";
import PicturePad from "@/components/PicturePad";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { KidsError, PICTURE_COUNT, resetKidPictures, type SecretPicture } from "@/lib/kidsAPI";

/**
 * My Classroom: how kids log in with pictures, and a "New pictures" button for
 * each child who uses picture log-in (for when someone forgets theirs).
 */
interface Props {
  code: string;
  kids: { id: string; name: string; needsHelp?: boolean }[];
  /** Set from the "Forgot their pictures" alert: open and start on this child */
  focus?: { id: string; n: number } | null;
  onReset?: (kidId: string) => void;
}

const KidsLoginCard = ({ code, kids, focus, onReset }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [resetting, setResetting] = useState<string | null>(null);
  const [pictures, setPictures] = useState<SecretPicture[]>([]);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!focus || !box.current) return;
    box.current.open = true;
    setResetting(focus.id);
    setPictures([]);
    box.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  // Kids who asked for help come first
  const ordered = [...kids].sort((a, b) => Number(!!b.needsHelp) - Number(!!a.needsHelp));
  const url = `${window.location.host}/kids`;
  const how = t("teach.kids.how").replace("{url}", url).replace("{code}", code);
  const [before, after] = how.split(url);

  const save = async (kidId: string) => {
    setBusy(true);
    try {
      await resetKidPictures(kidId, pictures);
      toast({ title: t("teach.kids.reset.done") });
      setResetting(null);
      setPictures([]);
      onReset?.(kidId);
    } catch (err) {
      const c = err instanceof KidsError ? err.code : "server_error";
      toast({ title: t(c === "not_set_up" ? "kids.not_set_up" : "kids.error"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    // Closed by default: only opened when a child needs help logging in
    <details ref={box} className="group rounded-[14px] border-2 border-border bg-card">
      <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer list-none text-sm font-bold text-muted-foreground [&::-webkit-details-marker]:hidden">
        <PathIcon path="little_lanterns" className="w-6 h-6" />
        <span className="flex-1">{t("teach.kids.title")}</span>
        <span aria-hidden="true" className="text-xs group-open:rotate-180">▾</span>
      </summary>
      <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {before}
            <bdi className="font-bold text-foreground" dir="ltr">{url}</bdi>
            {after}
          </p>

      {kids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teach.kids.none")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {ordered.map((k) => (
            <li key={k.id} className="py-2 flex flex-col gap-2">
              <span className="flex items-center gap-3">
                <span className="font-bold flex-1 min-w-0 truncate">{k.name}</span>
                {k.needsHelp && (
                  <span className="shrink-0 rounded-full border-2 border-stroke bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                    {t("teach.kids.asked")}
                  </span>
                )}
                {resetting !== k.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResetting(k.id);
                      setPictures([]);
                    }}
                  >
                    {t("teach.kids.reset")}
                  </Button>
                )}
              </span>
              {resetting === k.id && (
                <div className="flex flex-col items-center gap-2 rounded-[10px] bg-muted/40 p-3">
                  <p className="text-xs font-bold text-center">{t("teach.kids.reset.pick").replace("{name}", k.name)}</p>
                  <PicturePad value={pictures} onChange={setPictures} disabled={busy} small />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setResetting(null)} disabled={busy}>
                      {t("teach.kids.reset.cancel")}
                    </Button>
                    <Button size="sm" onClick={() => save(k.id)} disabled={busy || pictures.length < PICTURE_COUNT}>
                      {t("teach.kids.reset.save")}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
    </details>
  );
};

export default KidsLoginCard;
