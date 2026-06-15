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

export function saveTrainerAuth(auth) {
  localStorage.setItem(TRAINER_AUTH_KEY, JSON.stringify(auth));
}

export function getDefaultTrainerAuth() {
  return DEFAULT_TRAINER_AUTH;
}
