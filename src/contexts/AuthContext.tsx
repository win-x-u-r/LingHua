import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "student" | "teacher" | "independent";

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  classroom_id: string | null;
  language_pref: "ar" | "en";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  joinClassroom: (code: string) => Promise<void>;
  createClassroom: (name: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) throw error;
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

    const { data: classroom } = await (supabase as any)
      .from("classrooms")
      .select("id")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (!classroom) throw new Error("Classroom not found");

    const { error } = await (supabase as any)
      .from("profiles")
      .update({ classroom_id: classroom.id })
      .eq("id", me.id);

    if (error) throw error;
    await fetchProfile(me.id);
  };

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
      user, session, profile, loading,
      signUp, signIn, signOut, joinClassroom, createClassroom,
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
