import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AVATAR_IDS } from "@/lib/avatars";
import AvatarIcon from "@/components/AvatarIcon";
import ClassCodeInput from "@/components/ClassCodeInput";
import RoleIcon from "@/components/RoleIcon";
import { GoalPicker, ReminderSetting } from "@/components/GoalPicker";
import { DEFAULT_GOAL_MINUTES, DEFAULT_REMINDER_TIME, tierFor, type GoalTier } from "@/lib/dailyGoal";

// The lantern gets a little more excited the bigger the goal
const GOAL_MOOD: Record<GoalTier, LanternMood> = {
  casual: "happy",
  steady: "happy",
  focused: "delight",
  dedicated: "celebrate",
};

const ROLES: { value: UserRole; labelKey: string }[] = [
  { value: "student", labelKey: "auth.role.student" },
  { value: "teacher", labelKey: "auth.role.teacher" },
  { value: "independent", labelKey: "auth.role.independent" },
];

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [classroomCode, setClassroomCode] = useState("");
  const [className, setClassName] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("panda");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Learners get a second sign-up step for their daily goal; teachers skip it
  const [goalStep, setGoalStep] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState(DEFAULT_GOAL_MINUTES);
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  // After sign-up with email confirmation on: the address the link went to
  const [sentTo, setSentTo] = useState("");
  // Shown above the log-in form: the email isn't confirmed yet, or the link didn't work
  const [notice, setNotice] = useState<"" | "unconfirmed" | "link_expired" | "link_failed">("");
  const [resent, setResent] = useState(false);
  // "I've verified my email": asks Supabase, and says so if the email still isn't verified
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  const { user, loading, signUp, signIn, resendConfirmation, finishSetup, setLearningPrefs } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // The lantern reacts to the form. Email and the other text fields: happy eyes that follow
  // what you type, with a hop per typing burst. Password: turns its back and peeks.
  // Sign-up choices (role, class code, avatar) get a short reaction, then it settles again.
  const [mood, setMood] = useState<LanternMood>("idle");
  const [bounce, setBounce] = useState(0);
  const [look, setLook] = useState(0);
  const lastBounce = useRef(0);
  const settle = useRef<number>();
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const bumpLantern = () => {
    const now = Date.now();
    if (now - lastBounce.current < 420) return;
    lastBounce.current = now;
    setBounce((b) => b + 1);
  };
  const changeMood = (m: LanternMood) => {
    window.clearTimeout(settle.current);
    setMood(m);
  };
  // A one-off reaction that wears off by itself
  const react = (m: LanternMood, ms = 1600) => {
    changeMood(m);
    bumpLantern();
    settle.current = window.setTimeout(() => setMood((cur) => (cur === m ? "idle" : cur)), ms);
  };
  // Eyes follow the text from the start of the field to the end, like reading along
  const watchText = (text: string, rtl = false, span = 24) => {
    const along = Math.min(text.length, span) / span;
    setLook((rtl ? -1 : 1) * (along * 2 - 1));
  };
  const watchField = (text: string, rtl = false, span = 24) => {
    changeMood("watch");
    watchText(text, rtl, span);
  };
  const typeInField = (text: string, rtl = false, span = 24) => {
    watchField(text, rtl, span);
    bumpLantern();
  };
  const rtl = language === "ar";

  // Coming back from the confirmation link with an error (Supabase puts it after # or ?)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    const code = params.get("error_code") || params.get("error");
    if (!code) return;
    setNotice(code === "otp_expired" ? "link_expired" : "link_failed");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const resend = async () => {
    const to = sentTo || email;
    if (!to) return;
    try {
      await resendConfirmation(to);
      setResent(true);
      react("happy", 1400);
    } catch (err: any) {
      toast({ title: t("auth.resend.failed"), description: err.message, variant: "destructive" });
    }
  };

  // Logging in is the real check: Supabase refuses it until the email is verified
  const checkVerified = async () => {
    if (!sentTo || !password) return goToLogIn();
    setChecking(true);
    setIsSubmitting(true);
    setNotYet(false);
    changeMood("thinking");
    try {
      await signIn(sentTo, password);
      await finishSetup();
      changeMood("celebrate");
      toast({ title: t("auth.created"), description: t("auth.created.desc") });
      navigate(role === "teacher" ? "/dashboard" : "/");
    } catch (err: any) {
      if (err?.code === "email_not_confirmed" || /not confirmed/i.test(err?.message ?? "")) {
        setNotYet(true);
        changeMood("sad");
      } else {
        toast({ title: t("auth.signin.failed"), description: err?.message || t("auth.try_again"), variant: "destructive" });
        goToLogIn();
      }
    } finally {
      setChecking(false);
      setIsSubmitting(false);
    }
  };

  const goToLogIn = () => {
    setSentTo("");
    setNotYet(false);
    setResent(false);
    setGoalStep(false);
    setIsSignUp(false);
    setPassword("");
  };

  if (!loading && user && !isSubmitting) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && role === "student" && classroomCode.length < 6) {
      setCodeError(true);
      changeMood("sad");
      return;
    }
    const asksGoal = isSignUp && role !== "teacher";
    if (asksGoal && !goalStep) {
      setGoalStep(true);
      react("happy", 1400);
      window.scrollTo({ top: 0 });
      return;
    }
    setIsSubmitting(true);
    changeMood("thinking");

    try {
      if (isSignUp) {
        const prefs = asksGoal ? { goalMinutes, reminderOn, reminderTime } : undefined;
        const { needsConfirm } = await signUp(email, password, fullName, role, prefs, {
          avatar: selectedAvatar,
          classCode: role === "student" ? classroomCode : undefined,
          className: role === "teacher" ? className : undefined,
        });

        if (needsConfirm) {
          // Not signed in yet: the avatar, class and goal are saved on the first log-in
          setSentTo(email);
          setResent(false);
          setNotYet(false);
          changeMood("celebrate");
          window.scrollTo({ top: 0 });
          return;
        }

        if (prefs) {
          try {
            await setLearningPrefs(prefs);
          } catch {
            // Already kept in the sign-up details and on this device
          }
        }
        // Avatar, then joining or creating the class; never blocks sign-up
        await finishSetup();

        changeMood("celebrate");
        toast({ title: t("auth.created"), description: t("auth.created.desc") });
        navigate(role === "teacher" ? "/dashboard" : "/");
      } else {
        await signIn(email, password);
        setNotice("");
        changeMood("happy");
        toast({ title: t("auth.welcomed") });
        navigate("/");
      }
    } catch (err: any) {
      changeMood("sad");
      if (err?.message === "already_registered") {
        toast({ title: t("auth.signup.failed"), description: t("auth.already") });
        goToLogIn();
        return;
      }
      if (!isSignUp && (err?.code === "email_not_confirmed" || /not confirmed/i.test(err?.message ?? ""))) {
        setNotice("unconfirmed");
        setResent(false);
        return;
      }
      if (!isSignUp && (err?.code === "invalid_credentials" || /invalid login/i.test(err?.message ?? ""))) {
        toast({ title: t("auth.signin.failed"), description: t("auth.try_again"), variant: "destructive" });
        return;
      }
      toast({
        title: isSignUp ? t("auth.signup.failed") : t("auth.signin.failed"),
        description: err.message || t("auth.try_again"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaveField = () => setMood((m) => (m === "watch" || m === "shy" ? "idle" : m));

  return (
    <div className="min-h-screen py-10 px-4 flex items-start md:items-center justify-center">
      <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-clip p-0">
        {/* On phones the sign-up form is long, so the lantern stays pinned under the header to keep reacting */}
        <div
          className={`bg-gradient-to-b from-card to-muted border-b-2 md:border-b-0 md:border-e-2 border-stroke flex items-center justify-center md:min-h-[520px] overflow-hidden ${
            isSignUp ? "max-md:sticky max-md:top-[66px] max-md:z-10 min-h-[150px]" : "min-h-[220px]"
          }`}
        >
          <div className="lantern-glow [--glow-size:200%] [--glow-y:62%]">
            <Lantern
              mood={mood}
              bounce={bounce}
              look={look}
              entering
              className={`md:w-72 md:h-72 ${isSignUp ? "w-36 h-36" : "w-48 h-48"}`}
            />
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-5">
          {sentTo ? (
            <div className="flex flex-col gap-4" role="status">
              <div>
                <h1 className="text-3xl font-bold">{t("auth.check.title")}</h1>
                <p lang="zh" className="font-zh text-muted-foreground">查收邮件</p>
              </div>
              <p>
                {t("auth.check.sent")}{" "}
                <bdi dir="ltr" className="font-bold break-all">{sentTo}</bdi>
                {t("auth.check.sent.end")}
              </p>
              <p className="text-muted-foreground">{t("auth.check.next")}</p>
              <p className="text-sm text-muted-foreground">{t("auth.check.spam")}</p>
              {notYet && (
                <p className="rounded-[12px] border-2 border-stroke bg-accent p-3 text-sm font-bold" role="alert">
                  {t("auth.check.not_yet")}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button type="button" size="lg" className="flex-1" onClick={checkVerified} disabled={checking}>
                  {checking ? t("auth.wait") : t("auth.check.verified")}
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={resend} disabled={resent}>
                  {resent ? t("auth.resend.done") : t("auth.resend")}
                </Button>
              </div>
            </div>
          ) : (
          <>
          <div>
            {goalStep ? (
              <>
                <h1 id="goal-title" className="text-2xl md:text-3xl font-bold text-balance">{t("goal.title")}</h1>
                <p className="text-muted-foreground mt-1">{t("goal.sub")}</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{isSignUp ? t("auth.join") : t("auth.welcome")}</h1>
                <p lang="zh" className="font-zh text-muted-foreground">{isSignUp ? "欢迎加入" : "欢迎回来"}</p>
              </>
            )}
          </div>

          {/* Log in or sign up */}
          {!goalStep && (
          <div className="grid grid-cols-2 border-2 border-stroke rounded-[10px] overflow-hidden font-bold" role="tablist">
            {[false, true].map((signUpTab) => (
              <button
                key={String(signUpTab)}
                type="button"
                role="tab"
                aria-selected={isSignUp === signUpTab}
                onClick={() => {
                  if (isSignUp !== signUpTab) react("happy", 1200);
                  setIsSignUp(signUpTab);
                  setGoalStep(false);
                }}
                className={`py-2 ${isSignUp === signUpTab ? "bg-foreground text-background" : "bg-card"}`}
              >
                {signUpTab ? t("auth.signup") : t("auth.signin")}
              </button>
            ))}
          </div>
          )}

          {!isSignUp && notice && (
            <div className="rounded-[12px] border-2 border-stroke bg-accent p-4 flex flex-col gap-2" role="alert">
              <p className="font-bold">{t(`auth.notice.${notice}`)}</p>
              <p className="text-sm">{t(`auth.notice.${notice}.desc`)}</p>
              {notice !== "link_failed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={resend}
                  disabled={resent || !email}
                >
                  {resent ? t("auth.resend.done") : t("auth.resend")}
                </Button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {goalStep && (
              <>
                <GoalPicker
                  value={goalMinutes}
                  labelledBy="goal-title"
                  onChange={(m) => {
                    if (m !== goalMinutes) react(GOAL_MOOD[tierFor(m)], 2000);
                    setGoalMinutes(m);
                  }}
                />
                <ReminderSetting
                  on={reminderOn}
                  time={reminderTime}
                  onChange={(on, time) => {
                    if (on && !reminderOn) react("happy", 1400);
                    setReminderOn(on);
                    setReminderTime(time);
                  }}
                />
              </>
            )}

            {isSignUp && !goalStep && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onFocus={() => watchField(fullName, rtl)}
                    onBlur={leaveField}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      typeInField(e.target.value, rtl);
                    }}
                    placeholder={t("auth.name.placeholder")}
                    required
                  />
                </div>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium mb-1.5">{t("auth.role")}</legend>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup">
                    {ROLES.map((r) => {
                      const on = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            if (role !== r.value) react("happy");
                            setRole(r.value);
                          }}
                          className={`flex flex-col items-center gap-1.5 rounded-[12px] border-2 px-2 py-3 font-bold text-sm leading-tight text-center ${
                            on ? "border-stroke bg-accent shadow-[3px_3px_0_hsl(var(--stamp))]" : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          <RoleIcon role={r.value} className="w-11 h-11" />
                          {t(r.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {role === "student" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="classroom">{t("auth.classroom")}</Label>
                    <ClassCodeInput
                      id="classroom"
                      value={classroomCode}
                      onFocus={() => watchField(classroomCode, false, 6)}
                      onBlur={leaveField}
                      onChange={(c) => {
                        setClassroomCode(c);
                        setCodeError(false);
                        // Six characters is a whole code: a little cheer, then back to watching
                        if (c.length === 6 && classroomCode.length < 6) react("happy", 1400);
                        else typeInField(c, false, 6);
                      }}
                    />
                    <span className={`text-xs ${codeError ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                      {codeError ? t("auth.classroom.required") : t("auth.classroom.hint")}
                    </span>
                  </div>
                )}

                {role === "teacher" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="classname">{t("auth.classname")}</Label>
                    <Input
                      id="classname"
                      value={className}
                      onFocus={() => watchField(className, rtl)}
                      onBlur={leaveField}
                      onChange={(e) => {
                        setClassName(e.target.value);
                        typeInField(e.target.value, rtl);
                      }}
                      placeholder={t("dashboard.classroom_name_placeholder")}
                    />
                    <span className="text-xs text-muted-foreground">{t("auth.classname.hint")}</span>
                  </div>
                )}

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium mb-1.5">{t("auth.avatar")}</legend>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2 max-w-sm">
                    {AVATAR_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={t(`avatar.${id}`)}
                        aria-pressed={selectedAvatar === id}
                        onClick={() => {
                          if (selectedAvatar !== id) react("delight", 2200);
                          setSelectedAvatar(id);
                        }}
                        className={`aspect-square rounded-full border-2 p-0.5 sm:p-1 grid place-items-center ${
                          selectedAvatar === id ? "border-stroke bg-accent shadow-[2px_2px_0_hsl(var(--stamp))]" : "border-border bg-card"
                        }`}
                      >
                        <AvatarIcon id={id} className="w-full h-full" />
                      </button>
                    ))}
                  </div>
                </fieldset>

              </>
            )}

            {!goalStep && (
            <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={email}
                onFocus={() => watchField(email)}
                onBlur={leaveField}
                onChange={(e) => {
                  setEmail(e.target.value);
                  typeInField(e.target.value);
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onFocus={() => changeMood("shy")}
                onBlur={leaveField}
                onChange={(e) => {
                  setPassword(e.target.value);
                  bumpLantern();
                }}
                placeholder={t("auth.password.placeholder")}
                required
                minLength={6}
              />
            </div>
            </>
            )}

            <div className="flex gap-3 mt-2">
              {goalStep && (
                <Button type="button" variant="outline" size="lg" onClick={() => setGoalStep(false)}>
                  {t("goal.back")}
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
                {isSubmitting
                  ? t("auth.wait")
                  : !isSignUp
                    ? t("auth.signin")
                    : role !== "teacher" && !goalStep
                      ? t("goal.next")
                      : t("auth.create")}
              </Button>
            </div>
          </form>
          </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
