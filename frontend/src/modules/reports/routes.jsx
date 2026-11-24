import OwnerDashboard from "./pages/OwnerDashboard";
import OrderStaffDashboard from "./pages/OrderStaffDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import PackerDashboard from "./pages/PackerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import SalesReport from "./pages/SalesReport";
import BestSellersReport from "./pages/BestSellersReport";
import SeasonalReport from "./pages/SeasonalReport";

// Member 10's pages. Paths must match shared/layout/menus.js.
export default [
  { path: "/staff/owner", element: <OwnerDashboard /> },
  { path: "/staff/order-staff", element: <OrderStaffDashboard /> },
  { path: "/staff/inventory", element: <InventoryDashboard /> },
  { path: "/staff/packer", element: <PackerDashboard /> },
  { path: "/staff/driver", element: <DriverDashboard /> },
  { path: "/staff/reports/sales", element: <SalesReport /> },
  { path: "/staff/reports/best-sellers", element: <BestSellersReport /> },
  { path: "/staff/reports/seasonal", element: <SeasonalReport /> },
];
