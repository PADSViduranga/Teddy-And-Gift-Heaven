import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./modules/storefront/pages/LandingPage";
import RequireLogin from "./shared/layout/RequireLogin";
import { RequireStaff, RoleGate } from "./shared/layout/guards";
import StaffLayout from "./shared/layout/StaffLayout";
import Placeholder from "./shared/layout/Placeholder";
import AccessDenied from "./shared/layout/AccessDenied";
import { STAFF_PAGES } from "./shared/layout/menus";
import "./shared/components/staff.css";

// Each member lists their finished pages in src/modules/<module>/routes.jsx:
//   export default [{ path: "/staff/products", element: <ProductListPage /> }];
// The path must match menus.js (staff pages) or CUSTOMER_PAGES / LOGIN_PAGES below.
const moduleFiles = import.meta.glob("./modules/*/routes.jsx", { eager: true });
const REAL = {};
Object.values(moduleFiles).forEach((m) => (m.default || []).forEach((r) => { REAL[r.path] = r.element; }));

// public login pages (Member 2): 03 customer, 04 staff, 69 admin
const LOGIN_PAGES = ["/login", "/register", "/staff/login", "/admin/login"];

// customer pages: need a customer login
const CUSTOMER_PAGES = [
  "/shop", "/product/:id", "/cart", "/checkout", "/order-confirmation/:id",   // Members 4, 5
  "/upload-slip/:id",                                                         // Member 6
  "/my-orders", "/my-orders/:id", "/track/:id",                               // Member 7
  "/account", "/recipients", "/wishlist", "/notifications",                   // Member 2 (+ open questions)
];

function NotBuiltYet({ title }) {
  return <main style={{ padding: 48 }}><h1>{title}</h1><p className="text-muted">This page hasn't been built yet.</p></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {LOGIN_PAGES.map((p) => (
          <Route key={p} path={p} element={REAL[p] || <NotBuiltYet title="Log in" />} />
        ))}

        {CUSTOMER_PAGES.map((p) => (
          <Route key={p} path={p} element={<RequireLogin>{REAL[p] || <NotBuiltYet title={p} />}</RequireLogin>} />
        ))}

        <Route element={<RequireStaff><StaffLayout /></RequireStaff>}>
          {STAFF_PAGES.map((p) => (
            <Route key={p.path} path={p.path}
              element={<RoleGate path={p.path}>{REAL[p.path] || <Placeholder />}</RoleGate>} />
          ))}
        </Route>

        <Route path="*" element={<AccessDenied variant="notfound" />} />
      </Routes>
    </BrowserRouter>
  );
}
