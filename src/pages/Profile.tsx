import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { XPBar } from "@/components/XPBar";
import { StreakIndicator } from "@/components/StreakIndicator";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Star, BookOpen, Target, School } from "lucide-react";

interface ProgressData {
  total_xp: number;
  current_streak: number;
  completed_words: number;
  last_practice_date: string | null;
}

interface Badge {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  xp_reward: number;
}

const AVATAR_MAP: Record<string, string> = {
  panda: "🐼",
  dragon: "🐉",
  phoenix: "🦅",
  bamboo: "🎋",
  lotus: "🪷",
  star: "⭐",
};

const Profile = () => {
  const { user, profile, joinClassroom } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [classroomCode, setClassroomCode] = useState("");
  const [joiningClassroom, setJoiningClassroom] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProgress();
    loadBadges();
    loadAttempts();
    loadClassroom();
  }, [user]);

  const loadClassroom = async () => {
    if (!profile?.classroom_id) {
      setCurrentClassroom(null);
      return;
    }
    const { data } = await (supabase as any)
      .from("classrooms")
      .select("name, code")
      .eq("id", profile.classroom_id)
      .single();
    if (data) setCurrentClassroom(data.name);
  };

  const handleJoinClassroom = async () => {
    if (!classroomCode.trim()) return;
    setJoiningClassroom(true);
    try {
      await joinClassroom(classroomCode.trim());
      toast({ title: t("profile.joined_classroom"), description: t("profile.joined_classroom_desc") });
      setClassroomCode("");
      loadClassroom();
    } catch (err) {
      toast({
        title: t("common.error"),
        description: err instanceof Error ? err.message : "Failed to join classroom",
        variant: "destructive",
      });
    } finally {
      setJoiningClassroom(false);
    }
  };

  const loadProgress = async () => {
    const { data } = await (supabase as any)
      .from("progress")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setProgress(data as ProgressData);
    } else {
      // No progress record yet — show defaults
      setProgress({ total_xp: 0, current_streak: 0, completed_words: 0, last_practice_date: null });
    }
  };

  const loadBadges = async () => {
    const { data: badges } = await (supabase as any).from("badges").select("*");
    if (badges) setAllBadges(badges as Badge[]);

    const { data: earned } = await (supabase as any)
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user!.id);
    if (earned) setEarnedBadgeIds(earned.map((e: any) => e.badge_id));
  };

  const loadAttempts = async () => {
    const { count } = await (supabase as any)
      .from("attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id);
    setTotalAttempts(count || 0);
  };

  if (!profile || !progress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const avatarEmoji = AVATAR_MAP[profile.avatar_url] || "🐼";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="p-8 mb-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/10 shadow-glow">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-coral flex items-center justify-center text-4xl shadow-glow">
              {avatarEmoji}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground capitalize">{profile.role}</p>
              <div className="mt-2">
                <StreakIndicator streak={progress.current_streak} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Experience Points
          </h2>
          <XPBar totalXp={progress.total_xp} />
        </Card>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold bg-gradient-coral bg-clip-text text-transparent">
              {progress.total_xp}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total XP</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold bg-gradient-mint bg-clip-text text-transparent">
              {progress.completed_words}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Words Learned</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold bg-gradient-lavender bg-clip-text text-transparent">
              {totalAttempts}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Practice Sessions</div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Badges ({earnedBadgeIds.length}/{allBadges.length})
          </h2>
          <BadgeDisplay allBadges={allBadges} earnedBadgeIds={earnedBadgeIds} />
        </Card>

        {/* Join Classroom - for students */}
        {profile.role === "student" && (
          <Card className="p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              {t("profile.classroom")}
            </h2>
            {currentClassroom ? (
              <p className="text-muted-foreground">
                {t("profile.current_classroom")}: <span className="font-medium text-foreground">{currentClassroom}</span>
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("profile.join_classroom_desc")}</p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("profile.classroom_code_placeholder")}
                    value={classroomCode}
                    onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                    className="max-w-[200px] font-mono tracking-wider"
                    maxLength={8}
                  />
                  <Button
                    onClick={handleJoinClassroom}
                    disabled={joiningClassroom || !classroomCode.trim()}
                    className="bg-gradient-mint"
                  >
                    {joiningClassroom ? "..." : t("profile.join")}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
