const STORAGE_KEY = "just4you_member_assessments";

export const ASSESSMENT_FIELDS = [
  { key: "date", label: "Assessment Date", type: "date" },
  { key: "height", label: "Height (cm)", type: "number", step: "0.1" },
  { key: "weight", label: "Weight (kg)", type: "number", step: "0.1" },
  { key: "bodyFat", label: "Body Fat %", type: "number", step: "0.1" },
  { key: "visceralFat", label: "Visceral Fat %", type: "number", step: "0.1" },
  { key: "bmr", label: "BMR (kcal)", type: "number", step: "1" },
  { key: "bodyAge", label: "Body Age", type: "number", step: "1" },
  { key: "trunkFat", label: "Trunk Subcutaneous Fat %", type: "number", step: "0.1" },
  { key: "skeletalMuscle", label: "Skeletal Muscle %", type: "number", step: "0.1" },
  { key: "profileNote", label: "FBS / Lipid / Notes", type: "text" },
  { key: "remarks", label: "Trainer Remarks", type: "textarea" },
];

function readAssessmentStore() {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function writeAssessmentStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createDefaultAssessment(member = {}) {
  return {
    date: new Date().toISOString().split("T")[0],
    height: member.height ? String(member.height) : "",
    weight: member.weight ? String(member.weight) : "",
    bodyFat: "",
    visceralFat: "",
    bmr: "",
    bodyAge: member.age ? String(member.age) : "",
    trunkFat: "",
    skeletalMuscle: "",
    profileNote: "",
    remarks: "",
  };
}

export function getMemberAssessment(member = {}) {
  const store = readAssessmentStore();
  const saved = member?.id ? store[member.id] : null;
  return {
    ...createDefaultAssessment(member),
    ...(saved || {}),
  };
}

export function saveMemberAssessment(memberId, assessment) {
  if (!memberId) return;
  const store = readAssessmentStore();
  store[memberId] = {
    ...assessment,
    updated_at: new Date().toISOString(),
  };
  writeAssessmentStore(store);
}

export function calcAssessmentBMI(height, weight) {
  const h = Number(height);
  const w = Number(weight);
  if (!h || !w) return null;
  return (w / ((h / 100) ** 2)).toFixed(1);
}

export function getAssessmentBMICategory(bmi) {
  const value = Number(bmi);
  if (!value) return null;
  if (value < 18.5) return { label: "Underweight", color: "#60a5fa", bg: "#eff6ff" };
  if (value < 25) return { label: "Normal", color: "#16a34a", bg: "#f0fdf4" };
  if (value < 30) return { label: "Overweight", color: "#d97706", bg: "#fffbeb" };
  return { label: "Obese", color: "#dc2626", bg: "#fef2f2" };
}

export function getBodyFatStatus(bodyFat) {
  const value = Number(bodyFat);
  if (!value) return null;
  if (value < 20) return { label: "Low", color: "#2563eb", bg: "#eff6ff" };
  if (value <= 30) return { label: "Normal", color: "#16a34a", bg: "#f0fdf4" };
  if (value <= 35) return { label: "Risky", color: "#d97706", bg: "#fffbeb" };
  if (value <= 40) return { label: "Very Risky", color: "#ea580c", bg: "#fff7ed" };
  return { label: "Extreme Risk", color: "#dc2626", bg: "#fef2f2" };
}
