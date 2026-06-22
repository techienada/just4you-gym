import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { fetchTrainerAuth, getTrainerAuth, saveTrainerAuth } from "../trainerAuth";
import { ASSESSMENT_FIELDS, calcAssessmentBMI, createDefaultAssessment, fetchMemberAssessments, getAssessmentBMICategory, getBodyFatStatus, saveMemberAssessment } from "../memberAssessments";
import { getMemberPhoto, removeMemberPhoto, saveMemberPhoto } from "../memberPhotos";
import { parseTeaNotes, updateTeaNotesPaymentStatus } from "../teaOrderMeta";

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

function getPackageStyle(pkg) {
  if (!pkg) return { color: "#7c6a9a", bg: "#f5f0ff" };
  if (pkg === "Protein Package") return { color: "#16a34a", bg: "#f0fdf4" };
  if (pkg === "3 Months") return { color: "#6c3fc4", bg: "#ede8ff" };
  return { color: "#9b7ed4", bg: "#f3f0ff" };
}

function getFeeStatus(member) {
  if (member.fee_status === "paid") return { label: "Paid", color: "#16a34a", bg: "#f0fdf4" };
  return { label: "Unpaid", color: "#dc2626", bg: "#fef2f2" };
}

function getExpiryStatus(expiry) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", color: "#dc2626", bg: "#fef2f2" };
  if (days <= 7) return { label: `Expires in ${days}d`, color: "#d97706", bg: "#fffbeb" };
  return { label: `${days}d left`, color: "#16a34a", bg: "#f0fdf4" };
}

function orderStatusStyle(status) {
  if (status === "delivered") return { color: "#16a34a", bg: "#f0fdf4" };
  if (status === "confirmed") return { color: "#2563eb", bg: "#eff6ff" };
  if (status === "packed") return { color: "#d97706", bg: "#fffbeb" };
  if (status === "cancelled") return { color: "#dc2626", bg: "#fef2f2" };
  return { color: "#6c3fc4", bg: "#f3f0ff" };
}

