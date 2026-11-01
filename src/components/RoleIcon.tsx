import type { UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/*
 * Small hand-drawn icons for the sign-up roles, in the lantern's palette:
 * a panda for students, a brush and scroll for teachers, a kite for learning on your own.
 */
const INK = "#2A1E1C";
const RED = "#E8352B";
const GOLD = "#FCC755";
const WHITE = "#FFFFFF";

const Panda = () => (
  <>
    <circle cx="16" cy="17" r="7" fill={INK} />
    <circle cx="48" cy="17" r="7" fill={INK} />
    <ellipse cx="32" cy="36" rx="22" ry="20" fill={WHITE} stroke={INK} strokeWidth="3" />
    <ellipse cx="23" cy="34" rx="6" ry="7.5" fill={INK} transform="rotate(-20 23 34)" />
    <ellipse cx="41" cy="34" rx="6" ry="7.5" fill={INK} transform="rotate(20 41 34)" />
    <circle cx="24" cy="33" r="2" fill={WHITE} />
    <circle cx="40" cy="33" r="2" fill={WHITE} />
    <ellipse cx="32" cy="42" rx="3.2" ry="2.3" fill={INK} />
    <path d="M28.5 46 q3.5 3 7 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="43" r="3" fill={RED} opacity="0.35" />
    <circle cx="47" cy="43" r="3" fill={RED} opacity="0.35" />
  </>
);

const BrushScroll = () => (
  <>
    {/* scroll */}
    <rect x="10" y="14" width="34" height="40" rx="3" fill={WHITE} stroke={INK} strokeWidth="3" />
    <rect x="7" y="10" width="40" height="7" rx="3.5" fill={RED} stroke={INK} strokeWidth="2.5" />
    <rect x="7" y="51" width="40" height="7" rx="3.5" fill={RED} stroke={INK} strokeWidth="2.5" />
    {/* the character 文 in brush strokes */}
    <path d="M27 21 v4 M18 27 h18 M21 30 q6 14 15 18 M33 30 q-5 13 -14 18" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    {/* brush */}
    <g transform="rotate(30 50 34)">
      <rect x="47" y="12" width="6" height="30" rx="2" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      <path d="M46 42 h8 l-4 12 z" fill={INK} />
    </g>
  </>
);

const Kite = () => (
  <>
    <path d="M32 6 L54 26 L32 46 L10 26 Z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M32 6 V46 M10 26 H54" stroke={GOLD} strokeWidth="3" />
    <circle cx="32" cy="26" r="6" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    {/* tail with bows */}
    <path d="M32 46 q-6 6 0 10 q6 4 0 8" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M27 52 l5 3 l-5 3 z M37 52 l-5 3 l5 3 z" fill={GOLD} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
  </>
);

const ICON: Record<UserRole, () => JSX.Element> = {
  student: Panda,
  teacher: BrushScroll,
  independent: Kite,
};

const RoleIcon = ({ role, className }: { role: UserRole; className?: string }) => {
  const Icon = ICON[role];
  return (
    <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)} aria-hidden="true">
      <Icon />
    </svg>
  );
};

export default RoleIcon;
