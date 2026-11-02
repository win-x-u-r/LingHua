// Word meanings for every Chinese word used in Grammar, in English and Arabic.
// Grammar sentences are split into words by longest match against this list, so
// each word in a question or option can show its pinyin and meaning underneath.

export interface Gloss {
  en: string;
  ar: string;
}

export const GRAMMAR_GLOSS: Record<string, Gloss> = {
  // People and pointers
  "我": { en: "I, me", ar: "أنا" },
  "你": { en: "you", ar: "أنت" },
  "他": { en: "he, him", ar: "هو" },
  "她": { en: "she, her", ar: "هي" },
  "我们": { en: "we, us", ar: "نحن" },
  "他们": { en: "they", ar: "هم" },
  "这": { en: "this", ar: "هذا" },
  "那": { en: "that", ar: "ذلك" },

  // Grammar words
  "是": { en: "is, am, are", ar: "يكون" },
  "不": { en: "not", ar: "لا" },
  "没": { en: "didn't", ar: "لم" },
  "吗": { en: "yes/no?", ar: "أداة سؤال" },
  "了": { en: "done", ar: "تمّ" },
  "在": { en: "is doing", ar: "يفعل الآن" },
  "的": { en: "'s, of", ar: "الخاص بـ" },
  "很": { en: "very", ar: "جدًا" },
  "比": { en: "than", ar: "أكثر من" },
  "想": { en: "want to", ar: "يريد أن" },
  "要": { en: "going to", ar: "سوف" },
  "会": { en: "can", ar: "يستطيع" },
  "把": { en: "takes the object", ar: "يقدّم المفعول" },
  "被": { en: "by", ar: "من قِبَل" },
  "过": { en: "have ever", ar: "سبق أن" },
  "着": { en: "-ing (ongoing)", ar: "مستمر" },

  // Verbs
  "吃": { en: "eat", ar: "يأكل" },
  "喝": { en: "drink", ar: "يشرب" },
  "看": { en: "watch, read", ar: "يشاهد، يقرأ" },
  "买": { en: "buy", ar: "يشتري" },
  "写": { en: "write", ar: "يكتب" },
  "听": { en: "listen", ar: "يستمع" },
  "说": { en: "speak", ar: "يتكلم" },
  "学": { en: "study", ar: "يدرس" },
  "去": { en: "go", ar: "يذهب" },
  "来": { en: "come", ar: "يأتي" },
  "关": { en: "close", ar: "يغلق" },
  "有": { en: "have", ar: "يملك" },
  "喜欢": { en: "like", ar: "يحب" },
  "完": { en: "finish", ar: "ينهي" },

  // Things
  "饭": { en: "meal", ar: "طعام" },
  "茶": { en: "tea", ar: "شاي" },
  "咖啡": { en: "coffee", ar: "قهوة" },
  "肉": { en: "meat", ar: "لحم" },
  "菜": { en: "dish", ar: "طبق" },
  "中国菜": { en: "Chinese food", ar: "طعام صيني" },
  "书": { en: "book", ar: "كتاب" },
  "一本": { en: "one (book)", ar: "واحد (كتاب)" },
  "一杯": { en: "a cup of", ar: "كوب من" },
  "那部": { en: "that (film)", ar: "ذلك (الفيلم)" },
  "电影": { en: "movie", ar: "فيلم" },
  "门": { en: "door", ar: "باب" },
  "中文": { en: "Chinese", ar: "الصينية" },
  "英文": { en: "English", ar: "الإنجليزية" },
  "中国": { en: "China", ar: "الصين" },
  "老师": { en: "teacher", ar: "معلم" },
  "学生": { en: "student", ar: "طالب" },
  "医生": { en: "doctor", ar: "طبيب" },

  // Time and describing words
  "今天": { en: "today", ar: "اليوم" },
  "昨天": { en: "yesterday", ar: "أمس" },
  "高": { en: "tall", ar: "طويل" },
  "冷": { en: "cold", ar: "بارد" },
  "难": { en: "hard", ar: "صعب" },
};

const MAX_WORD = Math.max(...Object.keys(GRAMMAR_GLOSS).map((w) => [...w].length));
const isHanzi = (c: string) => /[一-鿿]/.test(c);

export interface Segment {
  text: string;
  /** true for Chinese words; false for blanks, spaces and punctuation */
  word: boolean;
}

/** Split a Chinese sentence into known words (longest match first). */
export function segment(sentence: string): Segment[] {
  const chars = [...sentence];
  const out: Segment[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!isHanzi(chars[i])) {
      let j = i;
      while (j < chars.length && !isHanzi(chars[j])) j++;
      out.push({ text: chars.slice(i, j).join(""), word: false });
      i = j;
      continue;
    }
    let len = Math.min(MAX_WORD, chars.length - i);
    while (len > 1 && !GRAMMAR_GLOSS[chars.slice(i, i + len).join("")]) len--;
    out.push({ text: chars.slice(i, i + len).join(""), word: true });
    i += len;
  }
  return out;
}

/** Meaning of a word or short phrase, e.g. 买了 → "buy + done". */
export function glossOf(token: string, lang: "en" | "ar"): string {
  const direct = GRAMMAR_GLOSS[token];
  if (direct) return direct[lang];
  return segment(token)
    .filter((s) => s.word)
    .map((s) => GRAMMAR_GLOSS[s.text]?.[lang] ?? "")
    .filter(Boolean)
    .join(" + ");
}
