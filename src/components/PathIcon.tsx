import type { LearningPath } from "@/lib/learningPaths";
import { cn } from "@/lib/utils";

/*
 * Drawn icons for the learning paths, in the lantern's red and gold:
 * a little lantern for kids, bamboo growing in steps for HSK, a kite for
 * learning your own way, and a waving lucky cat for travel and work.
 */
const INK = "#2A1E1C";
const RED = "#E8352B";
const GOLD = "#FCC755";
const GREEN = "#3E9B5F";
const WHITE = "#FFFFFF";

const LittleLantern = () => (
  <>
    <path d="M32 3 v7" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="22" y="9" width="20" height="6" rx="2" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <ellipse cx="32" cy="32" rx="20" ry="17" fill={RED} stroke={INK} strokeWidth="3" />
    <path d="M24 17 q-5 15 0 30 M40 17 q5 15 0 30" fill="none" stroke="#C61F18" strokeWidth="2.5" />
    {/* happy closed eyes and blush */}
    <path d="M23 31 q3 -3 6 0 M35 31 q3 -3 6 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M29 37 q3 2.5 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="20" cy="36" r="2.6" fill="#FF9C9C" />
    <circle cx="44" cy="36" r="2.6" fill="#FF9C9C" />
    <rect x="22" y="48" width="20" height="6" rx="2" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <path d="M32 54 v7" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
  </>
);

/** Three bamboo stalks, each taller than the last: levels you climb */
const Bamboo = () => (
  <>
    <path d="M4 58 h56" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    {[
      { x: 10, top: 40 },
      { x: 26, top: 26 },
      { x: 42, top: 10 },
    ].map(({ x, top }) => (
      <g key={x}>
        <rect x={x} y={top} width="10" height={58 - top} rx="3" fill={GREEN} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: Math.floor((58 - top) / 12) }, (_, i) => (
          <path key={i} d={`M${x} ${top + 12 * (i + 1)} h10`} stroke={INK} strokeWidth="2.5" />
        ))}
        <path d={`M${x + 10} ${top + 4} q6 -6 10 -4 q-4 6 -10 4`} fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
    ))}
  </>
);

const Kite = () => (
  <>
    <path d="M32 6 L54 26 L32 46 L10 26 Z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M32 6 V46 M10 26 H54" stroke={GOLD} strokeWidth="3" />
    <circle cx="32" cy="26" r="6" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <path d="M32 46 q-6 6 0 10 q6 4 0 8" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M27 52 l5 3 l-5 3 z M37 52 l-5 3 l5 3 z" fill={GOLD} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
  </>
);

/** A lucky cat with one paw up and a gold coin */
const LuckyCat = () => (
  <>
    {/* raised paw */}
    <rect x="44" y="6" width="11" height="20" rx="5.5" fill={WHITE} stroke={INK} strokeWidth="2.5" />
    {/* body */}
    <rect x="14" y="34" width="34" height="24" rx="10" fill={WHITE} stroke={INK} strokeWidth="3" />
    {/* head with ears */}
    <path d="M13 22 l3 -13 l9 8 h14 l9 -8 l3 13" fill={WHITE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <ellipse cx="32" cy="26" rx="19" ry="13" fill={WHITE} stroke={INK} strokeWidth="3" />
    <path d="M17 12 l2 6 l4 -2 z M47 12 l-2 6 l-4 -2 z" fill={RED} />
    <path d="M24 25 q2.5 -3 5 0 M35 25 q2.5 -3 5 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M29.5 30 q2.5 2 5 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    {/* red collar and bell */}
    <path d="M16 36 q16 6 32 0" fill="none" stroke={RED} strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="40" r="3.5" fill={GOLD} stroke={INK} strokeWidth="2" />
    {/* coin */}
    <ellipse cx="25" cy="49" rx="8" ry="6" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <rect x="22.5" y="47" width="5" height="4" fill="none" stroke={INK} strokeWidth="1.8" />
  </>
);

const ICON: Record<LearningPath, () => JSX.Element> = {
  little_lanterns: LittleLantern,
  hsk: Bamboo,
  my_mandarin: Kite,
  on_the_move: LuckyCat,
};

const PathIcon = ({ path, className }: { path: LearningPath; className?: string }) => {
  const Icon = ICON[path];
  return (
    <svg viewBox="0 0 64 64" className={cn("w-12 h-12 shrink-0", className)} aria-hidden="true">
      <Icon />
    </svg>
  );
};

export default PathIcon;
