import { useLanguage } from "@/contexts/LanguageContext";
import SecretPictureIcon from "@/components/SecretPictureIcon";
import { PICTURE_COUNT, SECRET_PICTURES, type SecretPicture } from "@/lib/kidsAPI";
import { cn } from "@/lib/utils";

/**
 * 3 slots on top, a 3 by 3 grid of pictures below. Tapping a picture fills the
 * next slot; tapping a filled slot clears it and everything after it.
 */
const PicturePad = ({
  value,
  onChange,
  disabled = false,
  small = false,
}: {
  value: SecretPicture[];
  onChange: (next: SecretPicture[]) => void;
  disabled?: boolean;
  /** Compact tiles, for the teacher's reset */
  small?: boolean;
}) => {
  const { t } = useLanguage();
  return (
    <div className={cn("flex flex-col items-center", small ? "gap-2" : "gap-4")}>
      <div className="flex gap-3" dir="ltr" aria-live="polite">
        {Array.from({ length: PICTURE_COUNT }, (_, i) => {
          const pic = value[i];
          return (
            <button
              key={i}
              type="button"
              disabled={disabled || !pic}
              onClick={() => onChange(value.slice(0, i))}
              aria-label={pic ? t(`kids.pic.${pic}`) : `${i + 1}`}
              className={cn(
                "rounded-[14px] border-2 grid place-items-center",
                small ? "w-11 h-11 rounded-[10px]" : "w-16 h-16 sm:w-20 sm:h-20",
                pic ? "border-stroke bg-accent" : "border-dashed border-primary/50 bg-card",
              )}
            >
              {pic && <SecretPictureIcon id={pic} className={small ? "w-8 h-8" : "w-11 h-11 sm:w-14 sm:h-14"} />}
            </button>
          );
        })}
      </div>
      <div className={small ? "grid grid-cols-9 max-sm:grid-cols-5 gap-1.5" : "grid grid-cols-3 gap-2.5 sm:gap-3"} dir="ltr">
        {SECRET_PICTURES.map((pic) => (
          <button
            key={pic}
            type="button"
            disabled={disabled || value.length >= PICTURE_COUNT}
            onClick={() => onChange([...value, pic])}
            aria-label={t(`kids.pic.${pic}`)}
            className={cn(
              "border-2 border-stroke bg-card grid place-items-center disabled:opacity-60",
              small ? "w-11 h-11 rounded-[10px]" : "w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-[16px] shadow-[3px_3px_0_hsl(var(--stamp))]",
            )}
          >
            <SecretPictureIcon id={pic} className={small ? "w-8 h-8" : "w-14 h-14 sm:w-16 sm:h-16"} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default PicturePad;
