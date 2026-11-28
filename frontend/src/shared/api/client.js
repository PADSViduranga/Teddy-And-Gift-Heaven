import axios from "axios";
import { clearSession, getSession } from "../utils/session";

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api" });
const publicAuth = ["/auth/login", "/auth/register"];

client.interceptors.request.use((config) => {
  const session = getSession();
  if (session && !publicAuth.includes(config.url)) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

client.interceptors.response.use(undefined, (error) => {
  const session = getSession({ allowExpired: true });
  const sentToken = error.config?.headers?.Authorization;
  const expired = session && Date.parse(session.expiresAt) <= Date.now();
  if (session && error.response?.status === 401 && !publicAuth.includes(error.config?.url)
    && (sentToken === `Bearer ${session.token}` || (!sentToken && expired))) {
    clearSession();
    const portal = window.location.pathname.startsWith("/staff/") ? "/staff/login" : "/login";
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`${portal}?next=${next}`);
  }
  return Promise.reject(error);
});

export default client;
