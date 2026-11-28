import CategoriesPage from "./pages/CategoriesPage";
import LossesPage from "./pages/LossesPage";
import LowStockPage from "./pages/LowStockPage";
import MovementsPage from "./pages/MovementsPage";
import PackagingPage from "./pages/PackagingPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductListPage from "./pages/ProductListPage";
import ReservationsPage from "./pages/ReservationsPage";
import StockAdjustPage from "./pages/StockAdjustPage";

// Member 4's staff pages (17-25). Paths must match shared/layout/menus.js exactly.
export default [
  { path: "/staff/products", element: <ProductListPage /> },
  { path: "/staff/products/new", element: <ProductFormPage /> },
  { path: "/staff/products/:id/edit", element: <ProductFormPage /> },
  { path: "/staff/categories", element: <CategoriesPage /> },
  { path: "/staff/stock/adjust", element: <StockAdjustPage /> },
  { path: "/staff/stock/losses", element: <LossesPage /> },
  { path: "/staff/packaging", element: <PackagingPage /> },
  { path: "/staff/stock/low", element: <LowStockPage /> },
  { path: "/staff/stock/movements", element: <MovementsPage /> },
  { path: "/staff/stock/reservations", element: <ReservationsPage /> },
];
