import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCircuit, BookOpen, Languages, Sparkles } from "lucide-react";
import featuresBg from "@/assets/features-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: BrainCircuit,
      titleKey: "home.feature.translator",
      descKey: "home.feature.translator.desc",
      link: "/translator",
      gradient: "bg-gradient-coral",
    },
    {
      icon: BookOpen,
      titleKey: "home.feature.flashcards",
      descKey: "home.feature.flashcards.desc",
      link: "/flashcards",
      gradient: "bg-gradient-mint",
    },
    {
      icon: Languages,
      titleKey: "home.feature.progress",
      descKey: "home.feature.progress.desc",
      link: "/dashboard",
      gradient: "bg-gradient-lavender",
    },
  ];

  const stats = [
    { number: "500+", labelKey: "home.stat.words" },
    { number: "100%", labelKey: "home.stat.fun" },
    { number: "24/7", labelKey: "home.stat.anytime" },
    { number: "∞", labelKey: "home.stat.possibilities" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-primary-foreground">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 animate-bounce-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">{t("home.badge")}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-bounce-in">
            <span className="bg-gradient-rainbow bg-clip-text text-primary text-7xl">
              {t("home.hero.line1")}
            </span>
            <br />
            <span className="text-foreground text-6xl italic">{t("home.hero.line2")}</span>
          </h1>

          <Link to="/translator" className="bg-primary-foreground">
            <Button size="lg" className="bg-gradient-coral hover:scale-105 transition-transform shadow-glow text-lg px-8 py-6 font-semibold">
              {t("home.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16 px-[16px] py-[170px] bg-cover bg-no-repeat pt-[200px]" style={{ backgroundImage: `url(${featuresBg})`, backgroundPosition: 'center top' }}>
        <div className="container mx-auto">
          <h2 className="font-bold text-center mb-12 text-5xl text-primary -mt-8">
            {t("home.features.title")}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} to={feature.link}>
                  <Card className="p-6 hover:shadow-glow transition-all hover:-translate-y-2 cursor-pointer h-full border-2 border-transparent hover:border-primary/20 flex flex-col items-center text-center">
                    <div
                      className={`w-16 h-16 rounded-2xl ${feature.gradient} items-center justify-center mb-4 shadow-soft flex`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground text-center font-semibold">{t(feature.descKey)}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fun Stats */}
      <section className="py-16 px-4 bg-primary-foreground">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="text-4xl font-bold bg-gradient-coral bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
