import AuthPage from "./AuthPage";
import CustomerAccount from "./CustomerAccount";

export default [
  { path: "/login", element: <AuthPage key="customer" /> },
  { path: "/register", element: <AuthPage key="register" register /> },
  { path: "/staff/login", element: <AuthPage key="staff" portal="STAFF" /> },
  { path: "/admin/login", element: <AuthPage key="admin" portal="ADMIN" /> },
  { path: "/account", element: <CustomerAccount /> },
];
