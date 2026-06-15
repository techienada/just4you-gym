import { useState } from "react";
import { supabase } from "../supabase";
import { fetchTrainerAuth } from "../trainerAuth";

export default function Login({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const trainerAuth = await fetchTrainerAuth();

    if (username === trainerAuth.username && password === trainerAuth.password) {
      onLogin({ role: "trainer" });
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase
      .from("members")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (loginError || !data) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    if (data.role === "trainer") {
      onLogin({ role: "trainer" });
    } else {
      onLogin({ role: "member", data });
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f3f0ff,#f8f6ff,#ede8ff)", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI',sans-serif" }}>
      <style>{`
        @media(min-width:769px){
          .login-wrap{flex-direction:row!important}
          .login-left{display:flex!important}
          .login-right{padding:48px!important}
        }
        @media(max-width:768px){
          .login-left{display:none!important}
          .login-right{padding:32px 20px!important;min-height:100vh}
        }
      `}</style>

      <div className="login-wrap" style={{ display: "flex", flex: 1 }}>
        <div className="login-left" style={{ flex: 1, background: "linear-gradient(160deg,#9b7ed4,#6c3fc4)", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 64, marginBottom: 14 }}>🌸</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 8px" }}>Just4You</h1>
            <h2 style={{ fontSize: 18, fontWeight: 400, margin: "0 0 28px", opacity: 0.85 }}>Ladies Gym · Mahbubnagar</h2>
            <div style={{ width: 50, height: 2, background: "rgba(255,255,255,0.4)", margin: "0 auto 28px" }} />
            <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.7, maxWidth: 240 }}>Your fitness journey starts here. Track your progress, hit your goals. 💪</p>
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
              {["BMI & Weight Tracking", "Daily Workout Plans", "Fee & Membership Tracking", "Attendance Monitoring"].map((feature) => (
                <div key={feature} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.9 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
                  <span style={{ fontSize: 13 }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#9b7ed4", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0, fontWeight: 600 }}>← Back to Home</button>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e1030", marginBottom: 6 }}>Welcome back 👋</h2>
            <p style={{ color: "#7c6a9a", fontSize: 14, marginBottom: 28 }}>Sign in to your account</p>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#1e1030", display: "block", marginBottom: 6 }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "2px solid #e0d7f5", background: "#fff", color: "#1e1030", fontSize: 14, boxSizing: "border-box", marginBottom: 16 }}
            />

            <label style={{ fontSize: 12, fontWeight: 600, color: "#1e1030", display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "13px 46px 13px 16px", borderRadius: 12, border: "2px solid #e0d7f5", background: "#fff", color: "#1e1030", fontSize: 14, boxSizing: "border-box" }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9b7ed4", fontSize: 15 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 15, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#9b7ed4,#6c3fc4)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(108,63,196,0.35)" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
