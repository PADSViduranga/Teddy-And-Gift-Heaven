import axios from "axios";

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// TEMPORARY (until Member 2's JWT login): if VITE_DEV_BASIC_AUTH is set in frontend/.env,
// e.g. VITE_DEV_BASIC_AUTH=dev:dev12345, send that test login instead of a token.
const devBasic = import.meta.env.VITE_DEV_BASIC_AUTH;

client.interceptors.request.use((config) => {
  if (devBasic) {
    config.headers.Authorization = `Basic ${btoa(devBasic)}`;
    return config;
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
