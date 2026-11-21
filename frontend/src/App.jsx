
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import client from "./shared/api/client";
import PricingPage from "./modules/pricing/pages/PricingPage";

function Landing() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    client.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("backend not reachable"));
  }, []);

  return (
    <main style={{ padding: 48 }}>
      <p className="eyebrow">Setup check</p>

      <h1>
        <span className="logo">Teddy &amp; Gift Heaven</span>
      </h1>

      <p className="text-muted">Fonts and colors are loaded.</p>

      <p>Backend status: {status}</p>

      <button className="btn btn-primary">Primary button</button>{" "}

      <span className="badge badge-success">In stock</span>
    </main>
  );
}

function Login() {
  return (
    <main style={{ padding: "48px" }}>
      <h1>Log in / Register</h1>
    </main>
  );
}

function NotFound() {
  return (
    <main style={{ padding: "48px" }}>
      <h1>Page not found</h1>
    </main>
  );
}

function Protected({ children }) {
  return localStorage.getItem("token")
    ? children
    : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/owner/pricing"
          element={
            <Protected>
              <PricingPage />
            </Protected>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
