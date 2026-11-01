// Avatar ids stored in profiles.avatar_url and drawn by <AvatarIcon>.
// Unknown or older ids (phoenix, star) fall back to the panda.
export const AVATAR_IDS = ["panda", "dragon", "dumpling", "cat", "lotus", "bamboo"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];
