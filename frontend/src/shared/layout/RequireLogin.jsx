import { Navigate, useLocation } from "react-router-dom";

// Visitors see only the landing page. Any other page sends them to the login,
// remembering where they wanted to go. Member 2 replaces the token check with the real one.
export default function RequireLogin({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
