import { Navigate, useLocation } from "react-router-dom";
import AccessDenied from "./AccessDenied";
import useVerifiedSession from "./useVerifiedSession";

// Customer pages: visitors are sent to the customer login, which brings them back afterwards.
export default function RequireLogin({ children }) {
  const location = useLocation();
  const { account, loading, error } = useVerifiedSession();
  if (loading) return <p role="status">Checking your session…</p>;
  if (error) return <p role="alert">Unable to verify your session. Reload to try again.</p>;
  if (!account) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (account.role !== "CUSTOMER") return <AccessDenied />;
  return children;
}