function whatsappLink(phone, message) {
  const clean = (phone || "").replace(/\D/g, "");
  const number = clean.startsWith("91") ? clean : `91${clean}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function membershipReminderMessage(member) {
  return `Hi ${member.full_name}, this is Just4You Ladies Gym. Your membership is ending soon. Please contact us to renew your plan and continue your workouts.`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

function printHtmlDocument(title, bodyHtml) {
  const printWindow = window.open("", "_blank", "width=960,height=760");
  if (!printWindow) return false;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 24px; color: #1e1030; }
          h1 { margin: 0 0 6px; font-size: 26px; }
          h2 { margin: 0 0 8px; font-size: 18px; }
          p { margin: 0 0 8px; }
          .muted { color: #6b5f86; font-size: 12px; }
          .card { border: 1px solid #e0d7f5; border-radius: 14px; padding: 16px; margin-bottom: 16px; break-inside: avoid; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin-top: 14px; }
          .row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f1ebfb; }
          .label { color: #7c6a9a; font-size: 12px; }
          .value { font-weight: 600; font-size: 12px; text-align: right; }
          .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #f3f0ff; color: #6c3fc4; font-size: 12px; font-weight: 700; margin-right: 8px; }
          .notes { margin-top: 12px; padding: 12px; border-radius: 12px; background: #faf7ff; border: 1px solid #e0d7f5; }
          .total { font-size: 18px; font-weight: 800; color: #6c3fc4; }
          @media print {
            body { margin: 12px; }
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function renderTeaOrderPrintCard(order, paymentStatus) {
  return `
    <div class="card">
      <h2>${escapeHtml(order.product_name || "Tea Order")}</h2>
      <p>${escapeHtml(order.customer_name || "-")} • ${escapeHtml(order.phone || "-")}</p>
      <div style="margin: 10px 0 2px;">
        <span class="pill">Status: ${escapeHtml(order.status || "new")}</span>
        <span class="pill">Payment: ${escapeHtml(paymentStatus || "pending")}</span>
      </div>
      <div class="grid">
        <div>
          <div class="row"><span class="label">Product ID</span><span class="value">${escapeHtml(order.product_id || "-")}</span></div>
          <div class="row"><span class="label">Quantity</span><span class="value">${escapeHtml(order.quantity || 0)}</span></div>
          <div class="row"><span class="label">Payment Method</span><span class="value">${escapeHtml((order.payment_method || "upi").toUpperCase())}</span></div>
          <div class="row"><span class="label">COD Charge</span><span class="value">Rs. ${escapeHtml(Number(order.cod_extra_charge || 0).toLocaleString("en-IN"))}</span></div>
        </div>
        <div>
          <div class="row"><span class="label">Ordered On</span><span class="value">${escapeHtml(formatDateTime(order.ordered_on))}</span></div>
          <div class="row"><span class="label">Created</span><span class="value">${escapeHtml(formatDateTime(order.created_at))}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${escapeHtml(order.address || "-")}</span></div>
          <div class="row"><span class="label">Total</span><span class="value total">Rs. ${escapeHtml(Number(order.total_amount || 0).toLocaleString("en-IN"))}</span></div>
        </div>
      </div>
      ${order.notes ? `<div class="notes"><p class="label">Customer Notes</p><p>${escapeHtml(order.notes)}</p></div>` : ""}
    </div>
  `;
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e0d7f5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    boxShadow: "0 2px 12px rgba(108,63,196,0.08)",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "2px solid #e0d7f5",
    background: "#fff",
    color: "#1e1030",
    fontSize: 14,
    boxSizing: "border-box",
    marginBottom: 12,
    fontFamily: "inherit",
  },
  navGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: 8,
    borderRadius: 18,
    background: "rgba(248, 246, 255, 0.9)",
    border: "1px solid #e8def8",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  },
  navBtn: (active, danger) => ({
    padding: "10px 15px",
    borderRadius: 999,
    border: "1px solid",
    borderColor: danger ? (active ? "#dc2626" : "#fecaca") : active ? "#8d64d2" : "#e2d6f5",
    background: danger
      ? active
        ? "linear-gradient(135deg,#ef4444,#dc2626)"
        : "#fff7f7"
      : active
        ? "linear-gradient(135deg,#a88ae1,#6c3fc4)"
        : "#fff",
    color: danger ? (active ? "#fff" : "#dc2626") : active ? "#fff" : "#7c6a9a",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
    minHeight: 42,
    boxShadow: active ? "0 10px 20px rgba(108,63,196,0.18)" : "0 1px 0 rgba(255,255,255,0.9)",
  }),
  btn: (active, danger) => ({
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: danger ? "#fef2f2" : active ? "linear-gradient(135deg,#9b7ed4,#6c3fc4)" : "#f3f0ff",
    color: danger ? "#dc2626" : active ? "#fff" : "#7c6a9a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  }),
  sectionCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #fcfaff 100%)",
    border: "1px solid #e6dbf7",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(108,63,196,0.07)",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#7c6a9a",
    display: "block",
    marginBottom: 6,
  },
};
function PaymentConfirmations({ members, onRefresh }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase.from("upi_payments").select("*").order("submitted_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  async function confirmPayment(payment) {
    await supabase.from("upi_payments").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", payment.id);
    await supabase.from("members").update({ payment_status: "confirmed", fee_status: "paid", last_payment_date: new Date().toISOString().split("T")[0], last_payment_amount: payment.amount, package_type: payment.package_type }).eq("id", payment.member_id);
    fetchPayments();
    onRefresh();
  }

  async function rejectPayment(payment) {
    await supabase.from("upi_payments").update({ status: "rejected" }).eq("id", payment.id);
    await supabase.from("members").update({ payment_status: null }).eq("id", payment.member_id);
    fetchPayments();
  }

  const pending = payments.filter(p => p.status === "pending");
  const confirmed = payments.filter(p => p.status === "confirmed");

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[["⏳", "Pending", pending.length, "#fffbeb", "#d97706"], ["✅", "Confirmed", confirmed.length, "#f0fdf4", "#16a34a"], ["💰", "Total Collected", `₹${confirmed.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString("en-IN")}`, "#f3f0ff", "#6c3fc4"]].map(([icon, label, val, bg, color]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #e0d7f5", borderRadius: 14, padding: "16px 18px", textAlign: "center", boxShadow: "0 2px 12px rgba(108,63,196,0.06)", background: bg }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7c6a9a", fontWeight: 600 }}>{label.toUpperCase()}</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Pending payments */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#d97706" }}>⏳ Pending Confirmation ({pending.length})</h3>
          {pending.map(pay => (
            <div key={pay.id} style={{ background: "#fff", border: "2px solid #fcd34d", borderRadius: 14, padding: "18px 20px", marginBottom: 10, boxShadow: "0 2px 12px rgba(108,63,196,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>
                    {pay.member_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15 }}>{pay.member_name}</p>
                    <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 12 }}>{pay.package_type} • {new Date(pay.submitted_at).toLocaleString("en-IN")}</p>
                    <span style={{ background: "#fffbeb", color: "#d97706", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⏳ Pending</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#6c3fc4" }}>₹{pay.amount?.toLocaleString("en-IN")}</span>
                  <button onClick={() => confirmPayment(pay)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#f0fdf4", color: "#16a34a", fontWeight: 800, cursor: "pointer", fontSize: 13, transition: "all 0.2s ease" }}>✓ Confirm</button>
                  <button onClick={() => rejectPayment(pay)} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.2s ease" }}>✗ Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #e0d7f5", borderRadius: 14, padding: "32px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <p style={{ color: "#7c6a9a", fontSize: 14, margin: 0 }}>No pending payments! All caught up.</p>
        </div>
      )}

      {/* Confirmed payments */}
      {confirmed.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#16a34a" }}>✅ Confirmed Payments ({confirmed.length})</h3>
          {confirmed.map(pay => (
            <div key={pay.id} style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 14, padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14 }}>{pay.member_name}</p>
                <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>{pay.package_type} • {new Date(pay.submitted_at).toLocaleDateString("en-IN")}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>₹{pay.amount?.toLocaleString("en-IN")}</span>
                <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ Confirmed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default function TrainerDashboard({ onLogout }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("members");
  const [loading, setLoading] = useState(true);
  const [teaLoading, setTeaLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [teaOrders, setTeaOrders] = useState([]);
  const [assessmentForm, setAssessmentForm] = useState(() => createDefaultAssessment());
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [selectedPhotoBroken, setSelectedPhotoBroken] = useState(false);
  const [photoErrors, setPhotoErrors] = useState({});
  const [newWeight, setNewWeight] = useState("");
  const [search, setSearch] = useState("");
  const [filterPkg, setFilterPkg] = useState("all");
  const [teaStatusFilter, setTeaStatusFilter] = useState("all");
  const [teaPaymentFilter, setTeaPaymentFilter] = useState("all");
  const [teaSearch, setTeaSearch] = useState("");
  const [renewalStatus, setRenewalStatus] = useState({});
  const [teaOrderMeta, setTeaOrderMeta] = useState({});
  const [trainerAuth, setTrainerAuth] = useState(() => getTrainerAuth());
  const [msg, setMsg] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [assessmentMsg, setAssessmentMsg] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    phone: "",
    age: "",
    height: "",
    weight: "",
    goal: "",
    fee_amount: "",
    expiry_date: "",
    fee_status: "unpaid",
    package_type: "",
  });
  const [trainerForm, setTrainerForm] = useState(() => getTrainerAuth());

  useEffect(() => {
    fetchMembers();
    fetchTodayAttendance();
    fetchTeaOrders();
    loadRenewalStatus();
    loadTeaOrderMeta();
    loadTrainerCredentials();
  }, []);

  async function loadTrainerCredentials() {
    const auth = await fetchTrainerAuth();
    setTrainerAuth(auth);
    setTrainerForm(auth);
  }

  function loadRenewalStatus() {
    try {
      const saved = localStorage.getItem("just4you_renewal_status");
      if (saved) setRenewalStatus(JSON.parse(saved));
    } catch {
      setRenewalStatus({});
    }
  }

  function saveRenewalStatus(next) {
    setRenewalStatus(next);
    localStorage.setItem("just4you_renewal_status", JSON.stringify(next));
  }

  function loadTeaOrderMeta() {
    try {
      const saved = localStorage.getItem("just4you_tea_order_meta");
      if (saved) setTeaOrderMeta(JSON.parse(saved));
    } catch {
      setTeaOrderMeta({});
    }
  }

  function saveTeaOrderMeta(next) {
    setTeaOrderMeta(next);
    localStorage.setItem("just4you_tea_order_meta", JSON.stringify(next));
  }

  async function updateTrainerLogin() {
    setSettingsMsg("");
    if (!trainerForm.username.trim() || !trainerForm.password.trim()) {
      setSettingsMsg("error:Trainer username and password are required.");
      return;
    }
    const next = {
      username: trainerForm.username.trim(),
      password: trainerForm.password.trim(),
    };
    const { error } = await saveTrainerAuth(next);
    if (error) {
      setSettingsMsg(`error:${error.message}`);
      return;
    }
    setTrainerAuth(next);
    setTrainerForm(next);
    setSettingsMsg("success");
  }

  function handleLogoutClick() {
    if (window.confirm("Log out of the trainer dashboard?")) {
      onLogout();
    }
  }

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  }

  async function fetchTodayAttendance() {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("attendance").select("member_id").eq("date", today);
    setTodayAttendance((data || []).map((item) => item.member_id));
  }

  async function fetchTeaOrders() {
    setTeaLoading(true);
    const { data } = await supabase.from("tea_orders").select("*").order("created_at", { ascending: false });
    setTeaOrders(data || []);
    setTeaLoading(false);
  }

  async function openMember(member) {
    setSelected(member);
    setAssessmentHistory([]);
    setAssessmentForm(createDefaultAssessment(member));
    setAssessmentMsg("");
    setSelectedPhoto(getMemberPhoto(member.id));
    setSelectedPhotoBroken(false);
    setPhotoMsg("");
    const [assessmentResult, wh, att] = await Promise.all([
      fetchMemberAssessments(member).catch((error) => ({ error })),
      supabase.from("weight_history").select("*").eq("member_id", member.id).order("recorded_at", { ascending: true }),
      supabase.from("attendance").select("*").eq("member_id", member.id).order("date", { ascending: false }).limit(10),
    ]);
    if (assessmentResult?.error) {
      setAssessmentMsg(`error:${assessmentResult.error.message}`);
    } else {
      setAssessmentHistory(assessmentResult);
      setAssessmentForm(assessmentResult[0] || createDefaultAssessment(member));
    }
    setWeightHistory(wh.data || []);
    setAttendance(att.data || []);
    setView("detail");
  }

  async function addMember() {
    if (!form.full_name || !form.username || !form.password) {
      setMsg("error:Name, username and password are required.");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      phone: form.phone.trim() || null,
      age: form.age ? parseInt(form.age, 10) : null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      goal: form.goal.trim() || null,
      fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : 0,
      expiry_date: form.expiry_date || null,
      fee_status: form.fee_status || "unpaid",
      package_type: form.package_type || null,
      join_date: new Date().toISOString().split("T")[0],
      role: "member",
    };

    try {
      const { error } = await supabase.from("members").insert([payload]);

      if (error) {
        setMsg(`error:${error.message}`);
        return;
      }
    } catch (error) {
      const text = String(error?.message || error || "");
      const friendly = text.toLowerCase().includes("failed to fetch")
        ? "Could not reach Supabase. Refresh the page, then try again. If it still fails, disable browser shields/extensions or try another browser."
        : text || "Could not add member right now.";
      setMsg(`error:${friendly}`);
      return;
    }

    setMsg("success");
    setForm({
      full_name: "",
      username: "",
      password: "",
      phone: "",
      age: "",
      height: "",
      weight: "",
      goal: "",
      fee_amount: "",
      expiry_date: "",
      fee_status: "unpaid",
      package_type: "",
    });
    fetchMembers();
  }

  async function deleteMember(id) {
    if (!window.confirm("Delete this member?")) return;
    await supabase.from("members").delete().eq("id", id);
    fetchMembers();
    setView("members");
  }

  async function addWeight() {
    if (!newWeight || !selected) return;
    const weight = parseFloat(newWeight);
    await supabase.from("weight_history").insert([
      { member_id: selected.id, weight, recorded_at: new Date().toISOString().split("T")[0] },
    ]);
    await supabase.from("members").update({ weight }).eq("id", selected.id);
    const updated = { ...selected, weight };
    setSelected(updated);
    setMembers((prev) => prev.map((member) => (member.id === selected.id ? updated : member)));
    setNewWeight("");
    const { data } = await supabase.from("weight_history").select("*").eq("member_id", selected.id).order("recorded_at", { ascending: true });
    setWeightHistory(data || []);
  }

  async function markAttendance(memberId) {
    const today = new Date().toISOString().split("T")[0];
    if (todayAttendance.includes(memberId)) {
      await supabase.from("attendance").delete().eq("member_id", memberId).eq("date", today);
      setTodayAttendance((prev) => prev.filter((id) => id !== memberId));
    } else {
      await supabase.from("attendance").insert([{ member_id: memberId, date: today }]);
      setTodayAttendance((prev) => [...prev, memberId]);
    }
  }

  async function updateFee(status) {
    if (!selected) return;
    const updates = {
      fee_status: status,
      fee_paid_date: status === "paid" ? new Date().toISOString().split("T")[0] : null,
    };
    await supabase.from("members").update(updates).eq("id", selected.id);
    const updated = { ...selected, ...updates };
    setSelected(updated);
    setMembers((prev) => prev.map((member) => (member.id === selected.id ? updated : member)));
  }

  async function updateExpiry(date) {
    if (!selected) return;
    await supabase.from("members").update({ expiry_date: date }).eq("id", selected.id);
    const updated = { ...selected, expiry_date: date };
    setSelected(updated);
    setMembers((prev) => prev.map((member) => (member.id === selected.id ? updated : member)));
  }

  async function updatePackage(pkg) {
    if (!selected) return;
    await supabase.from("members").update({ package_type: pkg }).eq("id", selected.id);
    const updated = { ...selected, package_type: pkg };
    setSelected(updated);
    setMembers((prev) => prev.map((member) => (member.id === selected.id ? updated : member)));
  }

  async function updateTeaOrderStatus(orderId, status) {
    await supabase.from("tea_orders").update({ status }).eq("id", orderId);
    setTeaOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  function getTeaPaymentStatus(order) {
    return order.payment_status || parseTeaNotes(order.notes).paymentStatus || (order.payment_method === "cod" ? "pending" : "paid");
  }

  async function updateTeaPaymentStatus(orderId, paymentStatus) {
    const currentOrder = teaOrders.find((order) => order.id === orderId);
    if (!currentOrder) return;

    const nextNotes = updateTeaNotesPaymentStatus(currentOrder.notes, paymentStatus);
    const { error } = await supabase.from("tea_orders").update({ notes: nextNotes }).eq("id", orderId);
    if (error) return;

    setTeaOrders((prev) => prev.map((order) => (
      order.id === orderId
        ? { ...order, notes: nextNotes, payment_status: paymentStatus }
        : order
    )));
  }

  function printTeaOrder(order) {
    const paymentStatus = getTeaPaymentStatus(order);
    printHtmlDocument(
      `Tea Order - ${order.customer_name || "Customer"}`,
      `
        <h1>Just4You Ladies Gym</h1>
        <p class="muted">Tea order print slip</p>
        ${renderTeaOrderPrintCard(order, paymentStatus)}
      `,
    );
  }

  function printFilteredTeaOrders() {
    if (filteredTeaOrders.length === 0) return;
    const cards = filteredTeaOrders.map((order) => {
      const paymentStatus = getTeaPaymentStatus(order);
      return renderTeaOrderPrintCard(order, paymentStatus);
    }).join("");

    printHtmlDocument(
      "Tea Orders",
      `
        <h1>Just4You Ladies Gym</h1>
        <p class="muted">Filtered tea orders • Printed on ${escapeHtml(new Date().toLocaleString("en-IN"))}</p>
        ${cards}
      `,
    );
  }

  function updateAssessmentField(key, value) {
    setAssessmentForm((current) => ({ ...current, [key]: value }));
  }

  function startNewAssessment() {
    if (!selected) return;
    const previousAssessment = assessmentHistory[0] || assessmentForm;
    setAssessmentForm(createDefaultAssessment(selected, previousAssessment));
    setAssessmentMsg("");
  }

  function loadAssessmentRecord(entry) {
    setAssessmentForm(entry);
    setAssessmentMsg("");
  }

  async function saveAssessment() {
    if (!selected) return;
    try {
      const nextHistory = await saveMemberAssessment(selected.id, assessmentForm, selected);
      setAssessmentHistory(nextHistory);
      setAssessmentForm(nextHistory.find((entry) => entry.id === assessmentForm.id) || nextHistory[0] || assessmentForm);
      setAssessmentMsg("success");
    } catch (error) {
      setAssessmentMsg(`error:${error.message || "Could not save assessment."}`);
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selected) return;
    if (!file.type.startsWith("image/")) {
      setPhotoMsg("error:Please choose an image file.");
      return;
    }

    try {
      const url = await saveMemberPhoto(selected.id, file);
      setSelectedPhoto(url);
      setSelectedPhotoBroken(false);
      setPhotoErrors((current) => ({ ...current, [selected.id]: false }));
      setPhotoMsg("success");
    } catch (error) {
      setPhotoMsg(`error:${error.message || "Could not upload that image."}`);
    }
  }

  async function clearPhoto() {
    if (!selected) return;
    try {
      await removeMemberPhoto(selected.id);
      setSelectedPhoto("");
      setSelectedPhotoBroken(false);
      setPhotoErrors((current) => ({ ...current, [selected.id]: true }));
      setPhotoMsg("removed");
    } catch (error) {
      setPhotoMsg(`error:${error.message || "Could not remove that image."}`);
    }
  }

  function markRenewalReminder(memberId, status) {
    const next = {
      ...renewalStatus,
      [memberId]: {
        status,
        updated_at: new Date().toISOString(),
      },
    };
    saveRenewalStatus(next);
  }

  const expiringSoon = members
    .filter((member) => {
      if (!member.expiry_date) return false;
      const days = Math.ceil((new Date(member.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    })
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const renewalQueue = members
    .filter((member) => {
      if (!member.expiry_date) return false;
      const days = Math.ceil((new Date(member.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    })
    .map((member) => {
      const days = Math.ceil((new Date(member.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return { ...member, renewal_days: days };
    })
    .sort((a, b) => a.renewal_days - b.renewal_days);
  const unpaidCount = members.filter((member) => member.fee_status !== "paid").length;
  const filteredMembers = members.filter((member) => {
    const fullName = (member.full_name || "").toLowerCase();
    const username = (member.username || "").toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      username.includes(search.toLowerCase());
    const matchesPackage = filterPkg === "all" || member.package_type === filterPkg;
    return matchesSearch && matchesPackage;
  });
  const packageCounts = {
    monthly: members.filter((member) => member.package_type === "Monthly").length,
    quarterly: members.filter((member) => member.package_type === "3 Months").length,
    protein: members.filter((member) => member.package_type === "Protein Package").length,
  };
  const teaStats = {
    total: teaOrders.length,
    new: teaOrders.filter((order) => order.status === "new").length,
    confirmed: teaOrders.filter((order) => order.status === "confirmed").length,
    delivered: teaOrders.filter((order) => order.status === "delivered").length,
    revenue: teaOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    cod: teaOrders.filter((order) => order.payment_method === "cod").length,
    upi: teaOrders.filter((order) => order.payment_method === "upi").length,
  };
  const filteredTeaOrders = teaOrders.filter((order) => {
    const paymentStatus = getTeaPaymentStatus(order);
    const matchesStatus = teaStatusFilter === "all" ? true : order.status === teaStatusFilter;
    const matchesPayment = teaPaymentFilter === "all" ? true : paymentStatus === teaPaymentFilter;
    const haystack = `${order.product_name || ""} ${order.customer_name || ""} ${order.phone || ""}`.toLowerCase();
    const matchesSearch = haystack.includes(teaSearch.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6ff", fontFamily: "'Segoe UI',sans-serif", color: "#1e1030" }}>
      <style>{`
        @media(max-width:768px){
          .t-header{padding:12px!important;height:auto!important;flex-wrap:wrap;gap:10px}
          .t-nav-btns{display:none!important}
          .t-mobile-tabs{display:flex!important}
          .t-four-grid{grid-template-columns:1fr 1fr!important}
          .t-two-grid{grid-template-columns:1fr!important}
          .t-body{padding:16px 12px 90px!important}
          .t-row{flex-direction:column!important;align-items:stretch!important}
        }
        @media(min-width:769px){
          .t-mobile-tabs{display:none!important}
        }
      `}</style>

      <div className="t-header" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #e0d7f5", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 76, boxShadow: "0 2px 14px rgba(108,63,196,0.08)", position: "sticky", top: 0, zIndex: 50, gap: 16, backdropFilter: "blur(10px)" }}>
        <div style={{ minWidth: 180 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#6c3fc4", letterSpacing: "-0.02em" }}>Just4You Ladies Gym</h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7c6a9a" }}>Trainer Dashboard</p>
        </div>
        <div className="t-nav-btns" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={styles.navGroup}>
            {[
              ["Members", "members"],
              ["Add Member", "add"],
              ["Attendance", "attendance"],
              ["Renewals", "renewals"],
              ["Payments", "payments"],
              ["Tea Orders", "teaorders"],
            ].map(([label, target]) => (
              <button key={target} onClick={() => { setView(target); setMsg(""); }} style={styles.navBtn(view === target, false)}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => { setView("settings"); setMsg(""); }} style={styles.navBtn(view === "settings", false)}>
            Settings
          </button>
        </div>
      </div>

      <div className="t-mobile-tabs" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e0d7f5", padding: "8px 12px", zIndex: 50, gap: 6, justifyContent: "space-around", boxShadow: "0 -2px 12px rgba(108,63,196,0.1)" }}>
        {[
          ["Members", "members"],
          ["Add", "add"],
          ["Attend", "attendance"],
          ["Renew", "renewals"],
          ["Pay", "payments"],
          ["Tea", "teaorders"],
          ["Settings", "settings"],
        ].map(([label, target]) => (
          <button
            key={target}
            onClick={() => {
              setView(target);
              setMsg("");
            }}
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: 10,
              border: "none",
              background: view === target ? "linear-gradient(135deg,#9b7ed4,#6c3fc4)" : "#f3f0ff",
              color: view === target ? "#fff" : "#7c6a9a",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="t-body" style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px", paddingBottom: 80 }}>
        {view === "members" && (
          <>
            {(expiringSoon.length > 0 || unpaidCount > 0) && (
              <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {expiringSoon.length > 0 && (
                  <div style={{ ...styles.card, background: "#fffbeb", border: "1px solid #fcd34d", marginBottom: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#d97706", fontSize: 13 }}>{expiringSoon.length} membership(s) expiring soon</p>
                    <p style={{ margin: 0, color: "#92400e", fontSize: 12 }}>{expiringSoon.map((member) => member.full_name).join(", ")}</p>
                    {expiringSoon[0]?.phone && (
                      <a
                        href={whatsappLink(expiringSoon[0].phone, membershipReminderMessage(expiringSoon[0]))}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "#fff", color: "#d97706", fontWeight: 700, fontSize: 12, textDecoration: "none" }}
                      >
                        Remind First Member
                      </a>
                    )}
                  </div>
                )}
                {unpaidCount > 0 && (
                  <div style={{ ...styles.card, background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#dc2626", fontSize: 13 }}>{unpaidCount} unpaid fee(s)</p>
                    <p style={{ margin: 0, color: "#991b1b", fontSize: 12 }}>Please collect fees</p>
                  </div>
                )}
              </div>
            )}

            <div className="t-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                ["Total", members.length, "#f3f0ff", "#6c3fc4"],
                ["Monthly", packageCounts.monthly, "#f3f0ff", "#9b7ed4"],
                ["3 Months", packageCounts.quarterly, "#ede8ff", "#6c3fc4"],
                ["Protein", packageCounts.protein, "#f0fdf4", "#16a34a"],
              ].map(([label, value, bg, color]) => (
                <div key={label} style={{ ...styles.card, marginBottom: 0, padding: 14, textAlign: "center", background: bg }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7c6a9a", fontWeight: 700 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>All Members</h2>
                <p style={{ margin: "4px 0 0", color: "#7c6a9a", fontSize: 12 }}>{filteredMembers.length} members • {todayAttendance.length} present today</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder="Search members" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...styles.input, width: 180, marginBottom: 0 }} />
                <select value={filterPkg} onChange={(e) => setFilterPkg(e.target.value)} style={{ ...styles.input, width: 150, marginBottom: 0 }}>
                  <option value="all">All Packages</option>
                  <option value="Monthly">Monthly</option>
                  <option value="3 Months">3 Months</option>
                  <option value="Protein Package">Protein Package</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p style={{ color: "#7c6a9a", textAlign: "center", padding: 40 }}>Loading members...</p>
            ) : filteredMembers.length === 0 ? (
              <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
                <p style={{ color: "#7c6a9a", fontSize: 14 }}>No members found.</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const bmi = calcBMI(member.weight, member.height);
                const fee = getFeeStatus(member);
                const expiry = getExpiryStatus(member.expiry_date);
                const pkgStyle = getPackageStyle(member.package_type);
                const present = todayAttendance.includes(member.id);
                const photo = getMemberPhoto(member.id);
                const photoBroken = photoErrors[member.id];
                return (
                  <div key={member.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div onClick={() => openMember(member)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer", minWidth: 0 }}>
                      {photo && !photoBroken ? (
                        <img src={photo} alt={member.full_name} onError={() => setPhotoErrors((current) => ({ ...current, [member.id]: true }))} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e9ddfb" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                          {member.full_name[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14 }}>{member.full_name}</p>
                        <p style={{ margin: "0 0 6px", color: "#7c6a9a", fontSize: 12 }}>@{member.username} • {member.phone || "No phone"}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {member.package_type && <span style={{ background: pkgStyle.bg, color: pkgStyle.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{member.package_type}</span>}
                          {bmi && <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>BMI {bmi}</span>}
                          <span style={{ background: fee.bg, color: fee.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{fee.label}</span>
                          {expiry && <span style={{ background: expiry.bg, color: expiry.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{expiry.label}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {member.phone && (
                        <a href={whatsappLink(member.phone, `Hi ${member.full_name}, this is Just4You Ladies Gym.`)} target="_blank" rel="noreferrer" style={{ padding: "8px 10px", borderRadius: 8, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                          WhatsApp
                        </a>
                      )}
                      {expiry && member.phone && (
                        <a href={whatsappLink(member.phone, membershipReminderMessage(member))} target="_blank" rel="noreferrer" style={{ padding: "8px 10px", borderRadius: 8, background: "#fffbeb", color: "#d97706", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                          Renew
                        </a>
                      )}
                      <button onClick={() => markAttendance(member.id)} style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: present ? "#f0fdf4" : "#f3f0ff", color: present ? "#16a34a" : "#7c6a9a", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        {present ? "Present" : "Mark"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {view === "add" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Add New Member</h2>
            <p style={{ color: "#7c6a9a", marginBottom: 20 }}>Fill in the member details below.</p>
            <div style={styles.card}>
              <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                {[["Full Name *", "full_name", "text"], ["Username *", "username", "text"], ["Password *", "password", "text"], ["Phone", "phone", "text"], ["Age", "age", "number"], ["Height (cm)", "height", "number"], ["Weight (kg)", "weight", "number"], ["Monthly Fee (Rs.)", "fee_amount", "number"], ["Membership Expiry", "expiry_date", "date"], ["Fitness Goal", "goal", "text"]].map(([label, key, type]) => (
                  <div key={key}>
                    <label style={styles.label}>{label}</label>
                    <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={styles.input} />
                  </div>
                ))}
                <div>
                  <label style={styles.label}>Package</label>
                  <select value={form.package_type} onChange={(e) => setForm({ ...form, package_type: e.target.value })} style={styles.input}>
                    <option value="">Select Package</option>
                    <option value="Monthly">Monthly</option>
                    <option value="3 Months">3 Months</option>
                    <option value="Protein Package">Protein Package</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Fee Status</label>
                  <select value={form.fee_status} onChange={(e) => setForm({ ...form, fee_status: e.target.value })} style={styles.input}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              {msg === "success" && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 14px", marginBottom: 14, color: "#16a34a", fontSize: 13 }}>Member added successfully.</div>}
              {msg.startsWith("error:") && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 14, color: "#dc2626", fontSize: 13 }}>{msg.replace("error:", "")}</div>}
              <button onClick={addMember} style={{ ...styles.btn(true), width: "100%", padding: 15, fontSize: 15 }}>Add Member</button>
            </div>
          </div>
        )}

        {view === "attendance" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Today's Attendance</h2>
            <p style={{ color: "#7c6a9a", marginBottom: 20 }}>{new Date().toDateString()} • {todayAttendance.length}/{members.length} present</p>
            <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ ...styles.card, textAlign: "center", marginBottom: 0, background: "#f0fdf4", border: "1px solid #86efac" }}>
                <p style={{ margin: "0 0 4px", fontSize: 32, fontWeight: 900, color: "#16a34a" }}>{todayAttendance.length}</p>
                <p style={{ margin: 0, color: "#166534", fontSize: 13, fontWeight: 600 }}>Present Today</p>
              </div>
              <div style={{ ...styles.card, textAlign: "center", marginBottom: 0, background: "#fef2f2", border: "1px solid #fca5a5" }}>
                <p style={{ margin: "0 0 4px", fontSize: 32, fontWeight: 900, color: "#dc2626" }}>{members.length - todayAttendance.length}</p>
                <p style={{ margin: 0, color: "#991b1b", fontSize: 13, fontWeight: 600 }}>Absent Today</p>
              </div>
            </div>
            {members.map((member) => {
              const present = todayAttendance.includes(member.id);
              const pkgStyle = getPackageStyle(member.package_type);
              return (
                <div key={member.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: present ? "linear-gradient(135deg,#4ade80,#16a34a)" : "#f3f0ff", color: present ? "#fff" : "#7c6a9a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                      {present ? "OK" : member.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 14 }}>{member.full_name}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ color: "#7c6a9a", fontSize: 12 }}>@{member.username}</span>
                        {member.package_type && <span style={{ background: pkgStyle.bg, color: pkgStyle.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{member.package_type}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => markAttendance(member.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: present ? "#f0fdf4" : "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: present ? "#16a34a" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    {present ? "Present" : "Mark"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* PAYMENTS VIEW */}
{view === "payments" && (
  <div>
    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>💳 Payment Confirmations</h2>
    <p style={{ color: "#7c6a9a", marginBottom: 24 }}>Review and confirm member payments</p>
    <PaymentConfirmations members={members} onRefresh={fetchMembers} />
  </div>
)}

        {view === "renewals" && (
          <div>
            <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Renewal Queue</h2>
                <p style={{ color: "#7c6a9a", fontSize: 13 }}>Members whose memberships expire within 7 days are listed here.</p>
              </div>
            </div>

            <div className="t-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                ["Due Soon", renewalQueue.filter((member) => member.renewal_days > 3).length, "#fffbeb", "#d97706"],
                ["Urgent", renewalQueue.filter((member) => member.renewal_days >= 0 && member.renewal_days <= 3).length, "#fef2f2", "#dc2626"],
                ["Expired", renewalQueue.filter((member) => member.renewal_days < 0).length, "#fee2e2", "#b91c1c"],
                ["Reminded", renewalQueue.filter((member) => renewalStatus[member.id]?.status === "reminded").length, "#eff6ff", "#2563eb"],
              ].map(([label, value, bg, color]) => (
                <div key={label} style={{ ...styles.card, marginBottom: 0, padding: 14, textAlign: "center", background: bg }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7c6a9a", fontWeight: 700 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>{value}</p>
                </div>
              ))}
            </div>

            {renewalQueue.length === 0 ? (
              <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
                <p style={{ color: "#7c6a9a", fontSize: 14 }}>No memberships need renewal follow-up right now.</p>
              </div>
            ) : (
              renewalQueue.map((member) => {
                const reminder = renewalStatus[member.id];
                const urgency =
                  member.renewal_days < 0
                    ? { label: "Expired", bg: "#fef2f2", color: "#dc2626" }
                    : member.renewal_days <= 3
                      ? { label: `Ends in ${member.renewal_days} day${member.renewal_days === 1 ? "" : "s"}`, bg: "#fff7ed", color: "#d97706" }
                      : { label: `Ends in ${member.renewal_days} days`, bg: "#fffbeb", color: "#a16207" };

                return (
                  <div key={member.id} style={{ ...styles.card, marginBottom: 10 }}>
                    <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1030" }}>{member.full_name}</h3>
                          <span style={{ background: urgency.bg, color: urgency.color, padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{urgency.label}</span>
                          {reminder?.status === "reminded" && (
                            <span style={{ background: "#eff6ff", color: "#2563eb", padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              Reminded
                            </span>
                          )}
                          {reminder?.status === "renewed" && (
                            <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              Renewed
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0 0 6px", color: "#7c6a9a", fontSize: 13 }}>@{member.username} • {member.phone || "No phone"} • Expiry: {member.expiry_date || "-"}</p>
                        <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>
                          {reminder?.updated_at ? `Last renewal update: ${new Date(reminder.updated_at).toLocaleString()}` : "No reminder action recorded yet."}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {member.phone && (
                          <a
                            href={whatsappLink(member.phone, membershipReminderMessage(member))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => markRenewalReminder(member.id, "reminded")}
                            style={{ padding: "9px 12px", borderRadius: 10, background: "#fffbeb", color: "#d97706", fontWeight: 700, fontSize: 12, textDecoration: "none" }}
                          >
                            Send Reminder
                          </a>
                        )}
                        <button
                          onClick={() => markRenewalReminder(member.id, "reminded")}
                          style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >
                          Mark Reminded
                        </button>
                        <button
                          onClick={() => markRenewalReminder(member.id, "renewed")}
                          style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >
                          Mark Renewed
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === "payments" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>UPI Payments</h2>
              <p style={{ color: "#7c6a9a", fontSize: 13 }}>Review member payment submissions and confirm them here.</p>
            </div>
            <PaymentConfirmations members={members} onRefresh={fetchMembers} />
          </div>
        )}

        {view === "teaorders" && (
          <div>
            <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tea Orders</h2>
                <p style={{ color: "#7c6a9a", fontSize: 13 }}>Review order workflow, payment collection, and homemade tea orders from the website.</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder="Search tea orders" value={teaSearch} onChange={(e) => setTeaSearch(e.target.value)} style={{ ...styles.input, width: 180, marginBottom: 0 }} />
                <select value={teaStatusFilter} onChange={(e) => setTeaStatusFilter(e.target.value)} style={{ ...styles.input, width: 150, marginBottom: 0 }}>
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select value={teaPaymentFilter} onChange={(e) => setTeaPaymentFilter(e.target.value)} style={{ ...styles.input, width: 150, marginBottom: 0 }}>
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <button onClick={printFilteredTeaOrders} disabled={filteredTeaOrders.length === 0} style={styles.btn(false)}>Print Filtered</button>
                <button onClick={fetchTeaOrders} style={styles.btn(false)}>Refresh</button>
              </div>
            </div>

            <div className="t-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                ["Total", teaStats.total, "#f3f0ff", "#6c3fc4"],
                ["New", teaStats.new, "#eff6ff", "#2563eb"],
                ["Confirmed", teaStats.confirmed, "#fffbeb", "#d97706"],
                ["Delivered", teaStats.delivered, "#f0fdf4", "#16a34a"],
              ].map(([label, value, bg, color]) => (
                <div key={label} style={{ ...styles.card, marginBottom: 0, padding: 14, textAlign: "center", background: bg }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7c6a9a", fontWeight: 700 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="t-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                ["Revenue", `Rs. ${Number(teaStats.revenue || 0).toLocaleString("en-IN")}`, "#faf5ff", "#6c3fc4"],
                ["UPI Orders", teaStats.upi, "#eff6ff", "#2563eb"],
                ["COD Orders", teaStats.cod, "#fff7ed", "#ea580c"],
                ["Filtered", filteredTeaOrders.length, "#fdf4ff", "#a855f7"],
              ].map(([label, value, bg, color]) => (
                <div key={label} style={{ ...styles.card, marginBottom: 0, padding: 14, textAlign: "center", background: bg }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#7c6a9a", fontWeight: 700 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color }}>{value}</p>
                </div>
              ))}
            </div>

            {teaLoading ? (
              <p style={{ color: "#7c6a9a", textAlign: "center", padding: 40 }}>Loading tea orders...</p>
            ) : filteredTeaOrders.length === 0 ? (
              <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
                <p style={{ color: "#7c6a9a", fontSize: 14 }}>No tea orders found.</p>
              </div>
            ) : (
              filteredTeaOrders.map((order) => {
                const statusStyle = orderStatusStyle(order.status || "new");
                const paymentStatus = getTeaPaymentStatus(order);
                const paymentStyle = paymentStatus === "paid"
                  ? { bg: "#f0fdf4", color: "#16a34a" }
                  : { bg: "#fff7ed", color: "#ea580c" };
                const message = `Hi ${order.customer_name}, regarding your ${order.product_name} order from Just4You Ladies Gym.`;
                return (
                  <div key={order.id} style={{ ...styles.card, marginBottom: 10 }}>
                    <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#1e1030" }}>{order.product_name}</h3>
                        <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 13 }}>{order.customer_name} • {order.phone}</p>
                        <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Qty: {order.quantity} • Total: Rs. {order.total_amount || 0}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{order.status || "new"}</span>
                        <span style={{ background: paymentStyle.bg, color: paymentStyle.color, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{paymentStatus}</span>
                        <button onClick={() => printTeaOrder(order)} style={{ ...styles.btn(false), padding: "8px 12px" }}>
                          Print
                        </button>
                        <a href={whatsappLink(order.phone, message)} target="_blank" rel="noreferrer" style={{ padding: "8px 12px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        {[
                          ["Product ID", order.product_id || "-"],
                          ["Ordered On", order.ordered_on ? new Date(order.ordered_on).toLocaleString() : "-"],
                          ["Created", order.created_at ? new Date(order.created_at).toLocaleString() : "-"],
                          ["Address", order.address || "-"],
                          ["Payment Method", (order.payment_method || "upi").toUpperCase()],
                          ["COD Charge", `Rs. ${Number(order.cod_extra_charge || 0).toLocaleString("en-IN")}`],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #f5f0ff" }}>
                            <span style={{ color: "#7c6a9a", fontSize: 12 }}>{label}</span>
                            <span style={{ color: "#1e1030", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label style={styles.label}>Update Status</label>
                        <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {["new", "confirmed", "packed", "delivered", "cancelled"].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateTeaOrderStatus(order.id, status)}
                              style={{
                                padding: "9px 10px",
                                borderRadius: 10,
                                border: "none",
                                background: order.status === status ? "linear-gradient(135deg,#9b7ed4,#6c3fc4)" : "#f3f0ff",
                                color: order.status === status ? "#fff" : "#7c6a9a",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: 12,
                                textTransform: "capitalize",
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        <label style={{ ...styles.label, marginTop: 12 }}>Payment Collection</label>
                        <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {["paid", "pending"].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateTeaPaymentStatus(order.id, status)}
                              style={{
                                padding: "9px 10px",
                                borderRadius: 10,
                                border: "none",
                                background: paymentStatus === status ? "linear-gradient(135deg,#9b7ed4,#6c3fc4)" : "#f3f0ff",
                                color: paymentStatus === status ? "#fff" : "#7c6a9a",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: 12,
                                textTransform: "capitalize",
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        {parseTeaNotes(order.notes).customerNotes && (
                          <div style={{ marginTop: 12, background: "#f8f6ff", borderRadius: 12, padding: 12, border: "1px solid #e0d7f5" }}>
                            <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>CUSTOMER NOTES</p>
                            <p style={{ margin: 0, color: "#1e1030", fontSize: 13, lineHeight: 1.6 }}>{parseTeaNotes(order.notes).customerNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === "settings" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>Trainer Settings</h2>
              <p style={{ margin: 0, color: "#7c6a9a", fontSize: 13 }}>Keep the shared login updated and log out from one clean place.</p>
            </div>

            <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={styles.sectionCard}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Current Login</h3>
                <div style={{ background: "#f8f6ff", border: "1px solid #e0d7f5", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <p style={{ margin: "0 0 6px", color: "#7c6a9a", fontSize: 12 }}>Username</p>
                  <p style={{ margin: "0 0 10px", color: "#1e1030", fontSize: 18, fontWeight: 800 }}>{trainerAuth.username}</p>
                  <p style={{ margin: "0 0 6px", color: "#7c6a9a", fontSize: 12 }}>Password</p>
                  <p style={{ margin: 0, color: "#1e1030", fontSize: 18, fontWeight: 800 }}>{trainerAuth.password}</p>
                </div>
                <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Changes here take effect immediately on the login page.</p>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Change Trainer Login</h3>
                <label style={styles.label}>TRAINER USERNAME</label>
                <input
                  value={trainerForm.username}
                  onChange={(e) => setTrainerForm((current) => ({ ...current, username: e.target.value }))}
                  style={styles.input}
                  placeholder="trainer"
                />
                <label style={styles.label}>TRAINER PASSWORD</label>
                <input
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm((current) => ({ ...current, password: e.target.value }))}
                  style={styles.input}
                  placeholder="Enter new password"
                />
                {settingsMsg === "success" && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 14px", marginBottom: 12, color: "#166534", fontSize: 13 }}>Trainer login updated successfully.</div>}
                {settingsMsg.startsWith("error:") && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 12, color: "#dc2626", fontSize: 13 }}>{settingsMsg.replace("error:", "")}</div>}
                <button onClick={updateTrainerLogin} style={styles.btn(true)}>Save Trainer Login</button>
              </div>

              <div style={{ ...styles.sectionCard, gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Session</h3>
                  <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Use this when you want to leave the trainer dashboard on this device.</p>
                </div>
                <button onClick={handleLogoutClick} style={styles.navBtn(false, true)}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "detail" && selected && (() => {
          const bmi = calcBMI(selected.weight, selected.height);
          const category = bmi ? getBMICategory(parseFloat(bmi)) : null;
          const fee = getFeeStatus(selected);
          const expiry = getExpiryStatus(selected.expiry_date);
          const assessmentBMI = calcAssessmentBMI(assessmentForm.height, assessmentForm.weight);
          const assessmentBMICategory = getAssessmentBMICategory(assessmentBMI);
          const bodyFatStatus = getBodyFatStatus(assessmentForm.bodyFat);

          return (
            <div>
              <button onClick={() => setView("members")} style={{ ...styles.btn(false), marginBottom: 16 }}>Back</button>

              <div style={{ ...styles.card, background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {selectedPhoto && !selectedPhotoBroken ? (
                  <img src={selectedPhoto} alt={selected.full_name} onError={() => setSelectedPhotoBroken(true)} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>
                    {selected.full_name[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{selected.full_name}</h2>
                  <p style={{ margin: "0 0 4px", opacity: 0.85, fontSize: 13 }}>@{selected.username} • {selected.phone || "No phone"}</p>
                  {selected.goal && <p style={{ margin: 0, opacity: 0.85, fontSize: 12 }}>{selected.goal}</p>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.phone && (
                    <a href={whatsappLink(selected.phone, `Hi ${selected.full_name}, this is Just4You Ladies Gym.`)} target="_blank" rel="noreferrer" style={{ padding: "9px 14px", borderRadius: 10, background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                      WhatsApp
                    </a>
                  )}
                  {selected.phone && expiry && (
                    <a href={whatsappLink(selected.phone, membershipReminderMessage(selected))} target="_blank" rel="noreferrer" style={{ padding: "9px 14px", borderRadius: 10, background: "#fffbeb", color: "#d97706", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                      Send Renewal Reminder
                    </a>
                  )}
                  <button onClick={() => deleteMember(selected.id)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                    Remove
                  </button>
                </div>
              </div>

              <div style={styles.card}>
                <div className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Profile Photo</h3>
                    <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Use phone camera or gallery. Members can view this photo but cannot edit it.</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <label style={{ ...styles.btn(true), display: "inline-flex", alignItems: "center" }}>
                      Add / Change Photo
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: "none" }} />
                    </label>
                    {selectedPhoto && <button onClick={clearPhoto} style={styles.btn(false, true)}>Remove Photo</button>}
                  </div>
                </div>
                {photoMsg === "success" && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 12px", marginBottom: 12, color: "#166534", fontSize: 13 }}>Member photo updated.</div>}
                {photoMsg === "removed" && <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 10, padding: "10px 12px", marginBottom: 12, color: "#9a3412", fontSize: 13 }}>Member photo removed.</div>}
                {photoMsg.startsWith("error:") && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 12px", marginBottom: 12, color: "#dc2626", fontSize: 13 }}>{photoMsg.replace("error:", "")}</div>}
              </div>

              <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Member Info</h3>
                    {[["Age", selected.age ? `${selected.age} yrs` : "-"], ["Height", selected.height ? `${selected.height} cm` : "-"], ["Weight", selected.weight ? `${selected.weight} kg` : "-"], ["Joined", selected.join_date || "-"], ["Phone", selected.phone || "-"]].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f0ff" }}>
                        <span style={{ color: "#7c6a9a", fontSize: 13 }}>{label}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Package</h3>
                    <div style={{ display: "grid", gap: 8 }}>
                      {[["Monthly", "Rs. 1,300"], ["3 Months", "Rs. 3,300"], ["Protein Package", "Rs. 5,500"]].map(([pkg, price]) => {
                        const style = getPackageStyle(pkg);
                        return (
                          <button
                            key={pkg}
                            onClick={() => updatePackage(pkg)}
                            style={{
                              padding: "11px 14px",
                              borderRadius: 10,
                              border: `2px solid ${selected.package_type === pkg ? style.color : "#e0d7f5"}`,
                              background: selected.package_type === pkg ? style.bg : "#fff",
                              color: selected.package_type === pkg ? style.color : "#7c6a9a",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: 13,
                              textAlign: "left",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{pkg}</span>
                            <span>{price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Fee Management</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <p style={{ margin: "0 0 2px", color: "#7c6a9a", fontSize: 12 }}>Monthly Fee</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Rs. {selected.fee_amount || 0}</p>
                      </div>
                      <span style={{ background: fee.bg, color: fee.color, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{fee.label}</span>
                    </div>
                    {selected.fee_paid_date && <p style={{ color: "#7c6a9a", fontSize: 11, marginBottom: 10 }}>Last paid: {selected.fee_paid_date}</p>}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <button onClick={() => updateFee("paid")} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "#f0fdf4", color: "#16a34a", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Paid</button>
                      <button onClick={() => updateFee("unpaid")} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Unpaid</button>
                    </div>
                    <label style={styles.label}>Membership Expiry</label>
                    <input type="date" defaultValue={selected.expiry_date || ""} onChange={(e) => updateExpiry(e.target.value)} style={{ ...styles.input, marginBottom: 8 }} />
                    {expiry && <span style={{ background: expiry.bg, color: expiry.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{expiry.label}</span>}
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Recent Attendance</h3>
                    {attendance.length === 0 ? (
                      <p style={{ color: "#7c6a9a", fontSize: 13 }}>No attendance recorded yet.</p>
                    ) : (
                      attendance.map((entry) => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f0ff" }}>
                          <span style={{ color: "#7c6a9a", fontSize: 12 }}>{entry.date}</span>
                          <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 12 }}>Present</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>BMI Tracker</h3>
                    {bmi && category ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 36, fontWeight: 900, color: category.color }}>{bmi}</span>
                          <span style={{ background: category.bg, color: category.color, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{category.label}</span>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: "#7c6a9a", fontSize: 13, marginBottom: 14 }}>Add height and weight to calculate BMI.</p>
                    )}
                    <label style={styles.label}>Log New Weight (kg)</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="e.g. 58.5" style={{ ...styles.input, marginBottom: 0, flex: 1 }} />
                      <button onClick={addWeight} style={styles.btn(true)}>Log</button>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Assessment Sheet</h3>
                        <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>Trainer can update this. Members can only view it. Add a fresh record every month to keep a proper timeline.</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {assessmentForm.date && <span style={{ background: "#f3f0ff", color: "#6c3fc4", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{assessmentForm.date}</span>}
                        <button onClick={startNewAssessment} style={{ ...styles.btn(false), padding: "8px 14px" }}>New Monthly Record</button>
                      </div>
                    </div>

                    <div style={{ background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 14, padding: 12, marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: assessmentHistory.length ? 10 : 0 }}>
                        <p style={{ margin: 0, color: "#6c3fc4", fontSize: 12, fontWeight: 800 }}>Assessment History</p>
                        <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>{assessmentHistory.length} saved record{assessmentHistory.length === 1 ? "" : "s"}</p>
                      </div>
                      {assessmentHistory.length === 0 ? (
                        <p style={{ margin: 0, color: "#7c6a9a", fontSize: 12 }}>No previous assessments yet. Save the first one for this member.</p>
                      ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                          {assessmentHistory.map((entry, index) => {
                            const active = entry.id === assessmentForm.id;
                            return (
                              <button
                                key={entry.id}
                                onClick={() => loadAssessmentRecord(entry)}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  borderRadius: 12,
                                  border: active ? "2px solid #9b7ed4" : "1px solid #e0d7f5",
                                  background: active ? "#f3f0ff" : "#fff",
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                  <div>
                                    <p style={{ margin: "0 0 3px", color: "#1e1030", fontSize: 13, fontWeight: 800 }}>
                                      {entry.date || "Undated assessment"} {index === 0 ? "• Latest" : ""}
                                    </p>
                                    <p style={{ margin: 0, color: "#7c6a9a", fontSize: 11 }}>
                                      Weight {entry.weight || "-"} kg • Body Fat {entry.bodyFat || "-"}%
                                    </p>
                                  </div>
                                  <span style={{ background: active ? "#9b7ed4" : "#f3f0ff", color: active ? "#fff" : "#6c3fc4", padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                                    {active ? "Open" : "View"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {ASSESSMENT_FIELDS.map((field) => (
                        <div key={field.key} style={field.type === "textarea" ? { gridColumn: "1 / -1" } : null}>
                          <label style={styles.label}>{field.label}</label>
                          {field.type === "textarea" ? (
                            <textarea
                              value={assessmentForm[field.key] || ""}
                              onChange={(e) => updateAssessmentField(field.key, e.target.value)}
                              style={{ ...styles.input, minHeight: 92, resize: "vertical", marginBottom: 0 }}
                              placeholder={field.label}
                            />
                          ) : (
                            <input
                              type={field.type}
                              step={field.step}
                              value={assessmentForm[field.key] || ""}
                              onChange={(e) => updateAssessmentField(field.key, e.target.value)}
                              style={{ ...styles.input, marginBottom: 0 }}
                              placeholder={field.label}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="t-two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {[
                        ["Assessment BMI", assessmentBMI || "-", assessmentBMICategory],
                        ["Body Fat Status", bodyFatStatus ? bodyFatStatus.label : "-", bodyFatStatus],
                      ].map(([label, value, status]) => (
                        <div key={label} style={{ background: "#faf7ff", border: "1px solid #e0d7f5", borderRadius: 12, padding: 12 }}>
                          <p style={{ margin: "0 0 4px", color: "#7c6a9a", fontSize: 11, fontWeight: 700 }}>{label}</p>
                          <p style={{ margin: 0, color: "#1e1030", fontSize: 18, fontWeight: 800 }}>{value}</p>
                          {status && <span style={{ display: "inline-block", marginTop: 8, background: status.bg, color: status.color, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{status.label}</span>}
                        </div>
                      ))}
                    </div>

                    {assessmentMsg === "success" && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 14px", marginBottom: 12, color: "#166534", fontSize: 13 }}>Assessment saved for this member.</div>}
                    {assessmentMsg.startsWith("error:") && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 12, color: "#dc2626", fontSize: 13 }}>{assessmentMsg.replace("error:", "")}</div>}
                    <button onClick={saveAssessment} style={styles.btn(true)}>Save Assessment</button>
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Weight Log</h3>
                    {weightHistory.length === 0 ? (
                      <p style={{ color: "#7c6a9a", fontSize: 13 }}>No weight logged yet.</p>
                    ) : (
                      [...weightHistory].reverse().map((entry, index) => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f0ff" }}>
                          <span style={{ color: "#7c6a9a", fontSize: 12 }}>{entry.recorded_at}</span>
                          <span style={{ fontWeight: 700, color: index === 0 ? "#9b7ed4" : "#1e1030", fontSize: 12 }}>
                            {entry.weight} kg {index === 0 ? "latest" : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
