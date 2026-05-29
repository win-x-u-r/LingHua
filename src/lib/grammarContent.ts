// Grammar Mode content — authored here (no DB). Topics share the vocab levels
// (beginner/intermediate/advanced) so learners progress in parallel.

export type GrammarLevel = "beginner" | "intermediate" | "advanced";
export type GrammarCardType = "rule" | "pattern" | "example";
export type GrammarQuestionType = "mcq_blank" | "word_bank" | "tap_correct" | "reorder";

export interface GrammarCard {
  type: GrammarCardType;
  text: string;          // EN: rule text / pattern formula / example gloss
  textAr: string;        // AR equivalent
  hanzi?: string;        // example sentence
  pinyin?: string;
  translation?: string;  // EN translation of the example
  highlight?: string;    // grammar token to emphasize within hanzi
}

export interface GrammarQuestion {
  id: string;
  type: GrammarQuestionType;
  prompt: string;        // sentence-with-blank ("___") or an instruction
  promptAr: string;
  options: string[];     // option buttons / word bank / sentence tokens / scrambled tokens
  answer: string | string[]; // correct option/token, or ordered array (reorder)
  fullSentence: string;  // shown on a correct answer
  pinyin: string;
  translation: string;
  translationAr: string;
  explanation: string;   // <= 1 line
  explanationAr: string;
}

export interface GrammarTopic {
  id: string;
  level: GrammarLevel;
  title: string;
  titleAr: string;
  blurb: string;         // 1-line topic summary
  blurbAr: string;
  cards: GrammarCard[];
  questions: GrammarQuestion[];
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  // ── Topic 1: 了 (le) — completed action ────────────────────────────────
  {
    id: "le-completed",
    level: "beginner",
    title: "了 — Completed action",
    titleAr: "了 — الفعل المكتمل",
    blurb: "Mandarin has no tense; add 了 after a verb to mark a completed action.",
    blurbAr: "لا يوجد تصريف زمني في الصينية؛ أضف 了 بعد الفعل للدلالة على فعل مكتمل.",
    cards: [
      {
        type: "rule",
        text: "Add 了 right after a verb to show the action is completed.",
        textAr: "أضف 了 بعد الفعل مباشرةً للدلالة على أن الفعل قد اكتمل.",
      },
      {
        type: "pattern",
        text: "Subject + Verb + 了 + (Object)",
        textAr: "الفاعل + الفعل + 了 + (المفعول)",
        hanzi: "我 + 吃 + 了 + 饭",
        pinyin: "wǒ + chī + le + fàn",
      },
      {
        type: "example",
        text: "I ate (the meal).",
        textAr: "أكلتُ (الطعام).",
        hanzi: "我吃了饭。",
        pinyin: "wǒ chī le fàn",
        translation: "I ate.",
        highlight: "了",
      },
      {
        type: "example",
        text: "He bought a book.",
        textAr: "اشترى كتابًا.",
        hanzi: "他买了一本书。",
        pinyin: "tā mǎi le yì běn shū",
        translation: "He bought a book.",
        highlight: "了",
      },
    ],
    questions: [
      {
        id: "le-mcq-1", type: "mcq_blank",
        prompt: "我昨天 ___ 一本书。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.",
        options: ["买了", "买", "买的", "在买"], answer: "买了",
        fullSentence: "我昨天买了一本书。", pinyin: "wǒ zuótiān mǎi le yì běn shū",
        translation: "I bought a book yesterday.", translationAr: "اشتريتُ كتابًا أمس.",
        explanation: "了 marks the completed action.", explanationAr: "了 يدل على اكتمال الفعل.",
      },
      {
        id: "le-mcq-2", type: "mcq_blank",
        prompt: "我们 ___ 那部电影。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.",
        options: ["看了", "看", "要看", "看着"], answer: "看了",
        fullSentence: "我们看了那部电影。", pinyin: "wǒmen kàn le nà bù diànyǐng",
        translation: "We watched that movie.", translationAr: "شاهدنا ذلك الفيلم.",
        explanation: "了 after 看 = the watching is done.", explanationAr: "了 بعد 看 تعني أن المشاهدة قد تمت.",
      },
      {
        id: "le-wb-1", type: "word_bank",
        prompt: "我 ___ 饭了。", promptAr: "اختر الكلمة الصحيحة من البنك.",
        options: ["吃", "喝", "看", "买"], answer: "吃",
        fullSentence: "我吃饭了。", pinyin: "wǒ chī fàn le",
        translation: "I have eaten.", translationAr: "لقد أكلتُ.",
        explanation: "吃 = eat; 了 marks completion.", explanationAr: "吃 تعني يأكل؛ و了 تدل على الاكتمال.",
      },
      {
        id: "le-wb-2", type: "word_bank",
        prompt: "她 ___ 了一杯茶。", promptAr: "اختر الكلمة الصحيحة من البنك.",
        options: ["喝", "吃", "写", "听"], answer: "喝",
        fullSentence: "她喝了一杯茶。", pinyin: "tā hē le yì bēi chá",
        translation: "She drank a cup of tea.", translationAr: "شربت كوبًا من الشاي.",
        explanation: "喝 = drink (used with 茶).", explanationAr: "喝 تعني يشرب (تُستخدم مع 茶).",
      },
      {
        id: "le-tap-1", type: "tap_correct",
        prompt: "Tap the word that shows the action is completed.",
        promptAr: "اضغط على الكلمة التي تدل على اكتمال الفعل.",
        options: ["我", "看", "了", "电影"], answer: "了",
        fullSentence: "我看了电影。", pinyin: "wǒ kàn le diànyǐng",
        translation: "I watched a movie.", translationAr: "شاهدتُ فيلمًا.",
        explanation: "了 is the completed-action marker.", explanationAr: "了 هي علامة الفعل المكتمل.",
      },
      {
        id: "le-tap-2", type: "tap_correct",
        prompt: "Tap the completed-action marker.",
        promptAr: "اضغط على علامة الفعل المكتمل.",
        options: ["他们", "来", "了"], answer: "了",
        fullSentence: "他们来了。", pinyin: "tāmen lái le",
        translation: "They came / They're here.", translationAr: "لقد أتوا.",
        explanation: "了 shows the arriving is done.", explanationAr: "了 تدل على أن الوصول قد تم.",
      },
      {
        id: "le-re-1", type: "reorder",
        prompt: "Arrange into a correct sentence: \"I ate.\"",
        promptAr: "رتّب الكلمات لتكوين جملة صحيحة: \"أكلتُ\".",
        options: ["了", "我", "吃", "饭"], answer: ["我", "吃", "了", "饭"],
        fullSentence: "我吃了饭。", pinyin: "wǒ chī le fàn",
        translation: "I ate.", translationAr: "أكلتُ.",
        explanation: "了 goes right after the verb 吃.", explanationAr: "了 تأتي مباشرةً بعد الفعل 吃.",
      },
      {
        id: "le-re-2", type: "reorder",
        prompt: "Arrange into a correct sentence: \"He bought a book.\"",
        promptAr: "رتّب الكلمات: \"اشترى كتابًا\".",
        options: ["书", "买", "了", "他", "一本"], answer: ["他", "买", "了", "一本", "书"],
        fullSentence: "他买了一本书。", pinyin: "tā mǎi le yì běn shū",
        translation: "He bought a book.", translationAr: "اشترى كتابًا.",
        explanation: "了 follows the verb 买, before the object.", explanationAr: "了 تتبع الفعل 买 قبل المفعول.",
      },
    ],
  },

