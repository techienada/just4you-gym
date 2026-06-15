import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import TrainerDashboard from "./components/TrainerDashboard";
import MemberDashboard from "./components/MemberDashboard";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import TeaOrderPage from "./components/TeaOrderPage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("landing");

  useEffect(() => {
    const saved = localStorage.getItem("just4you_user");
    if (saved) { setUser(JSON.parse(saved)); setPage("app"); }
  }, []);

  function handleLogin(userData) {
    localStorage.setItem("just4you_user", JSON.stringify(userData));
    setUser(userData); setPage("app");
  }

  function handleLogout() {
    localStorage.removeItem("just4you_user");
    setUser(null); setPage("landing");
  }

  if (page === "landing") return <LandingPage onEnter={() => setPage("login")} onTeaPage={() => setPage("tea")} />;
  if (page === "tea") return <TeaOrderPage onBack={() => setPage("landing")} onEnter={() => setPage("login")} />;
  if (page === "login") return <Login onLogin={handleLogin} onBack={() => setPage("landing")} />;
  if (user?.role === "trainer") return <TrainerDashboard onLogout={handleLogout} />;
  if (user?.role === "member") return <MemberDashboard member={user.data} onLogout={handleLogout} />;
}

export default App;
