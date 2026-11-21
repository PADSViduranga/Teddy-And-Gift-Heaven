import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./modules/storefront/pages/LandingPage";
import RequireLogin from "./shared/layout/RequireLogin";

// Temporary stand-ins until Member 2 builds the login pages (03, 04, 69).
function LoginPlaceholder() {
  return <main style={{ padding: 48 }}><h1>Log in / Register</h1><p className="text-muted">Built by Member 2.</p></main>;
}
function NotBuiltYet() {
  return <main style={{ padding: 48 }}><h1>Not built yet</h1></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPlaceholder />} />
        {/* every other address needs a login */}
        <Route path="*" element={<RequireLogin><NotBuiltYet /></RequireLogin>} />
      </Routes>
    </BrowserRouter>
  );
}
