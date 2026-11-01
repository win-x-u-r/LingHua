import { cn } from "@/lib/utils";
import { AVATAR_IDS, type AvatarId } from "@/lib/avatars";

/* Learner avatars: small drawings in the lantern's palette, easy to recognise for new learners. */
const INK = "#2A1E1C";
const RED = "#E8352B";
const GOLD = "#FCC755";
const CREAM = "#FFF6E8";
const WHITE = "#FFFFFF";
const GREEN = "#3FA66B";
const PINK = "#F59BA8";

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

const Dragon = () => (
  <>
    {/* golden mane behind the head */}
    <path d="M8 36 l-4 -6 l7 0 l-3 -7 l8 3 l0 -8 l7 6 l3 -8 l6 7 l6 -7 l3 8 l7 -6 l0 8 l8 -3 l-3 7 l7 0 l-4 6 z" fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    {/* branching antlers */}
    <path d="M22 18 q-4 -8 -2 -13 M21 11 q-5 -1 -7 -4 M42 18 q4 -8 2 -13 M43 11 q5 -1 7 -4" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    {/* head */}
    <ellipse cx="32" cy="35" rx="19" ry="17" fill={GREEN} stroke={INK} strokeWidth="3" />
    {/* snout */}
    <ellipse cx="32" cy="43" rx="12" ry="7.5" fill={CREAM} stroke={INK} strokeWidth="2.5" />
    <circle cx="28" cy="42" r="1.5" fill={INK} />
    <circle cx="36" cy="42" r="1.5" fill={INK} />
    <path d="M29 46.5 q3 2 6 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    {/* big friendly eyes */}
    <circle cx="24" cy="30" r="5" fill={WHITE} stroke={INK} strokeWidth="2" />
    <circle cx="40" cy="30" r="5" fill={WHITE} stroke={INK} strokeWidth="2" />
    <circle cx="25" cy="31" r="2.4" fill={INK} />
    <circle cx="39" cy="31" r="2.4" fill={INK} />
    <circle cx="25.8" cy="30" r="0.8" fill={WHITE} />
    <circle cx="39.8" cy="30" r="0.8" fill={WHITE} />
    {/* curly whiskers */}
    <path d="M21 44 q-8 -1 -10 5 q-1 4 3 4 M43 44 q8 -1 10 5 q1 4 -3 4" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" />
  </>
);

const Dumpling = () => (
  <>
    <path d="M8 40 q2 -22 24 -24 q22 2 24 24 q-4 10 -24 10 q-20 0 -24 -10 z" fill={CREAM} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    {/* pleats */}
    <path d="M22 20 q2 6 0 10 M32 16 v12 M42 20 q-2 6 0 10" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    {/* face */}
    <path d="M23 38 q2.5 2.5 5 0 M36 38 q2.5 2.5 5 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <path d="M30 42 q2 2 4 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <circle cx="19" cy="42" r="3" fill={PINK} opacity="0.7" />
    <circle cx="45" cy="42" r="3" fill={PINK} opacity="0.7" />
    {/* steam */}
    <path d="M26 10 q-3 -3 0 -6 M38 10 q-3 -3 0 -6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
  </>
);

const LuckyCat = () => (
  <>
    {/* ears */}
    <path d="M14 26 l2 -16 l12 10 z M50 26 l-2 -16 l-12 10 z" fill={WHITE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M17 22 l1 -7 l5 4 z M47 22 l-1 -7 l-5 4 z" fill={PINK} />
    {/* head */}
    <ellipse cx="32" cy="36" rx="21" ry="18" fill={WHITE} stroke={INK} strokeWidth="3" />
    {/* raised paw */}
    <ellipse cx="54" cy="22" rx="6" ry="8" fill={WHITE} stroke={INK} strokeWidth="2.5" />
    {/* eyes */}
    <path d="M22 34 q3 -3 6 0 M36 34 q3 -3 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M30 40 l2 2 l2 -2" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* collar and bell */}
    <path d="M16 48 q16 8 32 0" fill="none" stroke={RED} strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="53" r="4" fill={GOLD} stroke={INK} strokeWidth="2" />
  </>
);

const Lotus = () => (
  <>
    <path d="M32 12 q10 12 0 32 q-10 -20 0 -32 z" fill={PINK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M14 22 q14 4 18 22 q-16 -2 -18 -22 z M50 22 q-14 4 -18 22 q16 -2 18 -22 z" fill={PINK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M6 36 q16 0 26 8 q-18 4 -26 -8 z M58 36 q-16 0 -26 8 q18 4 26 -8 z" fill={WHITE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <ellipse cx="32" cy="50" rx="22" ry="5" fill={GREEN} stroke={INK} strokeWidth="2.5" />
  </>
);

const Bamboo = () => (
  <>
    <rect x="18" y="6" width="12" height="52" rx="5" fill={GREEN} stroke={INK} strokeWidth="3" />
    <path d="M18 22 h12 M18 40 h12" stroke={INK} strokeWidth="2.5" />
    <rect x="36" y="16" width="10" height="42" rx="4.5" fill={GREEN} stroke={INK} strokeWidth="3" />
    <path d="M36 32 h10 M36 46 h10" stroke={INK} strokeWidth="2.5" />
    {/* leaves */}
    <path d="M30 20 q10 -10 20 -6 q-8 8 -20 6 z" fill={GREEN} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M18 34 q-10 -6 -14 2 q8 4 14 -2 z" fill={GREEN} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
    {/* face on the big stalk */}
    <circle cx="22" cy="30" r="1.5" fill={INK} />
    <circle cx="27" cy="30" r="1.5" fill={INK} />
    <path d="M22.5 33.5 q2 1.5 4 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
  </>
);

const ICON: Record<AvatarId, () => JSX.Element> = {
  panda: Panda,
  dragon: Dragon,
  dumpling: Dumpling,
  cat: LuckyCat,
  lotus: Lotus,
  bamboo: Bamboo,
};

const AvatarIcon = ({ id, className }: { id?: string | null; className?: string }) => {
  const key = (AVATAR_IDS as readonly string[]).includes(id ?? "") ? (id as AvatarId) : "panda";
  const Icon = ICON[key];
  return (
    <svg viewBox="0 0 64 64" className={cn("w-10 h-10", className)} aria-hidden="true">
      <Icon />
    </svg>
  );
};

export default AvatarIcon;