  // ── Topic 2: 是 (shì) — "to be" linking two nouns ───────────────────────
  {
    id: "shi-tobe",
    level: "beginner",
    title: "是 — A is B",
    titleAr: "是 — أ هو ب",
    blurb: "Use 是 to link two nouns: A 是 B. Not used before adjectives.",
    blurbAr: "استخدم 是 للربط بين اسمين: A 是 B. لا تُستخدم قبل الصفات.",
    cards: [
      { type: "rule", text: "是 links two nouns (A 是 B). Don't use it before adjectives.",
        textAr: "是 تربط اسمين (A 是 B). لا تستخدمها قبل الصفات." },
      { type: "pattern", text: "Noun + 是 + Noun", textAr: "اسم + 是 + اسم",
        hanzi: "我 + 是 + 学生", pinyin: "wǒ + shì + xuésheng" },
      { type: "example", text: "I am a student.", textAr: "أنا طالب.",
        hanzi: "我是学生。", pinyin: "wǒ shì xuésheng", translation: "I am a student.", highlight: "是" },
    ],
    questions: [
      {
        id: "shi-mcq-1", type: "mcq_blank",
        prompt: "他 ___ 老师。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.",
        options: ["是", "在", "有", "很"], answer: "是",
        fullSentence: "他是老师。", pinyin: "tā shì lǎoshī",
        translation: "He is a teacher.", translationAr: "هو معلم.",
        explanation: "是 links the two nouns 他 and 老师.", explanationAr: "是 تربط الاسمين 他 و老师.",
      },
      {
        id: "shi-mcq-2", type: "mcq_blank",
        prompt: "这 ___ 我的书。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.",
        options: ["是", "了", "吗", "不"], answer: "是",
        fullSentence: "这是我的书。", pinyin: "zhè shì wǒ de shū",
        translation: "This is my book.", translationAr: "هذا كتابي.",
        explanation: "是 = is, linking 这 and 我的书.", explanationAr: "是 تعني (هو) وتربط 这 و我的书.",
      },
      {
        id: "shi-tap-1", type: "tap_correct",
        prompt: "Tap the linking verb (\"is\").", promptAr: "اضغط على فعل الربط (\"هو\").",
        options: ["她", "是", "医生"], answer: "是",
        fullSentence: "她是医生。", pinyin: "tā shì yīshēng",
        translation: "She is a doctor.", translationAr: "هي طبيبة.",
        explanation: "是 is the linking verb.", explanationAr: "是 هي فعل الربط.",
      },
      {
        id: "shi-re-1", type: "reorder",
        prompt: "Arrange: \"I am a student.\"", promptAr: "رتّب: \"أنا طالب\".",
        options: ["学生", "我", "是"], answer: ["我", "是", "学生"],
        fullSentence: "我是学生。", pinyin: "wǒ shì xuésheng",
        translation: "I am a student.", translationAr: "أنا طالب.",
        explanation: "Order is Noun 是 Noun.", explanationAr: "الترتيب: اسم 是 اسم.",
      },
      {
        id: "shi-wb-1", type: "word_bank",
        prompt: "那 ___ 我的老师。", promptAr: "اختر الكلمة الصحيحة من البنك.",
        options: ["是", "在", "有", "的"], answer: "是",
        fullSentence: "那是我的老师。", pinyin: "nà shì wǒ de lǎoshī",
        translation: "That is my teacher.", translationAr: "ذلك معلمي.",
        explanation: "是 links 那 and 我的老师.", explanationAr: "是 تربط 那 و我的老师.",
      },
      {
        id: "shi-mcq-3", type: "mcq_blank",
        prompt: "我们 ___ 学生。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.",
        options: ["是", "在", "有", "了"], answer: "是",
        fullSentence: "我们是学生。", pinyin: "wǒmen shì xuésheng",
        translation: "We are students.", translationAr: "نحن طلاب.",
        explanation: "是 links the two nouns.", explanationAr: "是 تربط الاسمين.",
      },
    ],
  },

