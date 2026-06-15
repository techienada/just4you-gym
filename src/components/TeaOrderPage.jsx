import { useState } from "react";
import { supabase } from "../supabase";

const UPI_ID = "919014944750@axlm";
const UPI_NAME = "Amatul Gaffar";
const UPI_NOTE = "Just4You Tea Order";

const teaProducts = [
  { id: "green-tea", badge: "GT", icon: "🍃", mood: "Daily detox", name: "Green Tea", price: "Rs. 249", priceValue: 249, note: "Fresh homemade blend for daily wellness and metabolism boost", color: "#f4eeff", accent: "#7c5ac2" },
  { id: "blue-tea", badge: "BT", icon: "🫖", mood: "Calm recovery", name: "Blue Tea", price: "Rs. 349", priceValue: 349, note: "Self-made floral tea for calm, recovery and antioxidants", color: "#efe6ff", accent: "#8d6cc8" },
  { id: "pink-tea", badge: "PT", icon: "🌸", mood: "Skin & glow", name: "Pink Tea", price: "Rs. 339", priceValue: 339, note: "Soothing rose blend for skin health and relaxation", color: "#fdf0f8", accent: "#b56d9d" },
  { id: "meetha-pan", badge: "MP", icon: "🌿", mood: "Digestion", name: "Meetha Pan", price: "Rs. 299", priceValue: 299, note: "Traditional homemade sweet pan for digestion and freshness", color: "#f5f1e7", accent: "#8f7a55" },
  { id: "hormonal-multivitamin", badge: "HM", icon: "💜", mood: "Women's health", name: "Hormonal + Multi Vitamin", price: "Rs. 499", priceValue: 499, note: "Special herbal blend for hormonal balance, daily energy, immunity and overall wellness", color: "#f7efff", accent: "#8e6bcc" },
];

const palette = {
  bgTop: "#faf5ff",
  bgMid: "#fdfbff",
  panelBorder: "#eadcf8",
  panelSoft: "#f7f0ff",
  cardSoft: "#fcf9ff",
  heroStart: "#6f4aa8",
  heroEnd: "#b49ae3",
  primary: "#8e6bcc",
  primaryDark: "#6743a4",
  primarySoft: "#efe5ff",
  accentSoft: "#f6eeff",
  accentText: "#7a5db0",
  textSoft: "#7f6f9f",
  shadow: "0 18px 50px rgba(122,93,176,0.10)",
};

