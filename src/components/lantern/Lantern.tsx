import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import "./lantern.css";

export type LanternMood =
  | "idle" // home screen, between questions
  | "happy" // correct answer, good score
  | "sad" // wrong answer
  | "celebrate" // lesson finished, level up, streak milestone
  | "sleepy" // empty states, nothing due
  | "listening" // microphone is recording
  | "thinking" // score or translation is loading
  | "watch" // login: someone is typing their email
  | "shy"; // login: password field, turns its back and peeks

interface LanternProps {
  mood?: LanternMood;
  /** Accessible description; leave empty when the lantern is decoration. */
  label?: string;
  className?: string;
  /** Drop in on its string when first shown (login page). */
  entering?: boolean;
  /** Change this number to make the lantern react once, e.g. on each typing burst. */
  bounce?: number;
  /** Where the eyes look in the watch mood, from -1 (left) to 1 (right). */
  look?: number;
  /** No motion at all, e.g. the logo in the nav bar. */
  still?: boolean;
}

const INK = "#2A1E1C";

const CONFETTI_COLORS = ["#E8352B", "#FCC755", "#FDE36E", "#C61F18", "#F5B731"];
const confetti = Array.from({ length: 16 }, (_, i) => ({
  x: 60 + ((i * 61) % 900),
  w: 14 + (i % 3) * 4,
  h: 26 + (i % 4) * 5,
  fill: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  style: {
    "--t": `${(2.2 + (i % 5) * 0.35).toFixed(2)}s`,
    "--d": `${(-(i * 0.37) % 2.6).toFixed(2)}s`,
    "--dx": `${(i % 2 ? 1 : -1) * (20 + ((i * 13) % 50))}px`,
  } as React.CSSProperties,
}));

