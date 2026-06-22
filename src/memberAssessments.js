import { supabase } from "./supabase";

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

function createAssessmentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `assessment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultAssessment(member = {}, previousAssessment = {}) {
  return {
    id: createAssessmentId(),
    date: new Date().toISOString().split("T")[0],
    height: previousAssessment.height || (member.height ? String(member.height) : ""),
    weight: previousAssessment.weight || (member.weight ? String(member.weight) : ""),
    bodyFat: "",
    visceralFat: "",
    bmr: "",
    bodyAge: previousAssessment.bodyAge || (member.age ? String(member.age) : ""),
    trunkFat: "",
    skeletalMuscle: "",
    profileNote: "",
    remarks: "",
  };
}

function normalizeAssessmentEntry(entry = {}, member = {}) {
  const fallback = createDefaultAssessment(member);
  return {
    ...fallback,
    ...(entry || {}),
    id: entry?.id || fallback.id,
    date: entry?.date || fallback.date,
  };
}

function sortAssessments(list = []) {
  return [...list].sort((a, b) => {
    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });
}

function mapDbRowToAssessment(row = {}, member = {}) {
  return normalizeAssessmentEntry({
    id: row.id,
    date: row.assessment_date,
    height: row.height != null ? String(row.height) : "",
    weight: row.weight != null ? String(row.weight) : "",
    bodyFat: row.body_fat != null ? String(row.body_fat) : "",
    visceralFat: row.visceral_fat != null ? String(row.visceral_fat) : "",
    bmr: row.bmr != null ? String(row.bmr) : "",
    bodyAge: row.body_age != null ? String(row.body_age) : "",
    trunkFat: row.trunk_fat != null ? String(row.trunk_fat) : "",
    skeletalMuscle: row.skeletal_muscle != null ? String(row.skeletal_muscle) : "",
    profileNote: row.profile_note || "",
    remarks: row.remarks || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }, member);
}

function mapAssessmentToDbRow(memberId, assessment = {}) {
  const toNumber = (value) => {
    if (value === "" || value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  return {
    id: assessment.id,
    member_id: memberId,
    assessment_date: assessment.date || new Date().toISOString().split("T")[0],
    height: toNumber(assessment.height),
    weight: toNumber(assessment.weight),
    body_fat: toNumber(assessment.bodyFat),
    visceral_fat: toNumber(assessment.visceralFat),
    bmr: toNumber(assessment.bmr),
    body_age: toNumber(assessment.bodyAge),
    trunk_fat: toNumber(assessment.trunkFat),
    skeletal_muscle: toNumber(assessment.skeletalMuscle),
    profile_note: assessment.profileNote || null,
    remarks: assessment.remarks || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchMemberAssessments(member = {}) {
  if (!member?.id) return [];
  const { data, error } = await supabase
    .from("assessment_history")
    .select("*")
    .eq("member_id", member.id)
    .order("assessment_date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return sortAssessments((data || []).map((row) => mapDbRowToAssessment(row, member)));
}

export async function fetchLatestMemberAssessment(member = {}) {
  const assessments = await fetchMemberAssessments(member);
  return assessments[0] || createDefaultAssessment(member);
}

export async function saveMemberAssessment(memberId, assessment, member = {}) {
  if (!memberId) return [];
  const payload = mapAssessmentToDbRow(memberId, normalizeAssessmentEntry(assessment, member));
  const { error } = await supabase.from("assessment_history").upsert([payload], { onConflict: "id" });
  if (error) {
    throw error;
  }
  return fetchMemberAssessments({ ...member, id: memberId });
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
