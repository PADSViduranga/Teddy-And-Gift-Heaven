import AuditLogPage from "./pages/AuditLogPage";
import BackupPage from "./pages/BackupPage";

// Member 3's pages. Paths must match shared/layout/menus.js.
export default [
  { path: "/staff/audit", element: <AuditLogPage /> },
  { path: "/staff/backup", element: <BackupPage /> },
];
