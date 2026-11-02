import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import AvatarIcon from "@/components/AvatarIcon";
import ClassCodeInput from "@/components/ClassCodeInput";
import PicturePad from "@/components/PicturePad";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AVATAR_IDS } from "@/lib/avatars";
import { PATH_ZH } from "@/lib/learningPaths";
import {
  KidsError, PICTURE_COUNT, askTeacherForHelp, checkClassCode, kidJoin, kidLogIn,
  type KidsErrorCode, type SecretPicture,
} from "@/lib/kidsAPI";

type Step = "code" | "who" | "pictures" | "name" | "pick" | "again";

const ERROR_KEY: Partial<Record<KidsErrorCode, string>> = {
  class_not_found: "kids.no_class",
  name_taken: "kids.name.taken",
  wrong_pictures: "kids.wrong",
  name_not_found: "kids.no_name",
  locked: "kids.locked",
  not_set_up: "kids.not_set_up",
};

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Little Lanterns log-in: class code, type your first and last name, tap your 3 secret pictures.
 * Classmates' names are never shown.
 * New kids type their name, pick an avatar and pick their pictures twice.
 */
const KidsLogin = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [className, setClassName] = useState("");
  // First and last name apart: a class can have many Mohammeds. Hua greets
  // them by first name; the teacher sees the full name.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const nameDone = !!firstName.trim() && !!lastName.trim();
  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const [avatar, setAvatar] = useState<string>("panda");
  const [pictures, setPictures] = useState<SecretPicture[]>([]);
  const [chosen, setChosen] = useState<SecretPicture[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<LanternMood>("idle");
  const [bounce, setBounce] = useState(0);
  const [helped, setHelped] = useState(false);

  if (!loading && user && !busy) return <Navigate to="/" replace />;

  const cheer = (m: LanternMood = "happy") => {
    setMood(m);
    setBounce((b) => b + 1);
  };
  const oops = (err: unknown) => {
    const c = err instanceof KidsError ? err.code : "server_error";
    setMessage(t(ERROR_KEY[c] ?? "kids.error"));
    setMood("sad");
  };
  const go = (next: Step) => {
    setMessage("");
    setHelped(false);
    setPictures([]);
    setStep(next);
    cheer();
  };

  const findClass = async () => {
    if (code.length < 6) return;
    setBusy(true);
    try {
      setClassName(await checkClassCode(code));
      go("who");
    } catch (err) {
      oops(err);
    } finally {
      setBusy(false);
    }
  };

  const tryLogIn = async (pics: SecretPicture[]) => {
    setBusy(true);
    setMood("thinking");
    try {
      await kidLogIn(code, fullName, pics);
      setMood("celebrate");
      navigate("/");
    } catch (err) {
      oops(err);
      setPictures([]);
      // Typo in the name: back to the name boxes, keeping the message
      if (err instanceof KidsError && err.code === "name_not_found") setStep("who");
    } finally {
      setBusy(false);
    }
  };

  const join = async (pics: SecretPicture[]) => {
    if (!same(pics, chosen)) {
      setMessage(t("kids.mismatch"));
      setMood("sad");
      setChosen([]);
      setPictures([]);
      setStep("pick");
      return;
    }
    setBusy(true);
    setMood("thinking");
    try {
      await kidJoin(code, firstName, lastName, avatar, pics);
      setMood("celebrate");
      navigate("/");
    } catch (err) {
      oops(err);
      if (err instanceof KidsError && err.code === "name_taken") {
        setPictures([]);
        setChosen([]);
        setStep("name");
      }
    } finally {
      setBusy(false);
    }
  };

  const askHelp = async () => {
    setBusy(true);
    try {
      await askTeacherForHelp(code, fullName);
      setHelped(true);
      setMessage(t("kids.helped"));
      cheer("happy");
    } catch (err) {
      oops(err);
    } finally {
      setBusy(false);
    }
  };

  const onPictures = (next: SecretPicture[]) => {
    setPictures(next);
    setMessage("");
    if (next.length > pictures.length) cheer();
    if (next.length < PICTURE_COUNT) return;
    if (step === "pictures") void tryLogIn(next);
    if (step === "pick") {
      setChosen(next);
      window.setTimeout(() => go("again"), 350);
    }
    if (step === "again") void join(next);
  };

  const back = () => {
    const prev: Record<Step, Step | null> = { code: null, who: "code", pictures: "who", name: "who", pick: "name", again: "pick" };
    const p = prev[step];
    if (p) go(p);
    else navigate("/auth");
  };

  // First and last name, used both to log in and to join
  const nameFields = (
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setMessage("");
                }}
                placeholder={t("kids.first")}
                maxLength={24}
                className="text-center text-lg h-12"
                aria-label={t("kids.first")}
                autoComplete="off"
                autoFocus
              />
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setMessage("");
                }}
                placeholder={t("kids.last")}
                maxLength={24}
                className="text-center text-lg h-12"
                aria-label={t("kids.last")}
                autoComplete="off"
              />
            </div>
  );

  const heading: Record<Step, string> = {
    code: t("kids.code"),
    who: t("kids.name"),
    pictures: t("kids.pictures"),
    name: t("kids.name"),
    pick: t("kids.pick"),
    again: t("kids.again"),
  };

  return (
    <div className="min-h-screen py-8 px-4 flex justify-center">
      <Card className="w-full max-w-lg p-6 md:p-8 flex flex-col items-center gap-5 text-center overflow-hidden">
        <div className="lantern-glow [--glow-size:220%]">
          <Lantern mood={mood} bounce={bounce} entering className="w-28 h-28 md:w-32 md:h-32" />
        </div>
        <div>
          <p className="text-sm font-bold text-muted-foreground">
            {t("path.little_lanterns")} <span lang="zh" className="font-zh">· {PATH_ZH.little_lanterns}</span>
            {className && <span className="block text-foreground">{className}</span>}
          </p>
          <h1 className="text-3xl font-bold mt-1 text-balance">{heading[step]}</h1>
          {step === "code" && <p className="text-muted-foreground">{t("kids.code.hint")}</p>}
          {step === "pick" && <p className="text-muted-foreground">{t("kids.pick.hint")}</p>}
        </div>

        {step === "code" && (
          <form
            className="w-full max-w-xs flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void findClass();
            }}
          >
            <ClassCodeInput
              id="kid-code"
              value={code}
              onChange={(c) => {
                setCode(c);
                setMessage("");
                if (c.length === 6 && code.length < 6) cheer();
              }}
            />
            <Button type="submit" size="lg" disabled={busy || code.length < 6}>{t("goal.next")}</Button>
          </form>
        )}

        {step === "who" && (
          <form
            className="w-full flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDone) go("pictures");
            }}
          >
            {nameFields}
            <Button type="submit" size="lg" disabled={!nameDone}>{t("goal.next")}</Button>
            <Button type="button" variant="link" onClick={() => go("name")}>{t("kids.new")}</Button>
          </form>
        )}

        {step === "pictures" && (
          <p className="font-bold">{fullName}</p>
        )}

        {step === "name" && (
          <form
            className="w-full flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDone) go("pick");
            }}
          >
            {nameFields}
            <fieldset className="flex flex-col items-center gap-2">
              <legend className="text-sm font-bold mb-2">{t("auth.avatar")}</legend>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-sm">
                {AVATAR_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={t(`avatar.${id}`)}
                    aria-pressed={avatar === id}
                    onClick={() => {
                      if (avatar !== id) cheer("delight");
                      setAvatar(id);
                    }}
                    className={`aspect-square rounded-full border-2 p-0.5 sm:p-1 grid place-items-center ${
                      avatar === id ? "border-stroke bg-accent shadow-[2px_2px_0_hsl(var(--stamp))]" : "border-border bg-card"
                    }`}
                  >
                    <AvatarIcon id={id} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </fieldset>
            <Button type="submit" size="lg" disabled={!nameDone}>{t("goal.next")}</Button>
          </form>
        )}

        {(step === "pictures" || step === "pick" || step === "again") && (
          <PicturePad value={pictures} onChange={onPictures} disabled={busy} />
        )}

        {message && (
          <p className="rounded-[12px] border-2 border-stroke bg-accent px-4 py-2 font-bold" role="alert">
            {message}
          </p>
        )}

        {step === "pictures" && !helped && (
          <Button type="button" variant="link" onClick={askHelp} disabled={busy}>
            {t("kids.forgot")}
          </Button>
        )}

        <Button type="button" variant="outline" onClick={back} disabled={busy}>
          {t("goal.back")}
        </Button>
      </Card>
    </div>
  );
};

export default KidsLogin;
