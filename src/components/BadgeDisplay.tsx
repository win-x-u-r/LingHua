import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface Badge {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  xp_reward: number;
}

interface BadgeDisplayProps {
  allBadges: Badge[];
  earnedBadgeIds: string[];
}

const ICON_MAP: Record<string, string> = {
  baby: "👶",
  music: "🎵",
  shield: "🛡️",
  globe: "🌍",
  star: "⭐",
};

export function BadgeDisplay({ allBadges, earnedBadgeIds }: BadgeDisplayProps) {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {allBadges.map((badge) => {
        const earned = earnedBadgeIds.includes(badge.id);
        const name = language === "ar" ? badge.name_ar : badge.name;
        const desc = language === "ar" ? badge.description_ar : badge.description;

        return (
          <Card
            key={badge.id}
            className={`p-4 text-center transition-all ${
              earned
                ? "border-2 border-primary/30 bg-primary/5 shadow-soft"
                : "opacity-40 grayscale"
            }`}
          >
            <div className="text-3xl mb-2">
              {ICON_MAP[badge.icon] || "🏆"}
            </div>
            <h4 className="font-bold text-sm">{name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            {earned && (
              <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                +{badge.xp_reward} XP
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
