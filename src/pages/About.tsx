import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    { icon: <AvatarIcon id="lotus" className="w-12 h-12 shrink-0" />, titleKey: "story.v.arabic", descKey: "story.v.arabic.desc" },
    { icon: <AvatarIcon id="cat" className="w-12 h-12 shrink-0" />, titleKey: "story.v.play", descKey: "story.v.play.desc" },
    { icon: <RoleIcon role="teacher" className="w-12 h-12 shrink-0" />, titleKey: "story.v.teachers", descKey: "story.v.teachers.desc" },
  ];

  const list = "flex flex-col border-2 border-stroke rounded-[14px] bg-card overflow-hidden";
  const row = "flex items-start gap-4 p-4 md:p-5 border-b-2 border-border last:border-b-0";

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl flex flex-col gap-14">
      <header className="flex flex-col items-center text-center gap-4">
        <div className="lantern-glow [--glow-size:220%] [--glow-y:55%]">
          <Lantern mood="idle" className="w-24 h-24" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-balance">{t("story.title")}</h1>
        <p className="text-xl font-bold text-primary text-balance">{t("story.lead")}</p>
        <p className="text-lg text-muted-foreground">{t("story.p1")}</p>
        <p className="text-lg text-muted-foreground">{t("story.p2")}</p>
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-balance">{t("home.for.title")}</h2>
          <p className="text-lg text-muted-foreground">{t("home.for.sub")}</p>
        </div>
        <ul className={list}>
          {audiences.map((a) => (
            <li key={a.titleKey} className={row}>
              <Seal char={a.seal} />
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-xl font-bold">{t(a.titleKey)}</h3>
                <p className="font-bold text-primary">{t(a.tagKey)}</p>
                <p className="text-muted-foreground">{t(a.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-balance">{t("story.values")}</h2>
        <ul className={list}>
          {values.map((v) => (
            <li key={v.titleKey} className={`${row} items-center`}>
              {v.icon}
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-xl font-bold">{t(v.titleKey)}</h3>
                <p className="text-muted-foreground">{t(v.descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl font-bold text-balance">{t("home.closing.title")}</h2>
        <Link to="/auth">
          <Button size="lg">{t("home.closing.cta")}</Button>
        </Link>
      </section>
    </div>
  );
};

export default About;
