import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { ASSESSMENT_FIELDS, calcAssessmentBMI, createDefaultAssessment, fetchMemberAssessments, getAssessmentBMICategory, getBodyFatStatus } from "../memberAssessments";
import { getMemberPhoto } from "../memberPhotos";

const UPI_ID = "919014944750@axlm";
const UPI_NAME = "Amatul Gaffar";
const UPI_NOTE = "Just4You Ladies Gym Fee";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WORKOUT_PLANS = {
  Monday: [
    { name: "Barbell Squat", sets: "4x10", muscle: "Legs", icon: "🏋️" },
    { name: "Leg Press", sets: "3x12", muscle: "Legs", icon: "🦵" },
    { name: "Lunges", sets: "3x10 each", muscle: "Legs", icon: "🚶" },
    { name: "Calf Raises", sets: "4x15", muscle: "Calves", icon: "⬆️" },
  ],
  Tuesday: [
    { name: "Bench Press", sets: "4x8", muscle: "Chest", icon: "💪" },
    { name: "Incline Dumbbell Press", sets: "3x10", muscle: "Chest", icon: "🏋️" },
    { name: "Cable Flyes", sets: "3x12", muscle: "Chest", icon: "🔁" },
    { name: "Tricep Dips", sets: "3x10", muscle: "Triceps", icon: "⬇️" },
  ],
  Wednesday: [
    { name: "Deadlift", sets: "4x6", muscle: "Back", icon: "🏋️" },
    { name: "Pull-Ups", sets: "3x8", muscle: "Back", icon: "⬆️" },
    { name: "Bent-Over Row", sets: "4x10", muscle: "Back", icon: "🔁" },
    { name: "Bicep Curls", sets: "3x12", muscle: "Biceps", icon: "💪" },
  ],
  Thursday: [
    { name: "Active Recovery", sets: "—", muscle: "Full Body", icon: "🧘" },
    { name: "Foam Rolling", sets: "15 min", muscle: "Recovery", icon: "🔁" },
    { name: "Light Walk", sets: "30 min", muscle: "Cardio", icon: "🚶" },
  ],
  Friday: [
    { name: "Overhead Press", sets: "4x8", muscle: "Shoulders", icon: "🏋️" },
    { name: "Lateral Raises", sets: "3x15", muscle: "Shoulders", icon: "🔁" },
    { name: "Front Raises", sets: "3x12", muscle: "Shoulders", icon: "⬆️" },
    { name: "Face Pulls", sets: "3x15", muscle: "Rear Delt", icon: "💪" },
  ],
  Saturday: [
    { name: "HIIT Sprints", sets: "8 rounds", muscle: "Cardio", icon: "🏃" },
    { name: "Jump Rope", sets: "3x3 min", muscle: "Cardio", icon: "⚡" },
    { name: "Box Jumps", sets: "4x10", muscle: "Power", icon: "📦" },
    { name: "Burpees", sets: "3x15", muscle: "Full Body", icon: "🔥" },
  ],
  Sunday: [
    { name: "Rest Day", sets: "—", muscle: "Recovery", icon: "😴" },
    { name: "Stretching", sets: "20 min", muscle: "Flexibility", icon: "🧘" },
  ],
};

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return (weight / ((height / 100) ** 2)).toFixed(1);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#60a5fa", bg: "#eff6ff" };
  if (bmi < 25) return { label: "Normal", color: "#16a34a", bg: "#f0fdf4" };
  if (bmi < 30) return { label: "Overweight", color: "#d97706", bg: "#fffbeb" };
  return { label: "Obese", color: "#dc2626", bg: "#fef2f2" };
}

function getExpiryStatus(expiry) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Membership expired", color: "#dc2626", bg: "#fef2f2", detail: "Please contact your trainer to renew your membership." };
  if (days <= 3) return { label: `Membership ends in ${days} day${days === 1 ? "" : "s"}`, color: "#dc2626", bg: "#fef2f2", detail: "Renew soon to keep your access active." };
  if (days <= 7) return { label: `Membership ends in ${days} days`, color: "#d97706", bg: "#fffbeb", detail: "Your trainer can help you renew your plan." };
  return null;
}

