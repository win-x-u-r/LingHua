import { Card } from "@/components/ui/card";
import { Sparkles, Heart, Users, Zap, Cpu, Mic, Globe, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import lanternLogo from "@/assets/lantern-logo.png";

const About = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: Heart,
      title: language === "ar" ? "تصميم مناسب للأطفال" : "Kid-Friendly Design",
      description: language === "ar"
        ? "كل عنصر مصمم مع مراعاة الأطفال - ملون وممتع وسهل الاستخدام مع دعم كامل للغة العربية"
        : "Every element is designed with children in mind — colorful, playful, and easy to use with full Arabic RTL support.",
      gradient: "bg-gradient-coral",
    },
    {
      icon: Zap,
      title: language === "ar" ? "تعلم بالذكاء الاصطناعي" : "AI-Powered Learning",
      description: language === "ar"
        ? "مدعوم بتقنيات هواوي السحابية للترجمة الدقيقة والتعرف على الكلام وتقييم النطق"
        : "Powered by Huawei Cloud AI for accurate translation, speech recognition, and pronunciation scoring.",
      gradient: "bg-gradient-mint",
    },
    {
      icon: Users,
      title: language === "ar" ? "دعم ثنائي اللغة" : "Bilingual Support",
      description: language === "ar"
        ? "دعم كامل للعربية والصينية مع التبديل السلس بين اللغات والاتجاهات"
        : "Full support for Arabic (RTL) and Chinese (LTR) with seamless language switching.",
      gradient: "bg-gradient-lavender",
    },
    {
      icon: Sparkles,
      title: language === "ar" ? "تجربة تعلم ممتعة" : "Gamified Experience",
      description: language === "ar"
        ? "اكسب نقاط الخبرة والشارات والمستويات مع نظام مكافآت يحفز التعلم المستمر"
        : "Earn XP, badges, and levels with a reward system that motivates consistent learning.",
      gradient: "bg-sunshine",
    },
  ];

  const huaweiTech = [
    {
      icon: Globe,
      name: language === "ar" ? "خدمة الترجمة الآلية" : "Machine Translation API",
      service: "Huawei Cloud NLP",
      description: language === "ar"
        ? "ترجمة عربي ↔ صيني باستخدام سلسلة ترجمة ذكية عبر اللغة الإنجليزية كلغة وسيطة"
        : "Arabic ↔ Chinese translation using intelligent pivot chaining through English for an underserved language pair.",
    },
    {
      icon: Mic,
      name: language === "ar" ? "التعرف على الكلام والتحويل إلى نص" : "Speech Recognition & TTS",
      service: "Huawei Cloud SIS",
      description: language === "ar"
        ? "تحويل كلام الطلاب إلى نص وتوليد نطق صحيح باستخدام خدمة التفاعل الصوتي"
        : "Convert student speech to text and generate native pronunciation audio using the Speech Interaction Service.",
    },
    {
      icon: Cpu,
      name: language === "ar" ? "نموذج تقييم النطق" : "Pronunciation Scoring Model",
      service: "MindSpore",
      description: language === "ar"
        ? "نموذج شبكة عصبية مخصص يقيّم دقة الأحرف وتشابه البينيين ودقة النغمات — مصمم خصيصاً للمتحدثين بالعربية"
        : "Custom neural network evaluating character accuracy, pinyin similarity, and tone correctness — designed for Arabic speakers' common Mandarin mistakes.",
    },
    {
      icon: BarChart3,
      name: language === "ar" ? "لوحة تحكم المعلم" : "Teacher Analytics Dashboard",
      service: "Huawei Cloud + Supabase",
      description: language === "ar"
        ? "تحليلات الأداء في الوقت الفعلي مع اتجاهات النطق ومستوى إتقان المفردات لكل طالب"
        : "Real-time performance analytics with pronunciation accuracy trends and per-student vocabulary mastery.",
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <img src={lanternLogo} alt="Líng Huà logo" className="w-12 h-12" />
            <span className="bg-gradient-rainbow bg-clip-text text-primary">
              {language === "ar" ? "حول لينغ هوا" : "About Líng Huà"}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground font-bold">
            灵话 — {language === "ar" ? "منصة ذكية لتعلم اللغة الصينية" : "Smart Mandarin Learning Platform"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {"\u200B"}
          </p>
        </div>

        {/* Platform Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="p-6 hover:shadow-glow transition-shadow">
                <div className={`w-12 h-12 rounded-full ${feature.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Huawei Technology Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-coral bg-clip-text text-transparent">
              {language === "ar" ? "تقنيات هواوي المستخدمة" : "Huawei Technologies Used"}
            </span>
          </h2>

          <div className="space-y-4">
            {huaweiTech.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <Card key={i} className="p-6 border-2 hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold">{tech.name}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {tech.service}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Architecture Diagram */}
        <Card className="p-6 mb-8 bg-popover border-2">
          <h3 className="font-bold text-center mb-4">
            {language === "ar" ? "البنية التقنية" : "Technical Architecture"}
          </h3>
          <div className="font-mono text-xs text-center space-y-2 text-muted-foreground">
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="bg-primary/10 px-3 py-1 rounded">React + TypeScript</span>
              <span className="bg-secondary/30 px-3 py-1 rounded">Flask Backend</span>
              <span className="bg-accent/30 px-3 py-1 rounded">Supabase</span>
            </div>
            <div className="text-lg">↕</div>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="bg-red-100 px-3 py-1 rounded text-red-700">Huawei Cloud SIS</span>
              <span className="bg-red-100 px-3 py-1 rounded text-red-700">Huawei Cloud NLP</span>
              <span className="bg-red-100 px-3 py-1 rounded text-red-700">MindSpore</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
