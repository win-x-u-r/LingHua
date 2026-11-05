// Mandarin on the Move 实用中文, Unit 1: Hello, China 你好，中国
//
// The same lesson cycle as Foundation 1 (Hear, Understand, Speak, Use,
// Remember), with scenes moved to the airport, a business meeting and a taxi
// to the hotel, and the polite 您好 added. Arabic sound guides and scripts
// still need a native teacher's review.
import type { Unit, SceneLine, T } from "../foundation1/types";

const OMAR: T = { en: "Omar", ar: "عمر" };
const OFFICER: T = { en: "Border officer", ar: "موظف الجوازات" };
const WANG: T = { en: "Mr Wang", ar: "السيد وانغ" };
const DRIVER: T = { en: "Taxi driver", ar: "سائق الأجرة" };

const line = (who: SceneLine["who"], name: T, zh: string, pinyin: string, en: string, ar: string): SceneLine => ({
  who,
  name,
  zh,
  pinyin,
  meaning: { en, ar },
});

export const MOVE_UNIT1: Unit = {
  key: "m1.u1",
  number: 1,
  title: { en: "Hello, China", ar: "أهلاً بك في الصين" },
  zh: "你好，中国",
  outcome: {
    en: "Greet people politely, meet a business partner and take a taxi to your hotel.",
    ar: "ألقِ التحية بأدب، وتعرّف على شريك عمل، واركب سيارة أجرة إلى فندقك.",
  },
  canDo: [
    { en: "I can greet someone politely with 您好 and say thank you and goodbye.", ar: "أستطيع أن أحيّي أحدًا بأدب بـ您好، وأن أقول شكراً ومع السلامة." },
    { en: "I can say my name and that I'm happy to meet a business partner.", ar: "أستطيع أن أقول اسمي، وأن أقول لشريك العمل إنني سعيد بالتعرّف عليه." },
    { en: "I can tell a taxi driver where I want to go.", ar: "أستطيع أن أخبر سائق الأجرة إلى أين أريد أن أذهب." },
    { en: "I can ask how much something costs.", ar: "أستطيع أن أسأل عن سعر شيء ما." },
  ],
  lessons: [
    // ─────────────────────────────────────────────────────────────
    {
      key: "m1.u1.l1",
      title: { en: "Arriving", ar: "الوصول" },
      zh: "到中国了",
      goal: { en: "Greet people politely with 您好, say thank you and say goodbye.", ar: "حيِّ الناس بأدب بـ您好، وقل شكراً ومع السلامة." },
      minutes: 8,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "At passport control in Beijing", ar: "عند مكتب الجوازات في بكين" },
              lines: [
                line("a", OFFICER, "您好！", "Nín hǎo!", "Hello!", "مرحباً!"),
                line("b", OMAR, "您好！", "Nín hǎo!", "Hello!", "مرحباً!"),
                line("a", OFFICER, "欢迎来中国！", "Huānyíng lái Zhōngguó!", "Welcome to China!", "أهلاً بك في الصين!"),
                line("b", OMAR, "谢谢！", "Xièxie!", "Thank you!", "شكراً!"),
                line("a", OFFICER, "再见！", "Zàijiàn!", "Goodbye!", "مع السلامة!"),
                line("b", OMAR, "再见！", "Zàijiàn!", "Goodbye!", "مع السلامة!"),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "word",
              zh: "您好",
              pinyin: "nín hǎo",
              meaning: { en: "Hello (polite)", ar: "مرحباً (بأدب)" },
              sound: "نِينْ هَاوْ",
              note: {
                en: "您 is the polite you. Use it with officials, clients, hotel staff and anyone older than you.",
                ar: "您 هي «أنتَ» المهذّبة، مثل «حضرتك». استخدمها مع الموظفين والعملاء وموظفي الفندق ومن هو أكبر منك سنًّا.",
              },
            },
            {
              kind: "note",
              title: { en: "你好 or 您好?", ar: "你好 أم 您好؟" },
              body: {
                en: "Arabic has أنتَ and حضرتك. Mandarin has 你 and 您. On a trip or at work, 您好 is the safe choice. Save 你好 for friends.",
                ar: "في العربية نقول «أنتَ» و«حضرتك»، وفي الصينية 你 و您. في السفر أو العمل، 您好 هي الخيار الآمن، واحتفظ بـ你好 للأصدقاء.",
              },
              examples: [
                { zh: "你好", pinyin: "nǐ hǎo", meaning: { en: "Hi (to a friend)", ar: "أهلاً (لصديق)" } },
                { zh: "您好", pinyin: "nín hǎo", meaning: { en: "Hello (polite)", ar: "مرحباً (بأدب)" } },
              ],
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
              sound: "دْزَايْ جِيَانْ",
              note: {
                en: "z isn't ز. It's a quick d and z together, like the end of \"kids\". Both syllables fall.",
                ar: "صوت z ليس زايًا، بل دال وزاي معًا بسرعة. وكلا المقطعين بنغمة هابطة.",
              },
            },
            {
              kind: "word",
              zh: "欢迎",
              pinyin: "huānyíng",
              meaning: { en: "Welcome", ar: "أهلاً وسهلاً" },
              sound: "خْوَانْ يِينْغ",
              bonus: true,
              note: {
                en: "You'll hear it everywhere: at the airport, in hotels and in shops. The h is close to خ, but softer.",
                ar: "ستسمعها في كل مكان: في المطار والفنادق والمحلات. وصوت h قريب من الخاء لكنه أخفّ.",
              },
            },
          ],
        },
        {
          id: "speak",
          activities: [
            { kind: "say", zh: "您好", pinyin: "nín hǎo", prompt: { en: "Say 您好.", ar: "قل 您好." }, tip: { en: "nín rises, then hǎo dips.", ar: "nín ترتفع، ثم تنخفض hǎo." } },
            { kind: "say", zh: "谢谢", pinyin: "xièxie", prompt: { en: "Say thank you.", ar: "قل شكراً." }, tip: { en: "Smile for the x.", ar: "ابتسم عند نطق x." } },
            { kind: "say", zh: "再见", pinyin: "zàijiàn", prompt: { en: "Say goodbye.", ar: "قل مع السلامة." }, tip: { en: "dz, not z.", ar: "دْز وليس ز." } },
          ],
        },
        {
          id: "use",
          activities: [
            {
              kind: "choice",
              prompt: { en: "You reach the passport desk. What do you say to the officer?", ar: "وصلت إلى مكتب الجوازات. ماذا تقول للموظف؟" },
              options: [
                { label: { zh: "您好！", pinyin: "Nín hǎo!" }, correct: true },
                { label: { zh: "再见！", pinyin: "Zàijiàn!" } },
                { label: { zh: "谢谢！", pinyin: "Xièxie!" } },
              ],
              why: { en: "您好 is the polite hello, right for an official.", ar: "您好 هي التحية المهذّبة، وهي المناسبة مع موظف رسمي." },
            },
            {
              kind: "say",
              hua: { zh: "欢迎来中国！", pinyin: "Huānyíng lái Zhōngguó!" },
              zh: "谢谢",
              pinyin: "xièxie",
              prompt: { en: "Hua welcomes you to China. Say thank you!", ar: "هُوا يرحّب بك في الصين. قل شكراً!" },
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
                { zh: "您好", pinyin: "nín hǎo", meaning: { en: "Hello (polite)", ar: "مرحباً (بأدب)" } },
                { zh: "谢谢", pinyin: "xièxie", meaning: { en: "Thank you", ar: "شكراً" } },
                { zh: "再见", pinyin: "zàijiàn", meaning: { en: "Goodbye", ar: "مع السلامة" } },
                { zh: "欢迎", pinyin: "huānyíng", meaning: { en: "Welcome", ar: "أهلاً وسهلاً" } },
              ],
            },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────
    {
      key: "m1.u1.l2",
      title: { en: "Meeting a Partner", ar: "لقاء شريك عمل" },
      zh: "认识新朋友",
      goal: { en: "Say your name, swap business cards and say nice to meet you.", ar: "قل اسمك، وتبادل بطاقات العمل، وقل تشرّفنا." },
      minutes: 10,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "A first meeting in Shanghai", ar: "أول لقاء في شنغهاي" },
              lines: [
                line("a", WANG, "您好！我姓王。", "Nín hǎo! Wǒ xìng Wáng.", "Hello! My surname is Wang.", "مرحباً! اسم عائلتي وانغ."),
                line("b", OMAR, "王先生，您好！我叫 Omar。", "Wáng xiānsheng, nín hǎo! Wǒ jiào Omar.", "Hello, Mr Wang! My name is Omar.", "مرحباً يا سيد وانغ! اسمي عمر."),
                line("b", OMAR, "这是我的名片。", "Zhè shì wǒ de míngpiàn.", "This is my business card.", "هذه بطاقة عملي."),
                line("a", WANG, "谢谢！认识您很高兴。", "Xièxie! Rènshi nín hěn gāoxìng.", "Thank you! Nice to meet you.", "شكراً! تشرّفنا."),
                line("b", OMAR, "认识您很高兴！", "Rènshi nín hěn gāoxìng!", "Nice to meet you too!", "تشرّفنا!"),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "word",
              zh: "我叫",
              pinyin: "wǒ jiào",
              meaning: { en: "My name is", ar: "اسمي" },
              sound: "وُو جِيَاوْ",
              note: {
                en: "我 is I and 叫 is to be called. Add your own name after it: 我叫 Omar.",
                ar: "我 تعني أنا و叫 تعني يُدعى. أضف اسمك بعدها: 我叫 Omar.",
              },
            },
            {
              kind: "word",
              zh: "先生",
              pinyin: "xiānsheng",
              meaning: { en: "Mr, sir", ar: "السيد" },
              sound: "شِيَانْ شَنْغ",
              note: {
                en: "The surname comes first, then the title: 王先生 is Mr Wang. For a woman, use 女士 (nǚshì).",
                ar: "اسم العائلة أولًا ثم اللقب: 王先生 تعني السيد وانغ. وللمرأة استخدم 女士 (nǚshì).",
              },
            },
            {
              kind: "word",
              zh: "名片",
              pinyin: "míngpiàn",
              meaning: { en: "Business card", ar: "بطاقة العمل" },
              sound: "مِينْغ بِيَانْ",
              note: {
                en: "p is a puff of air, a strong ب. You'll swap these at almost every first meeting.",
                ar: "صوت p باء قوية مع نفَس. ستتبادل هذه البطاقات في كل لقاء أول تقريبًا.",
              },
            },
            {
              kind: "note",
              title: { en: "Cards with both hands", ar: "البطاقة باليدين" },
              body: {
                en: "Give and take a business card with both hands, with the words facing the other person. Take a moment to read it before you put it away.",
                ar: "قدّم بطاقة العمل وتسلّمها باليدين، والكتابة باتجاه الشخص الآخر. وخذ لحظة لقراءتها قبل أن تضعها جانبًا.",
              },
            },
            {
              kind: "word",
              zh: "认识您很高兴",
              pinyin: "rènshi nín hěn gāoxìng",
              meaning: { en: "Nice to meet you (polite)", ar: "تشرّفنا (بأدب)" },
              sound: "رِنْ شْ نِينْ هِنْ كَاوْ شِينْغ",
              note: {
                en: "Learn it as one phrase. With a client or partner, use 您 instead of 你.",
                ar: "احفظها عبارةً واحدة. ومع العميل أو الشريك استخدم 您 بدلًا من 你.",
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
            },
            {
              kind: "say",
              zh: "认识您很高兴",
              pinyin: "rènshi nín hěn gāoxìng",
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
              hua: { zh: "您好！您叫什么名字？", pinyin: "Nín hǎo! Nín jiào shénme míngzi?" },
              zh: "我叫",
              pinyin: "wǒ jiào",
              nameSlot: true,
              prompt: { en: "Hua asks your name. Tell him!", ar: "هُوا يسألك عن اسمك. أخبره!" },
            },
            {
              kind: "choice",
              prompt: { en: "Mr Wang hands you his business card with both hands. What do you do?", ar: "السيد وانغ يقدّم لك بطاقته باليدين. ماذا تفعل؟" },
              options: [
                { label: { en: "Take it with both hands and read it", ar: "أتسلّمها باليدين وأقرؤها" }, correct: true },
                { label: { en: "Put it straight in my pocket", ar: "أضعها في جيبي مباشرة" } },
                { label: { en: "Take it with one hand while I check my phone", ar: "أتسلّمها بيد واحدة وأنا أنظر إلى هاتفي" } },
              ],
              why: { en: "Both hands and a quick read show respect for the person.", ar: "التسلّم باليدين وقراءة البطاقة يُظهران الاحترام للشخص." },
            },
            {
              kind: "order",
              prompt: { en: "Put the words in order: nice to meet you.", ar: "رتّب الكلمات: تشرّفنا." },
              tiles: ["认识", "您", "很", "高兴"],
              pinyin: "Rènshi nín hěn gāoxìng.",
              meaning: { en: "Nice to meet you.", ar: "تشرّفنا." },
            },
          ],
        },
        {
          id: "remember",
          activities: [
            {
              kind: "match",
              pairs: [
                { zh: "名片", pinyin: "míngpiàn", meaning: { en: "Business card", ar: "بطاقة العمل" } },
                { zh: "先生", pinyin: "xiānsheng", meaning: { en: "Mr, sir", ar: "السيد" } },
                { zh: "我叫", pinyin: "wǒ jiào", meaning: { en: "My name is", ar: "اسمي" } },
                { zh: "您好", pinyin: "nín hǎo", meaning: { en: "Hello (polite)", ar: "مرحباً (بأدب)" } },
              ],
            },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────────────────────
    {
      key: "m1.u1.l3",
      title: { en: "Getting Around", ar: "التنقّل" },
      zh: "坐出租车",
      goal: { en: "Tell a taxi driver where to go and ask how much it costs.", ar: "أخبر سائق الأجرة إلى أين تذهب، واسأل عن الأجرة." },
      minutes: 10,
      steps: [
        {
          id: "hear",
          activities: [
            {
              kind: "scene",
              title: { en: "In a taxi to the hotel", ar: "في سيارة أجرة إلى الفندق" },
              lines: [
                line("a", DRIVER, "您好！去哪儿？", "Nín hǎo! Qù nǎr?", "Hello! Where to?", "مرحباً! إلى أين؟"),
                line("b", OMAR, "我要去酒店。", "Wǒ yào qù jiǔdiàn.", "I want to go to the hotel.", "أريد أن أذهب إلى الفندق."),
                line("a", DRIVER, "好！", "Hǎo!", "OK!", "حسناً!"),
                line("b", OMAR, "多少钱？", "Duōshao qián?", "How much is it?", "كم الأجرة؟"),
                line("a", DRIVER, "五十块。", "Wǔshí kuài.", "Fifty yuan.", "خمسون يوانًا."),
                line("b", OMAR, "谢谢！再见！", "Xièxie! Zàijiàn!", "Thank you! Goodbye!", "شكراً! مع السلامة!"),
              ],
            },
          ],
        },
        {
          id: "understand",
          activities: [
            {
              kind: "word",
              zh: "我要去",
              pinyin: "wǒ yào qù",
              meaning: { en: "I want to go to", ar: "أريد أن أذهب إلى" },
              sound: "وُو يَاوْ تْشْيُو",
              note: {
                en: "Put the place straight after it, with no extra word for \"to\": 我要去酒店.",
                ar: "ضع المكان بعدها مباشرة، دون كلمة مثل «إلى»: 我要去酒店.",
              },
            },
            {
              kind: "word",
              zh: "酒店",
              pinyin: "jiǔdiàn",
              meaning: { en: "Hotel", ar: "فندق" },
              sound: "جِيُو دِيَانْ",
              note: {
                en: "Drivers know hotel names in Chinese. Keep your hotel's name and address in characters on your phone.",
                ar: "السائقون يعرفون أسماء الفنادق بالصينية. احتفظ باسم فندقك وعنوانه بالحروف الصينية على هاتفك.",
              },
            },
            {
              kind: "word",
              zh: "多少钱",
              pinyin: "duōshao qián",
              meaning: { en: "How much is it?", ar: "كم السعر؟" },
              sound: "دْوُو شَاوْ تْشِيَانْ",
              note: {
                en: "Works in taxis, shops and markets. q is like تش with a smile.",
                ar: "تصلح في سيارات الأجرة والمحلات والأسواق. وصوت q مثل «تش» مع ابتسامة.",
              },
            },
            {
              kind: "note",
              title: { en: "块 means yuan", ar: "块 تعني يوان" },
              body: {
                en: "Prices are written 元 (yuán), but people say 块 (kuài). 五十块 is fifty yuan.",
                ar: "تُكتب الأسعار 元 (yuán)، لكن الناس يقولون 块 (kuài). 五十块 تعني خمسين يوانًا.",
              },
              examples: [
                { zh: "十块", pinyin: "shí kuài", meaning: { en: "10 yuan", ar: "10 يوانات" } },
                { zh: "五十块", pinyin: "wǔshí kuài", meaning: { en: "50 yuan", ar: "50 يوانًا" } },
                { zh: "一百块", pinyin: "yìbǎi kuài", meaning: { en: "100 yuan", ar: "100 يوان" } },
              ],
            },
          ],
        },
        {
          id: "speak",
          activities: [
            { kind: "say", zh: "我要去酒店", pinyin: "wǒ yào qù jiǔdiàn", prompt: { en: "Tell the driver: I want to go to the hotel.", ar: "قل للسائق: أريد أن أذهب إلى الفندق." } },
            { kind: "say", zh: "多少钱", pinyin: "duōshao qián", prompt: { en: "Ask: how much is it?", ar: "اسأل: كم السعر؟" }, tip: { en: "duō is high and flat, qián rises.", ar: "duō عالية ومستوية، وqián صاعدة." } },
          ],
        },
        {
          id: "use",
          activities: [
            {
              kind: "choice",
              prompt: { en: "Listen to the driver. What is he asking?", ar: "استمع إلى السائق. ماذا يسأل؟" },
              listen: { zh: "去哪儿？", pinyin: "Qù nǎr?" },
              options: [
                { label: { en: "Where to?", ar: "إلى أين؟" }, correct: true },
                { label: { en: "How much is it?", ar: "كم السعر؟" } },
                { label: { en: "What's your name?", ar: "ما اسمك؟" } },
              ],
              why: { en: "去 is to go and 哪儿 is where. Answer with 我要去 and the place.", ar: "去 تعني يذهب و哪儿 تعني أين. أجب بـ我要去 ثم المكان." },
            },
            {
              kind: "say",
              hua: { zh: "您好！去哪儿？", pinyin: "Nín hǎo! Qù nǎr?" },
              zh: "我要去酒店",
              pinyin: "wǒ yào qù jiǔdiàn",
              prompt: { en: "Hua is your driver today. Tell him you're going to the hotel.", ar: "هُوا سائقك اليوم. أخبره أنك ذاهب إلى الفندق." },
            },
            {
              kind: "choice",
              prompt: { en: "Listen. How much is the fare?", ar: "استمع. كم الأجرة؟" },
              listen: { zh: "五十块。", pinyin: "Wǔshí kuài." },
              options: [
                { label: { en: "50 yuan", ar: "50 يوانًا" }, correct: true },
                { label: { en: "10 yuan", ar: "10 يوانات" } },
                { label: { en: "100 yuan", ar: "100 يوان" } },
              ],
              why: { en: "五十 is fifty: five tens. 块 is yuan.", ar: "五十 تعني خمسين، أي خمس عشرات. و块 تعني يوان." },
            },
            {
              kind: "order",
              prompt: { en: "Put the words in order: I want to go to the hotel.", ar: "رتّب الكلمات: أريد أن أذهب إلى الفندق." },
              tiles: ["我", "要", "去", "酒店"],
              pinyin: "Wǒ yào qù jiǔdiàn.",
              meaning: { en: "I want to go to the hotel.", ar: "أريد أن أذهب إلى الفندق." },
            },
          ],
        },
        {
          id: "remember",
          activities: [
            {
              kind: "match",
              pairs: [
                { zh: "酒店", pinyin: "jiǔdiàn", meaning: { en: "Hotel", ar: "فندق" } },
                { zh: "多少钱", pinyin: "duōshao qián", meaning: { en: "How much is it?", ar: "كم السعر؟" } },
                { zh: "我要去", pinyin: "wǒ yào qù", meaning: { en: "I want to go to", ar: "أريد أن أذهب إلى" } },
                { zh: "谢谢", pinyin: "xièxie", meaning: { en: "Thank you", ar: "شكراً" } },
              ],
            },
          ],
        },
        { id: "self", activities: [{ kind: "canDo" }] },
      ],
    },
  ],
};
