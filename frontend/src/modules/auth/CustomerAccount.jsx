import { Link, useNavigate } from "react-router-dom";
import PublicHeader from "../../shared/layout/PublicHeader";
import { clearSession, getSession } from "../../shared/utils/session";

export default function CustomerAccount() {
  const navigate = useNavigate();
  return (
    <>
      <PublicHeader />
      <main className="auth-account">
        <h1>My account</h1>
        <p>Signed in as {getSession()?.name}</p>
        <Link to="/my-orders">My orders</Link>
        <button className="btn btn-outline" onClick={() => { clearSession(); navigate("/", { replace: true }); }}>
          Sign out
        </button>
      </main>
    </>
  );
}
