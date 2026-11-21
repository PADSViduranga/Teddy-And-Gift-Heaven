import { Link } from "react-router-dom";
import { Lock, SearchX } from "lucide-react";
import { getSession } from "../utils/session";
import { HOME_BY_ROLE } from "./menus";
import "./AccessDenied.css";

// Page 02 – Access denied / page not found (Member 1).
// variant="denied" when the role may not open the page, variant="notfound" for an unknown address.
export default function AccessDenied({ variant = "denied" }) {
  const session = getSession();
  const home = session ? HOME_BY_ROLE[session.role] || "/" : "/";
  const denied = variant === "denied";
  const Icon = denied ? Lock : SearchX;

  return (
    <main className="ad">
      <div className="ad-card">
        <div className="ad-icon"><Icon size={40} strokeWidth={1.6} /></div>
        <p className="eyebrow">{denied ? "Error 403" : "Error 404"}</p>
        <h1>{denied ? "You don't have access to this page" : "We couldn't find that page"}</h1>
        <p className="text-muted">
          {denied
            ? "Your role doesn't include this page. If you think you need it, ask the owner to check your account."
            : "The address may be mistyped, or the page may have moved."}
        </p>
        <Link to={home} className="btn btn-primary ad-btn">Back to my home</Link>
      </div>
    </main>
  );
}
