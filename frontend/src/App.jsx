import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import client from "./shared/api/client";

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

function Login() {
  return <main style={{ padding: "48px" }}><h1>Log in / Register</h1></main>;
}

function NotFound() {
  return <main style={{ padding: "48px" }}><h1>Page not found</h1></main>;
}

function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* every other page goes inside <Protected> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}