import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { onUpdateReady, refreshToUpdate, updateReady } from "@/lib/appUpdate";

/** "New update ready" note with Refresh, shown when a new LingHua arrives mid-visit. */
const UpdateReady = () => {
  const { t } = useLanguage();
  const [ready, setReady] = useState(updateReady);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stop = onUpdateReady(() => setReady(true));
    return () => {
      stop();
    };
  }, []);

  if (!ready || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-4 inset-x-3 md:inset-x-auto md:start-4 z-50 flex items-center justify-between gap-3 rounded-full border-2 border-stroke bg-card text-card-foreground shadow-glow py-1.5 ps-4 pe-1.5"
    >
      <span className="text-sm font-semibold">{t("update.ready")}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8" onClick={() => setDismissed(true)}>
          {t("update.later")}
        </Button>
        <Button size="sm" className="h-8 rounded-full" onClick={refreshToUpdate}>
          {t("update.refresh")}
        </Button>
      </div>
    </div>
  );
};

export default UpdateReady;
