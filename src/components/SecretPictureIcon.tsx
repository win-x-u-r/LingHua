import AvatarIcon from "@/components/AvatarIcon";
import PathIcon from "@/components/PathIcon";
import RoleIcon from "@/components/RoleIcon";
import type { SecretPicture } from "@/lib/kidsAPI";

/** The drawings kids pick their secret pictures from: the 6 avatars, a kite, a lantern and a scroll. */
const SecretPictureIcon = ({ id, className }: { id: SecretPicture; className?: string }) => {
  if (id === "kite") return <PathIcon path="my_mandarin" className={className} />;
  if (id === "lantern") return <PathIcon path="little_lanterns" className={className} />;
  if (id === "scroll") return <RoleIcon role="teacher" className={className} />;
  return <AvatarIcon id={id} className={className} />;
};

export default SecretPictureIcon;
