// Avatar ids stored on the profile, shown as a seal with a matching character
export const AVATARS: Record<string, string> = {
  panda: "熊",
  dragon: "龙",
  phoenix: "凤",
  bamboo: "竹",
  lotus: "莲",
  star: "星",
};

export const avatarChar = (id?: string | null) => AVATARS[id ?? ""] ?? AVATARS.panda;
