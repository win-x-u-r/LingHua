import { useState } from "react";
import { useNavigate } from "react-router-dom";
import lanternLogo from "@/assets/lantern-logo.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const AVATARS = ["panda", "dragon", "phoenix", "bamboo", "lotus", "star"];

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [classroomCode, setClassroomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("panda");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signIn, joinClassroom } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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

        toast({ title: "Account created!", description: "Welcome to Ling Hua!" });
        navigate(role === "teacher" ? "/dashboard" : "/flashcards");
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
        navigate("/flashcards");
      }
    } catch (err: any) {
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Card className="w-full max-w-md p-8 shadow-glow border-2 border-primary/10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow mx-auto mb-4">
            <img src={lanternLogo} alt="Ling Hua logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-coral bg-clip-text text-transparent">
            {isSignUp ? "Join Líng Huà" : "Welcome Back"}
          </h1>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={!isSignUp ? "default" : "outline"}
            className={`flex-1 ${!isSignUp ? "bg-gradient-coral" : ""}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </Button>
          <Button
            variant={isSignUp ? "default" : "outline"}
            className={`flex-1 ${isSignUp ? "bg-gradient-coral" : ""}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              {/* Full Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Role Selection */}
              <div>
                <Label>I am a</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={role === "student" ? "default" : "outline"}
                    className={`flex-1 ${role === "student" ? "bg-gradient-mint" : ""}`}
                    onClick={() => setRole("student")}
                  >
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant={role === "teacher" ? "default" : "outline"}
                    className={`flex-1 ${role === "teacher" ? "bg-gradient-lavender" : ""}`}
                    onClick={() => setRole("teacher")}
                  >
                    Teacher
                  </Button>
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <Label>Choose your avatar</Label>
                <div className="flex gap-2 mt-1 justify-center">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                        selectedAvatar === avatar
                          ? "border-primary bg-primary/10 scale-110"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      {avatar === "panda" && "🐼"}
                      {avatar === "dragon" && "🐉"}
                      {avatar === "phoenix" && "🦅"}
                      {avatar === "bamboo" && "🎋"}
                      {avatar === "lotus" && "🪷"}
                      {avatar === "star" && "⭐"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classroom Code (students only) */}
              {role === "student" && (
                <div>
                  <Label htmlFor="classroom">Classroom Code (optional)</Label>
                  <Input
                    id="classroom"
                    value={classroomCode}
                    onChange={(e) => setClassroomCode(e.target.value)}
                    placeholder="Enter your teacher's code"
                  />
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-coral hover:scale-105 transition-transform"
            size="lg"
          >
            {isSubmitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
