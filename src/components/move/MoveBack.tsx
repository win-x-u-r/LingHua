import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/** The way back to the Mandarin on the Move page */
const MoveBack = () => {
  const { t } = useLanguage();
  return (
    <Link to="/move" className="text-sm font-bold text-muted-foreground underline underline-offset-4 self-start">
      {t("move.back")}
    </Link>
  );
};

export default MoveBack;