const Lantern = ({ mood = "idle", label, className, entering = false, bounce = 0, look = 0, still = false }: LanternProps) => {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const firstBounce = useRef(true);

  // Replay the one-shot sway or hop each time `bounce` changes.
  useEffect(() => {
    if (firstBounce.current) {
      firstBounce.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    el.classList.remove("lh-bop");
    void el.getBoundingClientRect();
    el.classList.add("lh-bop");
  }, [bounce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = (e: AnimationEvent) => {
      if (e.animationName === "lh-drop") el.classList.remove("lh-entering");
      if (e.animationName === "lh-bop" || e.animationName === "lh-hopbop") el.classList.remove("lh-bop");
    };
    el.addEventListener("animationend", done);
    return () => el.removeEventListener("animationend", done);
  }, []);

  const lookX = Math.max(-1, Math.min(1, look)) * 20;
  const clip = (name: string) => `url(#${id}-${name})`;

  return (
    <svg
      ref={ref}
      className={cn("lh", still && "lh-still", entering && "lh-entering", className)}
      data-mood={mood}
      viewBox="0 0 1024 1050"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={`${id}-body`}><ellipse cx="512" cy="477" rx="335" ry="200" /></clipPath>
        <clipPath id={`${id}-cap1`}><rect x="315" y="203" width="395" height="86" rx="30" /></clipPath>
        <clipPath id={`${id}-cap2`}><rect x="315" y="658" width="395" height="84" rx="30" /></clipPath>
        <clipPath id={`${id}-tas`}><path d="M488 812 H536 Q590 915 568 952 Q540 984 512 984 Q484 984 456 952 Q434 915 488 812Z" /></clipPath>
      </defs>

      {mood === "celebrate" && !still && (
        <g className="lh-confetti">
          {confetti.map((c, i) => (
            <rect key={i} x={c.x} y={0} width={c.w} height={c.h} rx={3} fill={c.fill} style={c.style} />
          ))}
        </g>
      )}

      <g className="lh-rig">
        <line x1="512" y1="-1200" x2="512" y2="210" stroke="#C8901A" strokeWidth="10" strokeLinecap="round" />
        <g className="lh-lantern">
          <circle cx="512" cy="152" r="32" fill="#FCC755" />
          <circle cx="520" cy="144" r="19" fill="#FDE36E" />
          <path d="M490 204 A22 22 0 0 1 534 204Z" fill="#C8901A" />
          <g className="lh-body">
            <g clipPath={clip("body")}>
              <rect x="170" y="270" width="690" height="420" fill="#E8271F" />
              <ellipse cx="560" cy="477" rx="278" ry="230" fill="#FF4531" />
              <ellipse cx="560" cy="477" rx="182" ry="235" fill="#FF5D4D" />
            </g>
          </g>
          <g clipPath={clip("cap1")}>
            <rect x="315" y="203" width="395" height="86" fill="#FDE36E" />
            <rect x="315" y="203" width="100" height="86" fill="#FCC755" />
          </g>
          <g clipPath={clip("cap2")}>
            <rect x="315" y="658" width="395" height="84" fill="#FDE36E" />
            <rect x="315" y="658" width="100" height="84" fill="#FCC755" />
          </g>

          <g className="lh-face" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="368" cy="472" rx="41" ry="29" fill="#FFFFFF" />
            <ellipse cx="656" cy="472" rx="41" ry="29" fill="#FFFFFF" />

            <g className="lh-f-idle" fill="none" stroke={INK} strokeWidth="15">
              <path d="M374 434 Q400 462 426 434" />
              <path d="M596 434 Q622 462 648 434" />
              <path d="M481 450 Q512 482 543 450" />
            </g>

            <g className="lh-f-happy">
              <g className="lh-eye"><ellipse cx="400" cy="436" rx="22" ry="28" fill={INK} /><circle cx="408" cy="426" r="8" fill="#FFFFFF" /></g>
              <g className="lh-eye"><ellipse cx="622" cy="436" rx="22" ry="28" fill={INK} /><circle cx="630" cy="426" r="8" fill="#FFFFFF" /></g>
              <path d="M476 458 H548 Q546 508 512 510 Q478 508 476 458Z" fill={INK} />
              <path d="M492 496 Q512 482 532 496 Q524 508 512 508 Q500 508 492 496Z" fill="#FF8D7E" />
            </g>

            <g className="lh-f-sad">
              <path d="M370 398 L424 386" stroke={INK} strokeWidth="12" fill="none" />
              <path d="M600 386 L654 398" stroke={INK} strokeWidth="12" fill="none" />
              <ellipse cx="400" cy="440" rx="19" ry="23" fill={INK} /><circle cx="405" cy="429" r="7" fill="#FFFFFF" />
              <ellipse cx="622" cy="440" rx="19" ry="23" fill={INK} /><circle cx="627" cy="429" r="7" fill="#FFFFFF" />
              <path d="M488 482 Q512 462 536 482" stroke={INK} strokeWidth="13" fill="none" />
            </g>

            <g className="lh-f-celebrate">
              <path d="M374 446 Q400 412 426 446" stroke={INK} strokeWidth="15" fill="none" />
              <path d="M596 446 Q622 412 648 446" stroke={INK} strokeWidth="15" fill="none" />
              <path d="M470 455 H554 Q552 520 512 522 Q472 520 470 455Z" fill={INK} />
              <path d="M488 504 Q512 486 536 504 Q528 520 512 520 Q496 520 488 504Z" fill="#FF8D7E" />
            </g>

            <g className="lh-f-sleepy" stroke={INK} strokeWidth="14" fill="none">
              <path d="M378 446 Q400 452 424 446" />
              <path d="M598 446 Q622 452 646 446" />
              <ellipse cx="512" cy="474" rx="10" ry="12" fill={INK} stroke="none" />
            </g>

            <g className="lh-f-listening">
              <path d="M598 386 Q624 370 650 382" stroke={INK} strokeWidth="11" fill="none" />
              <ellipse cx="410" cy="438" rx="20" ry="26" fill={INK} /><circle cx="417" cy="428" r="7" fill="#FFFFFF" />
              <ellipse cx="632" cy="436" rx="20" ry="27" fill={INK} /><circle cx="639" cy="426" r="7" fill="#FFFFFF" />
              <ellipse cx="512" cy="478" rx="13" ry="15" fill={INK} />
            </g>

            <g className="lh-f-thinking" stroke={INK} fill="none">
              <path d="M376 406 Q400 400 424 406" strokeWidth="11" />
              <path d="M600 394 Q624 378 650 390" strokeWidth="11" />
              <path d="M378 444 Q401 452 424 444" strokeWidth="14" />
              <path d="M600 444 Q623 452 646 444" strokeWidth="14" />
              <path d="M512 482 Q524 472 536 480 Q548 488 556 478" strokeWidth="12" />
            </g>

            <g className="lh-f-watch">
              <g className="lh-look" style={{ transform: `translate(${lookX}px, 10px)` }}>
                <path d="M376 446 Q400 416 424 446" stroke={INK} strokeWidth="15" fill="none" />
                <path d="M598 446 Q622 416 646 446" stroke={INK} strokeWidth="15" fill="none" />
              </g>
              <path d="M476 458 H548 Q546 508 512 510 Q478 508 476 458Z" fill={INK} />
              <path d="M492 496 Q512 482 532 496 Q524 508 512 508 Q500 508 492 496Z" fill="#FF8D7E" />
            </g>

            <g className="lh-f-shy" stroke={INK} fill="none">
              <path d="M374 434 Q400 462 426 434" strokeWidth="15" />
              <path d="M596 434 Q622 462 648 434" strokeWidth="15" />
              <path d="M488 466 Q512 480 536 466" strokeWidth="13" />
            </g>
          </g>

          {/* One eye and a cheek peeking around the side while the lantern faces away */}
          <g className="lh-peek" clipPath={clip("body")}>
            <ellipse cx="196" cy="488" rx="30" ry="24" fill="#FFFFFF" />
            <path d="M206 404 Q226 396 246 404" stroke={INK} strokeWidth="10" strokeLinecap="round" fill="none" />
            <ellipse cx="228" cy="446" rx="16" ry="22" fill={INK} />
            <circle cx="233" cy="437" r="6" fill="#FFFFFF" />
          </g>

          <g className="lh-tassel">
            <circle cx="512" cy="772" r="50" fill="#E1DEDB" />
            <path d="M530 726 A50 50 0 0 1 530 818 A50 50 0 0 1 530 726Z" fill="#F2F0EE" />
            <g clipPath={clip("tas")}>
              <rect x="430" y="800" width="170" height="200" fill="#FCC755" />
              <path d="M512 812 Q545 900 520 984 H600 V800Z" fill="#FDE36E" />
            </g>
          </g>
        </g>

        <g className="lh-waves" fill="none" stroke="#E9A919" strokeWidth="13" strokeLinecap="round">
          <path d="M878 425 Q900 470 878 515" />
          <path d="M914 398 Q946 470 914 542" />
          <path d="M950 370 Q992 470 950 570" />
        </g>
        <g className="lh-dots" fill="#E9A919">
          <circle cx="735" cy="300" r="15" />
          <circle cx="782" cy="268" r="18" />
          <circle cx="836" cy="240" r="21" />
        </g>
      </g>

      {mood === "sleepy" && !still && (
        <g className="lh-zz" fill="#F2C14E" fontFamily="var(--font-sans)" fontWeight="600">
          <text x="700" y="330" fontSize="64">z</text>
          <text x="700" y="330" fontSize="52">z</text>
          <text x="700" y="330" fontSize="42">z</text>
        </g>
      )}
    </svg>
  );
};

export default Lantern;
