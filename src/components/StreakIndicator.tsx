import { Flame } from "lucide-react";

interface StreakIndicatorProps {
  streak: number;
  compact?: boolean;
}

export function StreakIndicator({ streak, compact = false }: StreakIndicatorProps) {
  const isGold = streak >= 7;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Flame
          className={`w-4 h-4 ${isGold ? "text-yellow-500" : "text-orange-400"}`}
          fill="currentColor"
        />
        <span className="text-xs font-bold">{streak}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
      isGold ? "bg-yellow-500/20" : "bg-orange-400/20"
    }`}>
      <Flame
        className={`w-5 h-5 ${isGold ? "text-yellow-500 animate-pulse" : "text-orange-400"}`}
        fill="currentColor"
      />
      <span className={`font-bold text-sm ${isGold ? "text-yellow-600" : "text-orange-500"}`}>
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
