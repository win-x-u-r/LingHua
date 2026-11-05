// Foundation 1, Unit 1: First Spark 初识中文
//
// Words are from the official YCT 1 list (curriculum/yct1-words.csv in the
// project files), except 名字, which is a bonus. Arabic sound guides and
// scripts still need a native teacher's review before release.
import type { Unit, SceneLine, T } from "./types";

const HUA: T = { en: "Hua", ar: "هُوا" };
const TEACHER: T = { en: "Teacher", ar: "المعلّم" };
const LAYLA: T = { en: "Layla", ar: "ليلى" };
const DAMING: T = { en: "Daming", ar: "دا مينغ" };
const PASSER: T = { en: "Passer-by", ar: "أحد المارّة" };

const line = (who: SceneLine["who"], name: T, zh: string, pinyin: string, en: string, ar: string): SceneLine => ({
  who,
  name,
  zh,
  pinyin,
  meaning: { en, ar },
});

export const UNIT1: Unit = {
  key: "f1.u1",
  number: 1,
  title: { en: "First Spark", ar: "الشرارة الأولى" },
  zh: "初识中文",
  outcome: {
    en: "Greet someone, say your name, ask theirs and hear that tones change meaning.",
    ar: "ألقِ التحية، وقل اسمك، واسأل عن اسم غيرك، واسمع كيف تغيّر النغمات المعنى.",
  },
  canDo: [
    { en: "I can greet a friend, a teacher or a group, and say goodbye.", ar: "أستطيع أن أحيّي صديقًا أو معلّمًا، وأن أودّعه." },
    { en: "I can say my name and say I'm happy to meet someone.", ar: "أستطيع أن أقول اسمي، وأن أقول إنني سعيد بالتعرّف على أحد." },
    { en: "I can ask someone's name and understand the answer.", ar: "أستطيع أن أسأل عن اسم أحد وأفهم جوابه." },
    { en: "I can hear the tone of a single syllable most of the time.", ar: "أستطيع أن أميّز نغمة المقطع الواحد في أغلب الأحيان." },
    { en: "I can say 你好 the way Chinese speakers do (ní hǎo).", ar: "أستطيع أن أقول 你好 كما يقولها الصينيون (ní hǎo)." },
  ],
  lessons: [
    // ─────────────────────────────────────────────────────────────
    {
      key: "f1.u1.l1",
      title: { en: "Meet Mandarin", ar: "تعرّف على الصينية" },
      zh: "认识中文",
      goal: { en: "Hear that tones change meaning, and pick the tone of a syllable.", ar: "اسمع كيف تغيّر النغمات المعنى، وميّز نغمة المقطع." },
      minutes: 12,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "On a street in Beijing", ar: "في أحد شوارع بكين" },
              lines: [
                line("a", PASSER, "你好！", "Nǐ hǎo!", "Hello!", "مرحباً!"),
                line("b", LAYLA, "你好！", "Nǐ hǎo!", "Hello!", "مرحباً!"),
                line("hua", HUA, "你好！我叫话。", "Nǐ hǎo! Wǒ jiào Huà.", "Hello! My name is Hua.", "مرحباً! اسمي هُوا."),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "note",
              title: { en: "Every syllable has a tone", ar: "لكل مقطع نغمة" },
              body: {
                en: "In Arabic, your voice can rise to ask a question, but the word stays the same. In Mandarin, the tone is part of the word. Change the tone and you say a different word.",
                ar: "في العربية قد يرتفع صوتك عند السؤال، لكن الكلمة تبقى نفسها. أما في الصينية فالنغمة جزء من الكلمة، وإذا غيّرتها قلت كلمة أخرى.",
              },
            },
            { kind: "tones" },
            {
              kind: "note",
              title: { en: "Three ways to see a word", ar: "ثلاث طرق لرؤية الكلمة" },
              body: {
                en: "Characters are how Mandarin is written. Pinyin spells the sound in Latin letters, with a mark for the tone. The Arabic sound guide is a helper: listen first, then use it if you need it.",
                ar: "الحروف الصينية هي طريقة كتابة الصينية. والبينيين يكتب الصوت بحروف لاتينية مع علامة للنغمة. أما دليل النطق بالعربية فهو مساعد: استمع أولًا، ثم استعن به إن احتجت.",
              },
              examples: [{ zh: "你好", pinyin: "nǐ hǎo", meaning: { en: "Hello · ني هاو", ar: "مرحباً · ني هاو" } }],
            },
          ],
        },
        {
          id: "speak",
          activities: [
            {
              kind: "say",
              zh: "妈妈",
              pinyin: "māma",
              prompt: { en: "Say māma (mum). Keep the first syllable high and flat.", ar: "قل māma (ماما). اجعل المقطع الأول عاليًا ومستويًا." },
              tip: { en: "The second ma is short and light. It has no tone of its own.", ar: "المقطع الثاني قصير وخفيف، وليس له نغمة خاصة." },
            },
          ],
        },
        {
          id: "use",
          activities: [
            {
              kind: "tonePick",
              items: [
                { zh: "妈", pinyin: "mā", tone: 1 },
                { zh: "麻", pinyin: "má", tone: 2 },
                { zh: "马", pinyin: "mǎ", tone: 3 },
                { zh: "骂", pinyin: "mà", tone: 4 },
                { zh: "高", pinyin: "gāo", tone: 1 },
                { zh: "什", pinyin: "shén", tone: 2 },
                { zh: "好", pinyin: "hǎo", tone: 3 },
                { zh: "叫", pinyin: "jiào", tone: 4 },
              ],
            },
          ],
        },
        {
          id: "remember",
          activities: [
            {
              kind: "tonePick",
              items: [
                { zh: "骂", pinyin: "mà", tone: 4 },
                { zh: "妈", pinyin: "mā", tone: 1 },
                { zh: "我", pinyin: "wǒ", tone: 3 },
                { zh: "什", pinyin: "shén", tone: 2 },
              ],
            },
            {
              kind: "say",
              zh: "你好",
              pinyin: "nǐ hǎo",
              prompt: { en: "Now your first word. Say 你好!", ar: "والآن كلمتك الأولى. قل 你好!" },
              tip: { en: "Two third tones in a row: the first one rises. Say ní hǎo.", ar: "نغمتان ثالثتان متتاليتان: الأولى ترتفع. قل ní hǎo." },
            },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────
    {
      key: "f1.u1.l2",
      title: { en: "Say Hello!", ar: "ألقِ التحية!" },
      zh: "打个招呼",
      goal: { en: "Greet a friend and a teacher, say thank you and say goodbye.", ar: "حيِّ صديقًا ومعلّمًا، وقل شكرًا ومع السلامة." },
      minutes: 12,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "In the classroom", ar: "في الفصل" },
              lines: [
                line("b", LAYLA, "老师好！", "Lǎoshī hǎo!", "Hello, teacher!", "مرحباً يا أستاذ!"),
                line("teacher", TEACHER, "你好！", "Nǐ hǎo!", "Hello!", "مرحباً!"),
                line("a", DAMING, "你好！", "Nǐ hǎo!", "Hi!", "مرحباً!"),
                line("b", LAYLA, "谢谢老师！", "Xièxie lǎoshī!", "Thank you, teacher!", "شكراً يا أستاذ!"),
                line("teacher", TEACHER, "再见！", "Zàijiàn!", "Goodbye!", "مع السلامة!"),
                line("b", LAYLA, "老师再见！", "Lǎoshī zàijiàn!", "Goodbye, teacher!", "مع السلامة يا أستاذ!"),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "word",
              zh: "你好",
              pinyin: "nǐ hǎo",
              meaning: { en: "Hello", ar: "مرحباً" },
              sound: "ني هاو",
              note: {
                en: "你 is you and 好 is good. Two third tones in a row change: the first one rises, so you say ní hǎo.",
                ar: "你 تعني أنت و好 تعني جيد. وعندما تأتي نغمتان ثالثتان متتاليتان ترتفع الأولى، فتقول ní hǎo.",
              },
            },
            {
              kind: "note",
              title: { en: "Person + 好 = hello", ar: "شخص + 好 = تحية" },
              body: {
                en: "Put a person in front of 好 to greet them. There's no verb, a bit like أنتَ بخير in Arabic.",
                ar: "ضع الشخص قبل 好 لتحيّيه. لا يوجد فعل، تمامًا مثل جملة «أنتَ بخير» في العربية.",
              },
              examples: [
                { zh: "你好", pinyin: "nǐ hǎo", meaning: { en: "Hello (to one person)", ar: "مرحباً (لشخص واحد)" } },
                { zh: "老师好", pinyin: "lǎoshī hǎo", meaning: { en: "Hello, teacher", ar: "مرحباً يا أستاذ" } },
              ],
            },
            {
              kind: "word",
              zh: "老师",
              pinyin: "lǎoshī",
              meaning: { en: "Teacher", ar: "مُعلّم / مُعلّمة" },
              sound: "لاو شْ",
              note: {
                en: "For shī, say ش with the tip of your tongue curled up and back. The i is a buzz, not ي.",
                ar: "في shī قل ش مع رفع طرف اللسان إلى الخلف. والـ i هنا طنين خفيف، وليست ياءً.",
              },
            },
            {
              kind: "word",
              zh: "谢谢",
              pinyin: "xièxie",
              meaning: { en: "Thank you", ar: "شكراً" },
              sound: "شْيِه شْيِه",
              note: {
                en: "x is softer than ش: smile and keep your tongue flat behind your bottom teeth. The second xie is short and light.",
                ar: "صوت x أنعم من ش: ابتسم وأبقِ لسانك مسطّحًا خلف أسنانك السفلى. والمقطع الثاني قصير وخفيف.",
              },
            },
            {
              kind: "word",
              zh: "再见",
              pinyin: "zàijiàn",
              meaning: { en: "Goodbye", ar: "مع السلامة" },
              sound: "دْزاي جْيان",
              note: {
                en: "z isn't ز. It's a quick d and z together, like the end of \"kids\". Both syllables fall.",
                ar: "صوت z ليس زايًا، بل دال وزاي معًا بسرعة. وكلا المقطعين بنغمة هابطة.",
              },
            },
          ],
        },
        {
          id: "speak",
          activities: [
            { kind: "say", zh: "你好", pinyin: "nǐ hǎo", prompt: { en: "Say 你好.", ar: "قل 你好." }, tip: { en: "Remember: ní hǎo.", ar: "تذكّر: ní hǎo." } },
            { kind: "say", zh: "老师好", pinyin: "lǎoshī hǎo", prompt: { en: "Greet your teacher.", ar: "حيِّ معلّمك." } },
            { kind: "say", zh: "谢谢", pinyin: "xièxie", prompt: { en: "Say thank you.", ar: "قل شكراً." }, tip: { en: "Smile for the x.", ar: "ابتسم عند نطق x." } },
            { kind: "say", zh: "再见", pinyin: "zàijiàn", prompt: { en: "Say goodbye.", ar: "قل مع السلامة." }, tip: { en: "dz, not z.", ar: "دْز وليس ز." } },
          ],
        },
        {
          id: "use",
          activities: [
            {
              kind: "say",
              hua: { zh: "你好！", pinyin: "Nǐ hǎo!" },
              zh: "你好",
              pinyin: "nǐ hǎo",
              prompt: { en: "Hua says hello. Say hello back!", ar: "هُوا يُحيّيك. ردّ التحية!" },
            },
            {
              kind: "choice",
              prompt: { en: "Your teacher walks into the classroom. What do you say?", ar: "دخل معلّمك إلى الفصل. ماذا تقول؟" },
              options: [
                { label: { zh: "老师好！", pinyin: "Lǎoshī hǎo!" }, correct: true },
                { label: { zh: "再见！", pinyin: "Zàijiàn!" } },
                { label: { zh: "谢谢！", pinyin: "Xièxie!" } },
              ],
              why: { en: "Person + 好 is how you greet someone, so 老师好 greets your teacher.", ar: "شخص + 好 هي طريقة التحية، لذلك 老师好 تحيّة للمعلّم." },
            },
            {
              kind: "say",
              zh: "谢谢",
              pinyin: "xièxie",
              prompt: { en: "Hua hands you a little lantern. Say thank you.", ar: "هُوا يعطيك فانوسًا صغيرًا. قل شكراً." },
            },
            {
              kind: "say",
              hua: { zh: "再见！", pinyin: "Zàijiàn!" },
              zh: "再见",
              pinyin: "zàijiàn",
              prompt: { en: "Hua waves goodbye. Say goodbye back.", ar: "هُوا يلوّح مودّعًا. ودّعه أنت أيضًا." },
            },
          ],
        },
        {
          id: "remember",
          activities: [
            {
              kind: "match",
              pairs: [
                { zh: "你好", pinyin: "nǐ hǎo", meaning: { en: "Hello", ar: "مرحباً" } },
                { zh: "谢谢", pinyin: "xièxie", meaning: { en: "Thank you", ar: "شكراً" } },
                { zh: "再见", pinyin: "zàijiàn", meaning: { en: "Goodbye", ar: "مع السلامة" } },
                { zh: "老师", pinyin: "lǎoshī", meaning: { en: "Teacher", ar: "مُعلّم" } },
              ],
            },
            {
              kind: "tonePick",
              items: [
                { zh: "好", pinyin: "hǎo", tone: 3 },
                { zh: "见", pinyin: "jiàn", tone: 4 },
              ],
            },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────
    {
      key: "f1.u1.l3",
      title: { en: "What's Your Name?", ar: "ما اسمك؟" },
      zh: "你叫什么名字？",
      goal: { en: "Say your name, ask someone's name and say nice to meet you.", ar: "قل اسمك، واسأل عن اسم غيرك، وقل تشرّفنا." },
      minutes: 12,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "The first day of class", ar: "اليوم الأول في الفصل" },
              lines: [
                line("a", DAMING, "你好！我叫大明。你叫什么名字？", "Nǐ hǎo! Wǒ jiào Dàmíng. Nǐ jiào shénme míngzi?", "Hi! My name is Daming. What's your name?", "مرحباً! اسمي دا مينغ. ما اسمك؟"),
                line("b", LAYLA, "你好！我叫 Layla。", "Nǐ hǎo! Wǒ jiào Layla.", "Hi! My name is Layla.", "مرحباً! اسمي ليلى."),
                line("a", DAMING, "认识你很高兴！", "Rènshi nǐ hěn gāoxìng!", "Nice to meet you!", "تشرّفنا!"),
                line("b", LAYLA, "认识你很高兴！", "Rènshi nǐ hěn gāoxìng!", "Nice to meet you too!", "تشرّفنا!"),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "word",
              zh: "我",
              pinyin: "wǒ",
              meaning: { en: "I, me", ar: "أنا" },
              sound: "وُو",
              note: { en: "我 never changes, whoever you are.", ar: "我 لا تتغيّر أبدًا، أيًّا كنت." },
            },
            {
              kind: "word",
              zh: "叫",
              pinyin: "jiào",
              meaning: { en: "To be called", ar: "يُدعى" },
              sound: "جْياو",
              note: {
                en: "我叫 means \"I am called\". Arabic says اسمي (my name). Mandarin says I am called.",
                ar: "我叫 تعني «أُدعى». العربية تقول «اسمي»، أما الصينية فتقول «أُدعى».",
              },
            },
            {
              kind: "word",
              zh: "什么",
              pinyin: "shénme",
              meaning: { en: "What?", ar: "ماذا؟ ما؟" },
              sound: "شِنْ مَه",
              note: { en: "sh with a curled tongue, and a light, short me.", ar: "ش مع رفع طرف اللسان، و«مه» قصيرة وخفيفة." },
            },
            {
              kind: "word",
              zh: "名字",
              pinyin: "míngzi",
              meaning: { en: "Name", ar: "اسم" },
              sound: "مِينغ دْزِ",
              bonus: true,
              note: {
                en: "A bonus word. For -ng, say ن at the back of your mouth, and don't say the غ out loud.",
                ar: "كلمة إضافية. في -ng قل النون من آخر الفم، ولا تنطق الغين.",
              },
            },
            {
              kind: "note",
              title: { en: "The question word stays in place", ar: "أداة السؤال تبقى في مكانها" },
              body: {
                en: "In Arabic, ما comes first: ما اسمك؟ In Mandarin, 什么 sits exactly where the answer goes. Swap your name into its place and you have the answer.",
                ar: "في العربية تأتي «ما» أولًا: ما اسمك؟ أما في الصينية فتقع 什么 في مكان الجواب نفسه. ضع اسمك مكانها، فيصبح لديك الجواب.",
              },
              examples: [
                { zh: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", meaning: { en: "What's your name?", ar: "ما اسمك؟" } },
                { zh: "我叫大明。", pinyin: "Wǒ jiào Dàmíng.", meaning: { en: "My name is Daming.", ar: "اسمي دا مينغ." } },
              ],
            },
            {
              kind: "note",
              title: { en: "你 is for everyone", ar: "你 للجميع" },
              body: {
                en: "Arabic has أنتَ and أنتِ. Mandarin has just 你, for a man or a woman. No gender to remember here.",
                ar: "في العربية نقول أنتَ وأنتِ، أما الصينية فلها 你 فقط، للرجل والمرأة. لا داعي لتذكّر التذكير والتأنيث هنا.",
              },
            },
            {
              kind: "word",
              zh: "认识你很高兴",
              pinyin: "rènshi nǐ hěn gāoxìng",
              meaning: { en: "Nice to meet you", ar: "تشرّفنا" },
              sound: "رِنْ شْ ني هِن كاو شِينغ",
              note: {
                en: "Learn it as one phrase. 认识 is to meet or know, 很 links to 高兴, happy. The r is not rolled: curl your tongue back without touching anything.",
                ar: "احفظها عبارةً واحدة. 认识 تعني يتعرّف، و很 تربط بـ高兴 أي سعيد. والـ r هنا لا تُلفظ مثل الراء العربية: ارفع لسانك إلى الخلف دون أن يلمس شيئًا.",
              },
            },
            {
              kind: "note",
              title: { en: "Hua's name", ar: "اسم هُوا" },
              body: {
                en: "My name is 话 (huà). It means words, or speech. It's the 话 in 灵话, and I'm here to help you speak.",
                ar: "اسمي 话 (huà)، ومعناه الكلام. إنه 话 في 灵话، وأنا هنا لأساعدك على الكلام.",
              },
            },
          ],
        },
        {
          id: "speak",
          activities: [
            {
              kind: "say",
              zh: "我叫",
              pinyin: "wǒ jiào",
              nameSlot: true,
              prompt: { en: "Say 我叫 and then your name.", ar: "قل 我叫 ثم اسمك." },
              tip: { en: "我 stays low here. It doesn't rise before jiào.", ar: "تبقى 我 منخفضة هنا ولا ترتفع قبل jiào." },
            },
            {
              kind: "say",
              zh: "你叫什么名字",
              pinyin: "nǐ jiào shénme míngzi",
              prompt: { en: "Ask: what's your name?", ar: "اسأل: ما اسمك؟" },
            },
            {
              kind: "say",
              zh: "认识你很高兴",
              pinyin: "rènshi nǐ hěn gāoxìng",
              prompt: { en: "Say: nice to meet you!", ar: "قل: تشرّفنا!" },
              tip: { en: "很 stays low, then 高 jumps up high.", ar: "很 منخفضة، ثم ترتفع 高 عاليًا." },
            },
          ],
        },
        {
          id: "use",
          activities: [
            {
              kind: "say",
              hua: { zh: "你好！我叫话。你叫什么名字？", pinyin: "Nǐ hǎo! Wǒ jiào Huà. Nǐ jiào shénme míngzi?" },
              zh: "我叫",
              pinyin: "wǒ jiào",
              nameSlot: true,
              prompt: { en: "Your first conversation! Answer Hua.", ar: "أول محادثة لك! أجب هُوا." },
            },
            {
              kind: "say",
              zh: "你叫什么名字",
              pinyin: "nǐ jiào shénme míngzi",
              prompt: { en: "Now ask Hua his name.", ar: "والآن اسأل هُوا عن اسمه." },
            },
            {
              kind: "say",
              hua: { zh: "我叫话。认识你很高兴！", pinyin: "Wǒ jiào Huà. Rènshi nǐ hěn gāoxìng!" },
              zh: "认识你很高兴",
              pinyin: "rènshi nǐ hěn gāoxìng",
              prompt: { en: "Hua is happy to meet you. Say it back!", ar: "هُوا سعيد بالتعرّف عليك. قل له الشيء نفسه!" },
            },
          ],
        },
        {
          id: "remember",
          activities: [
            {
              kind: "order",
              prompt: { en: "Build the question: what's your name?", ar: "رتّب السؤال: ما اسمك؟" },
              tiles: ["你", "叫", "什么", "名字"],
              pinyin: "Nǐ jiào shénme míngzi?",
              meaning: { en: "What's your name?", ar: "ما اسمك؟" },
            },
            {
              kind: "choice",
              prompt: { en: "Listen. What is his name?", ar: "استمع. ما اسمه؟" },
              listen: { zh: "你好！我叫大明。", pinyin: "Nǐ hǎo! Wǒ jiào Dàmíng." },
              options: [
                { label: { en: "Daming", ar: "دا مينغ" }, correct: true },
                { label: { en: "Hua", ar: "هُوا" } },
                { label: { en: "Layla", ar: "ليلى" } },
              ],
              why: { en: "The name comes right after 我叫: 我叫大明.", ar: "الاسم يأتي بعد 我叫 مباشرة: 我叫大明." },
            },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────
    {
      key: "f1.u1.check",
      isCheck: true,
      title: { en: "First Spark check", ar: "اختبار الشرارة الأولى" },
      zh: "小测验",
      goal: { en: "Show Hua what you can do. Get about 4 in 5 right and finish the conversation.", ar: "أرِ هُوا ما تستطيع فعله. أجب عن نحو 4 من كل 5 إجابة صحيحة وأكمل المحادثة." },
      minutes: 5,
      steps: [
        {
          id: "listening",
          activities: [
            listenPick("你好！", "Nǐ hǎo!", 0),
            listenPick("再见！", "Zàijiàn!", 1),
            listenPick("谢谢！", "Xièxie!", 2),
            listenPick("老师好！", "Lǎoshī hǎo!", 3),
            listenPick("你叫什么名字？", "Nǐ jiào shénme míngzi?", 4),
          ],
        },
        {
          id: "tones",
          activities: [
            {
              kind: "tonePick",
              items: [
                { zh: "妈", pinyin: "mā", tone: 1 },
                { zh: "什", pinyin: "shén", tone: 2 },
                { zh: "我", pinyin: "wǒ", tone: 3 },
                { zh: "叫", pinyin: "jiào", tone: 4 },
              ],
            },
          ],
        },
        {
          id: "reading",
          activities: [
            {
              kind: "match",
              pairs: [
                { zh: "我", pinyin: "wǒ", meaning: { en: "I, me", ar: "أنا" } },
                { zh: "老师", pinyin: "lǎoshī", meaning: { en: "Teacher", ar: "مُعلّم" } },
                { zh: "什么", pinyin: "shénme", meaning: { en: "What?", ar: "ماذا؟" } },
                { zh: "谢谢", pinyin: "xièxie", meaning: { en: "Thank you", ar: "شكراً" } },
                { zh: "再见", pinyin: "zàijiàn", meaning: { en: "Goodbye", ar: "مع السلامة" } },
              ],
            },
          ],
        },
        {
          id: "speaking",
          activities: [
            { kind: "say", hua: { zh: "你好！", pinyin: "Nǐ hǎo!" }, zh: "你好", pinyin: "nǐ hǎo", prompt: { en: "Greet Hua.", ar: "حيِّ هُوا." } },
            { kind: "say", hua: { zh: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?" }, zh: "我叫", pinyin: "wǒ jiào", nameSlot: true, prompt: { en: "Tell Hua your name.", ar: "قل لهُوا اسمك." } },
            { kind: "say", zh: "你叫什么名字", pinyin: "nǐ jiào shénme míngzi", prompt: { en: "Ask Hua his name.", ar: "اسأل هُوا عن اسمه." } },
            { kind: "say", hua: { zh: "我叫话。再见！", pinyin: "Wǒ jiào Huà. Zàijiàn!" }, zh: "再见", pinyin: "zàijiàn", prompt: { en: "Say goodbye.", ar: "ودّع هُوا." } },
          ],
        },
        { id: "self", activities: [{ kind: "canDo" }] },
      ],
    },
  ],
};

/** A listening item for the check: hear a phrase, pick its meaning */
function listenPick(zh: string, pinyin: string, answer: number) {
  const meanings: T[] = [
    { en: "Hello", ar: "مرحباً" },
    { en: "Goodbye", ar: "مع السلامة" },
    { en: "Thank you", ar: "شكراً" },
    { en: "Hello, teacher", ar: "مرحباً يا أستاذ" },
    { en: "What's your name?", ar: "ما اسمك؟" },
  ];
  // Three choices: the answer and the next two, in a fixed but varied order
  const picks = [answer, (answer + 1) % 5, (answer + 3) % 5].sort((a, b) => ((a * 7) % 5) - ((b * 7) % 5));
  return {
    kind: "choice" as const,
    prompt: { en: "Listen. What does it mean?", ar: "استمع. ماذا تعني؟" },
    listen: { zh, pinyin },
    options: picks.map((i) => ({ label: meanings[i], correct: i === answer })),
    why: { en: `It was ${pinyin}, which means "${meanings[answer].en}".`, ar: `كانت ${pinyin}، ومعناها «${meanings[answer].ar}».` },
  };
}

/** Lowest share of first-try answers to pass each scored part of the check */
export const PASS_MARKS: Partial<Record<string, number>> = { listening: 0.8, tones: 0.75, reading: 0.8 };

export const lessonByKey = (key: string) => UNIT1.lessons.find((l) => l.key === key) ?? null;
