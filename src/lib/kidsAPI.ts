// Little Lanterns picture log-in: kids in a class log in with the class code,
// their name and 3 secret pictures. The backend checks the pictures and hands
// back a normal Supabase session.
import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/** The 9 secret pictures, in grid order. Must match backend/services/kids.py. */
export const SECRET_PICTURES = ["panda", "dragon", "dumpling", "cat", "lotus", "bamboo", "kite", "lantern", "scroll"] as const;
export type SecretPicture = (typeof SECRET_PICTURES)[number];
export const PICTURE_COUNT = 3;

export interface Kid {
  id: string;
  name: string;
  avatar: string;
}

/** Error codes the screens turn into friendly messages. */
export type KidsErrorCode =
  | "class_not_found"
  | "name_taken"
  | "name_needed"
  | "wrong_pictures"
  | "locked"
  | "not_set_up"
  | "server_error";

export class KidsError extends Error {
  constructor(public code: KidsErrorCode) {
    super(code);
  }
}

async function call<T>(path: string, body: unknown, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/kids/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new KidsError("server_error");
  }
  // An older server has no /kids routes yet
  if (res.status === 404 && !res.headers.get("content-type")?.includes("json")) throw new KidsError("not_set_up");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = (data?.error as KidsErrorCode) || "server_error";
    throw new KidsError(res.status === 404 && code === "server_error" ? "not_set_up" : code);
  }
  return data as T;
}

export async function getClassKids(code: string): Promise<{ className: string; kids: Kid[] }> {
  const data = await call<{ class_name: string; kids: Kid[] }>("roster", { code });
  return { className: data.class_name, kids: data.kids };
}

async function startSession(tokens: { access_token: string; refresh_token: string }) {
  const { error } = await supabase.auth.setSession(tokens);
  if (error) throw new KidsError("server_error");
}

export async function kidLogIn(kidId: string, pictures: SecretPicture[]) {
  await startSession(await call("login", { kid_id: kidId, pictures }));
}

export async function kidJoin(code: string, firstName: string, lastName: string, avatar: string, pictures: SecretPicture[]) {
  const first = firstName.trim();
  const name = `${first} ${lastName.trim()}`.trim();
  await startSession(await call("join", { code, name, first_name: first, avatar, pictures }));
}

/** The child forgot their pictures: puts them on the teacher's "needs help" list. */
export async function askTeacherForHelp(kidId: string) {
  await call("help", { kid_id: kidId });
}

/** Teacher only: give a child in the teacher's class new secret pictures. */
export async function resetKidPictures(kidId: string, pictures: SecretPicture[]) {
  const { data } = await supabase.auth.getSession();
  await call("reset", { kid_id: kidId, pictures }, data.session?.access_token);
}
