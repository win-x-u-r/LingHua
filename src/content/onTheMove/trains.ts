// Mandarin on the Move: China's trains, for a business traveller.
// Journey times are approximate (fastest regular trains) and change with the timetable.
import type { T, Zh } from "../foundation1/types";
import { tx, type Pair } from "./build";

export interface TrainType {
  letter: string;
  zh: string;
  pinyin: string;
  name: T;
  speed: T;
}

export const TRAIN_TYPES: TrainType[] = [
  { letter: "G", zh: "高铁", pinyin: "gāotiě", name: tx(["High-speed", "قطار فائق السرعة"]), speed: tx(["Up to 350 km/h. The best choice between big cities.", "حتى 350 كم/س. الخيار الأفضل بين المدن الكبرى."]) },
  { letter: "D", zh: "动车", pinyin: "dòngchē", name: tx(["Fast (bullet)", "قطار سريع"]), speed: tx(["Up to 250 km/h. Some overnight D trains have sleeper berths.", "حتى 250 كم/س. وبعض قطارات D الليلية فيها أسرّة للنوم."]) },
  { letter: "C", zh: "城际", pinyin: "chéngjì", name: tx(["Intercity", "بين المدن القريبة"]), speed: tx(["Short hops between nearby cities, like Guangzhou to Zhuhai.", "رحلات قصيرة بين مدن متجاورة، مثل قوانغتشو إلى تشوهاي."]) },
  { letter: "Z T K", zh: "普速", pinyin: "pǔsù", name: tx(["Classic", "القطارات العادية"]), speed: tx(["Slower and cheaper, often overnight with sleepers.", "أبطأ وأرخص، وغالبًا ليلية بأسرّة للنوم."]) },
];

export interface SeatClass extends Zh {
  name: T;
  note: T;
}

export const SEATS: SeatClass[] = [
  { zh: "商务座", pinyin: "shāngwù zuò", name: tx(["Business class", "درجة رجال الأعمال"]), note: tx(["Lie-flat seats, lounge access at big stations. About 3 times second class.", "مقاعد تتحوّل إلى سرير وصالة انتظار في المحطات الكبرى. نحو ثلاثة أضعاف سعر الدرجة الثانية."]) },
  { zh: "一等座", pinyin: "yīděng zuò", name: tx(["First class", "الدرجة الأولى"]), note: tx(["2 + 2 seats, more legroom and quieter. Good for working on a laptop.", "مقعدان ومقعدان في كل صف، مساحة أوسع وهدوء أكثر. مناسبة للعمل على الحاسوب."]) },
  { zh: "二等座", pinyin: "èrděng zuò", name: tx(["Second class", "الدرجة الثانية"]), note: tx(["3 + 2 seats, comfortable and the most common. Seats A and F are by the window.", "ثلاثة مقاعد ومقعدان في كل صف، مريحة والأكثر شيوعًا. المقعدان A وF بجانب النافذة."]) },
  { zh: "卧铺", pinyin: "wòpù", name: tx(["Sleeper berth", "سرير نوم"]), note: tx(["On overnight trains: 软卧 (soft, 4 per cabin) or 硬卧 (hard, 6 per bay).", "في القطارات الليلية: 软卧 (ناعم، 4 في المقصورة) أو 硬卧 (عادي، 6 في الحجرة)."]) },
];

/** The labelled parts of a ticket, in the order they appear on the sample */
export const TICKET_PARTS: { key: string; zh: string; pinyin: string; name: T }[] = [
  { key: "from", zh: "出发站", pinyin: "chūfā zhàn", name: tx(["Departure station", "محطة المغادرة"]) },
  { key: "train", zh: "车次", pinyin: "chēcì", name: tx(["Train number", "رقم القطار"]) },
  { key: "to", zh: "到达站", pinyin: "dàodá zhàn", name: tx(["Arrival station", "محطة الوصول"]) },
  { key: "time", zh: "发车时间", pinyin: "fāchē shíjiān", name: tx(["Departure time", "موعد الانطلاق"]) },
  { key: "car", zh: "车厢", pinyin: "chēxiāng", name: tx(["Carriage", "العربة"]) },
  { key: "seat", zh: "座位", pinyin: "zuòwèi", name: tx(["Seat", "المقعد"]) },
  { key: "gate", zh: "检票口", pinyin: "jiǎnpiào kǒu", name: tx(["Ticket gate", "بوابة التذاكر"]) },
];

