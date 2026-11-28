import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, Sparkles } from "lucide-react";
import { Link, matchPath, useNavigate, useSearchParams } from "react-router-dom";
import client from "../../shared/api/client";
import { HOME_BY_ROLE, STAFF_PAGES } from "../../shared/layout/menus";
import { saveSession } from "../../shared/utils/session";
import "./auth.css";

const COPY = {
  CUSTOMER: ["Welcome back", "Sign in to shop, follow orders, and save your favourite gifts."],
  STAFF: ["Staff sign in", "Use your staff account to open your work dashboard."],
  ADMIN: ["Owner sign in", "Use your owner account to open the administration dashboard."],
};

function destination(role, next) {
  if (next && /^\/(?![/\\])/.test(next)) {
    const url = new URL(next, window.location.origin);
    if (url.origin === window.location.origin) {
      if (role === "CUSTOMER" && !/^\/(staff|admin|login|register)(\/|$)/i.test(url.pathname)) return next;
      const page = STAFF_PAGES.find((entry) => entry.path === url.pathname)
        || STAFF_PAGES.find((entry) => matchPath(entry.path, url.pathname));
      if (page?.roles.includes(role)) return next;
    }
  }
  return HOME_BY_ROLE[role];
}

export default function AuthPage({ portal = "CUSTOMER", register = false }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const next = search.get("next");
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [heading, description] = register
    ? ["Create your account", "Save your favourites and keep track of the gifts you send."]
    : COPY[portal];

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    fields.email = fields.email.trim();
    if (register && new TextEncoder().encode(fields.password).length > 72) {
      setError("Use a password that is at most 72 UTF-8 bytes.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await client.post(register ? "/auth/register" : "/auth/login",
        register ? { ...fields, name: fields.name.trim(), phone: fields.phone.trim() } : { ...fields, portal });
      saveSession(data);
      navigate(destination(data.role, next), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError("We couldn’t sign you in. Check your details and sign-in page, then try again.");
      else if (status === 409) setError("An account already uses this email. Sign in to continue.");
      else if (status === 400) setError("Check the form details and try again.");
      else setError("We couldn’t connect right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-top">
        <Link className="auth-back" to="/"><ArrowLeft size={17} /> Home</Link>
        <Link className="auth-logo" to="/">Teddy &amp; Gift Heaven <Heart size={16} /></Link>
      </header>
      <div className="auth-card">
        <aside className="auth-cover">
          <div className="auth-art" aria-hidden="true">
            <Sparkles className="auth-sparkle" size={38} strokeWidth={1.2} />
            <Heart className="auth-heart" size={29} strokeWidth={1.2} />
            <div className="auth-present"><span /><i /></div>
          </div>
          <p>Good things<br />come wrapped.</p>
        </aside>
        <section className="auth-panel" aria-labelledby="auth-heading">
          <h1 id="auth-heading">{heading}</h1>
          <p className="auth-intro">{description}</p>
          <form onSubmit={submit} aria-busy={busy}>
            {register && <label>Full name<input name="name" autoComplete="name" maxLength={120} required /></label>}
            <label>Email address<input name="email" type="email" autoComplete="username" maxLength={150} required /></label>
            {register && (
              <label>Phone number<input name="phone" type="tel" autoComplete="tel" minLength={9}
                maxLength={15} pattern="[+0-9 ]{9,15}" placeholder="+94 77 123 4567" required /></label>
            )}
            <div className="auth-password">
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" name="password" type={visible ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"} minLength={register ? 12 : undefined}
                maxLength={72} aria-describedby={register ? "auth-password-hint" : undefined} required />
              <button className="auth-reveal" type="button" onClick={() => setVisible(!visible)}
                aria-label={visible ? "Hide password" : "Show password"}>
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {register && <p className="auth-hint" id="auth-password-hint">Use at least 12 characters.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"} <ArrowRight size={18} />
            </button>
          </form>
          {portal === "CUSTOMER" && (
            <p className="auth-switch">
              {register ? "Already have an account? " : "New to Teddy & Gift Heaven? "}
              <Link to={`${register ? "/login" : "/register"}${nextQuery}`}>{register ? "Sign in" : "Create an account"}</Link>
            </p>
          )}
        </section>
      </div>
      <footer className="auth-footer">
        {portal !== "CUSTOMER" && <Link to="/login">Customer sign in</Link>}
        {portal !== "STAFF" && <Link to="/staff/login">Staff sign in</Link>}
        {portal !== "ADMIN" && portal !== "CUSTOMER" && <Link to="/admin/login">Owner sign in</Link>}
      </footer>
    </main>
  );
}
