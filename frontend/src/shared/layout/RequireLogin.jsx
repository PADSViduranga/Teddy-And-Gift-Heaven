import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../utils/session";

// Customer pages: visitors are sent to the customer login, which brings them back afterwards.
export default function RequireLogin({ children }) {
  const location = useLocation();
  if (!getSession()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
