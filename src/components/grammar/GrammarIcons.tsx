import { cn } from "@/lib/utils";

/* Small brush-style marks for Grammar feedback, in the app's drawn-icon style. */
const INK = "#2A1E1C";

type IconProps = { className?: string };

/** A jade tick: the answer was right. */
export const TickMark = ({ className }: IconProps) => (
  <svg viewBox="0 0 64 64" className={cn("size-6 shrink-0", className)} aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="#2E9E6A" stroke={INK} strokeWidth="3" />
    <path d="M19 33 l9 9 l18 -19" fill="none" stroke="#FFF6E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** A lantern-red cross: not quite. */
export const CrossMark = ({ className }: IconProps) => (
  <svg viewBox="0 0 64 64" className={cn("size-6 shrink-0", className)} aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="#E8352B" stroke={INK} strokeWidth="3" />
    <path d="M23 23 l18 18 M41 23 l-18 18" stroke="#FCC755" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
