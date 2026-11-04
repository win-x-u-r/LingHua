// Write a number the way it's said in Mandarin, with pinyin.
// Covers 0 to 99,999,999, which is every price and order size a traveller meets.

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const PINYIN: Record<string, string> = {
  零: "líng", 一: "yī", 二: "èr", 两: "liǎng", 三: "sān", 四: "sì", 五: "wǔ", 六: "liù", 七: "qī", 八: "bā", 九: "jiǔ",
  十: "shí", 百: "bǎi", 千: "qiān", 万: "wàn",
};

/** 0 to 9999 as characters. `lead` is true when nothing comes before it. */
function under10k(n: number, lead: boolean): string[] {
  const parts: string[] = [];
  const d = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  const units = ["千", "百", "十", ""];
  let zero = false;
  let started = false;
  d.forEach((digit, i) => {
    if (digit === 0) {
      if (started) zero = true;
      return;
    }
    if (zero || (!started && !lead && i > 0)) parts.push("零");
    zero = false;
    // 10 to 19 at the very start is said 十, 十一… not 一十
    const bareTen = i === 2 && digit === 1 && !started && lead;
    // A leading two thousand or two hundred is said 两
    const two = digit === 2 && (i === 0 || i === 1) && !started && lead ? "两" : DIGITS[digit];
    if (!bareTen) parts.push(two);
    if (units[i]) parts.push(units[i]);
    started = true;
  });
  return parts;
}

export function toChineseChars(n: number): string[] {
  n = Math.floor(Math.abs(n));
  if (n === 0) return ["零"];
  if (n >= 100_000_000) n = 99_999_999;
  const high = Math.floor(n / 10_000);
  const low = n % 10_000;
  const parts: string[] = [];
  if (high) {
    const h = under10k(high, true);
    // 两万 for 20,000, but 十二万 keeps 二
    if (h.length === 1 && h[0] === "二") h[0] = "两";
    parts.push(...h, "万");
  }
  if (low) parts.push(...under10k(low, !high));
  return parts;
}

/** The pinyin for each character, with the tone change of 一 before 百, 千 and 万 */
export function toPinyin(chars: string[]): string {
  return chars
    .map((c, i) => {
      const next = chars[i + 1];
      if (c === "一" && next && "百千".includes(next)) return "yì";
      if (c === "一" && next === "万") return "yí";
      return PINYIN[c] ?? c;
    })
    .join(" ");
}

export function chineseNumber(n: number) {
  const chars = toChineseChars(n);
  return { zh: chars.join(""), pinyin: toPinyin(chars) };
}
