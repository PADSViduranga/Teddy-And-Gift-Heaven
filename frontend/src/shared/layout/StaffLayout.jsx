import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Heart, LogOut, Search } from "lucide-react";
import { clearSession } from "../utils/session";
import { menuFor, ROLE_LABEL } from "./menus";
import { usePageInfo, useStaffAccount } from "./staffContext";
import "./StaffLayout.css";

// The frame every staff page sits in: Deep Plum sidebar with the role's menu, white top bar.
export default function StaffLayout() {
  const navigate = useNavigate();
  const session = useStaffAccount();
  const page = usePageInfo();
  const groups = menuFor(session.role);
  const initials = (session.name || ROLE_LABEL[session.role] || "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  function logout() {
    clearSession();
    navigate("/staff/login", { replace: true });
  }

  return (
    <div className="sl">
      <aside className="sl-side">
        <div className="sl-logo">
          <span>Teddy &amp; Gift</span>
          <span>Heaven <Heart size={14} strokeWidth={2.5} /></span>
        </div>
        <nav className="sl-nav">
          {groups.map((g) => (
            <div key={g.section} className="sl-group">
              <p className="sl-section">{g.section}</p>
              {g.pages.map((p) => (
                <NavLink key={p.path} to={p.path} end
                  className={({ isActive }) => `sl-link${isActive ? " active" : ""}`}>
                  {p.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button type="button" className="sl-logout" onClick={logout}><LogOut size={16} /> Log out</button>
      </aside>

      <div className="sl-main">
        <header className="sl-top">
          <div className="sl-crumb">
            <span className="text-muted">{page?.section || "Staff"}</span>
            <strong>{page?.label || ""}</strong>
          </div>
          <div className="sl-search"><Search size={16} /><input type="search" placeholder="Search..." aria-label="Search" /></div>
          <div className="sl-user">
            {session.role !== "DRIVER" && (
              <NavLink to="/staff/notifications" className="sl-bell" aria-label="Notifications">
                <Bell size={20} /><span className="sl-dot" />
              </NavLink>
            )}
            <NavLink to="/staff/profile" className="sl-me">
              <span className="sl-avatar">{initials}</span>
              <span className="sl-me-text">
                <strong>{session.name || "Staff member"}</strong>
                <span className="badge badge-info">{ROLE_LABEL[session.role]}</span>
              </span>
            </NavLink>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}
