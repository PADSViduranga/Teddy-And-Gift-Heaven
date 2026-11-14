// TEMPORARY: Member 2 replaces this with the real JWT login.
export function getSession() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token && role ? { token, role } : null;
}

export function setSession(role) {
  localStorage.setItem("token", "dev-token");
  localStorage.setItem("role", role);
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}
