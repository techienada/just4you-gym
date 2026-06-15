import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const UPI_ID = "919014944750@axlm";
const UPI_NAME = "Amatul Gaffar";
const UPI_NOTE = "Just4You Ladies Gym Fee";

export default function PaymentPage({ member, onBack }) {
  const [step, setStep] = useState("select"); // select | pay | done
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  const packages = [
    { name: "Monthly", amount: 1300, color: "#f3f0ff", border: "#9b7ed4" },
    { name: "3 Months", amount: 3300, color: "#ede8ff", border: "#6c3fc4" },
    { name: "Protein Package", amount: 5500, color: "#f0fdf4", border: "#16a34a" },
    { name: "Personal Trainer", amount: 5000, color: "#eff6ff", border: "#2563eb" },
  ];

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    const { data } = await supabase.from("upi_payments").select("*")
      .eq("member_id", member.id).order("submitted_at", { ascending: false }).limit(5);
    setPayments(data || []);
  }

  function getUPILink(app) {
    const amount = selectedPkg?.amount || 0;
    const base = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
    if (app === "gpay") return `tez://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
    if (app === "phonepe") return `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
    if (app === "paytm") return `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
    return base;
  }

  async function handlePaid() {
    setLoading(true);
    await supabase.from("upi_payments").insert([{
      member_id: member.id,
      member_name: member.full_name,
      amount: selectedPkg.amount,
      package_type: selectedPkg.name,
      status: "pending",
      submitted_at: new Date().toISOString(),
    }]);
    await supabase.from("members").update({
      payment_status: "pending",
      last_payment_amount: selectedPkg.amount,
      package_type: selectedPkg.name,
    }).eq("id", member.id);
    setLoading(false);
    setStep("done");
    fetchPayments();
  }

  const p = {
    primary: "#8e6bcc",
    dark: "#6743a4",
    soft: "#efe5ff",
    border: "#eadcf8",
    text: "#7f6f9f",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6ff", fontFamily: "'Segoe UI', sans-serif", color: "#1e1030" }}>
      <style>{`
        @media(max-width:768px){
          .pay-grid{grid-template-columns:1fr!important}
          .pkg-grid{grid-template-columns:1fr 1fr!important}
          .app-grid{grid-template-columns:1fr 1fr!important}
        }
        .hover-btn{transition:all 0.2s ease!important}
        .hover-btn:hover{transform:translateY(-2px)!important;opacity:0.92!important}
        .pkg-card{transition:all 0.2s ease!important}
        .pkg-card:hover{transform:translateY(-3px)!important}
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${p.border}`, padding: "0 24px", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(108,63,196,0.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${p.primary},${p.dark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>J4Y</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: p.dark }}>Pay Fees</h1>
            <p style={{ margin: 0, fontSize: 11, color: p.text }}>Just4You Ladies Gym</p>
          </div>
        </div>
        <button onClick={onBack} className="hover-btn" style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${p.border}`, background: "#fff", color: p.text, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Payment history strip */}
        {payments.length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${p.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 24, boxShadow: "0 2px 12px rgba(108,63,196,0.06)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: p.text, letterSpacing: 0.5 }}>RECENT PAYMENTS</p>
            {payments.map((pay) => (
              <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${p.border}` }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{pay.package_type}</p>
                  <p style={{ margin: 0, color: p.text, fontSize: 12 }}>{new Date(pay.submitted_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>₹{pay.amount}</span>
                  <span style={{
                    padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: pay.status === "confirmed" ? "#f0fdf4" : "#fffbeb",
                    color: pay.status === "confirmed" ? "#16a34a" : "#d97706"
                  }}>
                    {pay.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Select package */}
        {step === "select" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>Pay Your Fees</h2>
              <p style={{ color: p.text, fontSize: 14, margin: 0 }}>Select your membership package to continue</p>
            </div>
            <div className="pkg-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 24 }}>
              {packages.map((pkg) => (
                <div key={pkg.name} className="pkg-card"
                  onClick={() => setSelectedPkg(pkg)}
                  style={{ background: selectedPkg?.name === pkg.name ? pkg.color : "#fff", border: `2px solid ${selectedPkg?.name === pkg.name ? pkg.border : p.border}`, borderRadius: 18, padding: "20px 22px", cursor: "pointer", boxShadow: selectedPkg?.name === pkg.name ? `0 8px 28px ${pkg.border}33` : "0 2px 12px rgba(108,63,196,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e1030" }}>{pkg.name}</h3>
                    {selectedPkg?.name === pkg.name && <span style={{ background: pkg.border, color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: pkg.border }}>₹{pkg.amount.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <button onClick={() => selectedPkg && setStep("pay")} className="hover-btn"
              style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: selectedPkg ? `linear-gradient(135deg,${p.primary},${p.dark})` : "#e0d7f5", color: "#fff", fontWeight: 800, cursor: selectedPkg ? "pointer" : "not-allowed", fontSize: 16, boxShadow: selectedPkg ? "0 8px 24px rgba(108,63,196,0.3)" : "none" }}>
              Continue to Payment →
            </button>
          </div>
        )}

        {/* STEP 2 — Pay */}
        {step === "pay" && selectedPkg && (
          <div>
            <button onClick={() => setStep("select")} style={{ background: "none", border: "none", color: p.primary, fontWeight: 600, cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}>← Change Package</button>

            {/* Amount banner */}
            <div style={{ background: `linear-gradient(135deg,${p.primary},${p.dark})`, borderRadius: 20, padding: "24px 28px", color: "#fff", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 13 }}>Pay for</p>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900 }}>{selectedPkg.name}</h2>
                <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>Just4You Ladies Gym • {UPI_NAME}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 13 }}>Amount</p>
                <p style={{ margin: 0, fontSize: 36, fontWeight: 900 }}>₹{selectedPkg.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="pay-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Left — QR + UPI apps */}
              <div>
                {/* QR Code */}
                <div style={{ background: "#fff", border: `1px solid ${p.border}`, borderRadius: 20, padding: 24, marginBottom: 16, textAlign: "center", boxShadow: "0 4px 20px rgba(108,63,196,0.08)" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: p.text, letterSpacing: 0.5 }}>SCAN & PAY</p>
                  {/* QR Code generated from UPI string */}
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${selectedPkg.amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`)}`}
                      alt="UPI QR Code"
                      style={{ width: 180, height: 180, borderRadius: 12, border: `2px solid ${p.border}`, display: "block" }}
                    />
                    <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", background: "#5f259f", borderRadius: 20, padding: "3px 14px", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>PhonePe</span>
                    </div>
                  </div>
                  <p style={{ margin: "16px 0 4px", fontWeight: 800, fontSize: 15, color: "#1e1030" }}>{UPI_NAME}</p>
                  <p style={{ margin: 0, color: p.text, fontSize: 12 }}>{UPI_ID}</p>
                </div>

                {/* UPI App buttons */}
                <div style={{ background: "#fff", border: `1px solid ${p.border}`, borderRadius: 20, padding: 20, boxShadow: "0 4px 20px rgba(108,63,196,0.08)" }}>
                  <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: p.text, letterSpacing: 0.5 }}>OR OPEN UPI APP</p>
                  <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { name: "GPay", app: "gpay", bg: "#1a73e8", emoji: "G" },
                      { name: "PhonePe", app: "phonepe", bg: "#5f259f", emoji: "₱" },
                      { name: "Paytm", app: "paytm", bg: "#002970", emoji: "P" },
                      { name: "Any UPI", app: "upi", bg: "#ff6b00", emoji: "⊕" },
                    ].map((app) => (
                      <a key={app.app} href={getUPILink(app.app)} className="hover-btn"
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: app.bg, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{app.emoji}</div>
                        {app.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — Steps + Confirm */}
              <div>
                {/* How to pay */}
                <div style={{ background: "#fff", border: `1px solid ${p.border}`, borderRadius: 20, padding: 22, marginBottom: 16, boxShadow: "0 4px 20px rgba(108,63,196,0.08)" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: p.text, letterSpacing: 0.5 }}>HOW TO PAY</p>
                  {[
                    ["1️⃣", "Scan QR or tap your UPI app above"],
                    ["2️⃣", `Pay ₹${selectedPkg.amount.toLocaleString("en-IN")} to ${UPI_NAME}`],
                    ["3️⃣", "Come back here after payment"],
                    ["4️⃣", "Click \"I've Paid\" button below"],
                    ["5️⃣", "Trainer will confirm within 24 hrs"],
                  ].map(([num, text]) => (
                    <div key={num} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{num}</span>
                      <p style={{ margin: 0, fontSize: 13, color: "#1e1030", lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* Payment details */}
                <div style={{ background: p.soft, border: `1px solid ${p.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
                  {[["Package", selectedPkg.name], ["Amount", `₹${selectedPkg.amount.toLocaleString("en-IN")}`], ["Pay to", UPI_NAME], ["UPI ID", UPI_ID]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${p.border}` }}>
                      <span style={{ color: p.text, fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#1e1030" }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Confirm button */}
                <button onClick={handlePaid} disabled={loading} className="hover-btn"
                  style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 16, boxShadow: "0 8px 24px rgba(22,163,74,0.3)", marginBottom: 10 }}>
                  {loading ? "Submitting..." : "✅ I've Paid — Notify Trainer"}
                </button>
                <p style={{ textAlign: "center", color: p.text, fontSize: 12, margin: 0 }}>
                  Your payment will be verified by the trainer within 24 hours
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px", color: "#1e1030" }}>Payment Submitted!</h2>
            <p style={{ color: p.text, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
              Your payment of <strong style={{ color: p.dark }}>₹{selectedPkg?.amount.toLocaleString("en-IN")}</strong> for <strong style={{ color: p.dark }}>{selectedPkg?.name}</strong> has been submitted.<br />
              The trainer will confirm it within 24 hours. 🌸
            </p>
            <div style={{ background: "#fff", border: `1px solid ${p.border}`, borderRadius: 20, padding: 24, maxWidth: 380, margin: "0 auto 32px", boxShadow: "0 4px 20px rgba(108,63,196,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>⏳</div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>Pending Confirmation</p>
                  <p style={{ margin: 0, color: p.text, fontSize: 13 }}>Trainer will verify your payment soon</p>
                </div>
              </div>
            </div>
            <button onClick={onBack} className="hover-btn"
              style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${p.primary},${p.dark})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, boxShadow: "0 8px 24px rgba(108,63,196,0.3)" }}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}