import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/session";
import { MENUS, ROLE_LABELS } from "./menus";
import "./Layout.css";

export default function Layout() {
  const session = getSession();
  const navigate = useNavigate();
  const menu = MENUS[session.role] || [];

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">Teddy and Gift Heaven</span>
        <span className="app-role">{ROLE_LABELS[session.role]}</span>
        <button className="app-logout" onClick={logout}>Log out</button>
      </header>
      <div className="app-body">
        <nav className="app-nav">
          {menu.map((m) => (
            <NavLink key={m.path} to={m.path} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
