import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Lantern, { type LanternMood } from "@/components/lantern/Lantern";
import Seal from "@/components/Seal";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AVATARS } from "@/lib/avatars";

const ROLES: { value: UserRole; labelKey: string }[] = [
  { value: "student", labelKey: "auth.role.student" },
  { value: "independent", labelKey: "auth.role.independent" },
  { value: "teacher", labelKey: "auth.role.teacher" },
];

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [classroomCode, setClassroomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("panda");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, signUp, signIn, joinClassroom } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // The lantern reacts to the form: happy while an email is typed, turns its back for the password
  const [mood, setMood] = useState<LanternMood>("idle");
  const [bounce, setBounce] = useState(0);
  const lastBounce = useRef(0);
  const bumpLantern = () => {
    const now = Date.now();
    if (now - lastBounce.current < 420) return;
    lastBounce.current = now;
    setBounce((b) => b + 1);
  };

  if (!loading && user && !isSubmitting) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMood("thinking");

    try {
      if (isSignUp) {
        await signUp(email, password, fullName, role);

        if (role === "student" && classroomCode.trim()) {
          try {
            await joinClassroom(classroomCode.trim());
          } catch {
            // Non-blocking: classroom join can be done later
          }
        }

        setMood("celebrate");
        toast({ title: t("auth.created"), description: t("auth.created.desc") });
        navigate(role === "teacher" ? "/dashboard" : "/");
      } else {
        await signIn(email, password);
        setMood("happy");
        toast({ title: t("auth.welcomed") });
        navigate("/");
      }
    } catch (err: any) {
      setMood("sad");
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
      <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden p-0">
        <div className="bg-muted border-b-2 md:border-b-0 md:border-e-2 border-stroke flex items-center justify-center min-h-[220px] md:min-h-[520px]">
          <Lantern mood={mood} bounce={bounce} entering className="w-48 h-48 md:w-72 md:h-72" />
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">{isSignUp ? t("auth.join") : t("auth.welcome")}</h1>
            <p lang="zh" className="font-zh text-muted-foreground">{isSignUp ? "欢迎加入" : "欢迎回来"}</p>
          </div>

          {/* Log in or sign up */}
          <div className="grid grid-cols-2 border-2 border-stroke rounded-[10px] overflow-hidden font-bold" role="tablist">
            {[false, true].map((signUpTab) => (
              <button
                key={String(signUpTab)}
                type="button"
                role="tab"
                aria-selected={isSignUp === signUpTab}
                onClick={() => setIsSignUp(signUpTab)}
                className={`py-2 ${isSignUp === signUpTab ? "bg-foreground text-background" : "bg-card"}`}
              >
                {signUpTab ? t("auth.signup") : t("auth.signin")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.name.placeholder")}
                    required
                  />
                </div>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium mb-1.5">{t("auth.role")}</legend>
                  <div className="flex flex-col gap-2">
                    {ROLES.map((r) => (
                      <Button
                        key={r.value}
                        type="button"
                        variant="outline"
                        aria-pressed={role === r.value}
                        className={`w-full justify-start ${role === r.value ? "bg-foreground text-background" : ""}`}
                        onClick={() => setRole(r.value)}
                      >
                        {t(r.labelKey)}
                      </Button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium mb-1.5">{t("auth.avatar")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(AVATARS).map(([id, char]) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={id}
                        aria-pressed={selectedAvatar === id}
                        onClick={() => setSelectedAvatar(id)}
                        className={`rounded-xl ${selectedAvatar === id ? "ring-[3px] ring-ring ring-offset-2 ring-offset-card" : ""}`}
                      >
                        <Seal char={char} tone={selectedAvatar === id ? "red" : "ink"} />
                      </button>
                    ))}
                  </div>
                </fieldset>

                {role === "student" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="classroom">{t("auth.classroom")}</Label>
                    <Input
                      id="classroom"
                      value={classroomCode}
                      onChange={(e) => setClassroomCode(e.target.value)}
                      placeholder={t("auth.classroom.placeholder")}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={email}
                onFocus={() => setMood("watch")}
                onBlur={leaveField}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMood("watch");
                  bumpLantern();
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
                onFocus={() => setMood("shy")}
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

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full mt-2">
              {isSubmitting ? t("auth.wait") : isSignUp ? t("auth.create") : t("auth.signin")}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
