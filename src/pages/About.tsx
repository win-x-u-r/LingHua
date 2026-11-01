import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Lantern from "@/components/lantern/Lantern";
import AvatarIcon from "@/components/AvatarIcon";
import RoleIcon from "@/components/RoleIcon";
import Seal from "@/components/Seal";
import { useLanguage } from "@/contexts/LanguageContext";

/* Our Story: why LingHua exists, who it is for, and what we care about */
const About = () => {
  const { t } = useLanguage();

  const audiences = [
    { seal: "童", titleKey: "home.for.kids", tagKey: "home.for.kids.tag", descKey: "home.for.kids.desc" },
    { seal: "学", titleKey: "home.for.students", tagKey: "home.for.students.tag", descKey: "home.for.students.desc" },
    { seal: "旅", titleKey: "home.for.travellers", tagKey: "home.for.travellers.tag", descKey: "home.for.travellers.desc" },
  ];

  const values = [
    { icon: <AvatarIcon id="lotus" className="w-14 h-14 shrink-0" />, titleKey: "story.v.arabic", descKey: "story.v.arabic.desc" },
    { icon: <AvatarIcon id="cat" className="w-14 h-14 shrink-0" />, titleKey: "story.v.play", descKey: "story.v.play.desc" },
    { icon: <RoleIcon role="teacher" className="w-14 h-14 shrink-0" />, titleKey: "story.v.teachers", descKey: "story.v.teachers.desc" },
  ];

  const list = "flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden";
  const row = "flex items-start gap-4 p-5 md:p-6 border-b-2 border-border last:border-b-0";

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 max-w-5xl flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="lantern-glow [--glow-size:220%] [--glow-y:55%] shrink-0">
            <Lantern mood="idle" className="w-16 h-16 md:w-20 md:h-20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">{t("story.title")}</h1>
        </div>
        <Card className="p-6 md:p-8 flex flex-col gap-4">
          <p dir="ltr" className="self-start flex items-baseline gap-3 text-primary font-bold text-3xl">
            <span lang="zh" className="font-zh">灵话</span>
            <span>LingHua</span>
          </p>
          <p className="text-2xl md:text-3xl font-bold text-primary text-balance leading-snug">{t("story.lead")}</p>
          <p className="text-lg md:text-xl leading-relaxed">{t("story.p1")}</p>
          <p className="text-lg md:text-xl leading-relaxed">{t("story.p2")}</p>
        </Card>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("home.for.title")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t("home.for.sub")}{" "}
            <Lantern mood="idle" className="inline-block align-middle w-7 h-7 -mt-1" />
          </p>
        </div>
        <ul className={list}>
          {audiences.map((a) => (
            <li key={a.titleKey} className={row}>
              <Seal char={a.seal} />
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold">{t(a.titleKey)}</h3>
                <p className="text-lg md:text-xl font-bold text-primary">{t(a.tagKey)}</p>
                <p className="text-lg md:text-xl text-foreground/80">{t(a.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("story.values")}</h2>
        <ul className={list}>
          {values.map((v) => (
            <li key={v.titleKey} className={`${row} items-center`}>
              {v.icon}
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold">{t(v.titleKey)}</h3>
                <p className="text-lg md:text-xl text-foreground/80">{t(v.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("home.closing.title")}</h2>
        <Link to="/auth">
          <Button size="lg">{t("home.closing.cta")}</Button>
        </Link>
      </section>
    </div>
  );
};

export default About;
