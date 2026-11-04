// Mandarin on the Move: business etiquette for a trip to China, each tip with
// one phrase to go with it. To be reviewed with a native teacher.
import type { T, Zh } from "../foundation1/types";
import { tx, type Pair } from "./build";

export interface Tip {
  title: T;
  body: T;
  phrase?: Zh & { meaning: T };
}

export interface TipGroup {
  key: string;
  title: T;
  zh: string;
  tips: Tip[];
}

const tip = (title: Pair, body: Pair, phrase?: [zh: string, pinyin: string, meaning: Pair]): Tip => ({
  title: tx(title),
  body: tx(body),
  phrase: phrase && { zh: phrase[0], pinyin: phrase[1], meaning: tx(phrase[2]) },
});

export const ETIQUETTE: TipGroup[] = [
  {
    key: "meeting",
    title: tx(["Meeting people", "التعارف"]),
    zh: "见面",
    tips: [
      tip(
        ["Greet the most senior person first", "حيِّ الأعلى منصبًا أولًا"],
        ["Rank matters. Greet the most senior person first with a light handshake and a small nod. A firm grip or a hug can feel too strong.", "المنصب مهم. حيِّ الأعلى منصبًا أولًا بمصافحة خفيفة وإيماءة صغيرة. فالمصافحة القوية أو العناق قد تبدو مبالغًا فيها."],
        ["认识您很高兴", "rènshi nín hěn gāoxìng", ["Nice to meet you", "تشرّفنا"]],
      ),
      tip(
        ["Surname and title, not first names", "اسم العائلة واللقب لا الاسم الأول"],
        ["The surname comes first: in 王明, Wang is the surname. Say 王总 for a boss, 王经理 for a manager, or 王先生 and 王女士 for Mr and Ms Wang.", "اسم العائلة يأتي أولًا: في 王明 اسم العائلة هو وانغ. قل 王总 للمدير العام، و王经理 للمدير، أو 王先生 و王女士 للسيد والسيدة وانغ."],
        ["王总，您好！", "Wáng zǒng, nín hǎo!", ["Hello, Mr Wang!", "مرحباً يا سيد وانغ!"]],
      ),
      tip(
        ["Business cards with both hands", "بطاقة العمل باليدين"],
        ["Offer your card with both hands, the Chinese side up and facing them. Read the card you receive for a moment, then place it on the table in front of you, not in your back pocket.", "قدّم بطاقتك باليدين، والوجه الصيني إلى الأعلى وباتجاههم. اقرأ البطاقة التي تتسلّمها لحظة، ثم ضعها على الطاولة أمامك، لا في جيبك الخلفي."],
        ["这是我的名片", "zhè shì wǒ de míngpiàn", ["This is my business card", "هذه بطاقة عملي"]],
      ),
      tip(
        ["Print a Chinese side", "اطبع وجهًا بالصينية"],
        ["A card with your name, title and company in Chinese on the back shows respect and saves confusion. Gold lettering is a nice touch.", "بطاقة عليها اسمك ولقبك واسم شركتك بالصينية على ظهرها تُظهر الاحترام وتمنع اللبس. والكتابة الذهبية لمسة جميلة."],
      ),
    ],
  },
  {
    key: "table",
    title: tx(["At the table", "على المائدة"]),
    zh: "饭桌",
    tips: [
      tip(
        ["Wait to be seated", "انتظر حتى يُشار إليك بالجلوس"],
        ["The host sits facing the door, and the guest of honour sits on the host's right. Let the host show you your seat.", "يجلس المضيف مقابل الباب، ويجلس ضيف الشرف عن يمينه. دع المضيف يرشدك إلى مقعدك."],
        ["请坐", "qǐng zuò", ["Please, have a seat", "تفضّل بالجلوس"]],
      ),
      tip(
        ["Mention halal early", "أخبرهم بالحلال مبكرًا"],
        ["Say you eat halal when the dinner is being planned, so the host can choose a restaurant without losing face. Halal restaurants are easy to find in big cities.", "أخبرهم أنك تأكل الحلال عند التخطيط للعشاء، ليختار المضيف مطعمًا دون حرج. والمطاعم الحلال سهلة الإيجاد في المدن الكبرى."],
        ["我只吃清真菜", "wǒ zhǐ chī qīngzhēn cài", ["I only eat halal food", "آكل الطعام الحلال فقط"]],
      ),
      tip(
        ["Toast with tea", "اشرب النخب بالشاي"],
        ["Toasts are a big part of a business dinner. If you don't drink alcohol, raise your tea or juice and say 以茶代酒. Hosts understand and respect it.", "الأنخاب جزء مهم من عشاء العمل. إذا كنت لا تشرب الكحول، فارفع الشاي أو العصير وقل 以茶代酒. سيفهم المضيفون ذلك ويحترمونه."],
        ["我以茶代酒", "wǒ yǐ chá dài jiǔ", ["I'll toast with tea", "سأشارك في النخب بالشاي"]],
      ),
      tip(
        ["Chopsticks", "عيدان الطعام"],
        ["Never stand chopsticks upright in a bowl of rice: it looks like incense at a funeral. Don't point with them, and use the serving chopsticks or spoon for shared dishes.", "لا تغرس العيدان واقفة في وعاء الأرز أبدًا، فهي تشبه البخور في الجنازات. لا تُشِر بها، واستخدم عيدان التقديم أو الملعقة للأطباق المشتركة."],
        ["筷子", "kuàizi", ["Chopsticks", "عيدان الطعام"]],
      ),
      tip(
        ["Who pays", "من يدفع"],
        ["The host pays. Offering to split the bill can embarrass them. Return the favour by inviting them next time.", "المضيف هو من يدفع، وعرض تقسيم الفاتورة قد يحرجه. ردّ الجميل بدعوته في المرة القادمة."],
        ["下次我请客", "xià cì wǒ qǐngkè", ["Next time, it's on me", "المرة القادمة على حسابي"]],
      ),
    ],
  },
  {
    key: "gifts",
    title: tx(["Gifts", "الهدايا"]),
    zh: "送礼",
    tips: [
      tip(
        ["Give with both hands", "قدّم الهدية باليدين"],
        ["A gift may be politely refused once or twice before it's accepted, and it usually isn't opened in front of you. Gifts from home, like good dates or Arabic coffee, go down well.", "قد تُرفض الهدية بلطف مرة أو مرتين قبل قبولها، وغالبًا لا تُفتح أمامك. والهدايا من بلدك، مثل التمر الجيد أو القهوة العربية، تلقى ترحيبًا."],
        ["一点小心意", "yìdiǎn xiǎo xīnyì", ["Just a small token", "هدية رمزية بسيطة"]],
      ),
      tip(
        ["Gifts to avoid", "هدايا تجنّبها"],
        ["Don't give a clock: 送钟 (giving a clock) sounds like 送终 (seeing someone to their death). Avoid sets of four and white wrapping. Red and gold are lucky.", "لا تُهدِ ساعة حائط: 送钟 (إهداء ساعة) تشبه في نطقها 送终 (توديع شخص إلى موته). وتجنّب المجموعات الرباعية والتغليف الأبيض. أما الأحمر والذهبي فلونا الحظ."],
      ),
    ],
  },
  {
    key: "business",
    title: tx(["Doing business", "عقد الصفقات"]),
    zh: "做生意",
    tips: [
      tip(
        ["Relationships come first", "العلاقة أولًا"],
        ["关系 (guānxi), your network of trust, comes before the contract. Expect dinners and small talk before any deal, and keep in touch between visits.", "关系 (guānxi)، أي شبكة الثقة، تأتي قبل العقد. توقّع العشاء والأحاديث الودّية قبل أي صفقة، وابقَ على تواصل بين الزيارات."],
        ["合作愉快", "hézuò yúkuài", ["To a great partnership", "نخب شراكة ناجحة"]],
      ),
      tip(
        ["Give face, save face", "احفظ ماء الوجه"],
        ["面子 (miànzi) is face, a person's standing in front of others. Never correct or criticise someone in public. A no often sounds soft, like we'll look into it.", "面子 (miànzi) هو ماء الوجه، أي مكانة الشخص أمام الآخرين. لا تصحّح لأحد ولا تنتقده أمام الناس. والرفض غالبًا يأتي بلطف، مثل «سندرس الأمر»."],
        ["我们再研究一下", "wǒmen zài yánjiū yíxià", ["We'll look into it again", "سندرس الأمر مرة أخرى"]],
      ),
      tip(
        ["Lucky and unlucky numbers", "أرقام الحظ وأرقام النحس"],
        ["8 sounds like prosper and 6 sounds like smooth, so prices like 888 or 66 are welcome. 4 sounds like death, so avoid it in prices and quantities.", "الرقم 8 يشبه في نطقه «الازدهار»، والرقم 6 يشبه «السلاسة»، لذلك تُستحسن أسعار مثل 888 أو 66. أما الرقم 4 فيشبه «الموت»، فتجنّبه في الأسعار والكميات."],
        ["八", "bā", ["Eight", "ثمانية"]],
      ),
      tip(
        ["Plan around the holidays", "خطّط حول العطلات"],
        ["Business slows right down for Chinese New Year (春节, late January or February) and for Golden Week (国庆节, 1 to 7 October). Factories can close for weeks around New Year.", "يتباطأ العمل كثيرًا في رأس السنة الصينية (春节، أواخر يناير أو فبراير) وفي الأسبوع الذهبي (国庆节، من 1 إلى 7 أكتوبر). وقد تُغلق المصانع أسابيع حول رأس السنة."],
        ["新年快乐", "xīnnián kuàilè", ["Happy New Year", "سنة جديدة سعيدة"]],
      ),
      tip(
        ["Everything is on WeChat", "كل شيء على وي تشات"],
        ["After a meeting, people add each other on WeChat to message, send files and follow up. Set up WeChat and a mobile payment app before you fly.", "بعد الاجتماع يضيف الناس بعضهم على وي تشات للمراسلة وإرسال الملفات والمتابعة. جهّز وي تشات وتطبيق دفع عبر الهاتف قبل سفرك."],
        ["我们加个微信吧", "wǒmen jiā ge Wēixìn ba", ["Let's add each other on WeChat", "لنضف بعضنا على وي تشات"]],
      ),
    ],
  },
];
