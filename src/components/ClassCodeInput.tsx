import { useState } from "react";
import { cn } from "@/lib/utils";

interface ClassCodeInputProps {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

/**
 * Six-character class code, shown as six boxes so it is easy to copy from a board.
 * One real input underneath keeps paste, autofill and screen readers working.
 */
const ClassCodeInput = ({ id, value, onChange, className }: ClassCodeInputProps) => {
  const [focused, setFocused] = useState(false);
  const chars = value.padEnd(6, " ").slice(0, 6).split("");
  return (
    <label htmlFor={id} className={cn("relative block", className)} dir="ltr">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        maxLength={6}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        aria-describedby={id ? `${id}-boxes` : undefined}
      />
      <span id={id ? `${id}-boxes` : undefined} aria-hidden="true" className="grid grid-cols-6 gap-1.5">
        {chars.map((c, i) => (
          <span
            key={i}
            className={cn(
              "h-12 rounded-[10px] border-2 border-stroke bg-card grid place-items-center text-2xl font-bold tabular-nums",
              focused && i === Math.min(value.length, 5) && "ring-2 ring-ring ring-offset-2 ring-offset-card",
              c === " " && "text-muted-foreground",
            )}
          >
            {c === " " ? "" : c}
          </span>
        ))}
      </span>
    </label>
  );
};

export default ClassCodeInput;