  // ── Topic 3: 不 / 没 — negation ─────────────────────────────────────────
  {
    id: "negation-bu-mei",
    level: "beginner",
    title: "不 / 没 — Negation",
    titleAr: "不 / 没 — النفي",
    blurb: "不 negates the present/habitual/future; 没 negates the past / 'didn't'.",
    blurbAr: "不 تنفي الحاضر/المعتاد/المستقبل؛ 没 تنفي الماضي / \"لم\".",
    cards: [
      { type: "rule", text: "不 = not (now/usually/will). 没 = did not / have not (past).",
        textAr: "不 = لا (الآن/عادةً/سوف). 没 = لم / لمّا (الماضي)." },
      { type: "pattern", text: "Subject + 不/没 + Verb", textAr: "الفاعل + 不/没 + الفعل",
        hanzi: "我 + 不 + 吃 / 我 + 没 + 吃", pinyin: "wǒ bù chī / wǒ méi chī" },
      { type: "example", text: "I don't eat meat.", textAr: "لا آكل اللحم.",
        hanzi: "我不吃肉。", pinyin: "wǒ bù chī ròu", translation: "I don't eat meat.", highlight: "不" },
      { type: "example", text: "I didn't eat.", textAr: "لم آكل.",
        hanzi: "我没吃饭。", pinyin: "wǒ méi chī fàn", translation: "I didn't eat.", highlight: "没" },
    ],
    questions: [
      {
        id: "neg-mcq-1", type: "mcq_blank",
        prompt: "我 ___ 喜欢咖啡。(I don't like coffee — in general)", promptAr: "اختر الكلمة الصحيحة.",
        options: ["不", "没", "了", "是"], answer: "不",
        fullSentence: "我不喜欢咖啡。", pinyin: "wǒ bù xǐhuān kāfēi",
        translation: "I don't like coffee.", translationAr: "لا أحب القهوة.",
        explanation: "不 negates a general/habitual state.", explanationAr: "不 تنفي حالة عامة/معتادة.",
      },
      {
        id: "neg-mcq-2", type: "mcq_blank",
        prompt: "他昨天 ___ 来。(He didn't come yesterday)", promptAr: "اختر الكلمة الصحيحة.",
        options: ["没", "不", "了", "很"], answer: "没",
        fullSentence: "他昨天没来。", pinyin: "tā zuótiān méi lái",
        translation: "He didn't come yesterday.", translationAr: "لم يأتِ أمس.",
        explanation: "没 negates a past action.", explanationAr: "没 تنفي فعلاً ماضيًا.",
      },
      {
        id: "neg-tap-1", type: "tap_correct",
        prompt: "Tap the negation word.", promptAr: "اضغط على أداة النفي.",
        options: ["我", "不", "喝", "茶"], answer: "不",
        fullSentence: "我不喝茶。", pinyin: "wǒ bù hē chá",
        translation: "I don't drink tea.", translationAr: "لا أشرب الشاي.",
        explanation: "不 negates the verb 喝.", explanationAr: "不 تنفي الفعل 喝.",
      },
      {
        id: "neg-re-1", type: "reorder",
        prompt: "Arrange: \"I didn't eat.\"", promptAr: "رتّب: \"لم آكل\".",
        options: ["吃", "我", "饭", "没"], answer: ["我", "没", "吃", "饭"],
        fullSentence: "我没吃饭。", pinyin: "wǒ méi chī fàn",
        translation: "I didn't eat.", translationAr: "لم آكل.",
        explanation: "没 goes before the verb 吃.", explanationAr: "没 تأتي قبل الفعل 吃.",
      },
      {
        id: "neg-wb-1", type: "word_bank",
        prompt: "我 ___ 喝咖啡。", promptAr: "اختر الكلمة الصحيحة من البنك (لا، بشكل عام).",
        options: ["不", "没", "的", "吗"], answer: "不",
        fullSentence: "我不喝咖啡。", pinyin: "wǒ bù hē kāfēi",
        translation: "I don't drink coffee.", translationAr: "لا أشرب القهوة.",
        explanation: "不 negates a habitual state.", explanationAr: "不 تنفي حالة معتادة.",
      },
      {
        id: "neg-mcq-3", type: "mcq_blank",
        prompt: "我今天 ___ 吃饭。(didn't)", promptAr: "اختر الكلمة الصحيحة (لم).",
        options: ["没", "不", "了", "在"], answer: "没",
        fullSentence: "我今天没吃饭。", pinyin: "wǒ jīntiān méi chī fàn",
        translation: "I didn't eat today.", translationAr: "لم آكل اليوم.",
        explanation: "没 negates a past action.", explanationAr: "没 تنفي فعلاً ماضيًا.",
      },
    ],
  },

