import { cn } from "@/lib/utils";

type SealTone = "red" | "gold" | "ink";

interface SealProps {
  /** One Chinese character shown inside the stamp, e.g. 说 for Speak. */
  char: string;
  tone?: SealTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const toneClass: Record<SealTone, string> = {
  red: "bg-primary text-primary-foreground",
  gold: "bg-sunshine text-sunshine-foreground",
  ink: "bg-card text-foreground",
};

const sizeClass = {
  sm: "w-7 h-7 text-base rounded-md",
  md: "w-10 h-10 text-xl rounded-lg",
  lg: "w-14 h-14 text-3xl rounded-xl",
};

/**
 * A red seal stamp holding one Chinese character. Used instead of an icon set,
 * so learners see a real character every time they read a menu or heading.
 */
const Seal = ({ char, tone = "red", size = "md", className }: SealProps) => (
  <span
    lang="zh"
    aria-hidden="true"
    className={cn(
      "inline-grid place-items-center shrink-0 border-2 border-stroke font-zh font-bold leading-none",
      toneClass[tone],
      sizeClass[size],
      className,
    )}
  >
    {char}
  </span>
);

export default Seal;
