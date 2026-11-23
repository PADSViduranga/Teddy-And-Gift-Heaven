import client from "../../../shared/api/client";

// Page 12 calls (backend: audit/controller/AuditController.java)
export const getAuditLog = (params) => client.get("/audit", { params }).then((r) => r.data);
export const getAuditSummary = () => client.get("/audit/summary").then((r) => r.data);
export const getActivity = (limit = 10) => client.get("/audit/activity", { params: { limit } }).then((r) => r.data);
