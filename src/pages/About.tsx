import { Card } from "@/components/ui/card";
import Lantern from "@/components/lantern/Lantern";
import AvatarIcon from "@/components/AvatarIcon";
import RoleIcon from "@/components/RoleIcon";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { language } = useLanguage();
  const ar = language === "ar";

  const features = [
    {
      icon: <AvatarIcon id="panda" className="w-12 h-12 shrink-0" />,
      key: "kids",
      title: ar ? "تصميم مناسب للأطفال" : "Kid-Friendly Design",
      description: ar
        ? "كل عنصر مصمم مع مراعاة الأطفال: ممتع وسهل الاستخدام مع دعم كامل للغة العربية."
        : "Every element is designed with children in mind: playful, easy to use, with full Arabic RTL support.",
    },
    {
      icon: <AvatarIcon id="dragon" className="w-12 h-12 shrink-0" />,
      key: "ai",
      title: ar ? "تعلم بالذكاء الاصطناعي" : "AI-Powered Learning",
      description: ar
        ? "مدعوم بتقنيات هواوي السحابية للترجمة الدقيقة والتعرف على الكلام وتقييم النطق."
        : "Powered by Huawei Cloud AI for accurate translation, speech recognition, and pronunciation scoring.",
    },
    {
      icon: <AvatarIcon id="dumpling" className="w-12 h-12 shrink-0" />,
      key: "bilingual",
      title: ar ? "دعم ثنائي اللغة" : "Bilingual Support",
      description: ar
        ? "دعم كامل للعربية والصينية مع التبديل السلس بين اللغات والاتجاهات."
        : "Full support for Arabic (RTL) and Chinese (LTR) with seamless language switching.",
    },
    {
      icon: <AvatarIcon id="cat" className="w-12 h-12 shrink-0" />,
      key: "game",
      title: ar ? "تجربة تعلم ممتعة" : "Gamified Experience",
      description: ar
        ? "اكسب نقاط الخبرة والشارات والمستويات مع نظام مكافآت يحفز التعلم المستمر."
        : "Earn XP, badges, and levels with a reward system that motivates consistent learning.",
    },
  ];

  const huaweiTech = [
    {
      icon: <RoleIcon role="independent" className="w-12 h-12 shrink-0" />,
      key: "mt",
      name: ar ? "خدمة الترجمة الآلية" : "Machine Translation API",
      service: "Huawei Cloud NLP",
      description: ar
        ? "ترجمة عربي ↔ صيني باستخدام سلسلة ترجمة ذكية عبر اللغة الإنجليزية كلغة وسيطة."
        : "Arabic ↔ Chinese translation using intelligent pivot chaining through English for an underserved language pair.",
    },
    {
      icon: <AvatarIcon id="lotus" className="w-12 h-12 shrink-0" />,
      key: "sis",
      name: ar ? "التعرف على الكلام والتحويل إلى نص" : "Speech Recognition & TTS",
      service: "Huawei Cloud SIS",
      description: ar
        ? "تحويل كلام الطلاب إلى نص وتوليد نطق صحيح باستخدام خدمة التفاعل الصوتي."
        : "Convert student speech to text and generate native pronunciation audio using the Speech Interaction Service.",
    },
    {
      icon: <AvatarIcon id="bamboo" className="w-12 h-12 shrink-0" />,
      key: "score",
      name: ar ? "نموذج تقييم النطق" : "Pronunciation Scoring Model",
      service: "MindSpore",
      description: ar
        ? "نموذج شبكة عصبية مخصص يقيّم دقة الأحرف وتشابه البينيين ودقة النغمات، مصمم خصيصاً للمتحدثين بالعربية."
        : "Custom neural network evaluating character accuracy, pinyin similarity, and tone correctness, designed for Arabic speakers' common Mandarin mistakes.",
    },
    {
      icon: <RoleIcon role="teacher" className="w-12 h-12 shrink-0" />,
      key: "teacher",
      name: ar ? "لوحة تحكم المعلم" : "Teacher Analytics Dashboard",
      service: "Huawei Cloud + Supabase",
      description: ar
        ? "تحليلات الأداء في الوقت الفعلي مع اتجاهات النطق ومستوى إتقان المفردات لكل طالب."
        : "Real-time performance analytics with pronunciation accuracy trends and per-student vocabulary mastery.",
    },
  ];

  const pill = "inline-block px-3 py-1 rounded-full border-2 border-stroke text-sm font-bold";

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto max-w-4xl flex flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col items-center text-center gap-3">
          <Lantern mood="idle" className="w-20 h-20" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary text-balance">
            {ar ? "حول لينغ هوا" : "About Líng Huà"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-bold text-balance">
            <span lang="zh" className="font-zh">灵话</span>{" "}
            {ar ? "منصة ذكية لتعلم اللغة الصينية" : "Smart Mandarin Learning Platform"}
          </p>
        </header>

        {/* Platform features */}
        <ul className="flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden">
          {features.map((f) => (
            <li key={f.key} className="flex items-start gap-4 p-4 md:p-5 border-b-2 border-border last:border-b-0">
              {f.icon}
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold leading-tight">{f.title}</h2>
                <p className="text-muted-foreground mt-1">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Huawei technology */}
        <section className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-center text-primary text-balance">
            {ar ? "تقنيات هواوي المستخدمة" : "Huawei Technologies Used"}
          </h2>

          <div className="flex flex-col gap-4">
            {huaweiTech.map((tech) => (
              <Card key={tech.key} className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  {tech.icon}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-lg font-bold leading-tight">{tech.name}</h3>
                      <span dir="ltr" className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                        {tech.service}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{tech.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <Card className="p-4 md:p-6 flex flex-col items-center gap-3 text-center">
          <h3 className="font-bold">{ar ? "البنية التقنية" : "Technical Architecture"}</h3>
          <div dir="ltr" className="flex flex-wrap justify-center gap-2">
            <span className={`${pill} bg-card`}>React + TypeScript</span>
            <span className={`${pill} bg-card`}>Flask Backend</span>
            <span className={`${pill} bg-card`}>Supabase</span>
          </div>
          <span aria-hidden="true" className="text-xl font-bold text-muted-foreground">↕</span>
          <div dir="ltr" className="flex flex-wrap justify-center gap-2">
            <span className={`${pill} bg-primary text-primary-foreground`}>Huawei Cloud SIS</span>
            <span className={`${pill} bg-primary text-primary-foreground`}>Huawei Cloud NLP</span>
            <span className={`${pill} bg-primary text-primary-foreground`}>MindSpore</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
