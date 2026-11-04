// Mandarin on the Move: the pocket phrasebook.
//
// Short, standard phrases for a trip or a business visit. Each one can be
// played aloud or shown full screen to a driver, receptionist or waiter.
// Arabic sound guides still need a native teacher's review.
import type { T, Zh } from "../foundation1/types";

export interface Phrase extends Zh {
  meaning: T;
  /** Arabic sound guide */
  sound: string;
}

export interface PhraseGroup {
  key: string;
  title: T;
  zh: string;
  phrases: Phrase[];
}

const p = (zh: string, pinyin: string, sound: string, en: string, ar: string): Phrase => ({ zh, pinyin, sound, meaning: { en, ar } });

export const PHRASE_GROUPS: PhraseGroup[] = [
  {
    key: "basics",
    title: { en: "Basics", ar: "الأساسيات" },
    zh: "基本",
    phrases: [
      p("您好", "nín hǎo", "نِين هاو", "Hello (polite)", "مرحباً (بأدب)"),
      p("谢谢", "xièxie", "شْيِه شْيِه", "Thank you", "شكراً"),
      p("不客气", "bú kèqi", "بُو كَه تْشِي", "You're welcome", "عفواً"),
      p("对不起", "duìbuqǐ", "دْوي بُو تْشِي", "Sorry", "آسف"),
      p("再见", "zàijiàn", "دْزاي جْيان", "Goodbye", "مع السلامة"),
      p("我听不懂", "wǒ tīng bu dǒng", "وُو تِينغ بُو دونغ", "I don't understand", "لا أفهم"),
      p("请再说一遍", "qǐng zài shuō yí biàn", "تْشِينغ دْزاي شْوو يِي بْيان", "Please say that again", "أعد من فضلك"),
      p("我会说一点儿中文", "wǒ huì shuō yìdiǎnr Zhōngwén", "وُو خْوي شْوو يِي دْيار جونغ وِن", "I speak a little Chinese", "أتكلّم القليل من الصينية"),
    ],
  },
  {
    key: "around",
    title: { en: "Getting around", ar: "التنقّل" },
    zh: "出行",
    phrases: [
      p("请带我去这个地址", "qǐng dài wǒ qù zhège dìzhǐ", "تْشِينغ داي وُو تْشْيُو جَه كَه دي جْ", "Please take me to this address", "خذني إلى هذا العنوان من فضلك"),
      p("我要去酒店", "wǒ yào qù jiǔdiàn", "وُو ياو تْشْيُو جْيُو دْيان", "I want to go to the hotel", "أريد أن أذهب إلى الفندق"),
      p("我要去机场", "wǒ yào qù jīchǎng", "وُو ياو تْشْيُو جِي تْشانغ", "I want to go to the airport", "أريد أن أذهب إلى المطار"),
      p("请在这儿停", "qǐng zài zhèr tíng", "تْشِينغ دْزاي جَر تِينغ", "Please stop here", "توقّف هنا من فضلك"),
      p("地铁站在哪儿？", "dìtiě zhàn zài nǎr?", "دي تْيِه جان دْزاي نار", "Where is the metro station?", "أين محطة المترو؟"),
      p("洗手间在哪儿？", "xǐshǒujiān zài nǎr?", "شْي شو جْيان دْزاي نار", "Where is the restroom?", "أين دورة المياه؟"),
    ],
  },
  {
    key: "hotel",
    title: { en: "Hotel", ar: "الفندق" },
    zh: "酒店",
    phrases: [
      p("我有预订", "wǒ yǒu yùdìng", "وُو يو يُوي دِينغ", "I have a reservation", "لديّ حجز"),
      p("Wi-Fi密码是多少？", "Wi-Fi mìmǎ shì duōshao?", "واي فاي مي ما شْ دوو شاو", "What's the Wi-Fi password?", "ما كلمة سر الواي فاي؟"),
      p("我要退房", "wǒ yào tuìfáng", "وُو ياو توي فانغ", "I'd like to check out", "أريد تسجيل المغادرة"),
    ],
  },
  {
    key: "food",
    title: { en: "Food", ar: "الطعام" },
    zh: "吃饭",
    phrases: [
      p("有清真菜吗？", "yǒu qīngzhēn cài ma?", "يو تْشِينغ جِن تْساي ما", "Do you have halal food?", "هل لديكم طعام حلال؟"),
      p("我不吃猪肉", "wǒ bù chī zhūròu", "وُو بُو تْشْ جو رو", "I don't eat pork", "لا آكل لحم الخنزير"),
      p("不要辣", "bú yào là", "بُو ياو لا", "Not spicy, please", "بدون حار من فضلك"),
      p("这个", "zhège", "جَه كَه", "This one", "هذا"),
      p("买单", "mǎidān", "ماي دان", "The bill, please", "الحساب من فضلك"),
    ],
  },
  {
    key: "shopping",
    title: { en: "Shopping", ar: "التسوّق" },
    zh: "购物",
    phrases: [
      p("多少钱？", "duōshao qián?", "دوو شاو تْشْيان", "How much is it?", "كم السعر؟"),
      p("太贵了", "tài guì le", "تاي كوي لَه", "That's too expensive", "هذا غالٍ جدًا"),
      p("可以刷卡吗？", "kěyǐ shuā kǎ ma?", "كَه يِي شْوا كا ما", "Can I pay by card?", "هل أستطيع الدفع بالبطاقة؟"),
    ],
  },
  {
    key: "business",
    title: { en: "Business", ar: "العمل" },
    zh: "商务",
    phrases: [
      p("认识您很高兴", "rènshi nín hěn gāoxìng", "رِنْ شْ نِين هِن كاو شِينغ", "Nice to meet you", "تشرّفنا"),
      p("这是我的名片", "zhè shì wǒ de míngpiàn", "جَه شْ وُو دَه مِينغ بْيان", "This is my business card", "هذه بطاقة عملي"),
      p("我来自迪拜", "wǒ láizì Díbài", "وُو لاي دْزِ دي باي", "I'm from Dubai", "أنا من دبي"),
      p("期待合作", "qīdài hézuò", "تْشِي داي خَه دْزوو", "I look forward to working together", "أتطلّع إلى التعاون معكم"),
    ],
  },
  {
    key: "help",
    title: { en: "Help", ar: "المساعدة" },
    zh: "帮助",
    phrases: [
      p("请帮帮我", "qǐng bāngbang wǒ", "تْشِينغ بانغ بانغ وُو", "Please help me", "ساعدني من فضلك"),
      p("我迷路了", "wǒ mílù le", "وُو مي لو لَه", "I'm lost", "لقد ضللت الطريق"),
      p("我需要医生", "wǒ xūyào yīshēng", "وُو شْيُو ياو يِي شُنغ", "I need a doctor", "أحتاج إلى طبيب"),
    ],
  },
];
