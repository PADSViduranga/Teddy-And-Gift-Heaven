import OwnerDashboard from "./pages/OwnerDashboard";
import OrderStaffDashboard from "./pages/OrderStaffDashboard";

// Member 10's pages. Paths must match shared/layout/menus.js.
export default [
  { path: "/staff/owner", element: <OwnerDashboard /> },
  { path: "/staff/order-staff", element: <OrderStaffDashboard /> },
];