function getUPILink(amount) {
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
}

export default function MemberDashboard({ member, onLogout }) {
  const [weightHistory, setWeightHistory] = useState([]);
  const [assessment, setAssessment] = useState(() => createDefaultAssessment(member));
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [assessmentMsg, setAssessmentMsg] = useState("");
  const [memberPhoto, setMemberPhoto] = useState(() => getMemberPhoto(member?.id));
  const [photoBroken, setPhotoBroken] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: member?.fee_amount ? String(member.fee_amount) : "",
    package_type: member?.package_type || "Monthly",
  });
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [tab, setTab] = useState("home");
  const today = DAYS[new Date().getDay()];
  const todayWorkout = WORKOUT_PLANS[today] || [];
  const bmi = calcBMI(member.weight, member.height);
  const category = bmi ? getBMICategory(parseFloat(bmi)) : null;
  const pct = bmi ? Math.min(Math.max((parseFloat(bmi) - 10) / 30, 0), 1) * 100 : 0;
  const expiry = getExpiryStatus(member.expiry_date);
  const firstName = (member.full_name || "Member").trim().split(/\s+/)[0] || "Member";

  useEffect(() => {
    if (!member?.id) {
      setWeightHistory([]);
      return;
    }

    supabase
      .from("weight_history")
      .select("*")
      .eq("member_id", member.id)
      .order("recorded_at", { ascending: false })
      .then(({ data }) => setWeightHistory(data || []));

    supabase
      .from("upi_payments")
      .select("*")
      .eq("member_id", member.id)
      .order("submitted_at", { ascending: false })
      .then(({ data }) => setPaymentHistory(data || []));

    fetchMemberAssessments(member)
      .then((history) => {
        setAssessmentHistory(history);
        setAssessment(history[0] || createDefaultAssessment(member));
        setAssessmentMsg("");
      })
      .catch((error) => {
        setAssessmentHistory([]);
        setAssessment(createDefaultAssessment(member));
        setAssessmentMsg(`error:${error.message}`);
      });
  }, [member?.id]);

  useEffect(() => {
    setAssessment(createDefaultAssessment(member));
    setAssessmentHistory([]);
    setAssessmentMsg("");
    setMemberPhoto(getMemberPhoto(member?.id));
    setPhotoBroken(false);
    setPaymentForm({
      amount: member?.fee_amount ? String(member.fee_amount) : "",
      package_type: member?.package_type || "Monthly",
    });
    setPaymentMsg("");
  }, [member]);

  const assessmentBMI = calcAssessmentBMI(assessment.height, assessment.weight);
  const assessmentBMICategory = getAssessmentBMICategory(assessmentBMI);
  const bodyFatStatus = getBodyFatStatus(assessment.bodyFat);
  const latestPayment = paymentHistory[0] || null;
  const effectivePaymentStatus = latestPayment?.status || member.payment_status || "not submitted";
  const effectiveLastPaymentAmount = latestPayment?.amount || member.last_payment_amount || null;
  const olderAssessments = assessmentHistory.filter((entry) => entry.id !== assessment.id);
  const paymentAmount = Number.parseFloat(paymentForm.amount || member?.fee_amount || "0");

  async function submitPayment() {
    setPaymentMsg("");
    const amount = Number.parseFloat(paymentForm.amount || "0");
    if (!amount || amount <= 0) {
      setPaymentMsg("error:Please enter a valid payment amount.");
      return;
    }

    setPaymentLoading(true);
    const payload = {
      member_id: member.id,
      member_name: member.full_name,
      amount,
      package_type: paymentForm.package_type || member.package_type || "Monthly",
      status: "pending",
    };

    const { data, error } = await supabase.from("upi_payments").insert([payload]).select();
    if (error) {
      setPaymentMsg(`error:${error.message}`);
    } else {
      await supabase.from("members").update({ payment_status: "pending" }).eq("id", member.id);
      setPaymentHistory((current) => [...(data || []), ...current]);
      setPaymentMsg("success");
    }
    setPaymentLoading(false);
  }

  const card = {
    background: "#fff",
    border: "1px solid #e0d7f5",
    borderRadius: 16,
    padding: "20px",
    marginBottom: 14,
    boxShadow: "0 2px 12px rgba(108,63,196,0.08)",
  };

  const tabBtn = (active) => ({
    padding: "9px 16px",
    borderRadius: 10,
    border: "none",
    background: active ? "linear-gradient(135deg,#9b7ed4,#6c3fc4)" : "#f3f0ff",
    color: active ? "#fff" : "#7c6a9a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6ff", fontFamily: "'Segoe UI',sans-serif", color: "#1e1030" }}>
      <style>{`
        @media(max-width:768px){
          .stats-3{grid-template-columns:1fr 1fr 1fr!important}
          .payment-qr-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <div style={{ background: "#fff", borderBottom: "1px solid #e0d7f5", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60, boxShadow: "0 2px 12px rgba(108,63,196,0.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌸</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#6c3fc4" }}>Just4You Ladies Gym</h1>
            <p style={{ margin: 0, fontSize: 10, color: "#7c6a9a" }}>Hi, {firstName}! 💪</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e0d7f5", background: "#fff", color: "#7c6a9a", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Logout</button>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e0d7f5", padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        <button onClick={() => setTab("home")} style={tabBtn(tab === "home")}>🏠 Home</button>
        <button onClick={() => setTab("bmi")} style={tabBtn(tab === "bmi")}>⚖️ BMI</button>
        <button onClick={() => setTab("payments")} style={tabBtn(tab === "payments")}>💳 Payments</button>
        <button onClick={() => setTab("workout")} style={tabBtn(tab === "workout")}>🏋️ Workout</button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        {tab === "home" && (
          <div>
            {expiry && (
              <div style={{ ...card, background: expiry.bg, border: `1px solid ${expiry.color}33`, marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: expiry.color }}>{expiry.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#7c6a9a" }}>{expiry.detail}</p>
              </div>
            )}

            <div style={{ ...card, background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>Hello, {firstName}! 🌸</h2>
                <p style={{ margin: "0 0 8px", opacity: 0.85, fontSize: 13 }}>Ready to crush today&apos;s workout?</p>
                {member.goal && <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 12px", borderRadius: 20, fontSize: 12 }}>🎯 {member.goal}</span>}
                {member.package_type && <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 12px", borderRadius: 20, fontSize: 12, marginLeft: 6 }}>📦 {member.package_type}</span>}
              </div>
              {memberPhoto && !photoBroken ? (
                <img src={memberPhoto} alt={firstName} onError={() => setPhotoBroken(true)} style={{ width: 78, height: 78, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
              ) : (
                <div style={{ fontSize: 56, opacity: 0.2 }}>💪</div>
              )}
            </div>

            <div className="stats-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["📏", "Height", member.height ? `${member.height} cm` : "—", "#eff6ff"], ["⚖️", "Weight", member.weight ? `${member.weight} kg` : "—", "#f5f0ff"], ["🔢", "BMI", bmi || "—", category ? category.bg : "#f5f0ff"]].map(([icon, label, value, bg]) => (
                <div key={label} style={{ ...card, textAlign: "center", marginBottom: 0, background: bg, padding: 14 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <p style={{ margin: "0 0 2px", color: "#7c6a9a", fontSize: 10, fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#1e1030" }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>💪 Today — {today}</h3>
                <button onClick={() => setTab("workout")} style={{ background: "none", border: "none", color: "#9b7ed4", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>See all →</button>
              </div>
              {todayWorkout.slice(0, 3).map((workout, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 2 ? "1px solid #f5f0ff" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3f0ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{workout.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 14 }}>{workout.name}</p>
                    <p style={{ margin: 0, color: "#7c6a9a", fontSize: 11 }}>{workout.muscle}</p>
                  </div>
                  <span style={{ background: "#f3f0ff", color: "#9b7ed4", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{workout.sets}</span>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Assessment Sheet</h3>
                  <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Visible to you, editable from trainer access only. Your newest assessment shows first.</p>
                </div>
                {assessment.date && <span style={{ background: "#f3f0ff", color: "#6c3fc4", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{assessment.date}</span>}
              </div>

              {assessmentMsg.startsWith("error:") ? (
                <p style={{ color: "#dc2626", fontSize: 13 }}>{assessmentMsg.replace("error:", "")}</p>
              ) : !assessmentHistory.length ? (
                <p style={{ color: "#7c6a9a", fontSize: 13 }}>Your trainer has not added this assessment yet.</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      ["Body Fat", assessment.bodyFat ? `${assessment.bodyFat}%` : "-", bodyFatStatus],
                      ["Visceral Fat", assessment.visceralFat ? `${assessment.visceralFat}%` : "-", null],
                      ["BMR", assessment.bmr ? `${assessment.bmr} kcal` : "-", null],
                      ["Assessment BMI", assessmentBMI || "-", assessmentBMICategory],
                      ["Body Age", assessment.bodyAge || "-", null],
                      ["Skeletal Muscle", assessment.skeletalMuscle ? `${assessment.skeletalMuscle}%` : "-", null],
                    ].map(([label, value, status]) => (
                      <div key={label} style={{ background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 14, padding: 12 }}>
                        <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>{label}</p>
                        <p style={{ margin: 0, color: "#1e1030", fontSize: 16, fontWeight: 800 }}>{value}</p>
                        {status && <span style={{ display: "inline-block", marginTop: 8, background: status.bg, color: status.color, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{status.label}</span>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {ASSESSMENT_FIELDS.filter((field) => ["trunkFat", "profileNote", "remarks"].includes(field.key)).map((field) => (
                      <div key={field.key} style={{ background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 14, padding: 12 }}>
                        <p style={{ margin: "0 0 6px", color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>{field.label}</p>
                        <p style={{ margin: 0, color: "#1e1030", fontSize: 13, lineHeight: 1.6 }}>
                          {assessment[field.key] ? (field.key === "trunkFat" ? `${assessment[field.key]}%` : assessment[field.key]) : "-"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 14, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: olderAssessments.length ? 10 : 0, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, color: "#6c3fc4", fontSize: 12, fontWeight: 800 }}>Assessment Timeline</p>
                      <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>{assessmentHistory.length} total record{assessmentHistory.length === 1 ? "" : "s"}</p>
                    </div>
                    {olderAssessments.length === 0 ? (
                      <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Older monthly assessments will appear here as your trainer adds them.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {olderAssessments.map((entry) => {
                          const entryBMI = calcAssessmentBMI(entry.height, entry.weight);
                          return (
                            <div key={entry.id} style={{ background: "#fff", border: "1px solid #e0d7f5", borderRadius: 12, padding: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                                <p style={{ margin: 0, color: "#1e1030", fontSize: 13, fontWeight: 800 }}>{entry.date || "Undated assessment"}</p>
                                <span style={{ background: "#f3f0ff", color: "#6c3fc4", padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>Previous</span>
                              </div>
                              <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12, lineHeight: 1.6 }}>
                                Weight {entry.weight || "-"} kg • Body Fat {entry.bodyFat || "-"}% • BMI {entryBMI || "-"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "bmi" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>⚖️ BMI & Weight</h2>
            <p style={{ color: "#7c6a9a", marginBottom: 20 }}>Track your fitness progress</p>
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Your Current BMI</h3>
              {bmi && category ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 48, fontWeight: 900, color: category.color }}>{bmi}</span>
                      <p style={{ margin: "4px 0 0", color: "#7c6a9a", fontSize: 12 }}>Body Mass Index</p>
                    </div>
                    <span style={{ background: category.bg, color: category.color, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{category.label}</span>
                  </div>
                  <div style={{ height: 10, background: "#f5f0ff", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,#9b7ed4,${category.color})`, borderRadius: 6 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b8a8d0" }}>
                    <span>&lt;18.5</span><span>18.5–25</span><span>25–30</span><span>&gt;30</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#7c6a9a" }}>BMI not available. Contact your trainer.</p>
              )}
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>📈 Weight History</h3>
              {weightHistory.length === 0 ? (
                <p style={{ color: "#7c6a9a", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No weight history yet.</p>
              ) : (
                weightHistory.map((entry, i) => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f0ff" }}>
                    <span style={{ color: "#7c6a9a", fontSize: 13 }}>{entry.recorded_at}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: i === 0 ? "#9b7ed4" : "#1e1030" }}>{entry.weight} kg</span>
                      {i === 0 && <span style={{ background: "#f3f0ff", color: "#9b7ed4", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Latest</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "workout" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🏋️ Today&apos;s Workout</h2>
            <p style={{ color: "#7c6a9a", marginBottom: 20 }}>{today} — Let&apos;s go! 💪</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
              {todayWorkout.map((workout, i) => (
                <div key={i} style={{ ...card, display: "flex", alignItems: "center", gap: 14, marginBottom: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#f3f0ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{workout.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 15 }}>{workout.name}</p>
                    <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>{workout.muscle}</p>
                  </div>
                  <span style={{ background: "#f3f0ff", color: "#9b7ed4", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{workout.sets}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📅 Weekly Schedule</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} style={{ ...card, marginBottom: 0, padding: "12px 16px", border: day === today ? "2px solid #9b7ed4" : "1px solid #e0d7f5", background: day === today ? "#f3f0ff" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: day === today ? 800 : 600, color: day === today ? "#6c3fc4" : "#1e1030", fontSize: 14 }}>
                      {day === today ? "👉 " : ""}{day}
                      {day === today && <span style={{ marginLeft: 8, background: "#9b7ed4", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>Today</span>}
                    </span>
                    <span style={{ color: "#7c6a9a", fontSize: 11 }}>{WORKOUT_PLANS[day]?.map((workout) => workout.name).slice(0, 2).join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>💳 UPI Payment</h2>
            <p style={{ color: "#7c6a9a", marginBottom: 20 }}>Submit your payment for trainer confirmation.</p>

            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  ["Current Package", member.package_type || paymentForm.package_type || "-", "#faf7ff"],
                  ["Suggested Fee", member.fee_amount ? `Rs. ${Number(member.fee_amount).toLocaleString("en-IN")}` : "Enter amount", "#f5f0ff"],
                  ["Payment Status", effectivePaymentStatus, effectivePaymentStatus === "confirmed" ? "#f0fdf4" : "#fff7ed"],
                  ["Last Payment", effectiveLastPaymentAmount ? `Rs. ${Number(effectiveLastPaymentAmount).toLocaleString("en-IN")}` : "-", "#eff6ff"],
                ].map(([label, value, bg]) => (
                  <div key={label} style={{ background: bg, border: "1px solid #e0d7f5", borderRadius: 14, padding: 12 }}>
                    <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>{label}</p>
                    <p style={{ margin: 0, color: "#1e1030", fontSize: 15, fontWeight: 800 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <div className="payment-qr-grid" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "center" }}>
                  <div style={{ background: "#fff", border: "1px solid #eadcf8", borderRadius: 16, padding: 12, textAlign: "center" }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getUPILink(paymentAmount > 0 ? paymentAmount : 0))}`}
                      alt="Member payment QR"
                      style={{ width: "100%", maxWidth: 180, borderRadius: 12, display: "block", margin: "0 auto 10px" }}
                    />
                    <p style={{ margin: 0, color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>SCAN TO PAY</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", color: "#7a5db0", fontSize: 12, fontWeight: 800, letterSpacing: 0.6 }}>UPI PAYMENT QR</p>
                    <h3 style={{ margin: "0 0 8px", color: "#1e1030", fontSize: 18, fontWeight: 800 }}>Pay first, then submit below</h3>
                    <p style={{ margin: "0 0 12px", color: "#7c6a9a", fontSize: 13, lineHeight: 1.6 }}>
                      Scan this QR with any UPI app. The QR updates to the amount you enter below so members can pay the exact fee.
                    </p>
                    <p style={{ margin: "0 0 6px", color: "#1e1030", fontSize: 13 }}><strong>UPI ID:</strong> {UPI_ID}</p>
                    <p style={{ margin: "0 0 12px", color: "#1e1030", fontSize: 13 }}><strong>Name:</strong> {UPI_NAME}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <a
                        href={getUPILink(paymentAmount > 0 ? paymentAmount : 0)}
                        style={{ padding: "10px 16px", borderRadius: 12, background: "#efe5ff", color: "#6c3fc4", textDecoration: "none", fontWeight: 800, fontSize: 13 }}
                      >
                        Open UPI App
                      </a>
                      <span style={{ padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #e0d7f5", color: "#7c6a9a", fontSize: 12, fontWeight: 700 }}>
                        Amount: Rs. {Number(paymentAmount > 0 ? paymentAmount : 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a5db0", display: "block", marginBottom: 6 }}>PACKAGE TYPE</label>
              <select value={paymentForm.package_type} onChange={(e) => setPaymentForm((current) => ({ ...current, package_type: e.target.value }))} style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "2px solid #e0d7f5", background: "#fff", color: "#1e1030", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }}>
                <option value="Monthly">Monthly</option>
                <option value="3 Months">3 Months</option>
                <option value="Protein Package">Protein Package</option>
                <option value="Personal Trainer">Personal Trainer</option>
              </select>

              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a5db0", display: "block", marginBottom: 6 }}>AMOUNT</label>
              <input type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm((current) => ({ ...current, amount: e.target.value }))} placeholder="Enter paid amount" style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "2px solid #e0d7f5", background: "#fff", color: "#1e1030", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />

              {paymentMsg === "success" && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "12px 14px", marginBottom: 12, color: "#166534", fontSize: 13 }}>Payment submitted successfully. Your trainer will confirm it soon.</div>}
              {paymentMsg.startsWith("error:") && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 14px", marginBottom: 12, color: "#dc2626", fontSize: 13 }}>{paymentMsg.replace("error:", "")}</div>}

              <button onClick={submitPayment} disabled={paymentLoading} style={{ padding: "12px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                {paymentLoading ? "Submitting..." : "Submit UPI Payment"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Recent Payment Requests</h3>
              {paymentHistory.length === 0 ? (
                <p style={{ color: "#7c6a9a", fontSize: 13 }}>No payment submissions yet.</p>
              ) : (
                paymentHistory.map((payment) => (
                  <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f0ff" }}>
                    <div>
                      <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 14 }}>{payment.package_type}</p>
                      <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>{payment.submitted_at ? new Date(payment.submitted_at).toLocaleString("en-IN") : "-"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: 14, color: "#1e1030" }}>Rs. {Number(payment.amount || 0).toLocaleString("en-IN")}</p>
                      <span style={{ background: payment.status === "confirmed" ? "#f0fdf4" : payment.status === "rejected" ? "#fef2f2" : "#fff7ed", color: payment.status === "confirmed" ? "#16a34a" : payment.status === "rejected" ? "#dc2626" : "#d97706", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{payment.status || "pending"}</span>
                    </div>
                  </div>
                ))
              )}
              {latestPayment?.status === "pending" && <p style={{ margin: "12px 0 0", color: "#7c6a9a", fontSize: 12 }}>Your latest payment is waiting for trainer confirmation.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
