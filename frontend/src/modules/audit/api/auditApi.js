import client from "../../../shared/api/client";

// Page 12 calls (backend: audit/controller/AuditController.java)
export const getAuditLog = (params) => client.get("/audit", { params }).then((r) => r.data);
export const getAuditSummary = () => client.get("/audit/summary").then((r) => r.data);
export const getActivity = (limit = 10) => client.get("/audit/activity", { params: { limit } }).then((r) => r.data);

// Page 13 calls (backend: audit/controller/BackupController.java)
export const getBackups = () => client.get("/backups").then((r) => r.data);
export const getBackupSummary = () => client.get("/backups/summary").then((r) => r.data);
export const runBackup = () => client.post("/backups/run").then((r) => r.data);
