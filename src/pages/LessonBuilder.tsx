import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Lantern from "@/components/lantern/Lantern";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GRAMMAR_TOPICS } from "@/lib/grammarContent";
import { getLesson, LessonsNotSetUp, saveLesson } from "@/lib/lessons";
import { pathOfKey } from "@/lib/classPaths";

interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic_translation: string;
  level: "beginner" | "intermediate" | "advanced";
}

type Tab = "words" | "grammar";
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

/** The drawn tick inside a picked box */
const Tick = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tick = (on: boolean) =>
  `w-6 h-6 shrink-0 rounded-md border-2 grid place-items-center text-sm font-bold ${
    on ? "border-stroke bg-primary text-primary-foreground" : "border-border bg-card"
  }`;

/**
 * Teacher's Corner: build a lesson for one class from LingHua's vocabulary and
 * grammar points. Teachers decide what to teach; students see it under
 * "From your teacher".
 */
const LessonBuilder = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [classroomId, setClassroomId] = useState(params.get("class") ?? "");
  const [tab, setTab] = useState<Tab>(params.get("tab") === "grammar" ? "grammar" : "words");
  const [title, setTitle] = useState("");
  const [vocabIds, setVocabIds] = useState<string[]>([]);
  const [grammarIds, setGrammarIds] = useState<string[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "all" | "picked">("all");
  const [missing, setMissing] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sourceKey, setSourceKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vocab").select("id, hanzi, pinyin, arabic_translation, level");
      setWords(((data as Word[]) ?? []).sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)));
    })();
  }, []);

  // Editing an existing lesson
  useEffect(() => {
    if (!id) return;
    getLesson(id)
      .then((l) => {
        if (!l) return;
        setClassroomId(l.classroomId);
        setTitle(l.title);
        setVocabIds(l.vocabIds);
        setGrammarIds(l.grammarIds);
        setSourceKey(l.sourceKey);
        if (l.sourceKey) setLevel("picked");
      })
      .catch((e) => e instanceof LessonsNotSetUp && setNotSetUp(true));
  }, [id]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter(
      (w) =>
        (level === "all" || w.level === level || (level === "picked" && vocabIds.includes(w.id))) &&
        (!q || w.hanzi.includes(q) || w.pinyin.toLowerCase().includes(q) || w.arabic_translation.includes(q)),
    );
  }, [words, query, level, vocabIds]);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const save = async () => {
    if (!title.trim() || (vocabIds.length === 0 && grammarIds.length === 0)) return setMissing(true);
    setBusy(true);
    try {
      await saveLesson({ id, classroomId, title: title.trim(), vocabIds, grammarIds });
      toast({ title: t("lesson.saved") });
      navigate("/dashboard");
    } catch (e) {
      if (e instanceof LessonsNotSetUp) setNotSetUp(true);
      else toast({ title: t("lesson.failed"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 flex flex-col gap-5">
      <Link to="/dashboard" className="text-sm font-bold text-primary underline underline-offset-4 self-start">
        {t("lesson.back")}
      </Link>
      <div className="flex items-center gap-4">
        <Lantern mood={vocabIds.length + grammarIds.length ? "happy" : "idle"} className="w-20 h-20 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold">{id ? title || t("lesson.title") : t("lesson.new")}</h1>
          <p lang="zh" className="font-zh text-muted-foreground">{id ? "编辑课程" : "新课程"}</p>
        </div>
      </div>

      {notSetUp && (
        <p className="rounded-[12px] border-2 border-stroke bg-accent p-3 font-bold" role="alert">{t("lesson.not_set_up")}</p>
      )}

      {pathOfKey(sourceKey) && (
        <p className="rounded-[12px] border-2 border-border bg-card p-3 text-sm">
          <span className="font-bold">{t("lesson.from_path").replace("{path}", pathOfKey(sourceKey)!.title[language === "ar" ? "ar" : "en"])}.</span>{" "}
          {t("lesson.based_on")}
        </p>
      )}

      <Card className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lesson-title">{t("lesson.name")}</Label>
          <Input
            id="lesson-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setMissing(false);
            }}
            placeholder={t("lesson.name.placeholder")}
            maxLength={60}
          />
        </div>

        <div className="grid grid-cols-2 border-2 border-stroke rounded-[10px] overflow-hidden font-bold" role="tablist">
          {(["words", "grammar"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`py-2 ${tab === k ? "bg-foreground text-background" : "bg-card"}`}
            >
              {t(k === "words" ? "lesson.words" : "lesson.grammar")}{" "}
              <span className="font-normal">({(k === "words" ? vocabIds : grammarIds).length})</span>
            </button>
          ))}
        </div>

        {tab === "words" ? (
          <div className="flex flex-col gap-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("lesson.search")} aria-label={t("lesson.search")} />
            <div className="flex flex-wrap gap-2">
              {(["all", "picked", ...LEVELS] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${
                    level === l ? "border-stroke bg-accent" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {l === "all" ? t("lesson.all") : l === "picked" ? t("lesson.picked").replace("{n}", String(vocabIds.length)) : t(`common.${l}`)}
                </button>
              ))}
            </div>
            <ul className="flex flex-col divide-y-2 divide-border border-2 border-border rounded-[12px] max-h-[28rem] overflow-y-auto">
              {shown.map((w) => {
                const on = vocabIds.includes(w.id);
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => {
                        toggle(vocabIds, setVocabIds, w.id);
                        setMissing(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-start ${on ? "bg-accent/60" : ""}`}
                    >
                      <span className={tick(on)} aria-hidden="true">{on && <Tick />}</span>
                      <span lang="zh" className="font-zh font-bold text-xl">{w.hanzi}</span>
                      <span className="font-pinyin text-primary">{w.pinyin}</span>
                      <span lang="ar" dir="rtl" className="ms-auto text-muted-foreground">{w.arabic_translation}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {GRAMMAR_TOPICS.map((g) => {
              const on = grammarIds.includes(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => {
                      toggle(grammarIds, setGrammarIds, g.id);
                      setMissing(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-[12px] border-2 px-3 py-2.5 text-start ${
                      on ? "border-stroke bg-accent" : "border-border bg-card"
                    }`}
                  >
                    <span className={tick(on)} aria-hidden="true">{on && <Tick />}</span>
                    <span className="flex-1 font-bold">{language === "ar" ? g.titleAr : g.title}</span>
                    <span className="text-xs text-muted-foreground">{t(`common.${g.level}`)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {missing && <p className="text-sm font-bold text-destructive" role="alert">{!title.trim() ? t("lesson.name") : t("lesson.empty")}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("lesson.count").replace("{w}", String(vocabIds.length)).replace("{g}", String(grammarIds.length))}
          </span>
          <Button size="lg" className="ms-auto" onClick={save} disabled={busy || !classroomId}>
            {t("lesson.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LessonBuilder;
