import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Lantern from "@/components/lantern/Lantern";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_PATHS, addPathToClass, type ClassPath } from "@/lib/classPaths";
import { isClassLevel, type ClassLevel } from "@/lib/classSetup";
import { GRAMMAR_TOPICS, topicFocus } from "@/lib/grammarContent";
import { listLessons, LessonsNotSetUp } from "@/lib/lessons";

/** "了", "不 / 没": the grammar a lesson teaches, as its Chinese words */
const grammarHeads = (ids: string[]) =>
  ids
    .map((id) => GRAMMAR_TOPICS.find((g) => g.id === id))
    .filter(Boolean)
    .map((g) => topicFocus(g!).join(" / "));

/**
 * Teacher's Corner: LingHua's ready-made learning paths. "Use this path" copies
 * the path's lessons into the class, where the teacher can change, reorder or
 * remove them. The original path stays the same for every other class.
 */
const ClassPaths = () => {
  const [params] = useSearchParams();
  const classroomId = params.get("class") ?? "";
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [level, setLevel] = useState<ClassLevel | null>(null);
  const [have, setHave] = useState<Set<string>>(new Set());
  const [notSetUp, setNotSetUp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomId) return;
    (supabase as any)
      .from("classrooms")
      .select("level")
      .eq("id", classroomId)
      .maybeSingle()
      .then(({ data }: any) => setLevel(isClassLevel(data?.level) ? data.level : null));
    listLessons(classroomId)
      .then((ls) => setHave(new Set(ls.map((l) => l.sourceKey).filter(Boolean) as string[])))
      .catch((e) => setNotSetUp(e instanceof LessonsNotSetUp));
  }, [classroomId]);

  const suits = (p: ClassPath) => !!level && p.suits.includes(level);
  const paths = [...CLASS_PATHS].sort((a, b) => Number(suits(b)) - Number(suits(a)));

  const use = async (p: ClassPath) => {
    setBusy(p.id);
    try {
      await addPathToClass(classroomId, p, language === "ar" ? "ar" : "en");
      toast({ title: t("paths.added") });
      navigate("/dashboard");
    } catch (e) {
      if (e instanceof LessonsNotSetUp) setNotSetUp(true);
      else toast({ title: t("lesson.failed"), variant: "destructive" });
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
      <Link to="/dashboard" className="text-sm font-bold text-primary underline underline-offset-4 self-start">
        {t("lesson.back")}
      </Link>
      <div className="flex items-center gap-4">
        <Lantern mood="happy" className="w-20 h-20 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold">{t("paths.title")}</h1>
          <p lang="zh" className="font-zh text-muted-foreground">学习路线</p>
          <p className="text-muted-foreground mt-1">{t("paths.desc")}</p>
        </div>
      </div>

      {notSetUp && (
        <p className="rounded-[12px] border-2 border-stroke bg-accent p-3 font-bold" role="alert">{t("lesson.not_set_up")}</p>
      )}

      {paths.map((p) => {
        const added = p.lessons.every((l) => have.has(l.key));
        const some = !added && p.lessons.some((l) => have.has(l.key));
        return (
          <Card key={p.id} className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div>
                <h2 className="text-2xl font-bold">{p.title[language === "ar" ? "ar" : "en"]}</h2>
                <p lang="zh" className="font-zh text-muted-foreground">{p.title.zh}</p>
              </div>
              {suits(p) && (
                <span className="rounded-full border-2 border-stroke bg-accent px-3 py-0.5 text-sm font-bold">{t("paths.match")}</span>
              )}
            </div>
            <p className="text-muted-foreground">{p.blurb[language === "ar" ? "ar" : "en"]}</p>
            <ol className="flex flex-col divide-y-2 divide-border border-2 border-border rounded-[12px]">
              {p.lessons.map((l, i) => {
                const heads = grammarHeads(l.grammarIds);
                return (
                  <li key={l.key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-7 h-7 shrink-0 rounded-full border-2 border-stroke grid place-items-center text-sm font-bold tabular-nums">{i + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="font-bold">{l.title[language === "ar" ? "ar" : "en"]}</span>{" "}
                      <span lang="zh" className="font-zh text-muted-foreground">{l.title.zh}</span>
                    </span>
                    {heads.length > 0 && (
                      <span lang="zh" className="font-zh shrink-0 text-sm font-bold text-primary" title={t("lesson.grammar")}>{heads.join(" · ")}</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => use(p)} disabled={added || busy !== null || notSetUp || !classroomId}>
                {added ? t("paths.in_class") : some ? t("paths.add_rest") : t("paths.use")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("paths.copy_note")}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ClassPaths;
