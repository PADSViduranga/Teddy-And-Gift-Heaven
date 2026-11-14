import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import client from "./shared/api/client";
import Layout from "./shared/layout/Layout";
import DevLogin from "./shared/layout/DevLogin";
import Placeholder from "./shared/layout/Placeholder";
import { RequireLogin, RoleGate } from "./shared/layout/guards";
import { ALL_PAGES } from "./shared/layout/menus";

function Landing() {
  const [status, setStatus] = useState("checking...");
  useEffect(() => {
    client.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("backend not reachable"));
  }, []);
  return (
    <main style={{ padding: "48px", maxWidth: 720, margin: "0 auto" }}>
      <h1>Teddy and Gift Heaven</h1>
      <p>Teddies and gifts, personalized and delivered.</p>
      <Link to="/login"><button className="btn-primary">Log in / Register</button></Link>
      <p style={{ color: "var(--text-muted)", marginTop: 32 }}>Backend status: {status}</p>
    </main>
  );
}

function NotFound() {
  return <main style={{ padding: 48 }}><h1>Page not found</h1></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<DevLogin />} />
        <Route element={<RequireLogin><Layout /></RequireLogin>}>
          {ALL_PAGES.map((p) => (
            <Route key={p.path} path={p.path}
              element={<RoleGate path={p.path}><Placeholder title={p.label} /></RoleGate>} />
          ))}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
