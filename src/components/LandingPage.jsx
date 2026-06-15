import { useState } from "react";

export default function LandingPage({ onEnter, onTeaPage }) {
  const [showSignup, setShowSignup] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");

  const palette = {
    primary: "#8e6bcc",
    primaryDark: "#6743a4",
    primarySoft: "#efe5ff",
    border: "#eadcf8",
    textSoft: "#7f6f9f",
    heroStart: "#6f4aa8",
    heroEnd: "#b49ae3",
  };

  const teaProducts = [
    { id: "green-tea", emoji: "🍃", mood: "Daily detox", name: "Green Tea", price: "Rs. 249", note: "Fresh homemade blend for daily wellness and metabolism boost", color: "#f0fff4" },
    { id: "blue-tea", emoji: "🫖", mood: "Calm recovery", name: "Blue Tea", price: "Rs. 349", note: "Self-made floral tea for calm, recovery and antioxidants", color: "#eff6ff" },
    { id: "pink-tea", emoji: "🌸", mood: "Skin & glow", name: "Pink Tea", price: "Rs. 339", note: "Soothing rose blend for skin health and relaxation", color: "#fff0f6" },
    { id: "meetha-pan", emoji: "🌿", mood: "Digestion", name: "Meetha Pan", price: "Rs. 299", note: "Traditional homemade sweet pan for digestion and freshness", color: "#fefce8" },
    { id: "hormonal-multivitamin", emoji: "💜", mood: "Women's health", name: "Hormonal + Multi Vitamin", price: "Rs. 499", note: "Special herbal blend for hormonal balance, daily energy, immunity and overall wellness", color: "#fdf4ff" },
  ];

  const packages = [
    { id: "monthly", badge: "M", name: "Monthly", duration: "1 Month", price: "Rs. 1,300", per: "per month", color: "#f3f0ff", border: "#9b7ed4", tag: null },
    { id: "quarterly", badge: "3M", name: "3 Months", duration: "3 Months", price: "Rs. 3,300", per: "Rs. 1,100/month", color: "#ede8ff", border: "#6c3fc4", tag: "SAVE Rs. 600" },
    { id: "protein", badge: "PRO", name: "Protein Package", duration: "Premium", price: "Rs. 5,500", per: "Includes protein supplement", color: "#f0fdf4", border: "#16a34a", tag: "BEST VALUE" },
    { id: "personal", badge: "PT", name: "Personal Trainer", duration: "Premium Session", price: "Rs. 5,000", per: "One-to-one trainer support", color: "#eff6ff", border: "#2563eb", tag: "PERSONAL" },
  ];

  if (showSignup) return (
    <div style={{ minHeight: "100vh", background: "#f8f6ff", fontFamily: "'Segoe UI', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: `1px solid ${palette.border}`, padding: "0 20px", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(108,63,196,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>J4Y</div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: palette.primaryDark }}>Just4You Ladies Gym</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSignup(false)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${palette.border}`, background: "#fff", color: palette.textSoft, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Back</button>
          <button onClick={onEnter} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Login</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
        <div className="signup-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          <style>{`@media(min-width:769px){.signup-grid{grid-template-columns:1fr 1.3fr!important}}`}</style>
          <div>
            <span style={{ background: palette.primarySoft, color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>JOIN US</span>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "12px 0 8px", lineHeight: 1.1, color: "#1e1030" }}>Choose a <span style={{ color: palette.primaryDark }}>Package</span></h2>
            <p style={{ color: palette.textSoft, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>Review the plans and contact the trainer. Only the trainer can create new member accounts.</p>
            {packages.map((pkg) => (
              <div key={pkg.id} onClick={() => setSelectedPackage(pkg.name)}
                style={{ background: selectedPackage === pkg.name ? pkg.color : "#fff", border: `2px solid ${selectedPackage === pkg.name ? pkg.border : palette.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.25s ease" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: pkg.color, color: pkg.border, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{pkg.badge}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e1030" }}>{pkg.name}</h3>
                    {pkg.tag && <span style={{ background: pkg.border, color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{pkg.tag}</span>}
                  </div>
                  <p style={{ margin: 0, color: palette.textSoft, fontSize: 12 }}>{pkg.per}</p>
                </div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: palette.primaryDark }}>{pkg.price}</p>
              </div>
            ))}
            <div style={{ background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, borderRadius: 14, padding: 20, color: "#fff", marginTop: 16 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 15 }}>Visit Us</p>
              <p style={{ margin: "0 0 6px", opacity: 0.9, fontSize: 13, lineHeight: 1.6 }}>Ansari Building, Bageerath Colony Road, Green Lake Colony Rd, near Medplus</p>
              <p style={{ margin: "0 0 4px", opacity: 0.9, fontSize: 13 }}>Phone: +91 90149 44750</p>
              <p style={{ margin: "0 0 4px", opacity: 0.9, fontSize: 13 }}>Hours: 6:30 AM - 11:00 AM, 5:30 PM - 9:00 PM</p>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>Rating: 4.8/5</p>
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(108,63,196,0.1)" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#1e1030" }}>Trainer Approval Required</h2>
            <p style={{ color: palette.textSoft, fontSize: 13, marginBottom: 20 }}>Self-registration is disabled. The trainer is the only person who can add new members.</p>
            {selectedPackage && (
              <div style={{ background: palette.primarySoft, border: `1px solid ${palette.primary}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ color: palette.primaryDark, fontWeight: 700, fontSize: 13 }}>Selected: {selectedPackage}</span>
                <span style={{ color: palette.primaryDark, fontWeight: 800, fontSize: 15 }}>{packages.find((p) => p.name === selectedPackage)?.price}</span>
              </div>
            )}
            <div style={{ background: "#f8f6ff", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: `1px solid ${palette.border}` }}>
              <p style={{ margin: 0, fontSize: 12, color: palette.textSoft, lineHeight: 1.6 }}>Contact the trainer on WhatsApp to create your account and activate your membership.</p>
            </div>
            <a href={`https://wa.me/919014944750?text=${encodeURIComponent(`Hi, I want to join Just4You Ladies Gym${selectedPackage ? ` for the ${selectedPackage} package` : ""}. Please help me with membership.`)}`}
              target="_blank" rel="noreferrer"
              style={{ display: "block", textAlign: "center", padding: 15, borderRadius: 12, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 20px rgba(108,63,196,0.35)", marginBottom: 12 }}>
              💬 Contact Trainer on WhatsApp
            </a>
            <p style={{ textAlign: "center", color: palette.textSoft, fontSize: 13, marginTop: 14 }}>
              Already a member? <span onClick={onEnter} style={{ color: palette.primary, fontWeight: 700, cursor: "pointer" }}>Sign in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: "#1e1030", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        @media(max-width:768px){
          .desktop-only{display:none!important}
          .mobile-only{display:flex!important}
          .hero-cards{grid-template-columns:1fr!important}
          .hero-pad{padding:90px 20px 40px!important}
          .hero-title{font-size:38px!important;letter-spacing:-1px!important}
          .section-pad{padding:48px 20px!important}
          .grid-2{grid-template-columns:1fr!important}
          .grid-3{grid-template-columns:1fr!important}
          .grid-6{grid-template-columns:1fr 1fr!important}
          .trainer-grid{grid-template-columns:1fr!important}
          .footer-stack{grid-template-columns:1fr!important}
        }
        @media(min-width:769px){
          .mobile-only{display:none!important}
          .grid-6{grid-template-columns:repeat(3,1fr)!important}
        }
        .hover-lift{transition:transform 0.25s ease,box-shadow 0.25s ease!important}
        .hover-lift:hover{transform:translateY(-4px)!important;box-shadow:0 20px 50px rgba(108,63,196,0.18)!important}
        .hover-btn{transition:transform 0.2s ease,opacity 0.2s ease!important}
        .hover-btn:hover{transform:translateY(-2px)!important;opacity:0.9!important}
        .tea-card{transition:transform 0.25s ease,box-shadow 0.25s ease,border-color 0.2s ease!important}
        .tea-card:hover{transform:translateY(-5px)!important;box-shadow:0 24px 60px rgba(108,63,196,0.16)!important}
        .nav-link{transition:color 0.2s ease!important}
        .nav-link:hover{color:#6743a4!important}
        a,button{transition:all 0.2s ease!important}
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${palette.border}`, padding: "0 24px", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 24px rgba(122,93,176,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>J4Y</div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: palette.primaryDark }}>Just4You Ladies Gym</h1>
        </div>
        <div className="desktop-only" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[["Packages", "#packages"], ["About", "#about"], ["Contact", "#contact"]].map(([label, href]) => (
            <a key={label} href={href} className="nav-link" style={{ color: palette.textSoft, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{label}</a>
          ))}
          <button onClick={onTeaPage} className="hover-btn" style={{ padding: "9px 18px", borderRadius: 12, border: `2px solid ${palette.border}`, background: palette.primarySoft, color: palette.primaryDark, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>🍵 Tea Orders</button>
          <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ padding: "9px 18px", borderRadius: 12, border: `2px solid ${palette.primary}`, background: "transparent", color: palette.primary, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Talk to Trainer</button>
          <button onClick={onEnter} className="hover-btn" style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, boxShadow: "0 10px 18px rgba(103,67,164,0.16)" }}>Login</button>
        </div>
        <div className="mobile-only" style={{ gap: 6, alignItems: "center" }}>
          <button onClick={onTeaPage} style={{ padding: "8px 10px", borderRadius: 10, border: "none", background: palette.primarySoft, color: palette.primaryDark, fontWeight: 700, cursor: "pointer", fontSize: 11 }}>🍵 Tea</button>
          <button onClick={() => setShowSignup(true)} style={{ padding: "8px 10px", borderRadius: 10, border: "none", background: "#f6eeff", color: palette.primaryDark, fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Contact</button>
          <button onClick={onEnter} style={{ padding: "8px 10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Login</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80)", backgroundSize: "cover", backgroundPosition: "center top", filter: "brightness(0.22)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${palette.heroStart}ee 0%,${palette.heroEnd}aa 60%,transparent 100%)` }} />
        <div className="hero-pad" style={{ position: "relative", zIndex: 1, padding: "110px 48px 60px", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
          <div className="hero-cards" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 48, alignItems: "center" }}>

            {/* LEFT — Gym info */}
            <div>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "6px 16px", borderRadius: 30, fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
                🌸 Women only fitness and wellness in Mahbubnagar
              </div>
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 800, letterSpacing: 0.4 }}>
                Co-owned by trainer Amatul Farheen
              </p>
              <h1 className="hero-title" style={{ fontSize: 62, fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.0, letterSpacing: -2 }}>
                Just4You<br />Ladies Gym
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", margin: "0 0 10px", lineHeight: 1.7, maxWidth: 460 }}>
                A safe, empowering space for women with gym memberships, trainer support, and homemade wellness teas, co-owned by trainer Amatul Farheen.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", margin: "0 0 28px" }}>
                📍 Ansari Building, Bageerath Colony Road, near Medplus &nbsp;•&nbsp; 📞 +91 90149 44750
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
                <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ padding: "12px 24px", borderRadius: 14, border: "none", background: "#fff", color: palette.primaryDark, fontWeight: 800, cursor: "pointer", fontSize: 14, boxShadow: "0 10px 24px rgba(48,24,92,0.16)" }}>Talk to Trainer</button>
                <button onClick={onTeaPage} className="hover-btn" style={{ padding: "12px 20px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>🍵 View Teas</button>
              </div>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {[["4.8/5", "Google Rating"], ["100%", "Ladies Only"], ["3+", "Years"], ["Bageerath Colony", "Mahbubnagar"]].map(([val, label]) => (
                  <div key={label}>
                    <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#fff" }}>{val}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.66)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Combined login card */}
            <div className="hover-lift" style={{ background: "rgba(255,255,255,0.13)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 28, padding: 28 }}>

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
                <h3 style={{ margin: "0 0 4px", color: "#fff", fontSize: 19, fontWeight: 900 }}>Member & Trainer Portal</h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Login → Goes to your personal dashboard</p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.15)", marginBottom: 18 }} />

              {/* Member features */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>👩 FOR MEMBERS</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[["⚖️", "BMI"], ["🏋️", "Workouts"], ["📊", "Progress"]].map(([icon, label]) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 600 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trainer features */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>👩‍💼 FOR TRAINER</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[["👥", "Members"], ["💳", "Fees"], ["📅", "Attend"]].map(([icon, label]) => (
                    <div key={label} style={{ background: "rgba(103,67,164,0.35)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 600 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "center" }}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.6 }}>
                  Trainer login → Full dashboard 👩‍💼<br />Member login → Personal profile 👩
                </p>
              </div>

              {/* Single login button */}
              <button onClick={onEnter} className="hover-btn" style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "#fff", color: palette.primaryDark, fontWeight: 800, cursor: "pointer", fontSize: 15, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", marginBottom: 10 }}>
                Login to Your Account →
              </button>

              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>
                New member?{" "}
                <span onClick={() => setShowSignup(true)} style={{ color: "#fff", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                  Contact trainer
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WELLNESS OPTIONS */}
      <div className="section-pad" style={{ padding: "56px 48px", background: "#fff7fb" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ background: "#fce7f3", color: "#be185d", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>WELLNESS OPTIONS</span>
            <h2 style={{ fontSize: 34, fontWeight: 900, margin: "14px 0 10px", color: "#1e1030" }}>Choose Your Wellness Path</h2>
            <p style={{ color: palette.textSoft, fontSize: 15, margin: 0 }}>Gym memberships and homemade wellness teas — all in one place.</p>
          </div>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="hover-lift" style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 22, padding: 28, boxShadow: "0 10px 30px rgba(108,63,196,0.08)" }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: "#f3f0ff", color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, marginBottom: 12 }}>GYM</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#1e1030" }}>Ladies Gym</h3>
              <p style={{ margin: "0 0 18px", color: palette.textSoft, fontSize: 14, lineHeight: 1.8 }}>Memberships, daily workouts, BMI tracking, attendance, and one-to-one trainer support.</p>
              <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ padding: "12px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Talk to Trainer</button>
            </div>
            <div className="hover-lift" style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 22, padding: 28, boxShadow: "0 10px 30px rgba(122,93,176,0.08)" }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: palette.primarySoft, color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, marginBottom: 12 }}>TEA</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#1e1030" }}>Homemade Wellness Teas</h3>
              <p style={{ margin: "0 0 18px", color: palette.textSoft, fontSize: 14, lineHeight: 1.8 }}>5 homemade wellness teas — green, blue, pink, meetha pan, and hormonal + multivitamin.</p>
              <button onClick={onTeaPage} className="hover-btn" style={{ display: "inline-block", padding: "12px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Open Tea Page</button>
            </div>
          </div>
        </div>
      </div>

      {/* TEA PREVIEW */}
      <div id="tea-shop" className="section-pad" style={{ padding: "80px 48px", background: "linear-gradient(180deg,#fbf7ff 0%,#f7efff 100%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: palette.primarySoft, color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>TEA SHOP</span>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: "14px 0 10px", color: "#1e1030" }}>Trainer's Homemade Teas</h2>
            <p style={{ color: palette.textSoft, fontSize: 15, margin: 0 }}>5 handcrafted wellness blends — order from the dedicated tea page.</p>
          </div>
          <div className="grid-6" style={{ display: "grid", gap: 16, marginBottom: 28 }}>
            {teaProducts.map((tea) => (
              <div key={tea.id} className="tea-card hover-lift" style={{ background: "#fcf9ff", border: `1px solid ${palette.border}`, borderRadius: 22, padding: 22, boxShadow: "0 8px 24px rgba(122,93,176,0.08)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -16, top: -16, width: 80, height: 80, borderRadius: "50%", background: "rgba(142,107,204,0.07)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: tea.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 12, border: `1px solid ${palette.border}` }}>{tea.emoji}</div>
                  <div style={{ background: palette.primarySoft, color: palette.primaryDark, borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 700, display: "inline-block", marginBottom: 8 }}>{tea.mood}</div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#1e1030" }}>{tea.name}</h3>
                  <p style={{ margin: "0 0 12px", color: palette.textSoft, fontSize: 12, lineHeight: 1.6 }}>{tea.note}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: palette.primary }}>{tea.price}</span>
                    <button onClick={onTeaPage} className="hover-btn" style={{ padding: "7px 14px", borderRadius: 10, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", border: "none", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Order</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: `linear-gradient(135deg,${palette.heroStart},${palette.heroEnd})`, borderRadius: 24, padding: 24, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 18px 40px rgba(122,93,176,0.16)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.86, marginBottom: 6 }}>READY TO ORDER?</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Visit the dedicated tea page</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Fill details, review total, and order online or by WhatsApp.</div>
            </div>
            <button onClick={onTeaPage} className="hover-btn" style={{ padding: "14px 22px", borderRadius: 16, border: "none", background: "#fff", color: palette.primaryDark, fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 12px 24px rgba(48,24,92,0.14)" }}>
              Open Tea Page →
            </button>
          </div>
        </div>
      </div>

      {/* PACKAGES */}
      <div id="packages" className="section-pad" style={{ padding: "80px 48px", background: "#f8f6ff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ background: "#f3f0ff", color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>MEMBERSHIP PLANS</span>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: "14px 0 10px", color: "#1e1030" }}>Choose Your Package</h2>
            <p style={{ color: palette.textSoft, fontSize: 15 }}>Simple, transparent pricing with no hidden fees.</p>
          </div>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {packages.map((pkg, i) => (
              <div key={pkg.id} className="hover-lift" style={{ background: "#fff", border: i === 2 ? `2px solid ${palette.primaryDark}` : `1px solid ${palette.border}`, borderRadius: 20, padding: "28px 22px", textAlign: "center", boxShadow: i === 2 ? "0 12px 48px rgba(108,63,196,0.15)" : "0 4px 20px rgba(108,63,196,0.06)", position: "relative" }}>
                {pkg.tag && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{pkg.tag}</div>}
                <div style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: 16, background: pkg.color, color: pkg.border, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 }}>{pkg.badge}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#1e1030" }}>{pkg.name}</h3>
                <p style={{ color: palette.textSoft, fontSize: 12, margin: "0 0 16px" }}>{pkg.duration}</p>
                <span style={{ fontSize: 36, fontWeight: 900, color: palette.primaryDark }}>{pkg.price}</span>
                <p style={{ color: palette.textSoft, fontSize: 12, margin: "6px 0 20px" }}>{pkg.per}</p>
                <div style={{ textAlign: "left", marginBottom: 24 }}>
                  {(pkg.id === "personal"
                    ? ["All equipment", "Daily workouts", "BMI tracking", "One-to-one trainer support"]
                    : ["All equipment", "Daily workouts", "BMI tracking", i >= 1 ? "Trainer support" : null, i >= 2 ? "Protein included" : null, i >= 2 ? "Nutrition guide" : null]
                  ).filter(Boolean).map((feat) => (
                    <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#f3f0ff", color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 10 }}>✓</div>
                      <span style={{ fontSize: 12, color: "#1e1030" }}>{feat}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: i === 2 ? `linear-gradient(135deg,${palette.primary},${palette.primaryDark})` : "#f3f0ff", color: i === 2 ? "#fff" : palette.primaryDark, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                  Ask About This Plan
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: palette.textSoft, fontSize: 14, marginTop: 24 }}>Call us: <strong style={{ color: palette.primaryDark }}>+91 90149 44750</strong></p>
        </div>
      </div>

      {/* ABOUT */}
      <div id="about" className="section-pad" style={{ padding: "80px 48px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="trainer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <span style={{ background: "#f3f0ff", color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ABOUT US</span>
              <h2 style={{ fontSize: 36, fontWeight: 900, margin: "14px 0 14px", lineHeight: 1.1, color: "#1e1030" }}>Mahbubnagar's Most <span style={{ color: palette.primaryDark }}>Trusted</span> Ladies Gym</h2>
              <p style={{ color: palette.textSoft, fontSize: 14, lineHeight: 1.9, marginBottom: 24 }}>Just4You is a women-only fitness facility in Bageerath Colony, Mahbubnagar, co-owned by trainer Amatul Farheen. Safe, motivating, and empowering.</p>
              {["100% ladies-only", "Certified female trainers", "Modern equipment", "4.8/5 Google rating", "Bageerath Colony, Mahbubnagar"].map((text) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3f0ff", color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#1e1030" }}>{text}</span>
                </div>
              ))}
            </div>
            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80", "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80", "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=400&q=80"].map((img, i) => (
                <div key={i} className="hover-lift" style={{ borderRadius: 14, overflow: "hidden", height: 140 }}>
                  <img src={img} alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRAINER */}
      <div className="section-pad" style={{ padding: "80px 48px", background: "#f8f6ff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="trainer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div className="hover-lift" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 60px rgba(108,63,196,0.15)", height: 340 }}>
              <img src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80" alt="Trainer" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <span style={{ background: "#f3f0ff", color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>YOUR TRAINER</span>
              <h2 style={{ fontSize: 32, fontWeight: 900, margin: "14px 0 12px", lineHeight: 1.1, color: "#1e1030" }}>Expert Guidance <span style={{ color: palette.primaryDark }}>Just For You</span></h2>
              <p style={{ color: palette.textSoft, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>Certified female trainer and co-owner Amatul Farheen, dedicated to helping every member reach their fitness goals safely.</p>
              {["Certified fitness trainer", "Women's fitness specialist", "Weight loss and toning expert", "Nutrition guidance"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800 }}>✓</div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#1e1030" }}>{item}</span>
                </div>
              ))}
              <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ marginTop: 20, padding: "13px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, boxShadow: "0 4px 20px rgba(108,63,196,0.35)" }}>Train With Us</button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="section-pad" style={{ padding: "80px 48px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: "#f3f0ff", color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>REVIEWS</span>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: "14px 0 8px", color: "#1e1030" }}>What Members Say</h2>
            <p style={{ color: palette.textSoft, fontSize: 14 }}>Rated 4.8/5 on Google</p>
          </div>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[{ name: "Sneha R.", text: "Best gym in Mahbubnagar. Lost 8kg in 3 months. The trainer is so supportive." }, { name: "Divya K.", text: "I love the ladies-only environment. It feels safe, comfortable, and motivating." }, { name: "Meera P.", text: "The protein package is worth it. Great results and a very helpful trainer." }].map((t) => (
              <div key={t.name} className="hover-lift" style={{ background: "#f8f6ff", border: `1px solid ${palette.border}`, borderRadius: 18, padding: 22 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}</div>
                <p style={{ color: "#1e1030", fontSize: 13, lineHeight: 1.7, margin: "0 0 16px", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{t.name[0]}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e1030" }}>{t.name}</p>
                    <p style={{ margin: 0, color: palette.textSoft, fontSize: 11 }}>Just4You Member</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" className="section-pad" style={{ padding: "80px 48px", background: "#f8f6ff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="trainer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <span style={{ background: "#f3f0ff", color: palette.primaryDark, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>FIND US</span>
              <h2 style={{ fontSize: 36, fontWeight: 900, margin: "14px 0 14px", lineHeight: 1.1, color: "#1e1030" }}>Visit <span style={{ color: palette.primaryDark }}>Just4You</span></h2>
              <p style={{ color: palette.textSoft, fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>Come for a free consultation. We would love to welcome you.</p>
              {[["Address", "Ansari Building, Bageerath Colony Road, Green Lake Colony Rd, near Medplus"], ["Landmark", "Near Medplus"], ["Phone", "+91 90149 44750"], ["Hours", "Morning: 6:30 AM - 11:00 AM • Evening: 5:30 PM - 9:00 PM"], ["Rating", "4.8 / 5 on Google"]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 36, borderRadius: 10, background: "#f3f0ff", color: palette.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{label.slice(0, 4).toUpperCase()}</div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: palette.textSoft, fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: "#1e1030" }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hover-lift" style={{ background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, borderRadius: 20, padding: 36, textAlign: "center", color: "#fff", boxShadow: "0 24px 80px rgba(108,63,196,0.25)" }}>
              <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px" }}>Ready to Start?</h3>
              <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>Join Mahbubnagar's trusted ladies gym through trainer approval.</p>
              <button onClick={() => setShowSignup(true)} className="hover-btn" style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#fff", color: palette.primaryDark, fontWeight: 800, cursor: "pointer", fontSize: 15, marginBottom: 10 }}>Contact Trainer</button>
              <button onClick={onEnter} className="hover-btn" style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Already a Member? Login</button>
              <div style={{ marginTop: 20, padding: 14, background: "rgba(255,255,255,0.15)", borderRadius: 10 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.85 }}>Call us directly</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>+91 90149 44750</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: "#0f0720", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="footer-stack" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${palette.primary},${palette.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>J4Y</div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 900 }}>Just4You Ladies Gym</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>Mahbubnagar's women-only fitness and wellness destination.</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 10 }}>+91 90149 44750</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Bageerath Colony, Mahbubnagar</p>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 14, fontSize: 13 }}>Packages</h4>
              {["Monthly - Rs. 1,300", "3 Months - Rs. 3,300", "Protein - Rs. 5,500"].map((link) => (
                <p key={link} style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{link}</p>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 14, fontSize: 13 }}>Members</h4>
              <p style={{ margin: "0 0 8px" }}><span onClick={onEnter} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Member Login</span></p>
              <p style={{ margin: "0 0 8px" }}><span onClick={() => setShowSignup(true)} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Contact Trainer</span></p>
              <p style={{ margin: "0 0 8px" }}><span onClick={onTeaPage} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Tea Orders</span></p>
              <h4 style={{ color: "#fff", fontWeight: 700, margin: "16px 0 10px", fontSize: 13 }}>Hours</h4>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Daily: 6:30 AM - 11:00 AM and 5:30 PM - 9:00 PM</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>© 2026 Just4You Ladies Gym, Mahbubnagar.</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>Built for women-focused fitness and wellness.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
