// Mandarin on the Move, Units 2 to 7: a business trip to China, from the hotel
// desk to the deal and the dinner after it. Scripts and Arabic sound guides
// still need a native teacher's review.
import type { Unit } from "../foundation1/types";
import { lesson, word, say, listen, pick, pickZh, order, tx, type Pair } from "./build";

const OMAR: Pair = ["Omar", "عمر"];
const DESK: Pair = ["Receptionist", "موظفة الاستقبال"];
const PASSER: Pair = ["Passer-by", "أحد المارّة"];
const CLERK: Pair = ["Ticket clerk", "موظف التذاكر"];
const LI: Pair = ["Manager Li", "المدير لي"];
const WAITER: Pair = ["Waiter", "النادل"];
const WANG: Pair = ["Manager Wang", "المدير وانغ"];

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT2: Unit = {
  key: "m1.u2",
  number: 2,
  title: tx(["Checking In", "تسجيل الدخول"]),
  zh: "入住酒店",
  outcome: tx(["Check in to your hotel, ask polite questions and ask what time things happen.", "سجّل دخولك في الفندق، واطرح أسئلة مهذّبة، واسأل عن المواعيد."]),
  canDo: [
    tx(["I can say I have a reservation and hand over my passport.", "أستطيع أن أقول إن لديّ حجزًا وأن أقدّم جواز سفري."]),
    tx(["I can make polite requests with 请.", "أستطيع أن أطلب بأدب باستخدام 请."]),
    tx(["I can ask what time breakfast is and understand the answer.", "أستطيع أن أسأل عن موعد الفطور وأفهم الجواب."]),
  ],
  lessons: [
    lesson({
      key: "m1.u2.l1",
      title: ["At the Front Desk", "عند مكتب الاستقبال"],
      zh: "在前台",
      goal: ["Check in with your reservation and passport.", "سجّل دخولك بحجزك وجواز سفرك."],
      minutes: 8,
      scene: {
        title: ["Checking in at a hotel in Guangzhou", "تسجيل الدخول في فندق بقوانغتشو"],
        lines: [
          ["a", DESK, "您好！欢迎光临。", "Nín hǎo! Huānyíng guānglín.", "Hello! Welcome.", "مرحباً! أهلاً بك."],
          ["b", OMAR, "您好！我有预订。我叫 Omar。", "Nín hǎo! Wǒ yǒu yùdìng. Wǒ jiào Omar.", "Hello! I have a reservation. My name is Omar.", "مرحباً! لديّ حجز. اسمي عمر."],
          ["a", DESK, "请给我您的护照。", "Qǐng gěi wǒ nín de hùzhào.", "Your passport, please.", "جواز سفرك من فضلك."],
          ["b", OMAR, "好的，给您。", "Hǎo de, gěi nín.", "Sure, here you are.", "حسناً، تفضّلي."],
          ["a", DESK, "您的房间在八楼。", "Nín de fángjiān zài bā lóu.", "Your room is on the eighth floor.", "غرفتك في الطابق الثامن."],
          ["b", OMAR, "谢谢！", "Xièxie!", "Thank you!", "شكراً!"],
        ],
      },
      words: [
        word("预订", "yùdìng", "يُوي دِينْغ", ["Reservation", "حجز"], ["我有预订 means I have a reservation. ü is like ي with rounded lips.", "我有预订 تعني لديّ حجز. وصوت ü مثل الياء مع ضمّ الشفتين."]),
        word("护照", "hùzhào", "خُو جَاوْ", ["Passport", "جواز السفر"], ["zh is close to ج, with the tongue curled back.", "صوت zh قريب من الجيم، مع رفع طرف اللسان إلى الخلف."]),
        word("房间", "fángjiān", "فَانْغ جِيَانْ", ["Room", "غرفة"]),
        word("请", "qǐng", "تْشِينْغ", ["Please", "من فضلك"], ["请 goes before the verb: 请进 come in, 请坐 have a seat.", "تأتي 请 قبل الفعل: 请进 تفضّل بالدخول، 请坐 تفضّل بالجلوس."]),
        word("楼", "lóu", "لُو", ["Floor (of a building)", "طابق"], ["Number first: 八楼 is the eighth floor.", "الرقم أولًا: 八楼 تعني الطابق الثامن."]),
      ],
      notes: [
        {
          title: ["请 makes it polite", "请 تجعل الطلب مهذّبًا"],
          body: ["Put 请 in front of a request, like تفضّل or من فضلك. Hotel staff will say it to you all the time.", "ضع 请 قبل الطلب، مثل «تفضّل» أو «من فضلك». سيقولها لك موظفو الفندق كثيرًا."],
          examples: [
            { zh: "请进", pinyin: "qǐng jìn", meaning: ["Come in, please", "تفضّل بالدخول"] },
            { zh: "请坐", pinyin: "qǐng zuò", meaning: ["Have a seat, please", "تفضّل بالجلوس"] },
            { zh: "请给我", pinyin: "qǐng gěi wǒ", meaning: ["Please give me", "أعطني من فضلك"] },
          ],
        },
      ],
      say: [
        say("我有预订", "wǒ yǒu yùdìng", ["Tell the receptionist: I have a reservation.", "قل لموظفة الاستقبال: لديّ حجز."], { tip: ["wǒ yǒu: two third tones, so wǒ rises.", "wǒ yǒu: نغمتان ثالثتان، لذلك ترتفع wǒ."] }),
        say("这是我的护照", "zhè shì wǒ de hùzhào", ["Say: this is my passport.", "قل: هذا جواز سفري."]),
      ],
      use: [
        listen("请给我您的护照。", "Qǐng gěi wǒ nín de hùzhào.", ["Listen. What does the receptionist want?", "استمع. ماذا تطلب موظفة الاستقبال؟"], [["Your passport", "جواز سفرك"], ["Your name", "اسمك"], ["Your room number", "رقم غرفتك"]], ["护照 is passport, and 请给我 is please give me.", "护照 تعني جواز السفر، و请给我 تعني أعطني من فضلك."]),
        say("我有预订", "wǒ yǒu yùdìng", ["Hua is at the front desk. Tell him you have a reservation.", "هُوا في مكتب الاستقبال. أخبره أن لديك حجزًا."], { hua: { zh: "您好！欢迎光临。", pinyin: "Nín hǎo! Huānyíng guānglín." } }),
        listen("您的房间在十二楼。", "Nín de fángjiān zài shí'èr lóu.", ["Listen. Which floor is your room on?", "استمع. في أي طابق غرفتك؟"], [["12th floor", "الطابق 12"], ["2nd floor", "الطابق 2"], ["10th floor", "الطابق 10"]], ["十二 is twelve: ten and two.", "十二 تعني اثني عشر: عشرة واثنان."]),
        order(["Put the words in order: my room is on the eighth floor.", "رتّب الكلمات: غرفتي في الطابق الثامن."], ["我的", "房间", "在", "八楼"], "Wǒ de fángjiān zài bā lóu.", ["My room is on the eighth floor.", "غرفتي في الطابق الثامن."]),
      ],
    }),
    lesson({
      key: "m1.u2.l2",
      title: ["Settling In", "الاستقرار في الغرفة"],
      zh: "住得舒服",
      goal: ["Ask what time breakfast is and get the Wi-Fi password.", "اسأل عن موعد الفطور واحصل على كلمة سر الواي فاي."],
      minutes: 8,
      scene: {
        title: ["Calling the front desk from your room", "الاتصال بالاستقبال من غرفتك"],
        lines: [
          ["b", OMAR, "您好！早饭几点？", "Nín hǎo! Zǎofàn jǐ diǎn?", "Hello! What time is breakfast?", "مرحباً! متى الفطور؟"],
          ["a", DESK, "早上七点到十点。", "Zǎoshang qī diǎn dào shí diǎn.", "From seven to ten in the morning.", "من السابعة إلى العاشرة صباحاً."],
          ["b", OMAR, "Wi-Fi 密码是多少？", "Wi-Fi mìmǎ shì duōshao?", "What's the Wi-Fi password?", "ما كلمة سر الواي فاي؟"],
          ["a", DESK, "八八八八八八。", "Bā bā bā bā bā bā.", "888888.", "888888."],
          ["b", OMAR, "太好了，谢谢！", "Tài hǎo le, xièxie!", "Great, thank you!", "رائع، شكراً!"],
        ],
      },
      words: [
        word("早饭", "zǎofàn", "دْزَاوْ فَانْ", ["Breakfast", "الفطور"], ["早 is early or morning, 饭 is a meal.", "早 تعني الصباح، و饭 تعني وجبة."]),
        word("几点", "jǐ diǎn", "جِي دِيَانْ", ["What time?", "في أي ساعة؟"], ["几 asks how many, 点 is o'clock. Put it after the thing you ask about.", "几 تسأل عن العدد، و点 تعني الساعة. ضعها بعد الشيء الذي تسأل عنه."]),
        word("密码", "mìmǎ", "مِي مَا", ["Password", "كلمة السر"]),
        word("太好了", "tài hǎo le", "تَايْ هَاوْ لَه", ["Great!", "رائع!"]),
      ],
      notes: [
        {
          title: ["Telling the time", "قول الوقت"],
          body: ["Number + 点 is the hour. Add 早上 for the morning, 下午 for the afternoon and 晚上 for the evening, before the hour.", "الرقم + 点 هو الساعة. وأضف 早上 للصباح و下午 لبعد الظهر و晚上 للمساء، قبل الساعة."],
          examples: [
            { zh: "早上七点", pinyin: "zǎoshang qī diǎn", meaning: ["7 in the morning", "السابعة صباحاً"] },
            { zh: "下午三点", pinyin: "xiàwǔ sān diǎn", meaning: ["3 in the afternoon", "الثالثة بعد الظهر"] },
            { zh: "晚上八点", pinyin: "wǎnshang bā diǎn", meaning: ["8 in the evening", "الثامنة مساءً"] },
          ],
        },
        {
          title: ["Why so many 8s?", "لماذا كثرة الرقم 8؟"],
          body: ["八 (bā) sounds like 发 (fā), to prosper. Hotels, phone numbers and prices love it. 四 (sì) sounds like 死 (sǐ), death, so many buildings skip the fourth floor.", "八 (bā) تشبه في نطقها 发 (fā) أي الازدهار، لذلك تحبها الفنادق وأرقام الهواتف والأسعار. أما 四 (sì) فتشبه 死 (sǐ) أي الموت، لذلك تتجنّب مبانٍ كثيرة الطابق الرابع."],
        },
      ],
      say: [
        say("早饭几点", "zǎofàn jǐ diǎn", ["Ask: what time is breakfast?", "اسأل: متى الفطور؟"]),
        say("密码是多少", "mìmǎ shì duōshao", ["Ask: what's the password?", "اسأل: ما كلمة السر؟"]),
      ],
      use: [
        listen("早上七点。", "Zǎoshang qī diǎn.", ["Listen. What time is breakfast?", "استمع. متى الفطور؟"], [["7 am", "7 صباحاً"], ["7 pm", "7 مساءً"], ["10 am", "10 صباحاً"]], ["早上 is the morning and 七点 is seven o'clock.", "早上 تعني الصباح، و七点 تعني الساعة السابعة."]),
        listen("晚上八点。", "Wǎnshang bā diǎn.", ["Listen. When is the dinner?", "استمع. متى العشاء؟"], [["8 pm", "8 مساءً"], ["8 am", "8 صباحاً"], ["4 pm", "4 بعد الظهر"]], ["晚上 is the evening.", "晚上 تعني المساء."]),
        say("太好了", "tài hǎo le", ["Hua says your room has a sea view. Say: great!", "هُوا يقول إن غرفتك تطلّ على البحر. قل: رائع!"], { hua: { zh: "您的房间可以看海。", pinyin: "Nín de fángjiān kěyǐ kàn hǎi." } }),
        order(["Put the words in order: what time is breakfast?", "رتّب الكلمات: متى الفطور؟"], ["早饭", "几", "点"], "Zǎofàn jǐ diǎn?", ["What time is breakfast?", "متى الفطور؟"]),
      ],
      canDo: true,
    }),
  ],
};

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT3: Unit = {
  key: "m1.u3",
  number: 3,
  title: tx(["Finding Your Way", "اعرف طريقك"]),
  zh: "出行",
  outcome: tx(["Ask for directions, follow left and right, and buy a train ticket.", "اسأل عن الطريق، وافهم يمينًا ويسارًا، واشترِ تذكرة قطار."]),
  canDo: [
    tx(["I can ask where a place is.", "أستطيع أن أسأل أين يقع مكان ما."]),
    tx(["I can understand go straight, turn left and turn right.", "أستطيع أن أفهم «امشِ إلى الأمام» و«انعطف يسارًا» و«انعطف يمينًا»."]),
    tx(["I can buy a train ticket for a time I choose.", "أستطيع أن أشتري تذكرة قطار في الوقت الذي أختاره."]),
  ],
  lessons: [
    lesson({
      key: "m1.u3.l1",
      title: ["Asking the Way", "السؤال عن الطريق"],
      zh: "问路",
      goal: ["Ask where something is and follow simple directions.", "اسأل أين يقع شيء ما واتبع إرشادات بسيطة."],
      minutes: 8,
      scene: {
        title: ["Looking for the metro in Shanghai", "البحث عن المترو في شنغهاي"],
        lines: [
          ["b", OMAR, "请问，地铁站在哪儿？", "Qǐngwèn, dìtiě zhàn zài nǎr?", "Excuse me, where is the metro station?", "لو سمحت، أين محطة المترو؟"],
          ["a", PASSER, "往前走，然后往左拐。", "Wǎng qián zǒu, ránhòu wǎng zuǒ guǎi.", "Go straight ahead, then turn left.", "امشِ إلى الأمام، ثم انعطف يسارًا."],
          ["b", OMAR, "远吗？", "Yuǎn ma?", "Is it far?", "هل هي بعيدة؟"],
          ["a", PASSER, "不远，五分钟。", "Bù yuǎn, wǔ fēnzhōng.", "Not far, five minutes.", "ليست بعيدة، خمس دقائق."],
          ["b", OMAR, "谢谢！", "Xièxie!", "Thank you!", "شكراً!"],
        ],
      },
      words: [
        word("请问", "qǐngwèn", "تْشِينْغ وِنْ", ["Excuse me (to ask)", "لو سمحت (للسؤال)"], ["Start any question to a stranger with 请问. It means may I ask.", "ابدأ أي سؤال لشخص لا تعرفه بـ请问، ومعناها «اسمح لي أن أسأل»."]),
        word("在哪儿", "zài nǎr", "دْزَايْ نَارْ", ["Where is…?", "أين…؟"], ["The place comes first: 地铁站在哪儿？ The metro station is where?", "المكان يأتي أولًا: 地铁站在哪儿؟ أي المحطة أين؟"]),
        word("往左拐", "wǎng zuǒ guǎi", "وَانْغ دْزْوُو كْوَايْ", ["Turn left", "انعطف يسارًا"]),
        word("往右拐", "wǎng yòu guǎi", "وَانْغ يُو كْوَايْ", ["Turn right", "انعطف يمينًا"]),
        word("地铁站", "dìtiě zhàn", "دِي تْيِه جَانْ", ["Metro station", "محطة المترو"]),
        word("远", "yuǎn", "يُوَانْ", ["Far", "بعيد"], ["不远 is not far. 远吗？ is it far?", "不远 تعني ليس بعيدًا، و远吗؟ تعني هل هو بعيد؟"]),
      ],
      notes: [
        {
          title: ["Place + 在哪儿?", "المكان + 在哪儿؟"],
          body: ["Swap in any place and you can find anything.", "ضع أي مكان، وستجد أي شيء."],
          examples: [
            { zh: "洗手间在哪儿？", pinyin: "Xǐshǒujiān zài nǎr?", meaning: ["Where is the restroom?", "أين دورة المياه؟"] },
            { zh: "出口在哪儿？", pinyin: "Chūkǒu zài nǎr?", meaning: ["Where is the exit?", "أين المخرج؟"] },
            { zh: "清真寺在哪儿？", pinyin: "Qīngzhēnsì zài nǎr?", meaning: ["Where is the mosque?", "أين المسجد؟"] },
          ],
        },
      ],
      say: [
        say("地铁站在哪儿", "dìtiě zhàn zài nǎr", ["Ask: where is the metro station?", "اسأل: أين محطة المترو؟"], { tip: ["Start with 请问 if you're talking to a stranger.", "ابدأ بـ请问 إذا كنت تكلّم شخصًا لا تعرفه."] }),
        say("远吗", "yuǎn ma", ["Ask: is it far?", "اسأل: هل هي بعيدة؟"]),
      ],
      use: [
        pickZh(["You want to ask a stranger the way. How do you start?", "تريد أن تسأل شخصًا لا تعرفه عن الطريق. بماذا تبدأ؟"], [{ zh: "请问", pinyin: "qǐngwèn" }, { zh: "再见", pinyin: "zàijiàn" }, { zh: "太贵了", pinyin: "tài guì le" }], ["请问 means may I ask. It opens any polite question.", "请问 تعني اسمح لي أن أسأل، وتبدأ بها أي سؤال مهذّب."]),
        listen("往右拐。", "Wǎng yòu guǎi.", ["Listen. Which way?", "استمع. إلى أي اتجاه؟"], [["Turn right", "انعطف يمينًا"], ["Turn left", "انعطف يسارًا"], ["Go straight", "امشِ إلى الأمام"]], ["右 is right and 左 is left.", "右 تعني اليمين، و左 تعني اليسار."]),
        say("洗手间在哪儿", "xǐshǒujiān zài nǎr", ["Ask Hua where the restroom is.", "اسأل هُوا أين دورة المياه."]),
        order(["Put the words in order: where is the metro station?", "رتّب الكلمات: أين محطة المترو؟"], ["地铁站", "在", "哪儿"], "Dìtiě zhàn zài nǎr?", ["Where is the metro station?", "أين محطة المترو؟"]),
      ],
    }),
    lesson({
      key: "m1.u3.l2",
      title: ["Taking the Train", "ركوب القطار"],
      zh: "坐高铁",
      goal: ["Buy a high-speed train ticket for the time you want.", "اشترِ تذكرة قطار سريع في الوقت الذي تريده."],
      minutes: 8,
      scene: {
        title: ["At the ticket office in Shanghai", "عند شبّاك التذاكر في شنغهاي"],
        lines: [
          ["b", OMAR, "您好！我要一张去北京的票。", "Nín hǎo! Wǒ yào yì zhāng qù Běijīng de piào.", "Hello! I'd like a ticket to Beijing.", "مرحباً! أريد تذكرة إلى بكين."],
          ["a", CLERK, "几点的？", "Jǐ diǎn de?", "For what time?", "في أي ساعة؟"],
          ["b", OMAR, "下午两点的。", "Xiàwǔ liǎng diǎn de.", "The 2 pm one.", "تذكرة الساعة الثانية بعد الظهر."],
          ["a", CLERK, "好的。请给我您的护照。", "Hǎo de. Qǐng gěi wǒ nín de hùzhào.", "OK. Your passport, please.", "حسناً. جواز سفرك من فضلك."],
          ["b", OMAR, "给您。谢谢！", "Gěi nín. Xièxie!", "Here you are. Thank you!", "تفضّل. شكراً!"],
        ],
      },
      words: [
        word("票", "piào", "بِيَاوْ", ["Ticket", "تذكرة"]),
        word("高铁", "gāotiě", "كَاوْ تْيِه", ["High-speed train", "القطار السريع"], ["China's bullet trains link most big cities. You show your passport to buy a ticket and to board.", "القطارات السريعة تربط معظم المدن الكبرى في الصين. تُظهر جواز سفرك لشراء التذكرة وللصعود."]),
        word("下午", "xiàwǔ", "شِيَا وُو", ["Afternoon, pm", "بعد الظهر"]),
        word("上午", "shàngwǔ", "شَانْغ وُو", ["Morning, am", "قبل الظهر"]),
        word("一张", "yì zhāng", "يِي جَانْغ", ["One (ticket, card, sheet)", "واحدة (تذكرة أو بطاقة أو ورقة)"], ["张 is the counting word for flat things: tickets, business cards, tables.", "张 كلمة العدّ للأشياء المسطّحة: التذاكر وبطاقات العمل والطاولات."]),
      ],
      notes: [
        {
          title: ["两 or 二?", "两 أم 二؟"],
          body: ["Both mean two. Count with 二 (一、二、三), but say 两 before a counting word or 点: 两张票, 两点.", "كلاهما يعني اثنين. استخدم 二 في العدّ (一、二、三)، وقل 两 قبل كلمة العدّ أو 点: 两张票 و两点."],
          examples: [
            { zh: "两点", pinyin: "liǎng diǎn", meaning: ["Two o'clock", "الساعة الثانية"] },
            { zh: "两张票", pinyin: "liǎng zhāng piào", meaning: ["Two tickets", "تذكرتان"] },
          ],
        },
      ],
      say: [
        say("我要一张票", "wǒ yào yì zhāng piào", ["Say: I'd like one ticket.", "قل: أريد تذكرة واحدة."]),
        say("下午两点", "xiàwǔ liǎng diǎn", ["Say: 2 pm.", "قل: الثانية بعد الظهر."]),
      ],
      use: [
        listen("上午十点的。", "Shàngwǔ shí diǎn de.", ["Listen. Which train?", "استمع. أي قطار؟"], [["10 am", "10 صباحاً"], ["10 pm", "10 مساءً"], ["2 pm", "2 بعد الظهر"]], ["上午 is the morning, before noon.", "上午 تعني الصباح، قبل الظهر."]),
        pickZh(["You need two tickets. What do you say?", "تحتاج إلى تذكرتين. ماذا تقول؟"], [{ zh: "两张票", pinyin: "liǎng zhāng piào" }, { zh: "二张票", pinyin: "èr zhāng piào" }, { zh: "两点", pinyin: "liǎng diǎn" }], ["Before a counting word like 张, two is 两.", "قبل كلمة عدّ مثل 张 نقول 两."]),
        say("我要一张票", "wǒ yào yì zhāng piào", ["Hua sells tickets today. Ask him for one.", "هُوا يبيع التذاكر اليوم. اطلب منه تذكرة."], { hua: { zh: "您好！去哪儿？", pinyin: "Nín hǎo! Qù nǎr?" } }),
        order(["Put the words in order: I'd like one ticket.", "رتّب الكلمات: أريد تذكرة واحدة."], ["我", "要", "一张", "票"], "Wǒ yào yì zhāng piào.", ["I'd like one ticket.", "أريد تذكرة واحدة."]),
      ],
      canDo: true,
    }),
  ],
};

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT4: Unit = {
  key: "m1.u4",
  number: 4,
  title: tx(["Business Meetings", "اجتماعات العمل"]),
  zh: "商务会议",
  outcome: tx(["Introduce yourself and your company, use titles and set up a meeting.", "قدّم نفسك وشركتك، واستخدم الألقاب، وحدّد موعد اجتماع."]),
  canDo: [
    tx(["I can say which company I'm from and where it is.", "أستطيع أن أقول من أي شركة أنا وأين تقع."]),
    tx(["I can address people by surname and title.", "أستطيع أن أخاطب الناس باسم العائلة واللقب."]),
    tx(["I can ask if someone has time and agree a day and hour.", "أستطيع أن أسأل إن كان لدى أحد وقت، وأن أتّفق على يوم وساعة."]),
  ],
  lessons: [
    lesson({
      key: "m1.u4.l1",
      title: ["Introducing Your Company", "تقديم شركتك"],
      zh: "介绍公司",
      goal: ["Say who you are, which company you're from and where it is.", "قل من أنت، ومن أي شركة، وأين تقع."],
      minutes: 9,
      scene: {
        title: ["At a trade fair in Guangzhou", "في معرض تجاري في قوانغتشو"],
        lines: [
          ["a", LI, "您好！我是李经理。", "Nín hǎo! Wǒ shì Lǐ jīnglǐ.", "Hello! I'm Manager Li.", "مرحباً! أنا المدير لي."],
          ["b", OMAR, "李经理，您好！我是 Omar，ABC 公司的。", "Lǐ jīnglǐ, nín hǎo! Wǒ shì Omar, ABC gōngsī de.", "Hello, Manager Li! I'm Omar, from ABC Company.", "مرحباً يا مدير لي! أنا عمر، من شركة ABC."],
          ["a", LI, "你们公司在哪儿？", "Nǐmen gōngsī zài nǎr?", "Where is your company?", "أين تقع شركتكم؟"],
          ["b", OMAR, "我们公司在迪拜。", "Wǒmen gōngsī zài Díbài.", "Our company is in Dubai.", "شركتنا في دبي."],
          ["a", LI, "欢迎欢迎！", "Huānyíng huānyíng!", "Welcome, welcome!", "أهلاً وسهلاً!"],
        ],
      },
      words: [
        word("公司", "gōngsī", "كُونْغ سِ", ["Company", "شركة"], ["The s in sī is a buzz, not سي.", "صوت s في sī طنين خفيف، وليس «سي»."]),
        word("经理", "jīnglǐ", "جِينْغ لِي", ["Manager", "مدير"]),
        word("我们", "wǒmen", "وُو مِنْ", ["We, us", "نحن"], ["们 makes a plural: 你们 is you all, 他们 is they.", "们 تجعل الضمير جمعًا: 你们 أنتم، و他们 هم."]),
        word("是", "shì", "شْ", ["To be (am, is, are)", "يكون"], ["是 links two nouns: 我是 Omar. It never changes.", "是 تربط بين اسمين: 我是 Omar، ولا تتغيّر أبدًا."]),
        word("迪拜", "Díbài", "دِي بَايْ", ["Dubai", "دبي"], ["阿联酋 (Āliánqiú) is the UAE.", "阿联酋 (Āliánqiú) تعني الإمارات."], true),
      ],
      notes: [
        {
          title: ["Surname + title", "اسم العائلة + اللقب"],
          body: ["In business, people are called by surname and title, not first name. 总 (zǒng), short for 总经理, is for the boss.", "في العمل يُنادى الناس باسم العائلة واللقب، لا بالاسم الأول. ولقب 总 (zǒng) اختصار 总经理 للمدير العام."],
          examples: [
            { zh: "李经理", pinyin: "Lǐ jīnglǐ", meaning: ["Manager Li", "المدير لي"] },
            { zh: "王总", pinyin: "Wáng zǒng", meaning: ["Mr Wang (the boss)", "السيد وانغ (المدير العام)"] },
            { zh: "张老师", pinyin: "Zhāng lǎoshī", meaning: ["Teacher Zhang", "الأستاذ تشانغ"] },
          ],
        },
      ],
      say: [
        say("我们公司在迪拜", "wǒmen gōngsī zài Díbài", ["Say: our company is in Dubai.", "قل: شركتنا في دبي."]),
        say("李经理您好", "Lǐ jīnglǐ nín hǎo", ["Greet Manager Li.", "حيِّ المدير لي."], { tip: ["Lǐ and the first syllable of jīnglǐ: keep jīng high.", "أبقِ jīng عالية ومستوية."] }),
      ],
      use: [
        pickZh(["You meet Mr Zhang, the general manager. How do you greet him?", "تقابل السيد تشانغ، المدير العام. كيف تحيّيه؟"], [{ zh: "张总，您好！", pinyin: "Zhāng zǒng, nín hǎo!" }, { zh: "小张，你好！", pinyin: "Xiǎo Zhāng, nǐ hǎo!" }, { zh: "张，你好！", pinyin: "Zhāng, nǐ hǎo!" }], ["Surname + 总 with 您好 shows respect. 小张 is for someone younger or junior.", "اسم العائلة + 总 مع 您好 يُظهر الاحترام. أما 小张 فتُقال لمن هو أصغر سنًّا أو أقل منصبًا."]),
        listen("你们公司在哪儿？", "Nǐmen gōngsī zài nǎr?", ["Listen. What are they asking?", "استمع. ماذا يسألون؟"], [["Where is your company?", "أين تقع شركتكم؟"], ["What's your name?", "ما اسمك؟"], ["Is it far?", "هل هو بعيد؟"]], ["你们公司 is your company, 在哪儿 is where.", "你们公司 تعني شركتكم، و在哪儿 تعني أين."]),
        say("我们公司在迪拜", "wǒmen gōngsī zài Díbài", ["Hua asks where your company is. Tell him.", "هُوا يسأل أين تقع شركتك. أخبره."], { hua: { zh: "你们公司在哪儿？", pinyin: "Nǐmen gōngsī zài nǎr?" } }),
        order(["Put the words in order: our company is in Dubai.", "رتّب الكلمات: شركتنا في دبي."], ["我们", "公司", "在", "迪拜"], "Wǒmen gōngsī zài Díbài.", ["Our company is in Dubai.", "شركتنا في دبي."]),
      ],
    }),
    lesson({
      key: "m1.u4.l2",
      title: ["Setting Up a Meeting", "تحديد موعد"],
      zh: "约时间",
      goal: ["Ask if someone has time, agree a time and say see you then.", "اسأل إن كان لدى أحد وقت، واتّفق على موعد، وقل إلى اللقاء."],
      minutes: 9,
      scene: {
        title: ["On the phone with Manager Li", "على الهاتف مع المدير لي"],
        lines: [
          ["b", OMAR, "李经理，明天您有时间吗？", "Lǐ jīnglǐ, míngtiān nín yǒu shíjiān ma?", "Manager Li, do you have time tomorrow?", "يا مدير لي، هل لديك وقت غدًا؟"],
          ["a", LI, "有。下午三点怎么样？", "Yǒu. Xiàwǔ sān diǎn zěnmeyàng?", "Yes. How about 3 pm?", "نعم. ما رأيك في الثالثة بعد الظهر؟"],
          ["b", OMAR, "好的，没问题。", "Hǎo de, méi wèntí.", "OK, no problem.", "حسناً، لا مشكلة."],
          ["a", LI, "明天见！", "Míngtiān jiàn!", "See you tomorrow!", "إلى اللقاء غدًا!"],
          ["b", OMAR, "明天见！", "Míngtiān jiàn!", "See you tomorrow!", "إلى اللقاء غدًا!"],
        ],
      },
      words: [
        word("明天", "míngtiān", "مِينْغ تِيَانْ", ["Tomorrow", "غدًا"]),
        word("有时间", "yǒu shíjiān", "يُو شْ جِيَانْ", ["To have time", "لديه وقت"]),
        word("怎么样", "zěnmeyàng", "دْزِنْ مَه يَانْغ", ["How about…?", "ما رأيك في…؟"], ["Put it after an idea to suggest it: 三点怎么样？", "ضعها بعد الاقتراح: 三点怎么样؟ أي ما رأيك في الثالثة؟"]),
        word("没问题", "méi wèntí", "مَيْ وِنْ تِي", ["No problem", "لا مشكلة"]),
        word("今天", "jīntiān", "جِينْ تِيَانْ", ["Today", "اليوم"]),
      ],
      notes: [
        {
          title: ["吗 makes a yes/no question", "吗 تجعل الجملة سؤالًا"],
          body: ["Add 吗 to the end of a sentence, a bit like هل at the start in Arabic. To answer yes, repeat the verb: 有. For no: 没有.", "أضف 吗 في آخر الجملة، كما نضع «هل» في أولها بالعربية. للإجابة بنعم كرّر الفعل: 有، وللنفي: 没有."],
          examples: [
            { zh: "您有时间吗？", pinyin: "Nín yǒu shíjiān ma?", meaning: ["Do you have time?", "هل لديك وقت؟"] },
            { zh: "有。", pinyin: "Yǒu.", meaning: ["Yes (I have).", "نعم (لديّ)."] },
            { zh: "没有。", pinyin: "Méiyǒu.", meaning: ["No (I don't).", "لا (ليس لديّ)."] },
          ],
        },
        {
          title: ["见 for see you", "见 تعني إلى اللقاء"],
          body: ["A time + 见 means see you then: 明天见, see you tomorrow. 再见 means see you again.", "الوقت + 见 يعني أراك حينها: 明天见 أراك غدًا، و再见 أراك مرة أخرى."],
        },
      ],
      say: [
        say("明天您有时间吗", "míngtiān nín yǒu shíjiān ma", ["Ask: do you have time tomorrow?", "اسأل: هل لديك وقت غدًا؟"]),
        say("没问题", "méi wèntí", ["Say: no problem.", "قل: لا مشكلة."]),
        say("明天见", "míngtiān jiàn", ["Say: see you tomorrow.", "قل: أراك غدًا."]),
      ],
      use: [
        listen("下午三点怎么样？", "Xiàwǔ sān diǎn zěnmeyàng?", ["Listen. What does Manager Li suggest?", "استمع. ماذا يقترح المدير لي؟"], [["3 pm", "الثالثة بعد الظهر"], ["3 am", "الثالثة صباحاً"], ["Tomorrow morning", "صباح الغد"]], ["下午 is the afternoon, 三点 is three o'clock, and 怎么样 suggests it.", "下午 بعد الظهر، و三点 الساعة الثالثة، و怎么样 للاقتراح."]),
        say("没问题", "méi wèntí", ["Hua suggests a time. Say: no problem.", "هُوا يقترح موعدًا. قل: لا مشكلة."], { hua: { zh: "明天上午十点怎么样？", pinyin: "Míngtiān shàngwǔ shí diǎn zěnmeyàng?" } }),
        say("明天见", "míngtiān jiàn", ["Hua says see you tomorrow. Say it back.", "هُوا يقول أراك غدًا. ردّ عليه."], { hua: { zh: "明天见！", pinyin: "Míngtiān jiàn!" } }),
        order(["Put the words in order: do you have time today?", "رتّب الكلمات: هل لديك وقت اليوم؟"], ["今天", "您", "有时间", "吗"], "Jīntiān nín yǒu shíjiān ma?", ["Do you have time today?", "هل لديك وقت اليوم؟"]),
      ],
      canDo: true,
    }),
  ],
};

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT5: Unit = {
  key: "m1.u5",
  number: 5,
  title: tx(["The Business Dinner", "عشاء العمل"]),
  zh: "商务宴请",
  outcome: tx(["Order halal food, say what you don't eat or drink and join a toast with tea.", "اطلب طعامًا حلالًا، وقل ما لا تأكله أو تشربه، وشارك في نخب بالشاي."]),
  canDo: [
    tx(["I can ask for halal food and say I don't eat pork.", "أستطيع أن أطلب طعامًا حلالًا وأن أقول إنني لا آكل لحم الخنزير."]),
    tx(["I can order by pointing and saying 我要这个.", "أستطيع أن أطلب بالإشارة وقول 我要这个."]),
    tx(["I can join a toast politely without alcohol.", "أستطيع أن أشارك في نخب بأدب دون كحول."]),
  ],
  lessons: [
    lesson({
      key: "m1.u5.l1",
      title: ["Ordering Halal", "طلب الطعام الحلال"],
      zh: "点清真菜",
      goal: ["Ask for halal dishes, order by pointing and say what you don't eat.", "اطلب أطباقًا حلالًا، واطلب بالإشارة، وقل ما لا تأكله."],
      minutes: 9,
      scene: {
        title: ["At a restaurant with Manager Li", "في مطعم مع المدير لي"],
        lines: [
          ["a", WAITER, "您好！这是菜单。", "Nín hǎo! Zhè shì càidān.", "Hello! Here's the menu.", "مرحباً! هذه قائمة الطعام."],
          ["b", OMAR, "有清真菜吗？", "Yǒu qīngzhēn cài ma?", "Do you have halal dishes?", "هل لديكم أطباق حلال؟"],
          ["a", WAITER, "有。牛肉面很好吃。", "Yǒu. Niúròu miàn hěn hǎochī.", "Yes. The beef noodles are delicious.", "نعم. نودلز اللحم البقري لذيذة جدًا."],
          ["b", OMAR, "好，我要这个。我不吃猪肉。", "Hǎo, wǒ yào zhège. Wǒ bù chī zhūròu.", "OK, I'll have this. I don't eat pork.", "حسناً، أريد هذا. أنا لا آكل لحم الخنزير."],
          ["a", WAITER, "好的，没问题。", "Hǎo de, méi wèntí.", "Sure, no problem.", "حسناً، لا مشكلة."],
        ],
      },
      words: [
        word("清真", "qīngzhēn", "تْشِينْغ جِنْ", ["Halal", "حلال"], ["Look for 清真 on signs and menus. A 清真寺 is a mosque.", "ابحث عن 清真 على اللافتات وقوائم الطعام. و清真寺 تعني المسجد."]),
        word("菜单", "càidān", "تْسَايْ دَانْ", ["Menu", "قائمة الطعام"], ["c is like تس in one quick sound.", "صوت c مثل «تس» بسرعة في صوت واحد."]),
        word("我要这个", "wǒ yào zhège", "وُو يَاوْ جَه كَه", ["I'll have this one", "أريد هذا"], ["Point at a picture and say it. It works everywhere.", "أشِر إلى الصورة وقلها، وستنجح في كل مكان."]),
        word("猪肉", "zhūròu", "جُو رُو", ["Pork", "لحم الخنزير"]),
        word("好吃", "hǎochī", "هَاوْ تْشْ", ["Delicious", "لذيذ"]),
        word("牛肉", "niúròu", "نِيُو رُو", ["Beef", "لحم البقر"], ["羊肉 (yángròu) is lamb and 鸡肉 (jīròu) is chicken.", "羊肉 (yángròu) لحم الضأن، و鸡肉 (jīròu) لحم الدجاج."]),
      ],
      notes: [
        {
          title: ["Halal in China", "الحلال في الصين"],
          body: ["China has millions of Muslims, and halal restaurants in every big city. Lanzhou beef noodle shops (兰州牛肉面) are usually halal. Look for the green 清真 sign.", "في الصين ملايين المسلمين، ومطاعم حلال في كل مدينة كبيرة. ومحلات نودلز لانتشو باللحم البقري (兰州牛肉面) حلال في الغالب. ابحث عن لافتة 清真 الخضراء."],
          examples: [
            { zh: "我不吃猪肉。", pinyin: "Wǒ bù chī zhūròu.", meaning: ["I don't eat pork.", "لا آكل لحم الخنزير."] },
            { zh: "附近有清真餐厅吗？", pinyin: "Fùjìn yǒu qīngzhēn cāntīng ma?", meaning: ["Is there a halal restaurant nearby?", "هل يوجد مطعم حلال قريب؟"] },
          ],
        },
      ],
      say: [
        say("有清真菜吗", "yǒu qīngzhēn cài ma", ["Ask: do you have halal dishes?", "اسأل: هل لديكم أطباق حلال؟"]),
        say("我不吃猪肉", "wǒ bù chī zhūròu", ["Say: I don't eat pork.", "قل: لا آكل لحم الخنزير."]),
        say("我要这个", "wǒ yào zhège", ["Point at a dish and say: I'll have this.", "أشِر إلى طبق وقل: أريد هذا."]),
      ],
      use: [
        pick(["You see a green sign that says 清真. What does it mean?", "ترى لافتة خضراء مكتوبًا عليها 清真. ماذا تعني؟"], [["Halal", "حلال"], ["Open", "مفتوح"], ["Exit", "مخرج"]], ["清真 is halal. You'll see it on restaurants and food packets.", "清真 تعني حلال، وستراها على المطاعم وعبوات الطعام."]),
        say("有清真菜吗", "yǒu qīngzhēn cài ma", ["Hua is your waiter. Ask if they have halal dishes.", "هُوا هو النادل. اسأله إن كان لديهم أطباق حلال."], { hua: { zh: "您好！这是菜单。", pinyin: "Nín hǎo! Zhè shì càidān." } }),
        listen("牛肉面很好吃。", "Niúròu miàn hěn hǎochī.", ["Listen. What does the waiter recommend?", "استمع. بماذا ينصح النادل؟"], [["Beef noodles", "نودلز باللحم البقري"], ["Chicken rice", "أرز بالدجاج"], ["Lamb soup", "شوربة لحم الضأن"]], ["牛肉 is beef and 面 is noodles.", "牛肉 لحم البقر، و面 النودلز."]),
        order(["Put the words in order: I don't eat pork.", "رتّب الكلمات: لا آكل لحم الخنزير."], ["我", "不", "吃", "猪肉"], "Wǒ bù chī zhūròu.", ["I don't eat pork.", "لا آكل لحم الخنزير."]),
      ],
    }),
    lesson({
      key: "m1.u5.l2",
      title: ["Toasts and Thanks", "الأنخاب والشكر"],
      zh: "以茶代酒",
      goal: ["Join a toast with tea, wish success and thank your host.", "شارك في النخب بالشاي، وتمنَّ النجاح، واشكر مضيفك."],
      minutes: 9,
      scene: {
        title: ["Dinner with Manager Li", "العشاء مع المدير لي"],
        lines: [
          ["a", LI, "来，干杯！", "Lái, gānbēi!", "Come on, cheers!", "هيا، في صحتكم!"],
          ["b", OMAR, "我不喝酒。我以茶代酒！", "Wǒ bù hē jiǔ. Wǒ yǐ chá dài jiǔ!", "I don't drink alcohol. I'll toast with tea!", "أنا لا أشرب الكحول. سأشارك بالشاي!"],
          ["a", LI, "没问题！合作愉快！", "Méi wèntí! Hézuò yúkuài!", "No problem! To a great partnership!", "لا مشكلة! نخب شراكة ناجحة!"],
          ["b", OMAR, "合作愉快！谢谢您的招待。", "Hézuò yúkuài! Xièxie nín de zhāodài.", "To our partnership! Thank you for your hospitality.", "نخب شراكتنا! شكراً على حسن ضيافتك."],
        ],
      },
      words: [
        word("干杯", "gānbēi", "كَانْ بَيْ", ["Cheers!", "في صحتكم!"], ["It means dry the glass. With tea or juice, a small sip is fine.", "معناها جفّف الكأس. ومع الشاي أو العصير تكفي رشفة صغيرة."]),
        word("我不喝酒", "wǒ bù hē jiǔ", "وُو بُو هَه جِيُو", ["I don't drink alcohol", "لا أشرب الكحول"]),
        word("以茶代酒", "yǐ chá dài jiǔ", "يِي تْشَا دَايْ جِيُو", ["Tea in place of wine", "الشاي بدل الخمر"], ["A classic, polite phrase. Raise your tea and everyone understands.", "عبارة تقليدية مهذّبة. ارفع كوب الشاي وسيفهم الجميع."]),
        word("合作愉快", "hézuò yúkuài", "هَه دْزْوُو يُوي كْوَايْ", ["To a great partnership", "نخب شراكة ناجحة"], ["Use it for toasts, at the end of a meeting and in messages.", "استخدمها في الأنخاب وفي نهاية الاجتماع وفي الرسائل."]),
        word("谢谢您的招待", "xièxie nín de zhāodài", "شْيِه شْيِه نِينْ دَه جَاوْ دَايْ", ["Thank you for your hospitality", "شكراً على حسن ضيافتك"]),
      ],
      notes: [
        {
          title: ["Banquet manners", "آداب المأدبة"],
          body: ["The host sits facing the door and the guest of honour sits on the host's right. Wait for the host to start. When you toast someone senior, hold your glass a little lower than theirs.", "يجلس المضيف مقابل الباب، وضيف الشرف عن يمينه. انتظر حتى يبدأ المضيف. وعند النخب مع شخص أعلى منصبًا اجعل كأسك أخفض قليلًا من كأسه."],
        },
      ],
      say: [
        say("我不喝酒", "wǒ bù hē jiǔ", ["Say: I don't drink alcohol.", "قل: لا أشرب الكحول."]),
        say("以茶代酒", "yǐ chá dài jiǔ", ["Say: tea in place of wine.", "قل: الشاي بدل الخمر."]),
        say("合作愉快", "hézuò yúkuài", ["Toast: to a great partnership!", "اشرب النخب: نخب شراكة ناجحة!"]),
      ],
      use: [
        pickZh(["Manager Li raises his glass: 干杯！ You don't drink alcohol. What's the best reply?", "يرفع المدير لي كأسه: 干杯! أنت لا تشرب الكحول. ما أفضل رد؟"], [{ zh: "我以茶代酒！", pinyin: "Wǒ yǐ chá dài jiǔ!" }, { zh: "太贵了！", pinyin: "Tài guì le!" }, { zh: "我不舒服。", pinyin: "Wǒ bù shūfu." }], ["以茶代酒 lets you join the toast politely with tea.", "以茶代酒 تتيح لك المشاركة في النخب بأدب بكوب شاي."]),
        say("以茶代酒", "yǐ chá dài jiǔ", ["Hua raises his glass. Join the toast with tea.", "هُوا يرفع كأسه. شارك في النخب بالشاي."], { hua: { zh: "来，干杯！", pinyin: "Lái, gānbēi!" } }),
        pick(["You're toasting Mr Wang, the boss. How do you hold your glass?", "تشرب نخب السيد وانغ، المدير العام. كيف تمسك كأسك؟"], [["A little lower than his", "أخفض قليلًا من كأسه"], ["Higher than his", "أعلى من كأسه"], ["On the table", "على الطاولة"]], ["A lower glass is a small sign of respect.", "الكأس الأخفض علامة احترام صغيرة."]),
        order(["Put the words in order: thank you for your hospitality.", "رتّب الكلمات: شكراً على حسن ضيافتك."], ["谢谢", "您的", "招待"], "Xièxie nín de zhāodài.", ["Thank you for your hospitality.", "شكراً على حسن ضيافتك."]),
      ],
      canDo: true,
    }),
  ],
};

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT6: Unit = {
  key: "m1.u6",
  number: 6,
  title: tx(["Deals and Prices", "الصفقات والأسعار"]),
  zh: "谈价格",
  outcome: tx(["Understand big numbers, ask for a total and negotiate a better price.", "افهم الأرقام الكبيرة، واسأل عن المجموع، وفاوض على سعر أفضل."]),
  canDo: [
    tx(["I can understand prices in the hundreds, thousands and ten-thousands.", "أستطيع أن أفهم الأسعار بالمئات والآلاف وعشرات الآلاف."]),
    tx(["I can ask how much it is in total.", "أستطيع أن أسأل عن المبلغ الإجمالي."]),
    tx(["I can ask for a lower price and close a deal.", "أستطيع أن أطلب سعرًا أقل وأن أُتمّ الصفقة."]),
  ],
  lessons: [
    lesson({
      key: "m1.u6.l1",
      title: ["Big Numbers", "الأرقام الكبيرة"],
      zh: "大数字",
      goal: ["Understand 百, 千 and 万, and ask for a total.", "افهم 百 و千 و万، واسأل عن المجموع."],
      minutes: 10,
      scene: {
        title: ["Getting a quote at a factory in Yiwu", "طلب عرض سعر في مصنع بييوو"],
        lines: [
          ["b", OMAR, "一个多少钱？", "Yí ge duōshao qián?", "How much for one?", "كم سعر القطعة؟"],
          ["a", WANG, "一个五十块。", "Yí ge wǔshí kuài.", "Fifty yuan each.", "خمسون يوانًا للقطعة."],
          ["b", OMAR, "我要一千个。一共多少钱？", "Wǒ yào yìqiān ge. Yígòng duōshao qián?", "I want a thousand. How much in total?", "أريد ألف قطعة. كم المجموع؟"],
          ["a", WANG, "一共五万块。", "Yígòng wǔwàn kuài.", "Fifty thousand yuan in total.", "المجموع خمسون ألف يوان."],
        ],
      },
      words: [
        word("百", "bǎi", "بَايْ", ["Hundred", "مئة"]),
        word("千", "qiān", "تْشِيَانْ", ["Thousand", "ألف"]),
        word("万", "wàn", "وَانْ", ["Ten thousand", "عشرة آلاف"], ["The key business number. 一万 is 10,000.", "أهم رقم في التجارة. 一万 تعني 10,000."]),
        word("一共", "yígòng", "يِي كُونْغ", ["In total", "المجموع"]),
        word("个", "ge", "كَه", ["(counting word)", "(كلمة عدّ)"], ["The general counting word: 一个, 两个, 一千个.", "كلمة العدّ العامة: 一个 و两个 و一千个."]),
      ],
      notes: [
        {
          title: ["万: count in fours", "万: العدّ بأربعة أصفار"],
          body: ["Arabic groups big numbers in threes: ألف, مليون. Mandarin groups them in fours, with 万 for 10,000. So 100,000 is 十万, ten 万, and a million is 一百万, a hundred 万.", "العربية تجمع الأرقام الكبيرة في ثلاثات: ألف ومليون. أما الصينية فتجمعها في أربعات، و万 تعني 10,000. فالـ100,000 هي 十万 أي عشرة 万، والمليون هو 一百万 أي مئة 万."],
          examples: [
            { zh: "五万", pinyin: "wǔwàn", meaning: ["50,000", "50,000"] },
            { zh: "十万", pinyin: "shíwàn", meaning: ["100,000", "100,000"] },
            { zh: "一百万", pinyin: "yìbǎiwàn", meaning: ["1,000,000", "1,000,000"] },
          ],
        },
      ],
      say: [
        say("一共多少钱", "yígòng duōshao qián", ["Ask: how much in total?", "اسأل: كم المجموع؟"]),
        say("一万", "yíwàn", ["Say 10,000.", "قل 10,000."], { tip: ["一 rises before 万: yíwàn.", "ترتفع 一 قبل 万: yíwàn."] }),
      ],
      use: [
        listen("三千。", "Sānqiān.", ["Listen. How many?", "استمع. كم العدد؟"], [["3,000", "3,000"], ["300", "300"], ["30,000", "30,000"]], ["千 is a thousand, so 三千 is 3,000.", "千 تعني ألفًا، إذن 三千 تعني 3,000."]),
        listen("两万。", "Liǎngwàn.", ["Listen. How much?", "استمع. كم المبلغ؟"], [["20,000", "20,000"], ["2,000", "2,000"], ["200,000", "200,000"]], ["万 is ten thousand, so 两万 is 20,000.", "万 تعني عشرة آلاف، إذن 两万 تعني 20,000."]),
        listen("十万。", "Shíwàn.", ["Listen. What's the order size?", "استمع. ما حجم الطلب؟"], [["100,000", "100,000"], ["10,000", "10,000"], ["1,000,000", "1,000,000"]], ["十万 is ten 万: 100,000.", "十万 تعني عشرة 万: أي 100,000."]),
        order(["Put the words in order: how much in total?", "رتّب الكلمات: كم المجموع؟"], ["一共", "多少", "钱"], "Yígòng duōshao qián?", ["How much in total?", "كم المجموع؟"]),
      ],
    }),
    lesson({
      key: "m1.u6.l2",
      title: ["Negotiating", "التفاوض"],
      zh: "讨价还价",
      goal: ["Say it's too expensive, ask for a lower price and close the deal.", "قل إن السعر غالٍ، واطلب سعرًا أقل، وأتمّ الصفقة."],
      minutes: 10,
      scene: {
        title: ["Talking price with Manager Wang", "التفاوض على السعر مع المدير وانغ"],
        lines: [
          ["b", OMAR, "太贵了！能便宜一点吗？", "Tài guì le! Néng piányi yìdiǎn ma?", "That's too expensive! Can you make it a bit cheaper?", "هذا غالٍ جدًا! هل يمكن أن تخفّض السعر قليلًا؟"],
          ["a", WANG, "您要多少个？", "Nín yào duōshao ge?", "How many do you want?", "كم قطعة تريد؟"],
          ["b", OMAR, "我要五千个。", "Wǒ yào wǔqiān ge.", "I want five thousand.", "أريد خمسة آلاف قطعة."],
          ["a", WANG, "好吧，一个四十块。", "Hǎo ba, yí ge sìshí kuài.", "All right, forty yuan each.", "حسناً، أربعون يوانًا للقطعة."],
          ["b", OMAR, "成交！合作愉快！", "Chéngjiāo! Hézuò yúkuài!", "Deal! To a great partnership!", "اتفقنا! نخب شراكة ناجحة!"],
        ],
      },
      words: [
        word("太贵了", "tài guì le", "تَايْ كْوَيْ لَه", ["Too expensive", "غالٍ جدًا"]),
        word("便宜一点", "piányi yìdiǎn", "بِيَانْ يِي يِي دِيَانْ", ["A bit cheaper", "أرخص قليلًا"]),
        word("能…吗", "néng…ma", "نَنْغ مَا", ["Can you…?", "هل يمكنك…؟"], ["能 is can. Wrap a request in 能…吗 to make it a polite question.", "能 تعني يستطيع. ضع الطلب بين 能…吗 ليصبح سؤالًا مهذّبًا."]),
        word("成交", "chéngjiāo", "تْشَنْغ جِيَاوْ", ["Deal!", "اتفقنا!"]),
        word("打折", "dǎzhé", "دَا جَه", ["Discount", "خصم"], ["Careful: 打八折 means pay 80%, a 20% discount.", "انتبه: 打八折 تعني أن تدفع 80%، أي خصم 20%."]),
      ],
      notes: [
        {
          title: ["How bargaining works", "كيف تتم المساومة"],
          body: ["In markets and factories the first price is an opening offer. Stay friendly, ask 能便宜一点吗？ and order more for a better price. In malls and chain stores, prices are fixed.", "في الأسواق والمصانع السعر الأول مجرد بداية. ابقَ لطيفًا، واسأل 能便宜一点吗؟ واطلب كمية أكبر لتحصل على سعر أفضل. أما في المراكز التجارية والمتاجر الكبرى فالأسعار ثابتة."],
        },
      ],
      say: [
        say("太贵了", "tài guì le", ["Say: that's too expensive!", "قل: هذا غالٍ جدًا!"]),
        say("能便宜一点吗", "néng piányi yìdiǎn ma", ["Ask: can you make it a bit cheaper?", "اسأل: هل يمكن أن تخفّض السعر قليلًا؟"]),
        say("成交", "chéngjiāo", ["Close the deal: deal!", "أتمّ الصفقة: اتفقنا!"]),
      ],
      use: [
        listen("好吧，一个四十块。", "Hǎo ba, yí ge sìshí kuài.", ["Listen. What's the new price?", "استمع. ما السعر الجديد؟"], [["40 yuan each", "40 يوانًا للقطعة"], ["14 yuan each", "14 يوانًا للقطعة"], ["400 yuan each", "400 يوان للقطعة"]], ["四十 is forty: four tens. 十四 would be fourteen.", "四十 تعني أربعين، أي أربع عشرات. أما 十四 فتعني أربعة عشر."]),
        say("能便宜一点吗", "néng piányi yìdiǎn ma", ["Hua quotes you a price. Ask for a bit less.", "هُوا يعطيك سعرًا. اطلب تخفيضًا بسيطًا."], { hua: { zh: "一个五十块。", pinyin: "Yí ge wǔshí kuài." } }),
        pick(["A shop sign says 打八折. What does it mean?", "لافتة متجر تقول 打八折. ماذا تعني؟"], [["20% off", "خصم 20%"], ["80% off", "خصم 80%"], ["8 yuan off", "خصم 8 يوانات"]], ["八折 means you pay eight tenths of the price.", "八折 تعني أنك تدفع ثمانية أعشار السعر."]),
        order(["Put the words in order: can you make it a bit cheaper?", "رتّب الكلمات: هل يمكن أن تخفّض السعر قليلًا؟"], ["能", "便宜", "一点", "吗"], "Néng piányi yìdiǎn ma?", ["Can you make it a bit cheaper?", "هل يمكن أن تخفّض السعر قليلًا؟"]),
      ],
      canDo: true,
    }),
  ],
};