const fieldStyles = {
  input: { width: "100%", padding: "13px 16px", borderRadius: 16, border: "2px solid #eadcf8", background: "#fff", color: "#1e1030", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" },
  label: { fontSize: 12, fontWeight: 700, color: "#7a5db0", display: "block", marginBottom: 6, letterSpacing: 0.5 },
};

export default function TeaOrderPage({ onBack, onEnter }) {
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    phone: "",
    notes: "",
    address: "",
    payment_method: "upi",
  });
  const [cart, setCart] = useState({ "green-tea": 1 });
  const [orderMsg, setOrderMsg] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState(null);

  const selectedItems = teaProducts
    .map((tea) => ({ ...tea, quantity: Math.max(0, Number(cart[tea.id] || 0)) }))
    .filter((tea) => tea.quantity > 0);
  const selectedTea = selectedItems[0] || teaProducts[0];
  const totalItems = selectedItems.reduce((sum, tea) => sum + tea.quantity, 0);
  const codExtra = orderForm.payment_method === "cod" ? 40 : 0;
  const teaTotal = selectedItems.reduce((sum, tea) => sum + (tea.priceValue * tea.quantity), 0);
  const teaTotalWithCharges = teaTotal + codExtra;

  function formatRupees(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function getUPILink(amount) {
    return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(UPI_NOTE)}`;
  }

  function buildOrderPayload(items, form) {
    return items.map((tea, index) => ({
      product_id: tea.id,
      product_name: tea.name,
      customer_name: form.customer_name,
      phone: form.phone,
      quantity: tea.quantity,
      notes: form.notes || null,
      address: form.address || null,
      payment_method: form.payment_method,
      total_amount: index === 0 ? teaTotalWithCharges : (tea.priceValue * tea.quantity),
      cod_extra_charge: index === 0 ? codExtra : 0,
      status: "new",
      ordered_on: new Date().toISOString(),
    }));
  }

  async function saveTeaOrder(payload, submittedSummary) {
    const { error } = await supabase.from("tea_orders").insert(payload);
    if (error) {
      setOrderMsg("fallback:Online tea order saving is not ready yet. Please complete this order on WhatsApp.");
      return false;
    }

    setOrderMsg("success");
    setLastSubmittedOrder(submittedSummary);
    setOrderForm({
      customer_name: "",
      phone: "",
      notes: "",
      address: "",
      payment_method: "upi",
    });
    setCart({ "green-tea": 1 });
    return true;
  }

  async function handleTeaOrder() {
    setOrderMsg("");
    if (!orderForm.customer_name || !orderForm.phone || !orderForm.address) {
      setOrderMsg("error:Please enter your name, phone number, and address.");
      setOrderLoading(false);
      return;
    }
    if (selectedItems.length === 0) {
      setOrderMsg("error:Please add at least one tea to your order.");
      setOrderLoading(false);
      return;
    }

    const submittedSummary = {
      items: selectedItems.map((tea) => ({ id: tea.id, name: tea.name, quantity: tea.quantity })),
      total: teaTotalWithCharges,
      payment_method: orderForm.payment_method,
      customer_name: orderForm.customer_name,
      phone: orderForm.phone,
      address: orderForm.address,
      notes: orderForm.notes || "",
    };

    if (orderForm.payment_method === "upi") {
      setLastSubmittedOrder(submittedSummary);
      setOrderMsg("awaiting_payment");
      return;
    }

    setOrderLoading(true);
    await saveTeaOrder(buildOrderPayload(selectedItems, orderForm), submittedSummary);
    setOrderLoading(false);
  }

  async function confirmTeaPayment() {
    if (!lastSubmittedOrder) return;
    setOrderLoading(true);
    const payload = buildOrderPayload(lastSubmittedOrder.items.map((item) => {
      const tea = teaProducts.find((product) => product.id === item.id);
      return { ...tea, quantity: item.quantity };
    }), {
      customer_name: lastSubmittedOrder.customer_name,
      phone: lastSubmittedOrder.phone,
      notes: lastSubmittedOrder.notes,
      address: lastSubmittedOrder.address,
      payment_method: lastSubmittedOrder.payment_method,
    });
    await saveTeaOrder(payload, lastSubmittedOrder);
    setOrderLoading(false);
  }

  function setTeaQuantity(teaId, quantity) {
    const nextQuantity = Math.max(0, Number.parseInt(quantity || "0", 10) || 0);
    setCart((current) => {
      const next = { ...current };
      if (nextQuantity === 0) {
        delete next[teaId];
      } else {
        next[teaId] = nextQuantity;
      }
      return next;
    });
  }

  function addTeaToCart(teaId) {
    setCart((current) => ({ ...current, [teaId]: Math.max(0, Number(current[teaId] || 0)) + 1 }));
  }

  const teaWhatsappLink = `https://wa.me/919014944750?text=${encodeURIComponent(
    `Hi, I want to order these teas:\n${selectedItems.map((tea) => `- ${tea.name} x${tea.quantity}`).join("\n") || "- No teas selected"}\nName: ${orderForm.customer_name || "Customer"}.\nPhone: ${orderForm.phone || "Not shared yet"}.\nAddress: ${orderForm.address || "N/A"}.\nPayment: ${orderForm.payment_method === "cod" ? "COD (+Rs. 40)" : "UPI"}.\nNotes: ${orderForm.notes || "None"}.\nTotal: ${formatRupees(teaTotalWithCharges)}.`
  )}`;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg,${palette.bgTop} 0%,${palette.bgMid} 48%,#ffffff 100%)`, fontFamily: "'Segoe UI', sans-serif", color: "#1e1030" }}>
      <style>{`
        @media(max-width:768px){
          .tea-page-pad{padding:92px 20px 48px!important}
          .tea-grid{grid-template-columns:1fr!important}
          .tea-hero-grid{grid-template-columns:1fr!important}
          .tea-form-grid{grid-template-columns:1fr!important}
          .tea-actions{flex-direction:column!important;align-items:stretch!important}
          .tea-summary-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${palette.panelBorder}`, padding: "0 24px", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 20px rgba(124,90,194,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>🍵</div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: palette.primaryDark }}>Just4You Tea Orders</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onBack} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${palette.panelBorder}`, background: "#fff", color: palette.primaryDark, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Back</button>
          <button onClick={onEnter} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Member Login</button>
        </div>
      </nav>

      <div className="tea-page-pad" style={{ maxWidth: 1120, margin: "0 auto", padding: "104px 48px 60px" }}>
        <div className="tea-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch", marginBottom: 28 }}>
          <div style={{ background: `linear-gradient(145deg,${palette.heroStart},${palette.heroEnd})`, borderRadius: 34, padding: 34, color: "#fff", boxShadow: "0 24px 70px rgba(124,90,194,0.22)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", top: -70, right: -60, background: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", bottom: -50, right: 80, background: "rgba(255,255,255,0.10)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ display: "inline-block", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>HOMEMADE WELLNESS TEAS</span>
              <h2 style={{ margin: "16px 0 10px", fontSize: 40, fontWeight: 900, lineHeight: 1.05 }}>Order directly from the tea page</h2>
              <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.92)", fontSize: 15, lineHeight: 1.8, maxWidth: 430 }}>
                Browse all 5 tea options here, see the exact total instantly, and place the order online or on WhatsApp.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="#tea-order-form" style={{ padding: "13px 20px", borderRadius: 14, background: "#fff", color: palette.primaryDark, fontWeight: 800, textDecoration: "none", fontSize: 14, boxShadow: "0 12px 24px rgba(48,24,92,0.14)" }}>Start Order</a>
                <a href={teaWhatsappLink} target="_blank" rel="noreferrer" style={{ padding: "13px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Order on WhatsApp</a>
              </div>
              <div className="tea-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 26 }}>
                {[
                  ["5", "Tea options"],
                  ["Same day", "WhatsApp flow"],
                  [formatRupees(teaProducts[0].priceValue), "Starting price"],
                ].map(([value, label]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 18, padding: "14px 12px" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${palette.panelBorder}`, borderRadius: 34, padding: 28, boxShadow: palette.shadow }}>
            <p style={{ margin: "0 0 10px", color: palette.accentText, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>WHY ORDER HERE</p>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                "Choose from all 5 wellness tea options",
                "See total instantly, including COD charges",
                "Place online or continue on WhatsApp",
                "Send delivery address and notes in one step",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16, background: palette.panelSoft, border: `1px solid ${palette.panelBorder}`, borderRadius: 20 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: palette.primarySoft, color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>+</div>
                  <p style={{ margin: 0, color: "#1e1030", fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tea-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          {teaProducts.map((tea) => (
            <div key={tea.id} style={{ background: palette.cardSoft, border: `1px solid ${palette.panelBorder}`, borderRadius: 28, padding: 28, boxShadow: "0 12px 32px rgba(124,90,194,0.08)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -24, top: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(142,107,204,0.08)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: tea.color, color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, border: `1px solid ${palette.panelBorder}` }}>{tea.icon}</div>
                  <div style={{ background: palette.primarySoft, color: palette.primaryDark, borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>{tea.mood}</div>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#1e1030" }}>{tea.name}</h3>
                <p style={{ margin: "0 0 16px", color: palette.textSoft, fontSize: 14, lineHeight: 1.8 }}>{tea.note}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: palette.primary }}>{formatRupees(tea.priceValue)}</span>
                  <button onClick={() => addTeaToCart(tea.id)} style={{ padding: "12px 18px", borderRadius: 14, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 12px 22px rgba(103,67,164,0.18)" }}>
                    {cart[tea.id] ? `Added x${cart[tea.id]}` : "Add This Tea"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div id="tea-order-form" style={{ background: "#fff", border: `1px solid ${palette.panelBorder}`, borderRadius: 34, padding: 28, boxShadow: palette.shadow }}>
          <div className="tea-form-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            <div>
              <span style={{ background: palette.primarySoft, color: palette.primaryDark, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>PLACE ORDER</span>
              <h3 style={{ margin: "14px 0 8px", fontSize: 28, fontWeight: 900, color: "#1e1030" }}>Order Tea Online</h3>
              <p style={{ margin: "0 0 18px", color: palette.textSoft, fontSize: 14, lineHeight: 1.8 }}>Choose one or more teas, enter your details, and send the order directly.</p>

              <div style={{ display: "flex", gap: 14, alignItems: "center", background: palette.panelSoft, border: `1px solid ${palette.panelBorder}`, borderRadius: 22, padding: 16, marginBottom: 18 }}>
                <div style={{ width: 58, height: 58, borderRadius: 18, background: selectedTea.color, border: `1px solid ${palette.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {selectedTea.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: palette.accentText, fontWeight: 700, marginBottom: 4 }}>ORDER CART</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1030", marginBottom: 3 }}>{selectedItems.length ? `${selectedItems.length} tea type(s)` : "No teas selected"}</div>
                  <div style={{ fontSize: 13, color: palette.textSoft }}>{selectedItems.length ? `${totalItems} total item(s)` : "Add teas from the cards above"}</div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldStyles.label}>SELECTED TEAS</label>
                <div style={{ display: "grid", gap: 10 }}>
                  {teaProducts.map((tea) => (
                    <div key={tea.id} style={{ display: "grid", gridTemplateColumns: "1fr 96px", gap: 10, alignItems: "center", background: "#faf7ff", border: `1px solid ${palette.panelBorder}`, borderRadius: 16, padding: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1030" }}>{tea.name}</div>
                        <div style={{ fontSize: 12, color: palette.textSoft }}>{formatRupees(tea.priceValue)}</div>
                      </div>
                      <input type="number" min="0" value={cart[tea.id] || 0} onChange={(e) => setTeaQuantity(tea.id, e.target.value)} style={{ ...fieldStyles.input, margin: 0, padding: "10px 12px" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="tea-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={fieldStyles.label}>CUSTOMER NAME *</label>
                  <input type="text" placeholder="Your full name" value={orderForm.customer_name} onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })} style={fieldStyles.input} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={fieldStyles.label}>PHONE NUMBER *</label>
                  <input type="text" placeholder="+91 98765 43210" value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} style={fieldStyles.input} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={fieldStyles.label}>PAYMENT METHOD *</label>
                  <select value={orderForm.payment_method} onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })} style={fieldStyles.input}>
                    <option value="upi">UPI</option>
                    <option value="cod">COD (+Rs. 40)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={fieldStyles.label}>ADDRESS *</label>
                <textarea placeholder="House / Street / Locality" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} style={{ ...fieldStyles.input, minHeight: 86, resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={fieldStyles.label}>NOTES</label>
                <textarea placeholder="Optional: preferred delivery time or extra details" value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} style={{ ...fieldStyles.input, minHeight: 90, resize: "vertical" }} />
              </div>

              {orderMsg === "success" && <div style={{ background: "#f6f0ff", border: `1px solid ${palette.panelBorder}`, borderRadius: 16, padding: "12px 14px", marginBottom: 14, color: palette.primaryDark, fontSize: 13, fontWeight: 700 }}>Tea order placed successfully!</div>}
              {orderMsg === "awaiting_payment" && <div style={{ background: "#f6f0ff", border: `1px solid ${palette.panelBorder}`, borderRadius: 16, padding: "12px 14px", marginBottom: 14, color: palette.primaryDark, fontSize: 13, fontWeight: 700 }}>Complete the UPI payment first, then tap confirm to place the tea order.</div>}
              {(orderMsg === "awaiting_payment" || orderMsg === "success") && lastSubmittedOrder?.payment_method === "upi" && (
                <div style={{ background: "#fff", border: `1px solid ${palette.panelBorder}`, borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: "0 10px 24px rgba(103,67,164,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", color: palette.accentText, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>UPI PAYMENT QR</p>
                      <p style={{ margin: 0, color: "#1e1030", fontSize: 16, fontWeight: 800 }}>Scan to pay {formatRupees(lastSubmittedOrder.total)}</p>
                    </div>
                    <a href={getUPILink(lastSubmittedOrder.total)} style={{ padding: "10px 16px", borderRadius: 12, background: "#efe5ff", color: palette.primaryDark, textDecoration: "none", fontWeight: 800, fontSize: 13 }}>Open UPI App</a>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "center" }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getUPILink(lastSubmittedOrder.total))}`}
                      alt="UPI Payment QR"
                      style={{ width: 180, height: 180, borderRadius: 18, border: `1px solid ${palette.panelBorder}`, background: "#fff", padding: 8, boxSizing: "border-box" }}
                    />
                    <div>
                      <p style={{ margin: "0 0 8px", color: palette.textSoft, fontSize: 13, lineHeight: 1.7 }}>Pay using this QR first. After payment, tap confirm below to finally place the tea order in the trainer dashboard.</p>
                      <p style={{ margin: "0 0 6px", color: "#1e1030", fontSize: 13 }}><strong>UPI ID:</strong> {UPI_ID}</p>
                      <p style={{ margin: "0 0 6px", color: "#1e1030", fontSize: 13 }}><strong>Name:</strong> {UPI_NAME}</p>
                      <p style={{ margin: 0, color: "#1e1030", fontSize: 13 }}><strong>Amount:</strong> {formatRupees(lastSubmittedOrder.total)}</p>
                      {orderMsg === "awaiting_payment" && (
                        <button onClick={confirmTeaPayment} disabled={orderLoading} style={{ marginTop: 14, padding: "12px 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                          {orderLoading ? "Confirming..." : "I Have Paid, Confirm Order"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {orderMsg.startsWith("error:") && <div style={{ background: "#fff0f6", border: "1px solid #f3bfd4", borderRadius: 16, padding: "12px 14px", marginBottom: 14, color: "#be185d", fontSize: 13 }}>{orderMsg.replace("error:", "")}</div>}
              {orderMsg.startsWith("fallback:") && <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 16, padding: "12px 14px", marginBottom: 14, color: "#9a3412", fontSize: 13 }}>{orderMsg.replace("fallback:", "")}</div>}

              <div className="tea-actions" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleTeaOrder} disabled={orderLoading} style={{ padding: "14px 20px", borderRadius: 16, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, boxShadow: "0 14px 24px rgba(103,67,164,0.20)" }}>
                  {orderLoading ? "Submitting..." : orderForm.payment_method === "upi" ? "Continue to Payment" : "Submit Tea Order"}
                </button>
                <a href={teaWhatsappLink} target="_blank" rel="noreferrer" style={{ padding: "14px 20px", borderRadius: 16, background: "#eadcf8", color: palette.primaryDark, textDecoration: "none", fontWeight: 800, fontSize: 14, textAlign: "center" }}>💬 Order on WhatsApp</a>
              </div>
            </div>

            <div style={{ background: palette.panelSoft, border: `1px solid ${palette.panelBorder}`, borderRadius: 28, padding: 22, alignSelf: "start" }}>
              <p style={{ margin: "0 0 10px", color: palette.primaryDark, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>ORDER SUMMARY</p>
              <div style={{ background: "#fff", border: `1px solid ${palette.panelBorder}`, borderRadius: 22, padding: 16, display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <div style={{ width: 54, height: 54, borderRadius: 18, background: selectedTea.color, border: `1px solid ${palette.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {selectedTea.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: palette.accentText, fontWeight: 700, marginBottom: 3 }}>YOUR CART</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1030" }}>{selectedItems.length ? `${selectedItems.length} tea type(s)` : "No teas selected"}</div>
                  <div style={{ fontSize: 13, color: palette.textSoft }}>{selectedItems.length ? `${totalItems} total item(s)` : "Add a tea to begin"}</div>
                </div>
              </div>
              {selectedItems.map((tea) => (
                <div key={tea.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "13px 14px", borderRadius: 16, background: "#fff", border: `1px solid ${palette.panelBorder}`, marginBottom: 10 }}>
                  <span style={{ color: palette.textSoft, fontSize: 14 }}>{tea.name} x{tea.quantity}</span>
                  <span style={{ color: "#1e1030", fontSize: 14, fontWeight: 700 }}>{formatRupees(tea.priceValue * tea.quantity)}</span>
                </div>
              ))}
              {[
                ["Items", totalItems],
                ["Base total", formatRupees(teaTotal)],
                ["Payment", orderForm.payment_method === "cod" ? "COD" : "UPI"],
                ["COD charge", formatRupees(codExtra)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "13px 14px", borderRadius: 16, background: "#fff", border: `1px solid ${palette.panelBorder}`, marginBottom: 10 }}>
                  <span style={{ color: palette.textSoft, fontSize: 14 }}>{label}</span>
                  <span style={{ color: "#1e1030", fontSize: 14, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, borderRadius: 22, padding: 18, background: `linear-gradient(135deg,${palette.primarySoft},#ffffff)`, border: `1px solid ${palette.panelBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <span style={{ color: palette.primaryDark, fontSize: 15, fontWeight: 800 }}>Total</span>
                  <span style={{ color: palette.primary, fontSize: 26, fontWeight: 900 }}>{formatRupees(teaTotalWithCharges)}</span>
                </div>
                <div style={{ marginTop: 6, color: palette.textSoft, fontSize: 12 }}>Final amount including payment method charges.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
