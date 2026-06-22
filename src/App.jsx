import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";

const TrainerDashboard = lazy(() => import("./components/TrainerDashboard"));
const MemberDashboard = lazy(() => import("./components/MemberDashboard"));
const Login = lazy(() => import("./components/Login"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const TeaOrderPage = lazy(() => import("./components/TeaOrderPage"));

function AppShellLoader() {
  return (
    <div className="app-shell-loader">
      <div className="app-shell-loader__card">
        <div className="app-shell-loader__dot" />
        <p>Loading Just4You...</p>
      </div>
    </div>
  );
}

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

  return (
    <Suspense fallback={<AppShellLoader />}>
      {page === "landing" && <LandingPage onEnter={() => setPage("login")} onTeaPage={() => setPage("tea")} />}
      {page === "tea" && <TeaOrderPage onBack={() => setPage("landing")} onEnter={() => setPage("login")} />}
      {page === "login" && <Login onLogin={handleLogin} onBack={() => setPage("landing")} />}
      {page === "app" && user?.role === "trainer" && <TrainerDashboard onLogout={handleLogout} />}
      {page === "app" && user?.role === "member" && <MemberDashboard member={user.data} onLogout={handleLogout} />}
    </Suspense>
  );
}

export default App;
