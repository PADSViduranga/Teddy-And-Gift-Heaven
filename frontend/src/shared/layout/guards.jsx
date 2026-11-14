import { Navigate } from "react-router-dom";
import { getSession } from "../utils/session";
import { allowedPaths } from "./menus";

export function RequireLogin({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

export function RoleGate({ path, children }) {
  const session = getSession();
  if (!allowedPaths(session.role).includes(path)) {
    return (
      <div>
        <h1>Access denied</h1>
        <p>Your role cannot open this page.</p>
      </div>
    );
  }
  return children;
}
