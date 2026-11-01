import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/*
 * Switches between light and dark. The app starts in light mode; a choice
 * made here is remembered. Shows a sleepy moon in light mode (tap for dark)
 * and a smiling sun in dark mode (tap for light), drawn in the lantern palette.
 */
const INK = "#2A1E1C";
const RED = "#E8352B";
const GOLD = "#FCC755";

const Sun = () => (
  <svg viewBox="0 0 64 64" className="!size-6" aria-hidden="true">
    <g stroke={RED} strokeWidth="4" strokeLinecap="round">
      <path d="M32 4 v7 M32 53 v7 M4 32 h7 M53 32 h7 M12 12 l5 5 M47 47 l5 5 M52 12 l-5 5 M17 47 l-5 5" />
    </g>
    <circle cx="32" cy="32" r="15" fill={GOLD} stroke={INK} strokeWidth="3" />
    <circle cx="27" cy="30" r="2" fill={INK} />
    <circle cx="37" cy="30" r="2" fill={INK} />
    <path d="M27.5 36 q4.5 4 9 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="23" cy="36" r="2.6" fill={RED} opacity="0.45" />
    <circle cx="41" cy="36" r="2.6" fill={RED} opacity="0.45" />
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 64 64" className="!size-6" aria-hidden="true">
    <path
      d="M40 8 A25 25 0 1 0 56 44 A20 20 0 0 1 40 8 Z"
      fill={GOLD}
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M19 33 q3 3 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M23 43 q3 2.5 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="17" cy="40" r="2.6" fill={RED} opacity="0.45" />
  </svg>
);

const ThemeToggle = ({ className, withLabel = false }: { className?: string; withLabel?: boolean }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? t("theme.light") : t("theme.dark");

  return (
    <Button
      variant="outline"
      size={withLabel ? "default" : "icon"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(className)}
    >
      {isDark ? <Sun /> : <Moon />}
      {withLabel && <span className="font-sans">{label}</span>}
    </Button>
  );
};

export default ThemeToggle;
