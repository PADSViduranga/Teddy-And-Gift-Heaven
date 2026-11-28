const KEY = "tagh-session";

export function getSession({ allowExpired = false } = {}) {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY));
    return session?.token && (allowExpired || Date.parse(session.expiresAt) > Date.now()) ? session : null;
  } catch {
    return null;
  }
}

export function saveSession({ token, role, name, expiresAt }) {
  sessionStorage.setItem(KEY, JSON.stringify({ token, role, name, expiresAt }));
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

export const STAFF_ROLES = ["OWNER", "ORDER_STAFF", "INVENTORY_MANAGER", "PACKER", "DRIVER"];
