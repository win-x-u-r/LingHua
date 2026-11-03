import { cn } from "@/lib/utils";

/* The pitch of each tone on the usual 1 to 5 scale, drawn as the path the lantern floats along. */
const PATHS: Record<1 | 2 | 3 | 4, string> = {
  1: "M8 10 L92 10",
  2: "M8 30 Q60 28 92 10",
  3: "M8 34 Q34 52 52 48 Q76 42 92 18",
  4: "M8 10 Q50 18 92 50",
};

interface ToneLineProps {
  tone: 1 | 2 | 3 | 4;
  className?: string;
}

/** One tone contour: a gold line with a small lantern-red dot where it ends. */
const ToneLine = ({ tone, className }: ToneLineProps) => {
  const end = { 1: [92, 10], 2: [92, 10], 3: [92, 18], 4: [92, 50] }[tone];
  return (
    <svg viewBox="0 0 100 60" className={cn("w-full h-auto", className)} aria-hidden="true">
      {[10, 20, 30, 40, 50].map((y) => (
        <line key={y} x1="4" x2="96" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
      ))}
      <path d={PATHS[tone]} fill="none" className="stroke-sunshine" strokeWidth="7" strokeLinecap="round" />
      <path d={PATHS[tone]} fill="none" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" />
      <circle cx={end[0]} cy={end[1]} r="5" className="fill-primary stroke-foreground" strokeWidth="2" />
    </svg>
  );
};

export default ToneLine;
