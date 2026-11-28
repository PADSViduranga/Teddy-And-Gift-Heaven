import { Navigate, useLocation } from "react-router-dom";
import { STAFF_ROLES } from "../utils/session";
import { STAFF_PAGES } from "./menus";
import AccessDenied from "./AccessDenied";
import useVerifiedSession from "./useVerifiedSession";
import { StaffAccount, useStaffAccount } from "./staffContext";

// Staff pages: no login -> staff login. A customer token -> access denied.
export function RequireStaff({ children }) {
  const location = useLocation();
  const { account, loading, error } = useVerifiedSession();
  if (loading) return <p role="status">Checking your session…</p>;
  if (error) return <p role="alert">Unable to verify your session. Reload to try again.</p>;
  if (!account) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/staff/login?next=${next}`} replace />;
  }
  if (!STAFF_ROLES.includes(account.role)) return <AccessDenied />;
  return <StaffAccount.Provider value={account}>{children}</StaffAccount.Provider>;
}

// One staff page: only the roles listed for it in menus.js may open it.
export function RoleGate({ path, children }) {
  const { role } = useStaffAccount();
  const page = STAFF_PAGES.find((p) => p.path === path);
  if (!page || !page.roles.includes(role)) return <AccessDenied />;
  return children;
}
