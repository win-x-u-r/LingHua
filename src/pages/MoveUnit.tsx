import { Link, Navigate, useParams } from "react-router-dom";
import Learn from "@/pages/Learn";
import { useLanguage } from "@/contexts/LanguageContext";
import { ON_THE_MOVE, findUnit } from "@/content/courses";

/** One Mandarin on the Move unit and its lessons */
const MoveUnit = () => {
  const { unitKey = "" } = useParams();
  const { t } = useLanguage();
  const unit = findUnit(ON_THE_MOVE, unitKey);
  if (!unit) return <Navigate to="/move" replace />;
  return (
    <Learn
      key={unit.key}
      course={ON_THE_MOVE}
      unit={unit}
      top={
        <Link to="/move" className="text-sm font-bold text-muted-foreground underline underline-offset-4 self-start">
          {t("move.back")}
        </Link>
      }
    />
  );
};

export default MoveUnit;
