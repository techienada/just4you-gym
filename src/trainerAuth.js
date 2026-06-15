import { supabase } from "./supabase";

const TRAINER_AUTH_KEY = "just4you_trainer_auth";

const DEFAULT_TRAINER_AUTH = {
  username: "trainer",
  password: "trainer123",
};

export function getTrainerAuth() {
  try {
    const saved = localStorage.getItem(TRAINER_AUTH_KEY);
    if (!saved) return DEFAULT_TRAINER_AUTH;
    const parsed = JSON.parse(saved);
    if (!parsed?.username || !parsed?.password) return DEFAULT_TRAINER_AUTH;
    return parsed;
  } catch {
    return DEFAULT_TRAINER_AUTH;
  }
}

function saveTrainerAuthLocal(auth) {
  localStorage.setItem(TRAINER_AUTH_KEY, JSON.stringify(auth));
}

export async function fetchTrainerAuth() {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("id, username, password")
      .eq("role", "trainer")
      .limit(1);

    if (!error && data?.[0]?.username && data?.[0]?.password) {
      const auth = {
        username: data[0].username,
        password: data[0].password,
      };
      saveTrainerAuthLocal(auth);
      return auth;
    }
  } catch {
    // Fall back to local/default below.
  }

  return getTrainerAuth();
}

export async function saveTrainerAuth(auth) {
  const next = {
    username: auth.username.trim(),
    password: auth.password.trim(),
  };

  const { data: existing } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("role", "trainer")
    .limit(1);

  if (existing?.[0]?.id) {
    const { error } = await supabase
      .from("members")
      .update({
        username: next.username,
        password: next.password,
      })
      .eq("id", existing[0].id);

    if (error) return { error };
  } else {
    const { error } = await supabase.from("members").insert([
      {
        full_name: "Trainer",
        username: next.username,
        password: next.password,
        role: "trainer",
        fee_status: "paid",
      },
    ]);

    if (error) return { error };
  }

  saveTrainerAuthLocal(next);
  return { data: next, error: null };
}

export function getDefaultTrainerAuth() {
  return DEFAULT_TRAINER_AUTH;
}
