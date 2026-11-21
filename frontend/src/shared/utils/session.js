// Who is logged in. Member 2's login pages save these after a successful login.
const KEYS = ["token", "role", "name"];

export function getSession() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return { token, role: localStorage.getItem("role"), name: localStorage.getItem("name") || "" };
}

export function saveSession({ token, role, name }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("name", name || "");
}

export function clearSession() {
  KEYS.forEach((k) => localStorage.removeItem(k));
}

export const STAFF_ROLES = ["OWNER", "ORDER_STAFF", "INVENTORY_MANAGER", "PACKER", "DRIVER"];