export const STATION_STEPS: { title: T; body: T }[] = [
  {
    title: tx(["Book on 12306", "احجز عبر 12306"]),
    body: tx(["12306 is the official railway app and website, with an English version. Register with your passport. Popular trains sell out, so book as early as you can (tickets open about 15 days ahead). You can also buy at the station's ticket office (售票处) with your passport.", "12306 هو التطبيق والموقع الرسمي للقطارات، وله نسخة بالإنجليزية. سجّل بجواز سفرك. القطارات المطلوبة تنفد تذاكرها، فاحجز مبكرًا قدر الإمكان (يبدأ الحجز قبل نحو 15 يومًا). ويمكنك الشراء من شبّاك التذاكر (售票处) في المحطة بجواز سفرك."]),
  },
  {
    title: tx(["Your passport is your ticket", "جواز سفرك هو تذكرتك"]),
    body: tx(["Tickets are electronic and linked to your passport. If the automatic gate can't read it, use the staffed lane (人工通道) and show your passport there.", "التذاكر إلكترونية ومرتبطة بجواز سفرك. إذا لم تقرأه البوابة الآلية، فاستخدم الممر الذي يقف فيه موظف (人工通道) وأظهر جوازك هناك."]),
  },
  {
    title: tx(["Arrive 45 minutes early", "احضر قبل 45 دقيقة"]),
    body: tx(["Big stations are like airports: an ID check at the door, then a bag scan. Find your train number and gate (检票口) on the big screens, and wait in the hall.", "المحطات الكبيرة تشبه المطارات: تفتيش الهوية عند الباب، ثم فحص الحقائب. ابحث عن رقم قطارك وبوابته (检票口) على الشاشات الكبيرة، وانتظر في القاعة."]),
  },
  {
    title: tx(["Boarding closes early", "يُغلق الصعود مبكرًا"]),
    body: tx(["Gates open about 15 to 20 minutes before departure and close about 5 minutes before. On the platform, stand by your carriage number painted on the ground.", "تُفتح البوابات قبل الانطلاق بنحو 15 إلى 20 دقيقة وتُغلق قبله بنحو 5 دقائق. وعلى الرصيف قف عند رقم عربتك المرسوم على الأرض."]),
  },
  {
    title: tx(["Food and luggage", "الطعام والأمتعة"]),
    body: tx(["Hot water is free on every train, so pack tea or instant food. Big stations have halal noodle shops; on board, halal food is not guaranteed. Large suitcases go on the racks at the end of each carriage.", "الماء الساخن مجاني في كل قطار، فاحمل الشاي أو الطعام السريع التحضير. في المحطات الكبيرة محلات نودلز حلال، أما في القطار فالطعام الحلال غير مضمون. والحقائب الكبيرة توضع على الرفوف في طرف كل عربة."]),
  },
];

export interface Route {
  from: Pair;
  fromZh: string;
  to: Pair;
  toZh: string;
  time: Pair;
}

export const ROUTES: Route[] = [
  { from: ["Beijing", "بكين"], fromZh: "北京", to: ["Shanghai", "شنغهاي"], toZh: "上海", time: ["About 4.5 hours", "نحو 4.5 ساعات"] },
  { from: ["Guangzhou", "قوانغتشو"], fromZh: "广州", to: ["Shenzhen", "شنتشن"], toZh: "深圳", time: ["About 30 to 40 minutes", "نحو 30 إلى 40 دقيقة"] },
  { from: ["Shanghai", "شنغهاي"], fromZh: "上海", to: ["Hangzhou", "هانغتشو"], toZh: "杭州", time: ["About 1 hour", "نحو ساعة"] },
  { from: ["Shanghai", "شنغهاي"], fromZh: "上海", to: ["Yiwu", "ييوو"], toZh: "义乌", time: ["About 2 hours", "نحو ساعتين"] },
  { from: ["Beijing", "بكين"], fromZh: "北京", to: ["Xi'an", "شيان"], toZh: "西安", time: ["About 4.5 hours", "نحو 4.5 ساعات"] },
  { from: ["Beijing", "بكين"], fromZh: "北京", to: ["Guangzhou", "قوانغتشو"], toZh: "广州", time: ["About 8 to 9 hours", "نحو 8 إلى 9 ساعات"] },
  { from: ["Guangzhou", "قوانغتشو"], fromZh: "广州", to: ["Hong Kong", "هونغ كونغ"], toZh: "香港", time: ["About 1 hour", "نحو ساعة"] },
];

export const TRAIN_PHRASES: (Zh & { meaning: T })[] = [
  { zh: "我要一张去上海的票", pinyin: "wǒ yào yì zhāng qù Shànghǎi de piào", meaning: tx(["One ticket to Shanghai, please", "تذكرة واحدة إلى شنغهاي من فضلك"]) },
  { zh: "有今天的票吗？", pinyin: "yǒu jīntiān de piào ma?", meaning: tx(["Are there tickets for today?", "هل توجد تذاكر لليوم؟"]) },
  { zh: "我要二等座", pinyin: "wǒ yào èrděng zuò", meaning: tx(["Second class, please", "الدرجة الثانية من فضلك"]) },
  { zh: "我要靠窗的座位", pinyin: "wǒ yào kào chuāng de zuòwèi", meaning: tx(["A window seat, please", "مقعد بجانب النافذة من فضلك"]) },
  { zh: "售票处在哪儿？", pinyin: "shòupiào chù zài nǎr?", meaning: tx(["Where is the ticket office?", "أين شبّاك التذاكر؟"]) },
  { zh: "在哪个检票口？", pinyin: "zài nǎge jiǎnpiào kǒu?", meaning: tx(["Which gate is it?", "من أي بوابة؟"]) },
  { zh: "人工通道在哪儿？", pinyin: "réngōng tōngdào zài nǎr?", meaning: tx(["Where is the staffed lane?", "أين الممر الذي فيه موظف؟"]) },
  { zh: "这是几号车厢？", pinyin: "zhè shì jǐ hào chēxiāng?", meaning: tx(["Which carriage is this?", "ما رقم هذه العربة؟"]) },
  { zh: "这是我的座位", pinyin: "zhè shì wǒ de zuòwèi", meaning: tx(["This is my seat", "هذا مقعدي"]) },
  { zh: "下一站是哪儿？", pinyin: "xià yí zhàn shì nǎr?", meaning: tx(["What's the next stop?", "ما المحطة التالية؟"]) },
  { zh: "火车晚点了吗？", pinyin: "huǒchē wǎndiǎn le ma?", meaning: tx(["Is the train delayed?", "هل تأخّر القطار؟"]) },
  { zh: "我想改签", pinyin: "wǒ xiǎng gǎiqiān", meaning: tx(["I'd like to change my ticket", "أريد تغيير موعد تذكرتي"]) },
];
