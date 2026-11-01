import { cn } from "@/lib/utils";

/*
 * Small drawn icons for the Hua chat, in the lantern's red and gold:
 * a microphone, a stop tile, a red envelope for sending, a gong for
 * reading replies aloud, and a fresh scroll for a new chat.
 */
const INK = "#2A1E1C";
const RED = "#E8352B";
const GOLD = "#FCC755";
const CREAM = "#FFF6E8";

type IconProps = { className?: string };

const Svg = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg viewBox="0 0 64 64" className={cn("!size-6 shrink-0", className)} aria-hidden="true">
    {children}
  </svg>
);

export const MicIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 30 q0 14 14 14 q14 0 14 -14" fill="none" stroke={RED} strokeWidth="4.5" strokeLinecap="round" />
    <path d="M32 44 v10 M22 56 h20" stroke={RED} strokeWidth="4.5" strokeLinecap="round" />
    <rect x="22" y="6" width="20" height="32" rx="10" fill={GOLD} stroke={INK} strokeWidth="3" />
    <path d="M26 16 h5 M26 22 h5 M26 28 h5" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const StopIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="14" y="14" width="36" height="36" rx="9" fill={RED} stroke={INK} strokeWidth="3" />
    <rect x="22" y="22" width="20" height="20" rx="4" fill={GOLD} />
  </Svg>
);

/** A red envelope (hongbao) with a gold seal: sends the message. */
export const SendIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    {/* cream edge so the envelope still reads on a red button */}
    <rect x="12" y="6" width="40" height="52" rx="5" fill={RED} stroke={CREAM} strokeWidth="7" />
    <rect x="12" y="6" width="40" height="52" rx="5" fill={RED} stroke={INK} strokeWidth="3" />
    <path d="M12 12 q20 20 40 0" fill="#C61F18" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <circle cx="32" cy="24" r="8" fill={GOLD} stroke={INK} strokeWidth="2.5" />
    <path d="M28 24 h8 M32 20 v8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 42 h24 M20 49 h16" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/** A gong on a red frame: Hua reads the reply aloud. */
export const GongIcon = ({ className, sounding = true }: IconProps & { sounding?: boolean }) => (
  <Svg className={className}>
    <path d="M8 58 V10 M40 58 V10 M4 10 h40" stroke={RED} strokeWidth="5" strokeLinecap="round" />
    <path d="M18 10 v6 M30 10 v6" stroke={INK} strokeWidth="2.5" />
    <circle cx="24" cy="32" r="14" fill={GOLD} stroke={INK} strokeWidth="3" />
    <circle cx="24" cy="32" r="5" fill="#F5B731" stroke={INK} strokeWidth="2" />
    {sounding && (
      <g fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round">
        <path d="M48 24 q5 8 0 16" />
        <path d="M54 18 q9 14 0 28" />
      </g>
    )}
  </Svg>
);

/** A blank scroll with red rollers: starts a new chat. */
export const ScrollIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="14" y="12" width="36" height="40" rx="3" fill={CREAM} stroke={INK} strokeWidth="3" />
    <rect x="9" y="8" width="46" height="8" rx="4" fill={RED} stroke={INK} strokeWidth="2.5" />
    <rect x="9" y="48" width="46" height="8" rx="4" fill={RED} stroke={INK} strokeWidth="2.5" />
    <path d="M32 24 v16 M24 32 h16" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
  </Svg>
);
