import { useNavigate } from "react-router-dom";
import { setSession } from "../utils/session";
import { ROLE_LABELS, homePath } from "./menus";

// TEMPORARY: Member 2 replaces this page with real register / login.
export default function DevLogin() {
  const navigate = useNavigate();
  function enter(role) {
    setSession(role);
    navigate(homePath(role));
  }
  return (
    <main style={{ padding: 48, maxWidth: 520, margin: "0 auto" }}>
      <h1>Log in / Register</h1>
      <p style={{ color: "var(--text-muted)" }}>Temporary: pick a role to preview its menu.</p>
      <div style={{ display: "grid", gap: 12 }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <button key={role} className="btn-primary" onClick={() => enter(role)}>{label}</button>
        ))}
      </div>
    </main>
  );
}
