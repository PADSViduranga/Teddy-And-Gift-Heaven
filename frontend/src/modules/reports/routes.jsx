import OwnerDashboard from "./pages/OwnerDashboard";
import OrderStaffDashboard from "./pages/OrderStaffDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import PackerDashboard from "./pages/PackerDashboard";

// Member 10's pages. Paths must match shared/layout/menus.js.
export default [
  { path: "/staff/owner", element: <OwnerDashboard /> },
  { path: "/staff/order-staff", element: <OrderStaffDashboard /> },
  { path: "/staff/inventory", element: <InventoryDashboard /> },
  { path: "/staff/packer", element: <PackerDashboard /> },
];
