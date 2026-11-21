// Every staff page: its address, page number, who may open it, and where it sits in the menu.
// The sidebar and the role check both read this list. To add a page, add one line here,
// then build it in your module and register the same path in your module's routes.jsx.
//
// Roles: O = OWNER, S = ORDER_STAFF, I = INVENTORY_MANAGER, P = PACKER, D = DRIVER

const O = "OWNER", S = "ORDER_STAFF", I = "INVENTORY_MANAGER", P = "PACKER", D = "DRIVER";

export const STAFF_PAGES = [
  // dashboards (Member 10)
  { no: 58, path: "/staff/owner",          label: "Dashboard", roles: [O], section: "Overview", menu: true },
  { no: 59, path: "/staff/order-staff",    label: "Dashboard", roles: [S], section: "Overview", menu: true },
  { no: 60, path: "/staff/inventory",      label: "Dashboard", roles: [I], section: "Overview", menu: true },
  { no: 61, path: "/staff/packer",         label: "Dashboard", roles: [P], section: "Overview", menu: true },
  { no: 62, path: "/staff/driver",         label: "Dashboard", roles: [D], section: "Overview", menu: true },
  { no: 16, path: "/staff/notifications",  label: "Notifications", roles: [O, S, I, P], section: "Overview", menu: true },

  // orders and payments (Members 5 and 6)
  { no: 34, path: "/staff/orders/confirm",  label: "Orders to confirm", roles: [O, S], section: "Orders", menu: true },
  { no: 29, path: "/staff/orders",          label: "Order list", roles: [O, S], section: "Orders", menu: true },
  { no: 30, path: "/staff/orders/:id",      label: "Order details", roles: [O, S], section: "Orders" },
  { no: 31, path: "/staff/orders/:id/edit", label: "Edit / cancel order", roles: [O, S], section: "Orders" },
  { no: 35, path: "/staff/payments",        label: "Payments", roles: [O, S], section: "Orders", menu: true },
  { no: 32, path: "/staff/orders/capacity", label: "Delivery date capacity", roles: [O], section: "Orders", menu: true },
  { no: 10, path: "/staff/customers",       label: "Customers", roles: [O, S], section: "Orders", menu: true },
  { no: 11, path: "/staff/customers/:id",   label: "Customer details", roles: [O, S], section: "Orders" },

  // inventory (Member 4)
  { no: 17, path: "/staff/products",            label: "Products", roles: [O, S, I], section: "Inventory", menu: true },
  { no: 18, path: "/staff/products/new",        label: "Add product", roles: [O, I], section: "Inventory" },
  { no: 18, path: "/staff/products/:id/edit",   label: "Edit product", roles: [O, I], section: "Inventory" },
  { no: 19, path: "/staff/categories",          label: "Categories", roles: [O, I], section: "Inventory", menu: true },
  { no: 20, path: "/staff/stock/adjust",        label: "Stock adjustment", roles: [O, I], section: "Inventory", menu: true },
  { no: 21, path: "/staff/stock/losses",        label: "Damaged / lost / returned", roles: [O, S, I, P], section: "Inventory", menu: true },
  { no: 22, path: "/staff/packaging",           label: "Packaging materials", roles: [O, I, P], section: "Inventory", menu: true },
  { no: 23, path: "/staff/stock/low",           label: "Low-stock alerts", roles: [O, I], section: "Inventory", menu: true },
  { no: 24, path: "/staff/stock/movements",     label: "Stock movements", roles: [O, I], section: "Inventory", menu: true },
  { no: 25, path: "/staff/stock/reservations",  label: "Online reservations", roles: [O, I], section: "Inventory", menu: true },

  // pricing (Member 6)
  { no: 36, path: "/staff/personalization", label: "Personalization options", roles: [O], section: "Pricing", menu: true },
  { no: 37, path: "/staff/discounts",       label: "Discounts", roles: [O], section: "Pricing", menu: true },
  { no: 38, path: "/staff/price-history",   label: "Price history", roles: [O], section: "Pricing", menu: true },

  // packing (Member 7)
  { no: 42, path: "/staff/packing",            label: "Packing queue", roles: [O, P], section: "Packing", menu: true },
  { no: 43, path: "/staff/packing/:id",        label: "Packing details", roles: [O, P], section: "Packing" },
  { no: 44, path: "/staff/packing/:id/status", label: "Status update", roles: [O, P], section: "Packing" },

  // delivery (Member 8)
  { no: 45, path: "/staff/deliveries",                label: "Delivery list", roles: [O], section: "Delivery", menu: true },
  { no: 46, path: "/staff/deliveries/:id/assign",     label: "Assign driver", roles: [O], section: "Delivery" },
  { no: 47, path: "/staff/my-deliveries",             label: "My deliveries", roles: [D], section: "Delivery", menu: true },
  { no: 48, path: "/staff/my-deliveries/:id/confirm", label: "Confirm delivery", roles: [D, O], section: "Delivery" },
  { no: 49, path: "/staff/my-deliveries/:id/failed",  label: "Failed delivery", roles: [D, O], section: "Delivery" },
  { no: 50, path: "/staff/drivers",                   label: "Drivers", roles: [O], section: "Delivery", menu: true },
  { no: 51, path: "/staff/deliveries/stats",          label: "Delivery statistics", roles: [O], section: "Delivery", menu: true },

  // suppliers (Member 9)
  { no: 52, path: "/staff/suppliers",               label: "Suppliers", roles: [O, I], section: "Suppliers", menu: true },
  { no: 53, path: "/staff/purchase-orders/new",     label: "Create purchase order", roles: [O, I], section: "Suppliers" },
  { no: 54, path: "/staff/purchase-orders",         label: "Purchase orders", roles: [O, I], section: "Suppliers", menu: true },
  { no: 55, path: "/staff/purchase-orders/receive", label: "Receive stock", roles: [O, I], section: "Suppliers", menu: true },
  { no: 56, path: "/staff/suppliers/compare",       label: "Price comparison", roles: [O, I], section: "Suppliers", menu: true },
  { no: 57, path: "/staff/reorder",                 label: "Reorder suggestions", roles: [O, I], section: "Suppliers", menu: true },

  // reports (Member 10)
  { no: 63, path: "/staff/reports/sales",        label: "Online sales", roles: [O], section: "Reports", menu: true },
  { no: 64, path: "/staff/reports/best-sellers", label: "Best sellers & slow stock", roles: [O], section: "Reports", menu: true },
  { no: 65, path: "/staff/reports/seasonal",     label: "Seasonal demand", roles: [O], section: "Reports", menu: true },
  { no: 66, path: "/staff/reports/customers",    label: "Customer report", roles: [O], section: "Reports", menu: true },
  { no: 67, path: "/staff/reports/stock-loss",   label: "Stock & loss", roles: [O, I], section: "Reports", menu: true },
  { no: 68, path: "/staff/reports/payments",     label: "Payment report", roles: [O], section: "Reports", menu: true },

  // administration (Members 2 and 3)
  { no: 8,  path: "/staff/users",   label: "Users", roles: [O], section: "Administration", menu: true },
  { no: 9,  path: "/staff/roles",   label: "Role permissions", roles: [O], section: "Administration", menu: true },
  { no: 12, path: "/staff/audit",   label: "Audit log", roles: [O], section: "Administration", menu: true },
  { no: 13, path: "/staff/backup",  label: "Backup & restore", roles: [O], section: "Administration", menu: true },
  { no: 7,  path: "/staff/profile", label: "My profile", roles: [O, S, I, P, D], section: "Account" },
];

// where each role lands after logging in
export const HOME_BY_ROLE = {
  OWNER: "/staff/owner",
  ORDER_STAFF: "/staff/order-staff",
  INVENTORY_MANAGER: "/staff/inventory",
  PACKER: "/staff/packer",
  DRIVER: "/staff/driver",
  CUSTOMER: "/shop",
};

export const ROLE_LABEL = {
  OWNER: "Owner",
  ORDER_STAFF: "Order staff",
  INVENTORY_MANAGER: "Inventory manager",
  PACKER: "Packer",
  DRIVER: "Driver",
  CUSTOMER: "Customer",
};

// menu for one role, grouped by section, in the order above
export function menuFor(role) {
  const groups = [];
  STAFF_PAGES.filter((p) => p.menu && p.roles.includes(role)).forEach((p) => {
    let g = groups.find((x) => x.section === p.section);
    if (!g) groups.push((g = { section: p.section, pages: [] }));
    g.pages.push(p);
  });
  return groups;
}
