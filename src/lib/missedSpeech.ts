import type { MissReason } from "@/hooks/use-microphone";
import type { UnclearReason } from "@/lib/linghuaAPI";

/** Any reason Hua could not hear a recording well enough to score it. */
export type Miss = MissReason | UnclearReason;

/** The i18n key for what Hua says when a recording could not be scored. */
export function missLineKey(miss: Miss): string {
  if (miss === "quiet" || miss === "no_speech") return "hua.miss.quiet";
  if (miss === "short") return "hua.miss.short";
  return "hua.miss.unclear";
}
