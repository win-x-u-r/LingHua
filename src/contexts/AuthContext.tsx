import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { resolvePrefs, writeLocalPrefs, type LearningPrefs } from "@/lib/dailyGoal";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { pathFor, type LearningPath } from "@/lib/learningPaths";

/** Sign-up choices that need a signed-in learner. When the email must be confirmed first,
 *  they wait in the sign-up details and are applied the first time the learner logs in. */
export interface SignUpExtras {
  avatar?: string;
  classCode?: string;
  className?: string;
  /** Kept apart so Hua can greet people by first name ("Abdul Rahman" stays whole) */
  firstName?: string;
  /** Independent learners pick a learning path at sign-up */
  learningPath?: LearningPath;
}

export interface SignUpResult {
  /** Supabase sent a confirmation email and the learner is not signed in yet */
  needsConfirm: boolean;
}

/** Where the confirmation email sends people back to: the site they signed up on */
export const authRedirectUrl = () => `${window.location.origin}/auth`;

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
  /** The learning path this learner follows; null for teachers and when signed out */
  learningPath: LearningPath | null;
  signUp: (email: string, password: string, fullName: string, role: string, prefs?: LearningPrefs, extras?: SignUpExtras) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  /** Saves the avatar and class picked at sign-up, if they are still waiting */
  finishSetup: () => Promise<void>;
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
  const { t } = useLanguage();
  const setupJob = useRef<Promise<void> | null>(null);
  const setupDone = useRef(new Set<string>());

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

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
    prefs?: LearningPrefs,
    extras?: SignUpExtras,
  ): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Without this the confirmation link goes to the Site URL in Supabase, which may not be this site
        emailRedirectTo: authRedirectUrl(),
        // The goal and the other choices ride along in the sign-up metadata, so they are kept
        // even when email confirmation is on and nobody is signed in yet
        data: {
          full_name: fullName,
          role,
          ...(prefs && {
            daily_goal_minutes: prefs.goalMinutes,
            reminder_enabled: prefs.reminderOn,
            reminder_time: prefs.reminderTime,
          }),
          ...(extras?.avatar && { pending_avatar: extras.avatar }),
          ...(extras?.classCode && { pending_class_code: extras.classCode.trim().toUpperCase() }),
          ...(extras?.className && { pending_class_name: extras.className.trim() }),
          ...(extras?.firstName && { first_name: extras.firstName }),
          ...(extras?.learningPath && { learning_path: extras.learningPath }),
        },
      },
    });
    if (error) throw error;
    // With confirmation on, Supabase answers an already-used email with a user that has no identities
    if (data.user && data.user.identities?.length === 0) throw new Error("already_registered");
    if (prefs && data.user) writeLocalPrefs(data.user.id, prefs);
    return { needsConfirm: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
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

  const learningPath = useMemo(
    () => pathFor(user, profile?.role, profile?.classroom_id),
    [user, profile],
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

  // Finish the sign-up choices (avatar, class) that wait in the sign-up details. With email
  // confirmation on they can only be saved once the learner is signed in, so this runs on the
  // first log-in. It is safe to call more than once: each step checks whether it is still needed.
  const finishSetup = (): Promise<void> => {
    setupJob.current ??= (async () => {
      const { data: { user: me } } = await supabase.auth.getUser();
      if (!me || setupDone.current.has(me.id)) return;
      const meta = me.user_metadata ?? {};
      const avatar = typeof meta.pending_avatar === "string" ? meta.pending_avatar : "";
      const classCode = typeof meta.pending_class_code === "string" ? meta.pending_class_code : "";
      const className = typeof meta.pending_class_name === "string" ? meta.pending_class_name : "";
      if (!avatar && !classCode && !className) {
        setupDone.current.add(me.id);
        return;
      }
      const { data: mine } = await (supabase as any).from("profiles").select("*").eq("id", me.id).maybeSingle();
      if (!mine) return; // no profile row yet: try again next time

      if (avatar && mine.avatar_url !== avatar) {
        try { await setAvatar(avatar); } catch { /* keeps the default panda */ }
      }
      if (classCode && mine.role === "student" && !mine.classroom_id) {
        try {
          await joinClassroom(classCode);
        } catch {
          toast({ title: t("class.join.failed"), description: t("class.join.later") });
        }
      }
      if (className && mine.role === "teacher") {
        try {
          const { data: existing } = await (supabase as any)
            .from("classrooms").select("id").eq("teacher_id", me.id).limit(1);
          if (!existing?.length) await createClassroom(className);
        } catch {
          // The dashboard shows "create your class" when there is none yet
        }
      }
      setupDone.current.add(me.id);
      await supabase.auth.updateUser({
        data: { pending_avatar: null, pending_class_code: null, pending_class_name: null },
      });
    })().finally(() => {
      setupJob.current = null;
    });
    return setupJob.current;
  };

  useEffect(() => {
    const meta = user?.user_metadata;
    if (!user || !profile || setupDone.current.has(user.id)) return;
    if (meta?.pending_avatar || meta?.pending_class_code || meta?.pending_class_name) void finishSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, prefs, learningPath,
      signUp, signIn, resendConfirmation, finishSetup, signOut, joinClassroom, createClassroom, setAvatar, setLearningPrefs,
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
