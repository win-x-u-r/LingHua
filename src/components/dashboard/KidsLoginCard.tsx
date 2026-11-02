import { useState } from "react";
import { Card } from "@/components/ui/card";
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
const KidsLoginCard = ({ code, kids }: { code: string; kids: { id: string; name: string }[] }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [resetting, setResetting] = useState<string | null>(null);
  const [pictures, setPictures] = useState<SecretPicture[]>([]);
  const [busy, setBusy] = useState(false);
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
    } catch (err) {
      const c = err instanceof KidsError ? err.code : "server_error";
      toast({ title: t(c === "not_set_up" ? "kids.not_set_up" : "kids.error"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <PathIcon path="little_lanterns" className="w-12 h-12" />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{t("teach.kids.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {before}
            <bdi className="font-bold text-foreground" dir="ltr">{url}</bdi>
            {after}
          </p>
        </div>
      </div>

      {kids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teach.kids.none")}</p>
      ) : (
        <ul className="flex flex-col divide-y-2 divide-border">
          {kids.map((k) => (
            <li key={k.id} className="py-3 flex flex-col gap-3">
              <span className="flex items-center gap-3">
                <span className="font-bold flex-1 min-w-0 truncate">{k.name}</span>
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
                <div className="flex flex-col items-center gap-3 rounded-[12px] border-2 border-border bg-muted/40 p-4">
                  <p className="text-sm font-bold text-center">{t("teach.kids.reset.pick").replace("{name}", k.name)}</p>
                  <PicturePad value={pictures} onChange={setPictures} disabled={busy} />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setResetting(null)} disabled={busy}>
                      {t("teach.kids.reset.cancel")}
                    </Button>
                    <Button onClick={() => save(k.id)} disabled={busy || pictures.length < PICTURE_COUNT}>
                      {t("teach.kids.reset.save")}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default KidsLoginCard;
