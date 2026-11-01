import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { resolvePrefs, writeLocalPrefs, type LearningPrefs } from "@/lib/dailyGoal";

export type UserRole = "student" | "teacher" | "independent";

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  classroom_id: string | null;
  language_pref: "ar" | "en";
  // Added by 20261101_daily_goal_and_reminders.sql; missing until it is run
  daily_goal_minutes?: number | null;
  reminder_enabled?: boolean | null;
  reminder_time?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Daily goal and reminder settings; null when signed out */
  prefs: LearningPrefs | null;
  signUp: (email: string, password: string, fullName: string, role: string, prefs?: LearningPrefs) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  joinClassroom: (code: string) => Promise<void>;
  createClassroom: (name: string) => Promise<string>;
  setAvatar: (avatarId: string) => Promise<void>;
  setLearningPrefs: (prefs: LearningPrefs) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefsVersion, setPrefsVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, fullName: string, role: string, prefs?: LearningPrefs) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // The goal rides along in the sign-up metadata too, so it is kept even when email confirmation is on
        data: {
          full_name: fullName,
          role,
          ...(prefs && {
            daily_goal_minutes: prefs.goalMinutes,
            reminder_enabled: prefs.reminderOn,
            reminder_time: prefs.reminderTime,
          }),
        },
      },
    });
    if (error) throw error;
    if (prefs && data.user) writeLocalPrefs(data.user.id, prefs);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Right after sign-up the `user` state has not updated yet, so ask Supabase for the session user.
  const currentUser = async () => {
    if (user) return user;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Not authenticated");
    return data.user;
  };

  const joinClassroom = async (code: string) => {
    const me = await currentUser();
    const clean = code.trim().toUpperCase();

    // Preferred: the join_classroom function (students cannot read classrooms they are not in)
    const { error: rpcError } = await (supabase as any).rpc("join_classroom", { class_code: clean });
    if (!rpcError) {
      await fetchProfile(me.id);
      return;
    }
    // Function not deployed yet: fall back to the direct lookup
    if (rpcError.code !== "PGRST202" && rpcError.code !== "42883") throw rpcError;

    const { data: classroom } = await (supabase as any)
      .from("classrooms")
      .select("id")
      .eq("code", clean)
      .maybeSingle();

    if (!classroom) throw new Error("Classroom not found");

    const { error } = await (supabase as any)
      .from("profiles")
      .update({ classroom_id: classroom.id })
      .eq("id", me.id);

    if (error) throw error;
    await fetchProfile(me.id);
  };

  const setAvatar = async (avatarId: string) => {
    const me = await currentUser();
    const { error } = await (supabase as any).from("profiles").update({ avatar_url: avatarId }).eq("id", me.id);
    if (error) throw error;
    await fetchProfile(me.id);
  };

  const setLearningPrefs = async (next: LearningPrefs) => {
    const me = await currentUser();
    // This device always remembers, so reminders work even before the database has the new columns
    writeLocalPrefs(me.id, next);
    setPrefsVersion((v) => v + 1);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        daily_goal_minutes: next.goalMinutes,
        reminder_enabled: next.reminderOn,
        reminder_time: next.reminderTime,
      })
      .eq("id", me.id);
    if (!error) await fetchProfile(me.id);
  };

  const prefs = useMemo(
    () => (user ? resolvePrefs(user.id, profile as unknown as Record<string, unknown> | null, user.user_metadata) : null),
    // prefsVersion: re-read this device's copy after a change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, prefsVersion],
  );

  const createClassroom = async (name: string): Promise<string> => {
    const me = await currentUser();
    // No 0/O or 1/I so the code is easy to read out to a class
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

    const { error } = await (supabase as any)
      .from("classrooms")
      .insert({ teacher_id: me.id, name, code });

    if (error) throw error;
    return code;
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, prefs,
      signUp, signIn, signOut, joinClassroom, createClassroom, setAvatar, setLearningPrefs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