// ─────────────────────────────────────────────────────────────
export const MOVE_UNIT7: Unit = {
  key: "m1.u7",
  number: 7,
  title: tx(["Staying Connected", "ابقَ على تواصل"]),
  zh: "保持联系",
  outcome: tx(["Swap WeChat and phone numbers, and get help if you feel unwell.", "تبادل أرقام الهاتف وحسابات وي تشات، واطلب المساعدة إذا شعرت بتوعّك."]),
  canDo: [
    tx(["I can offer to add someone on WeChat and keep in touch.", "أستطيع أن أعرض إضافة أحد على وي تشات والبقاء على تواصل."]),
    tx(["I can ask for a phone number.", "أستطيع أن أطلب رقم الهاتف."]),
    tx(["I can say I feel unwell and ask for a hospital.", "أستطيع أن أقول إنني متوعّك وأسأل عن مستشفى."]),
  ],
  lessons: [
    lesson({
      key: "m1.u7.l1",
      title: ["Let's Keep in Touch", "لنبقَ على تواصل"],
      zh: "加微信",
      goal: ["Add a contact on WeChat, ask for a number and say keep in touch.", "أضف جهة اتصال على وي تشات، واطلب رقمًا، وقل لنبقَ على تواصل."],
      minutes: 8,
      scene: {
        title: ["After the meeting", "بعد الاجتماع"],
        lines: [
          ["a", LI, "我们加个微信吧！", "Wǒmen jiā ge Wēixìn ba!", "Let's add each other on WeChat!", "لنضف بعضنا على وي تشات!"],
          ["b", OMAR, "好啊！我扫您。", "Hǎo a! Wǒ sǎo nín.", "Sure! I'll scan your code.", "بكل سرور! سأمسح رمزك."],
          ["a", LI, "您的电话号码是多少？", "Nín de diànhuà hàomǎ shì duōshao?", "What's your phone number?", "ما رقم هاتفك؟"],
          ["b", OMAR, "我发给您。", "Wǒ fā gěi nín.", "I'll send it to you.", "سأرسله لك."],
          ["a", LI, "好的。保持联系！", "Hǎo de. Bǎochí liánxì!", "Great. Let's keep in touch!", "ممتاز. لنبقَ على تواصل!"],
        ],
      },
      words: [
        word("微信", "Wēixìn", "وَيْ شِينْ", ["WeChat", "وي تشات"]),
        word("加微信", "jiā Wēixìn", "جِيَا وَيْ شِينْ", ["Add on WeChat", "الإضافة على وي تشات"], ["吧 at the end makes it a friendly suggestion: let's.", "吧 في آخر الجملة تجعلها اقتراحًا وديًّا: هيا بنا."]),
        word("扫", "sǎo", "سَاوْ", ["To scan", "يمسح (رمزًا)"], ["我扫您 means I'll scan your QR code.", "我扫您 تعني سأمسح رمزك."]),
        word("电话号码", "diànhuà hàomǎ", "دِيَانْ خْوَا هَاوْ مَا", ["Phone number", "رقم الهاتف"]),
        word("保持联系", "bǎochí liánxì", "بَاوْ تْشْ لِيَانْ شِي", ["Keep in touch", "لنبقَ على تواصل"]),
      ],
      notes: [
        {
          title: ["WeChat is the business card", "وي تشات هو بطاقة العمل"],
          body: ["Most business contact in China happens on WeChat: messages, files, voice notes, even payments. Keep your QR code ready on your phone.", "معظم التواصل في العمل في الصين يتم عبر وي تشات: الرسائل والملفات والرسائل الصوتية وحتى الدفع. أبقِ رمز QR الخاص بك جاهزًا على هاتفك."],
        },
        {
          title: ["1 is yāo in phone numbers", "الرقم 1 يُنطق yāo في أرقام الهاتف"],
          body: ["When reading out a phone or room number, 一 (yī) becomes 幺 (yāo), so it isn't mixed up with 七 (qī).", "عند قراءة رقم هاتف أو غرفة يصبح 一 (yī) ‏幺 (yāo)، حتى لا يختلط بـ七 (qī)."],
          examples: [{ zh: "幺三八", pinyin: "yāo sān bā", meaning: ["138 (a phone prefix)", "138 (بداية رقم هاتف)"] }],
        },
      ],
      say: [
        say("我们加个微信吧", "wǒmen jiā ge Wēixìn ba", ["Say: let's add each other on WeChat!", "قل: لنضف بعضنا على وي تشات!"]),
        say("我扫您", "wǒ sǎo nín", ["Say: I'll scan your code.", "قل: سأمسح رمزك."]),
        say("保持联系", "bǎochí liánxì", ["Say: let's keep in touch!", "قل: لنبقَ على تواصل!"]),
      ],
      use: [
        listen("您的电话号码是多少？", "Nín de diànhuà hàomǎ shì duōshao?", ["Listen. What do they want?", "استمع. ماذا يريدون؟"], [["Your phone number", "رقم هاتفك"], ["Your room number", "رقم غرفتك"], ["The price", "السعر"]], ["电话号码 is phone number.", "电话号码 تعني رقم الهاتف."]),
        say("我扫您", "wǒ sǎo nín", ["Hua shows you his QR code. Say you'll scan it.", "هُوا يريك رمز QR الخاص به. قل إنك ستمسحه."], { hua: { zh: "我们加个微信吧！", pinyin: "Wǒmen jiā ge Wēixìn ba!" } }),
        order(["Put the words in order: let's add each other on WeChat.", "رتّب الكلمات: لنضف بعضنا على وي تشات."], ["我们", "加个", "微信", "吧"], "Wǒmen jiā ge Wēixìn ba!", ["Let's add each other on WeChat!", "لنضف بعضنا على وي تشات!"]),
      ],
    }),
    lesson({
      key: "m1.u7.l2",
      title: ["Getting Help", "طلب المساعدة"],
      zh: "求助",
      goal: ["Say you feel unwell, ask for a hospital and thank someone warmly.", "قل إنك متوعّك، واسأل عن مستشفى، واشكر بحرارة."],
      minutes: 8,
      scene: {
        title: ["At the hotel front desk", "عند مكتب الاستقبال في الفندق"],
        lines: [
          ["b", OMAR, "您好！我不舒服。", "Nín hǎo! Wǒ bù shūfu.", "Hello! I don't feel well.", "مرحباً! أشعر بتوعّك."],
          ["a", DESK, "哪儿不舒服？", "Nǎr bù shūfu?", "What's wrong?", "ما الذي يؤلمك؟"],
          ["b", OMAR, "我头疼。附近有医院吗？", "Wǒ tóu téng. Fùjìn yǒu yīyuàn ma?", "I have a headache. Is there a hospital nearby?", "عندي صداع. هل يوجد مستشفى قريب؟"],
          ["a", DESK, "有。我帮您叫车。", "Yǒu. Wǒ bāng nín jiào chē.", "Yes. I'll call a car for you.", "نعم. سأطلب لك سيارة."],
          ["b", OMAR, "太谢谢您了！", "Tài xièxie nín le!", "Thank you so much!", "شكراً جزيلاً!"],
        ],
      },
      words: [
        word("不舒服", "bù shūfu", "بُو شُو فُو", ["Unwell", "متوعّك"]),
        word("医院", "yīyuàn", "يِي يُوَانْ", ["Hospital", "مستشفى"]),
        word("附近", "fùjìn", "فُو جِينْ", ["Nearby", "قريب"], ["附近有…吗？ asks if there's one nearby.", "附近有…吗؟ تسأل إن كان هناك واحد قريب."]),
        word("头疼", "tóu téng", "تُو تَنْغ", ["Headache", "صداع"]),
        word("太谢谢您了", "tài xièxie nín le", "تَايْ شْيِه شْيِه نِينْ لَه", ["Thank you so much", "شكراً جزيلاً"]),
      ],
      notes: [
        {
          title: ["Numbers to know", "أرقام مهمّة"],
          body: ["In China, call 120 for an ambulance, 110 for the police and 119 for fire. Keep your hotel's card with you: it has the address in Chinese.", "في الصين اتصل بـ120 للإسعاف، و110 للشرطة، و119 للإطفاء. واحتفظ ببطاقة فندقك معك، ففيها العنوان بالصينية."],
          examples: [
            { zh: "请帮帮我！", pinyin: "Qǐng bāngbang wǒ!", meaning: ["Please help me!", "ساعدني من فضلك!"] },
            { zh: "附近有药店吗？", pinyin: "Fùjìn yǒu yàodiàn ma?", meaning: ["Is there a pharmacy nearby?", "هل توجد صيدلية قريبة؟"] },
          ],
        },
      ],
      say: [
        say("我不舒服", "wǒ bù shūfu", ["Say: I don't feel well.", "قل: أشعر بتوعّك."]),
        say("附近有医院吗", "fùjìn yǒu yīyuàn ma", ["Ask: is there a hospital nearby?", "اسأل: هل يوجد مستشفى قريب؟"]),
        say("太谢谢您了", "tài xièxie nín le", ["Say: thank you so much!", "قل: شكراً جزيلاً!"]),
      ],
      use: [
        pick(["You need an ambulance in China. Which number do you call?", "تحتاج إلى سيارة إسعاف في الصين. بأي رقم تتصل؟"], [["120", "120"], ["110", "110"], ["119", "119"]], ["120 is the ambulance. 110 is the police and 119 is fire.", "120 للإسعاف، و110 للشرطة، و119 للإطفاء."]),
        listen("我帮您叫车。", "Wǒ bāng nín jiào chē.", ["Listen. What will the receptionist do?", "استمع. ماذا ستفعل موظفة الاستقبال؟"], [["Call a car for you", "تطلب لك سيارة"], ["Call the police", "تتصل بالشرطة"], ["Give you a room", "تعطيك غرفة"]], ["帮您 is help you, and 叫车 is call a car.", "帮您 تعني أساعدك، و叫车 تعني أطلب سيارة."]),
        say("附近有医院吗", "fùjìn yǒu yīyuàn ma", ["Hua asks what's wrong. Ask him for a hospital nearby.", "هُوا يسأل ما بك. اسأله عن مستشفى قريب."], { hua: { zh: "哪儿不舒服？", pinyin: "Nǎr bù shūfu?" } }),
      ],
      canDo: true,
    }),
  ],
};

export const MOVE_MORE_UNITS = [MOVE_UNIT2, MOVE_UNIT3, MOVE_UNIT4, MOVE_UNIT5, MOVE_UNIT6, MOVE_UNIT7];
