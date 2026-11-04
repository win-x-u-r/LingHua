import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Learn from "@/pages/Learn";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ON_THE_MOVE } from "@/content/courses";

/** Mandarin on the Move: the travel and business unit, open to visitors, plus the phrasebook */
const OnTheMove = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  return (
    <Learn course={ON_THE_MOVE}>
      <section className="rounded-[14px] border-2 border-stroke bg-card p-5 flex flex-col gap-3" aria-labelledby="phrasebook">
        <div className="flex items-center gap-4">
          <span lang="zh" aria-hidden className="w-12 h-12 shrink-0 rounded-full border-2 border-stroke bg-sunshine text-sunshine-foreground font-zh font-bold text-2xl flex items-center justify-center">
            语
          </span>
          <div className="min-w-0">
            <h2 id="phrasebook" className="text-xl font-bold leading-tight">{t("move.phrases.card")}</h2>
            <p className="text-muted-foreground">{t("move.phrases.card.desc")}</p>
          </div>
        </div>
        <Link to="/move/phrases">
          <Button size="lg" variant="outline" className="w-full">{t("move.phrases.open")}</Button>
        </Link>
      </section>

      {!user && (
        <section className="rounded-[14px] border-2 border-stroke bg-secondary dark:bg-card p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("move.save.title")}</h2>
          <p className="text-muted-foreground">{t("move.save.desc")}</p>
          <Link to="/auth?mode=signup&path=on_the_move">
            <Button size="lg" className="w-full">{t("move.save.cta")}</Button>
          </Link>
        </section>
      )}
    </Learn>
  );
};

export default OnTheMove;
