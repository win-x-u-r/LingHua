import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Switches between light and dark. The app starts on the device setting;
 * a choice made here is remembered. Shows 明 (bright) or 暗 (dark).
 */
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
      className={cn("font-zh", className)}
    >
      <span lang="zh" aria-hidden="true">{isDark ? "明" : "暗"}</span>
      {withLabel && <span className="font-sans">{label}</span>}
    </Button>
  );
};

export default ThemeToggle;
