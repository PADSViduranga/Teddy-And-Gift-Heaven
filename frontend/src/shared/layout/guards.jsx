import { Navigate, matchPath, useLocation } from "react-router-dom";
import { getSession, STAFF_ROLES } from "../utils/session";
import { STAFF_PAGES } from "./menus";
import AccessDenied from "./AccessDenied";

// Staff pages: no login -> staff login. A customer token -> access denied.
export function RequireStaff({ children }) {
  const location = useLocation();
  const session = getSession();
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/staff/login?next=${next}`} replace />;
  }
  if (!STAFF_ROLES.includes(session.role)) return <AccessDenied />;
  return children;
}

// One staff page: only the roles listed for it in menus.js may open it.
export function RoleGate({ path, children }) {
  const session = getSession();
  const page = STAFF_PAGES.find((p) => p.path === path);
  if (!page || !page.roles.includes(session?.role)) return <AccessDenied />;
  return children;
}

// the menus.js entry for the current address (used for the page title)
export function usePageInfo() {
  const { pathname } = useLocation();
  // fixed addresses first, so /staff/orders/capacity isn't read as /staff/orders/:id
  const ordered = [...STAFF_PAGES].sort((a, b) => a.path.includes(":") - b.path.includes(":"));
  return ordered.find((p) => matchPath(p.path, pathname)) || null;
}
