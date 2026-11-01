import type { GoalTier } from "@/lib/dailyGoal";
import { cn } from "@/lib/utils";

/*
 * Drawn icons for the four daily goals, in the lantern's red and gold:
 * a sprout in a pot, a bamboo shoot, a lotus in bloom and a lucky star.
 * Each one is a little fuller than the last, so the goals read as growing.
 */
const INK = "#2A1E1C";
const RED = "#E8352B";
const DEEP = "#C61F18";
const GOLD = "#FCC755";
const CREAM = "#FFF6E8";

const Face = ({ x, y }: { x: number; y: number }) => (
  <>
    <circle cx={x - 3.5} cy={y} r="1.4" fill={INK} />
    <circle cx={x + 3.5} cy={y} r="1.4" fill={INK} />
    <path d={`M${x - 2} ${y + 3} q2 1.6 4 0`} fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
  </>
);

const Sprout = () => (
  <>
    <path d="M32 40 V24" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <path d="M32 28 q-4 -12 -16 -12 q0 12 16 12 z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M32 26 q4 -10 14 -10 q0 10 -14 10 z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    {/* red clay pot */}
    <path d="M18 40 h28 l-4 18 h-20 z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <rect x="16" y="37" width="32" height="6" rx="2" fill={DEEP} stroke={INK} strokeWidth="2.5" />
    <Face x={32} y={49} />
  </>
);

const BambooShoot = () => (
  <>
    <rect x="25" y="8" width="14" height="50" rx="6" fill={GOLD} stroke={INK} strokeWidth="3" />
    <path d="M25 24 h14 M25 41 h14" stroke={INK} strokeWidth="2.5" />
    {/* red ribbon tied round the stalk */}
    <path d="M24 30 h16" stroke={RED} strokeWidth="5" />
    <path d="M40 30 l9 -4 l-2 6 l2 6 l-9 -4" fill={RED} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M39 14 q10 -8 18 -4 q-8 8 -18 4 z" fill={GOLD} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M25 46 q-10 -6 -16 0 q8 6 16 0 z" fill={GOLD} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <Face x={32} y={33.5} />
  </>
);

const Lotus = () => (
  <>
    <path d="M32 10 q11 13 0 34 q-11 -21 0 -34 z" fill={RED} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M13 21 q15 4 19 23 q-17 -2 -19 -23 z M51 21 q-15 4 -19 23 q17 -2 19 -23 z" fill={RED} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M5 36 q17 0 27 8 q-19 4 -27 -8 z M59 36 q-17 0 -27 8 q19 4 27 -8 z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <ellipse cx="32" cy="50" rx="21" ry="5" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <circle cx="32" cy="30" r="4" fill={GOLD} stroke={INK} strokeWidth="2" />
  </>
);

const LuckyStar = () => (
  <>
    {/* hangs from a string like a lantern charm */}
    <path d="M32 2 V9" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <path
      d="M32 9 l6.5 13.5 l14.5 2 l-10.5 10 l2.6 14.5 l-13.1 -7 l-13.1 7 l2.6 -14.5 l-10.5 -10 l14.5 -2 z"
      fill={GOLD}
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="23" cy="36" r="2.6" fill={RED} opacity="0.45" />
    <circle cx="41" cy="36" r="2.6" fill={RED} opacity="0.45" />
    <Face x={32} y={32} />
    {/* red tassel */}
    <path d="M32 52 V62" stroke={RED} strokeWidth="4" strokeLinecap="round" />
  </>
);

const ICON: Record<GoalTier, () => JSX.Element> = {
  casual: Sprout,
  steady: BambooShoot,
  focused: Lotus,
  dedicated: LuckyStar,
};

const GoalIcon = ({ tier, className }: { tier: GoalTier; className?: string }) => {
  const Icon = ICON[tier];
  return (
    <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)} aria-hidden="true">
      <Icon />
    </svg>
  );
};

/** A small paper lantern with a crescent moon, for the daily reminder setting */
export const ReminderIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={cn("w-10 h-10", className)} aria-hidden="true">
    <path d="M44 6 a12 12 0 1 0 12 16 a9 9 0 1 1 -12 -16 z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M24 8 V14" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="17" y="14" width="14" height="5" rx="2" fill={GOLD} stroke={INK} strokeWidth="2" />
    <ellipse cx="24" cy="35" rx="15" ry="16" fill={RED} stroke={INK} strokeWidth="3" />
    <path d="M24 19 q-8 16 0 32 M24 19 q8 16 0 32" fill="none" stroke={DEEP} strokeWidth="2" />
    <rect x="17" y="50" width="14" height="5" rx="2" fill={GOLD} stroke={INK} strokeWidth="2" />
    <path d="M24 55 V62" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="24" cy="35" r="5" fill={CREAM} opacity="0.55" />
  </svg>
);

export default GoalIcon;