  // ── Topic 4: 吗 (ma) — yes/no questions ─────────────────────────────────
  {
    id: "ma-questions",
    level: "beginner",
    title: "吗 — Yes/No questions",
    titleAr: "吗 — أسئلة نعم/لا",
    blurb: "Turn a statement into a yes/no question by adding 吗 at the end.",
    blurbAr: "حوّل الجملة الخبرية إلى سؤال نعم/لا بإضافة 吗 في النهاية.",
    cards: [
      { type: "rule", text: "Add 吗 to the end of a statement to make a yes/no question.",
        textAr: "أضف 吗 في نهاية الجملة لتكوين سؤال نعم/لا." },
      { type: "pattern", text: "Statement + 吗 ?", textAr: "جملة خبرية + 吗 ؟",
        hanzi: "你 是 学生 + 吗 ?", pinyin: "nǐ shì xuésheng + ma ?" },
      { type: "example", text: "Are you a student?", textAr: "هل أنت طالب؟",
        hanzi: "你是学生吗？", pinyin: "nǐ shì xuésheng ma", translation: "Are you a student?", highlight: "吗" },
    ],
    questions: [
      {
        id: "ma-mcq-1", type: "mcq_blank",
        prompt: "你喜欢中文 ___？", promptAr: "اختر الكلمة الصحيحة لتكوين سؤال.",
        options: ["吗", "了", "不", "是"], answer: "吗",
        fullSentence: "你喜欢中文吗？", pinyin: "nǐ xǐhuān zhōngwén ma",
        translation: "Do you like Chinese?", translationAr: "هل تحب اللغة الصينية؟",
        explanation: "吗 turns it into a yes/no question.", explanationAr: "吗 تحوّلها إلى سؤال نعم/لا.",
      },
      {
        id: "ma-tap-1", type: "tap_correct",
        prompt: "Tap the question particle.", promptAr: "اضغط على أداة الاستفهام.",
        options: ["他", "是", "老师", "吗"], answer: "吗",
        fullSentence: "他是老师吗？", pinyin: "tā shì lǎoshī ma",
        translation: "Is he a teacher?", translationAr: "هل هو معلم؟",
        explanation: "吗 marks a yes/no question.", explanationAr: "吗 علامة سؤال نعم/لا.",
      },
      {
        id: "ma-re-1", type: "reorder",
        prompt: "Arrange: \"Are you a student?\"", promptAr: "رتّب: \"هل أنت طالب؟\".",
        options: ["吗", "你", "学生", "是"], answer: ["你", "是", "学生", "吗"],
        fullSentence: "你是学生吗？", pinyin: "nǐ shì xuésheng ma",
        translation: "Are you a student?", translationAr: "هل أنت طالب؟",
        explanation: "吗 always comes last.", explanationAr: "吗 تأتي دائمًا في النهاية.",
      },
      {
        id: "ma-wb-1", type: "word_bank",
        prompt: "他喝茶 ___？", promptAr: "اختر الكلمة الصحيحة من البنك.",
        options: ["吗", "了", "不", "在"], answer: "吗",
        fullSentence: "他喝茶吗？", pinyin: "tā hē chá ma",
        translation: "Does he drink tea?", translationAr: "هل يشرب الشاي؟",
        explanation: "吗 makes it a yes/no question.", explanationAr: "吗 تجعلها سؤال نعم/لا.",
      },
      {
        id: "ma-mcq-2", type: "mcq_blank",
        prompt: "这是你的书 ___？", promptAr: "اختر الكلمة الصحيحة لتكوين سؤال.",
        options: ["吗", "了", "不", "很"], answer: "吗",
        fullSentence: "这是你的书吗？", pinyin: "zhè shì nǐ de shū ma",
        translation: "Is this your book?", translationAr: "هل هذا كتابك؟",
        explanation: "吗 turns a statement into a question.", explanationAr: "吗 تحوّل الجملة إلى سؤال.",
      },
    ],
  },

  // ════════════════ INTERMEDIATE ════════════════

