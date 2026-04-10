import { getCurrentLevel, getNextLevel, getXpProgress } from "@/lib/gamification";
import { useLanguage } from "@/contexts/LanguageContext";

interface XPBarProps {
  totalXp: number;
  compact?: boolean;
}

export function XPBar({ totalXp, compact = false }: XPBarProps) {
  const { language } = useLanguage();
  const current = getCurrentLevel(totalXp);
  const next = getNextLevel(totalXp);
  const progress = getXpProgress(totalXp);

  const title = language === "ar" ? current.titleAr : current.title;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold bg-gradient-coral bg-clip-text text-transparent">
          Lv.{current.level}
        </span>
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-coral rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold bg-gradient-coral bg-clip-text text-transparent">
          Level {current.level} — {title}
        </span>
        <span className="text-muted-foreground">
          {totalXp} XP {next ? `/ ${next.xp}` : "(MAX)"}
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-coral rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {next && (
        <p className="text-xs text-muted-foreground text-center">
          {next.xp - totalXp} XP to {language === "ar" ? next.titleAr : next.title}
        </p>
      )}
    </div>
  );
}
