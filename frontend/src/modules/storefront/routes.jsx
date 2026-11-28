import ProductPage from "./pages/ProductPage";
import ShopPage from "./pages/ShopPage";

// Member 4's customer pages. Paths must match CUSTOMER_PAGES in App.jsx.
// (The landing page "/" is Member 1's and is added in App.jsx directly.)
export default [
  { path: "/shop", element: <ShopPage /> },
  { path: "/product/:id", element: <ProductPage /> },
];