  // ── 在 — ongoing action (progressive) ──────────────────────────────────
  {
    id: "zai-progressive",
    level: "intermediate",
    title: "在 — Ongoing action",
    titleAr: "在 — الفعل المستمر",
    blurb: "Put 在 before the verb to show an action is happening right now.",
    blurbAr: "ضع 在 قبل الفعل للدلالة على فعل يحدث الآن.",
    cards: [
      { type: "rule", text: "Put 在 before the verb to mean the action is in progress.", textAr: "ضع 在 قبل الفعل ليعني أن الفعل جارٍ الآن." },
      { type: "pattern", text: "Subject + 在 + Verb + (Object)", textAr: "الفاعل + 在 + الفعل + (المفعول)", hanzi: "我 + 在 + 看 + 书", pinyin: "wǒ + zài + kàn + shū" },
      { type: "example", text: "I am reading a book.", textAr: "أنا أقرأ كتابًا.", hanzi: "我在看书。", pinyin: "wǒ zài kàn shū", translation: "I am reading a book.", highlight: "在" },
      { type: "example", text: "He is eating.", textAr: "هو يأكل الآن.", hanzi: "他在吃饭。", pinyin: "tā zài chī fàn", translation: "He is eating.", highlight: "在" },
    ],
    questions: [
      { id: "zai-mcq-1", type: "mcq_blank", prompt: "我 ___ 吃饭。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["在", "了", "的", "吗"], answer: "在", fullSentence: "我在吃饭。", pinyin: "wǒ zài chī fàn", translation: "I am eating.", translationAr: "أنا آكل الآن.", explanation: "在 before the verb = action in progress.", explanationAr: "在 قبل الفعل تعني أن الفعل جارٍ." },
      { id: "zai-mcq-2", type: "mcq_blank", prompt: "她 ___ 喝茶。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["在", "了", "的", "吗"], answer: "在", fullSentence: "她在喝茶。", pinyin: "tā zài hē chá", translation: "She is drinking tea.", translationAr: "هي تشرب الشاي الآن.", explanation: "在 marks the ongoing action.", explanationAr: "在 تدل على الفعل المستمر." },
      { id: "zai-wb-1", type: "word_bank", prompt: "他 ___ 看书。", promptAr: "اختر الكلمة الصحيحة من البنك.", options: ["在", "了", "的", "吗"], answer: "在", fullSentence: "他在看书。", pinyin: "tā zài kàn shū", translation: "He is reading.", translationAr: "هو يقرأ الآن.", explanation: "在 = is doing (now).", explanationAr: "在 تعني (يفعل الآن)." },
      { id: "zai-tap-1", type: "tap_correct", prompt: "Tap the word that shows the action is happening now.", promptAr: "اضغط على الكلمة التي تدل على أن الفعل يحدث الآن.", options: ["我", "在", "学", "中文"], answer: "在", fullSentence: "我在学中文。", pinyin: "wǒ zài xué zhōngwén", translation: "I am studying Chinese.", translationAr: "أنا أدرس الصينية الآن.", explanation: "在 marks the progressive.", explanationAr: "在 علامة الزمن المستمر." },
      { id: "zai-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"I am reading a book.\"", promptAr: "رتّب: \"أنا أقرأ كتابًا\".", options: ["书", "我", "看", "在"], answer: ["我", "在", "看", "书"], fullSentence: "我在看书。", pinyin: "wǒ zài kàn shū", translation: "I am reading a book.", translationAr: "أنا أقرأ كتابًا.", explanation: "在 comes before the verb 看.", explanationAr: "在 تأتي قبل الفعل 看." },
    ],
  },

  // ── 比 — comparison ─────────────────────────────────────────────────────
  {
    id: "bi-comparison",
    level: "intermediate",
    title: "比 — Comparison",
    titleAr: "比 — المقارنة",
    blurb: "Compare with 比: A 比 B + adjective (don't use 很).",
    blurbAr: "قارن باستخدام 比: A 比 B + صفة (بدون 很).",
    cards: [
      { type: "rule", text: "A 比 B + adjective = \"A is more ... than B\". Drop 很.", textAr: "A 比 B + صفة = \"A أكثر ... من B\". احذف 很." },
      { type: "pattern", text: "A + 比 + B + Adjective", textAr: "A + 比 + B + صفة", hanzi: "他 + 比 + 我 + 高", pinyin: "tā + bǐ + wǒ + gāo" },
      { type: "example", text: "He is taller than me.", textAr: "هو أطول مني.", hanzi: "他比我高。", pinyin: "tā bǐ wǒ gāo", translation: "He is taller than me.", highlight: "比" },
      { type: "example", text: "Chinese is harder than English.", textAr: "الصينية أصعب من الإنجليزية.", hanzi: "中文比英文难。", pinyin: "zhōngwén bǐ yīngwén nán", translation: "Chinese is harder than English.", highlight: "比" },
    ],
    questions: [
      { id: "bi-mcq-1", type: "mcq_blank", prompt: "他 ___ 我高。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["比", "在", "是", "的"], answer: "比", fullSentence: "他比我高。", pinyin: "tā bǐ wǒ gāo", translation: "He is taller than me.", translationAr: "هو أطول مني.", explanation: "比 compares two things.", explanationAr: "比 تقارن بين شيئين." },
      { id: "bi-mcq-2", type: "mcq_blank", prompt: "今天 ___ 昨天冷。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["比", "很", "在", "了"], answer: "比", fullSentence: "今天比昨天冷。", pinyin: "jīntiān bǐ zuótiān lěng", translation: "Today is colder than yesterday.", translationAr: "اليوم أبرد من أمس.", explanation: "Use 比, not 很, for comparison.", explanationAr: "استخدم 比 وليس 很 للمقارنة." },
      { id: "bi-wb-1", type: "word_bank", prompt: "中文 ___ 英文难。", promptAr: "اختر الكلمة الصحيحة من البنك.", options: ["比", "在", "的", "吗"], answer: "比", fullSentence: "中文比英文难。", pinyin: "zhōngwén bǐ yīngwén nán", translation: "Chinese is harder than English.", translationAr: "الصينية أصعب من الإنجليزية.", explanation: "比 links the two compared nouns.", explanationAr: "比 تربط الاسمين المُقارَنين." },
      { id: "bi-tap-1", type: "tap_correct", prompt: "Tap the comparison word.", promptAr: "اضغط على أداة المقارنة.", options: ["他", "比", "我", "高"], answer: "比", fullSentence: "他比我高。", pinyin: "tā bǐ wǒ gāo", translation: "He is taller than me.", translationAr: "هو أطول مني.", explanation: "比 = than (comparison).", explanationAr: "比 تعني (من) في المقارنة." },
      { id: "bi-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"He is taller than me.\"", promptAr: "رتّب: \"هو أطول مني\".", options: ["高", "他", "我", "比"], answer: ["他", "比", "我", "高"], fullSentence: "他比我高。", pinyin: "tā bǐ wǒ gāo", translation: "He is taller than me.", translationAr: "هو أطول مني.", explanation: "Order: A 比 B adjective.", explanationAr: "الترتيب: A 比 B صفة." },
    ],
  },

  // ── 想 / 要 / 会 — modal verbs ───────────────────────────────────────────
  {
    id: "modal-verbs",
    level: "intermediate",
    title: "想 / 要 / 会 — Modal verbs",
    titleAr: "想 / 要 / 会 — أفعال الرغبة والقدرة",
    blurb: "Before a verb: 想 = want to, 要 = will/want, 会 = can (a learned skill).",
    blurbAr: "قبل الفعل: 想 = يريد أن، 要 = سوف/يريد، 会 = يستطيع (مهارة مكتسبة).",
    cards: [
      { type: "rule", text: "Put 想 / 要 / 会 before the verb. 会 = can (a learned ability).", textAr: "ضع 想 / 要 / 会 قبل الفعل. 会 = يستطيع (مهارة مكتسبة)." },
      { type: "pattern", text: "Subject + 想/要/会 + Verb", textAr: "الفاعل + 想/要/会 + الفعل", hanzi: "我 + 想 + 喝茶", pinyin: "wǒ + xiǎng + hē chá" },
      { type: "example", text: "I want to drink tea.", textAr: "أريد أن أشرب الشاي.", hanzi: "我想喝茶。", pinyin: "wǒ xiǎng hē chá", translation: "I want to drink tea.", highlight: "想" },
      { type: "example", text: "I can speak Chinese.", textAr: "أستطيع التحدث بالصينية.", hanzi: "我会说中文。", pinyin: "wǒ huì shuō zhōngwén", translation: "I can speak Chinese.", highlight: "会" },
    ],
    questions: [
      { id: "modal-mcq-1", type: "mcq_blank", prompt: "我 ___ 学中文。(want to)", promptAr: "اختر الكلمة الصحيحة (يريد أن).", options: ["想", "了", "的", "吗"], answer: "想", fullSentence: "我想学中文。", pinyin: "wǒ xiǎng xué zhōngwén", translation: "I want to learn Chinese.", translationAr: "أريد أن أتعلم الصينية.", explanation: "想 + verb = want to do.", explanationAr: "想 + فعل = يريد أن يفعل." },
      { id: "modal-mcq-2", type: "mcq_blank", prompt: "他 ___ 说英文。(can)", promptAr: "اختر الكلمة الصحيحة (يستطيع).", options: ["会", "想", "要", "是"], answer: "会", fullSentence: "他会说英文。", pinyin: "tā huì shuō yīngwén", translation: "He can speak English.", translationAr: "يستطيع التحدث بالإنجليزية.", explanation: "会 = can (a learned skill).", explanationAr: "会 = يستطيع (مهارة مكتسبة)." },
      { id: "modal-wb-1", type: "word_bank", prompt: "我 ___ 喝咖啡。(want to)", promptAr: "اختر الكلمة الصحيحة من البنك (يريد).", options: ["想", "比", "的", "吗"], answer: "想", fullSentence: "我想喝咖啡。", pinyin: "wǒ xiǎng hē kāfēi", translation: "I want to drink coffee.", translationAr: "أريد أن أشرب القهوة.", explanation: "想 expresses a wish.", explanationAr: "想 تعبّر عن رغبة." },
      { id: "modal-tap-1", type: "tap_correct", prompt: "Tap the modal that means \"want to\".", promptAr: "اضغط على الكلمة التي تعني \"يريد أن\".", options: ["我", "想", "吃", "饭"], answer: "想", fullSentence: "我想吃饭。", pinyin: "wǒ xiǎng chī fàn", translation: "I want to eat.", translationAr: "أريد أن آكل.", explanation: "想 = want to.", explanationAr: "想 = يريد أن." },
      { id: "modal-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"I can speak Chinese.\"", promptAr: "رتّب: \"أستطيع التحدث بالصينية\".", options: ["说", "我", "中文", "会"], answer: ["我", "会", "说", "中文"], fullSentence: "我会说中文。", pinyin: "wǒ huì shuō zhōngwén", translation: "I can speak Chinese.", translationAr: "أستطيع التحدث بالصينية.", explanation: "会 goes before the verb 说.", explanationAr: "会 تأتي قبل الفعل 说." },
    ],
  },

  // ════════════════ ADVANCED ════════════════

  // ── 把 — the 把 construction ─────────────────────────────────────────────
  {
    id: "ba-construction",
    level: "advanced",
    title: "把 — The 把 construction",
    titleAr: "把 — تركيب 把",
    blurb: "把 moves the object before the verb to stress what happens to it.",
    blurbAr: "把 تنقل المفعول قبل الفعل للتأكيد على ما يحدث له.",
    cards: [
      { type: "rule", text: "把 puts the object before the verb: Subject + 把 + Object + Verb + result.", textAr: "把 تضع المفعول قبل الفعل: الفاعل + 把 + المفعول + الفعل + النتيجة." },
      { type: "pattern", text: "Subject + 把 + Object + Verb + 了", textAr: "الفاعل + 把 + المفعول + الفعل + 了", hanzi: "我 + 把 + 饭 + 吃 + 了", pinyin: "wǒ + bǎ + fàn + chī + le" },
      { type: "example", text: "I ate (up) the meal.", textAr: "أكلتُ الطعام (كله).", hanzi: "我把饭吃了。", pinyin: "wǒ bǎ fàn chī le", translation: "I ate the meal.", highlight: "把" },
      { type: "example", text: "He closed the door.", textAr: "أغلق الباب.", hanzi: "他把门关了。", pinyin: "tā bǎ mén guān le", translation: "He closed the door.", highlight: "把" },
    ],
    questions: [
      { id: "ba-mcq-1", type: "mcq_blank", prompt: "我 ___ 饭吃了。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["把", "在", "比", "的"], answer: "把", fullSentence: "我把饭吃了。", pinyin: "wǒ bǎ fàn chī le", translation: "I ate the meal.", translationAr: "أكلتُ الطعام.", explanation: "把 puts the object before the verb.", explanationAr: "把 تضع المفعول قبل الفعل." },
      { id: "ba-mcq-2", type: "mcq_blank", prompt: "她 ___ 茶喝了。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["把", "比", "在", "的"], answer: "把", fullSentence: "她把茶喝了。", pinyin: "tā bǎ chá hē le", translation: "She drank the tea.", translationAr: "شربت الشاي.", explanation: "把 + object + verb stresses the result.", explanationAr: "把 + مفعول + فعل تؤكّد على النتيجة." },
      { id: "ba-tap-1", type: "tap_correct", prompt: "Tap the 把-construction marker.", promptAr: "اضغط على علامة تركيب 把.", options: ["他", "把", "门", "关", "了"], answer: "把", fullSentence: "他把门关了。", pinyin: "tā bǎ mén guān le", translation: "He closed the door.", translationAr: "أغلق الباب.", explanation: "把 introduces the handled object.", explanationAr: "把 تُدخِل المفعول الذي جرى التعامل معه." },
      { id: "ba-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"I ate the meal.\" (把)", promptAr: "رتّب: \"أكلتُ الطعام\" (把).", options: ["吃", "我", "把", "饭", "了"], answer: ["我", "把", "饭", "吃", "了"], fullSentence: "我把饭吃了。", pinyin: "wǒ bǎ fàn chī le", translation: "I ate the meal.", translationAr: "أكلتُ الطعام.", explanation: "把 + object comes before the verb.", explanationAr: "把 + المفعول يأتيان قبل الفعل." },
      { id: "ba-wb-1", type: "word_bank", prompt: "我 ___ 书看完了。", promptAr: "اختر الكلمة الصحيحة من البنك.", options: ["把", "在", "比", "的"], answer: "把", fullSentence: "我把书看完了。", pinyin: "wǒ bǎ shū kàn wán le", translation: "I finished reading the book.", translationAr: "أنهيتُ قراءة الكتاب.", explanation: "把 + 书 + verb + 完了 = finished it.", explanationAr: "把 + 书 + فعل + 完了 = أنهاه." },
    ],
  },

  // ── 被 — passive voice ───────────────────────────────────────────────────
  {
    id: "bei-passive",
    level: "advanced",
    title: "被 — Passive voice",
    titleAr: "被 — المبني للمجهول",
    blurb: "被 marks the passive: the subject receives the action.",
    blurbAr: "被 تدل على المبني للمجهول: الفاعل يتلقى الفعل.",
    cards: [
      { type: "rule", text: "Use 被 for passive: Object + 被 + (doer) + Verb.", textAr: "استخدم 被 للمبني للمجهول: المفعول + 被 + (الفاعل) + الفعل." },
      { type: "pattern", text: "Object + 被 + Doer + Verb + 了", textAr: "المفعول + 被 + الفاعل + الفعل + 了", hanzi: "饭 + 被 + 他 + 吃 + 了", pinyin: "fàn + bèi + tā + chī + le" },
      { type: "example", text: "The meal was eaten by him.", textAr: "أُكِل الطعام من قِبَله.", hanzi: "饭被他吃了。", pinyin: "fàn bèi tā chī le", translation: "The meal was eaten by him.", highlight: "被" },
      { type: "example", text: "The tea was drunk by him.", textAr: "شُرِب الشاي من قِبَله.", hanzi: "茶被他喝了。", pinyin: "chá bèi tā hē le", translation: "The tea was drunk by him.", highlight: "被" },
    ],
    questions: [
      { id: "bei-mcq-1", type: "mcq_blank", prompt: "饭 ___ 他吃了。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["被", "比", "在", "的"], answer: "被", fullSentence: "饭被他吃了。", pinyin: "fàn bèi tā chī le", translation: "The meal was eaten by him.", translationAr: "أُكِل الطعام من قِبَله.", explanation: "被 marks the passive (received action).", explanationAr: "被 تدل على المبني للمجهول." },
      { id: "bei-mcq-2", type: "mcq_blank", prompt: "书 ___ 她看了。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["被", "要", "会", "的"], answer: "被", fullSentence: "书被她看了。", pinyin: "shū bèi tā kàn le", translation: "The book was read by her.", translationAr: "قُرِئ الكتاب من قِبَلها.", explanation: "被 = by (passive).", explanationAr: "被 تعني (من قِبَل) في المبني للمجهول." },
      { id: "bei-tap-1", type: "tap_correct", prompt: "Tap the passive marker.", promptAr: "اضغط على علامة المبني للمجهول.", options: ["茶", "被", "他", "喝", "了"], answer: "被", fullSentence: "茶被他喝了。", pinyin: "chá bèi tā hē le", translation: "The tea was drunk by him.", translationAr: "شُرِب الشاي من قِبَله.", explanation: "被 introduces the doer.", explanationAr: "被 تُدخِل الفاعل." },
      { id: "bei-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"The meal was eaten by him.\"", promptAr: "رتّب: \"أُكِل الطعام من قِبَله\".", options: ["他", "饭", "被", "吃", "了"], answer: ["饭", "被", "他", "吃", "了"], fullSentence: "饭被他吃了。", pinyin: "fàn bèi tā chī le", translation: "The meal was eaten by him.", translationAr: "أُكِل الطعام من قِبَله.", explanation: "Order: Object 被 Doer Verb 了.", explanationAr: "الترتيب: المفعول 被 الفاعل الفعل 了." },
      { id: "bei-wb-1", type: "word_bank", prompt: "咖啡 ___ 我喝了。", promptAr: "اختر الكلمة الصحيحة من البنك.", options: ["被", "比", "在", "的"], answer: "被", fullSentence: "咖啡被我喝了。", pinyin: "kāfēi bèi wǒ hē le", translation: "The coffee was drunk by me.", translationAr: "شُرِبت القهوة من قِبَلي.", explanation: "被 makes the sentence passive.", explanationAr: "被 تجعل الجملة مبنية للمجهول." },
    ],
  },

  // ── 过 — experiential aspect ─────────────────────────────────────────────
  {
    id: "guo-experiential",
    level: "advanced",
    title: "过 — Experiential aspect",
    titleAr: "过 — صيغة الخبرة",
    blurb: "Put 过 after a verb to say you have done/experienced it before.",
    blurbAr: "ضع 过 بعد الفعل للقول إنك فعلت/جرّبت ذلك من قبل.",
    cards: [
      { type: "rule", text: "Verb + 过 = have done it before (experience).", textAr: "فعل + 过 = فعلتَه من قبل (خبرة)." },
      { type: "pattern", text: "Subject + Verb + 过 + (Object)", textAr: "الفاعل + الفعل + 过 + (المفعول)", hanzi: "我 + 去 + 过 + 中国", pinyin: "wǒ + qù + guo + zhōngguó" },
      { type: "example", text: "I have been to China.", textAr: "لقد زُرتُ الصين من قبل.", hanzi: "我去过中国。", pinyin: "wǒ qù guo zhōngguó", translation: "I have been to China.", highlight: "过" },
      { type: "example", text: "He has eaten Chinese food.", textAr: "لقد أكل طعامًا صينيًا من قبل.", hanzi: "他吃过中国菜。", pinyin: "tā chī guo zhōngguó cài", translation: "He has eaten Chinese food.", highlight: "过" },
    ],
    questions: [
      { id: "guo-mcq-1", type: "mcq_blank", prompt: "我去 ___ 中国。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["过", "在", "把", "被"], answer: "过", fullSentence: "我去过中国。", pinyin: "wǒ qù guo zhōngguó", translation: "I have been to China.", translationAr: "لقد زُرتُ الصين.", explanation: "过 = have experienced (been there).", explanationAr: "过 = جرّبتَ (ذهبتَ من قبل)." },
      { id: "guo-mcq-2", type: "mcq_blank", prompt: "他吃 ___ 中国菜。", promptAr: "اختر الكلمة الصحيحة لملء الفراغ.", options: ["过", "把", "被", "比"], answer: "过", fullSentence: "他吃过中国菜。", pinyin: "tā chī guo zhōngguó cài", translation: "He has eaten Chinese food.", translationAr: "لقد أكل طعامًا صينيًا.", explanation: "过 marks past experience.", explanationAr: "过 تدل على خبرة سابقة." },
      { id: "guo-tap-1", type: "tap_correct", prompt: "Tap the experiential marker (have done).", promptAr: "اضغط على علامة الخبرة (فعلتَ من قبل).", options: ["我", "去", "过", "中国"], answer: "过", fullSentence: "我去过中国。", pinyin: "wǒ qù guo zhōngguó", translation: "I have been to China.", translationAr: "لقد زُرتُ الصين.", explanation: "过 follows the verb 去.", explanationAr: "过 تتبع الفعل 去." },
      { id: "guo-re-1", type: "reorder", prompt: "Arrange into a correct sentence: \"I have been to China.\"", promptAr: "رتّب: \"لقد زُرتُ الصين\".", options: ["中国", "我", "去", "过"], answer: ["我", "去", "过", "中国"], fullSentence: "我去过中国。", pinyin: "wǒ qù guo zhōngguó", translation: "I have been to China.", translationAr: "لقد زُرتُ الصين.", explanation: "过 comes right after the verb.", explanationAr: "过 تأتي مباشرةً بعد الفعل." },
      { id: "guo-wb-1", type: "word_bank", prompt: "你吃 ___ 中国菜吗？", promptAr: "اختر الكلمة الصحيحة من البنك.", options: ["过", "把", "被", "比"], answer: "过", fullSentence: "你吃过中国菜吗？", pinyin: "nǐ chī guo zhōngguó cài ma", translation: "Have you ever eaten Chinese food?", translationAr: "هل سبق أن أكلت طعامًا صينيًا؟", explanation: "过 asks about past experience.", explanationAr: "过 تسأل عن خبرة سابقة." },
    ],
  },
];

export function topicsByLevel(level: GrammarLevel): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((t) => t.level === level);
}

export function getTopic(id: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((t) => t.id === id);
}

export function allQuestions(): GrammarQuestion[] {
  return GRAMMAR_TOPICS.flatMap((t) => t.questions);
}

// Per-character pinyin (tone marks) for every hanzi used above — generated once
// with pypinyin and baked in so the frontend can show pinyin offline (no backend).
const CHAR_PINYIN: Record<string, string> = {
  "一": "yī", "不": "bù", "中": "zhōng", "书": "shū", "买": "mǎi", "了": "le", "今": "jīn",
  "他": "tā", "们": "men", "会": "huì", "你": "nǐ", "关": "guān", "写": "xiě", "冷": "lěng",
  "医": "yī", "去": "qù", "吃": "chī", "吗": "ma", "听": "tīng", "咖": "kā", "啡": "fēi",
  "喜": "xǐ", "喝": "hē", "国": "guó", "在": "zài", "天": "tiān", "她": "tā", "学": "xué",
  "完": "wán", "师": "shī", "影": "yǐng", "很": "hěn", "想": "xiǎng", "我": "wǒ", "把": "bǎ",
  "文": "wén", "昨": "zuó", "是": "shì", "有": "yǒu", "本": "běn", "来": "lái", "杯": "bēi",
  "欢": "huān", "比": "bǐ", "没": "méi", "生": "shēng", "电": "diàn", "的": "de", "看": "kàn",
  "着": "zhe", "老": "lǎo", "肉": "ròu", "英": "yīng", "茶": "chá", "菜": "cài", "被": "bèi",
  "要": "yào", "说": "shuō", "过": "guo", "这": "zhè", "那": "nà", "部": "bù", "门": "mén",
  "难": "nán", "饭": "fàn", "高": "gāo",
};

/** Space-joined pinyin for a token (which may be one or several characters). */
export function tokenPinyin(token: string): string {
  return [...token].map((c) => CHAR_PINYIN[c] ?? "").join(" ").trim();
}
