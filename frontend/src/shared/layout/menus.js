export const ROLE_LABELS = {
  CUSTOMER: "Customer",
  ORDER_STAFF: "Order staff",
  INVENTORY_MANAGER: "Inventory manager",
  PACKER: "Packer",
  DRIVER: "Driver",
  OWNER: "Owner",
};

export const MENUS = {
  CUSTOMER: [
    { label: "Shop", path: "/shop" },
    { label: "Cart", path: "/cart" },
    { label: "My orders", path: "/my-orders" },
    { label: "Track order", path: "/track" },
    { label: "My account", path: "/account" },
  ],
  ORDER_STAFF: [
    { label: "Dashboard", path: "/staff/dashboard" },
    { label: "Orders to confirm", path: "/staff/orders-to-confirm" },
    { label: "Orders", path: "/staff/orders" },
    { label: "Payments", path: "/staff/payments" },
    { label: "Customers", path: "/staff/customers" },
    { label: "Returns", path: "/staff/returns" },
    { label: "Notifications", path: "/staff/notifications" },
  ],
  INVENTORY_MANAGER: [
    { label: "Dashboard", path: "/inventory/dashboard" },
    { label: "Products", path: "/inventory/products" },
    { label: "Stock", path: "/inventory/stock" },
    { label: "Packaging materials", path: "/inventory/packaging" },
    { label: "Low-stock alerts", path: "/inventory/alerts" },
    { label: "Suppliers", path: "/inventory/suppliers" },
    { label: "Purchase orders", path: "/inventory/purchase-orders" },
    { label: "Receive stock", path: "/inventory/receive" },
    { label: "Notifications", path: "/inventory/notifications" },
  ],
  PACKER: [
    { label: "Dashboard", path: "/packing/dashboard" },
    { label: "Packing queue", path: "/packing/queue" },
    { label: "Packaging materials", path: "/packing/packaging" },
    { label: "Notifications", path: "/packing/notifications" },
  ],
  DRIVER: [
    { label: "Dashboard", path: "/driver/dashboard" },
    { label: "My deliveries", path: "/driver/deliveries" },
  ],
  OWNER: [
    { label: "Dashboard", path: "/owner/dashboard" },
    { label: "Orders", path: "/owner/orders" },
    { label: "Payments", path: "/owner/payments" },
    { label: "Inventory", path: "/owner/inventory" },
    { label: "Pricing", path: "/owner/pricing" },
    { label: "Packing", path: "/owner/packing" },
    { label: "Delivery", path: "/owner/delivery" },
    { label: "Suppliers", path: "/owner/suppliers" },
    { label: "Reports", path: "/owner/reports" },
    { label: "Users and roles", path: "/owner/users" },
    { label: "Audit log", path: "/owner/audit" },
    { label: "Backup", path: "/owner/backup" },
    { label: "Notifications", path: "/owner/notifications" },
  ],
};

export const homePath = (role) => MENUS[role][0].path;
export const allowedPaths = (role) => (MENUS[role] || []).map((m) => m.path);

// every path with its title, used to create placeholder routes
export const ALL_PAGES = Object.values(MENUS).flat();
