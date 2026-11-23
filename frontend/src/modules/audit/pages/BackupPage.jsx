import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, DatabaseBackup, HardDrive, Loader2, XCircle } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getBackupSummary, getBackups, runBackup } from "../api/auditApi";
import "./BackupPage.css";

// Page 13 – Backup and restore (Member 3). Owner only.
// Backups can be started here. Restoring is done on the server with database/backup/*.sh on purpose:
// overwriting the live database from a web page is too risky.

const HEALTHY_HOURS = 26; // a nightly backup plus a little slack

const when = (iso) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function size(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ago(hours) {
  if (hours === null || hours === undefined) return "never";
  if (hours < 1) return "under an hour ago";
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

const STEPS = [
  { title: "Restore a backup into the test database", cmd: "database/backup/restore.sh ~/tagh-backups/<file>.sql.gz",
    text: "Builds teddy_and_gift_heaven_restore from the file. The live database isn't touched." },
  { title: "Check the copy", cmd: "database/backup/compare.sh",
    text: "Compares row counts, triggers, procedures and events with the live database." },
  { title: "Or recover to an exact moment", cmd: 'database/backup/pitr.sh ~/tagh-backups/<file>.sql.gz "2026-11-23 14:05:10"',
    text: "Restores the backup, then replays the binary log up to that second. Use it to undo a mistake without losing later work." },
  { title: "Repair the live database", cmd: "copy back only what was damaged, or stop the backend and run\nRESTORE_LIVE=yes database/backup/restore.sh <file> teddy_and_gift_heaven",
    text: "See database/backup/README.md for the full steps." },
];

export default function BackupPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([getBackups(), getBackupSummary()])
      .then(([list, s]) => { setItems(list); setSummary(s); })
      .catch((e) => setError(e.response?.status === 401 || e.response?.status === 403
        ? "You need to be logged in as the owner to see backups."
        : "Couldn't load the backup history. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function backUpNow() {
    setRunning(true);
    setResult(null);
    runBackup()
      .then(setResult)
      .catch((e) => setResult({ success: false, message: e.response?.data?.message || "The backup couldn't be started." }))
      .finally(() => { setRunning(false); load(); });
  }

  const hours = summary?.hoursSinceLastSuccess;
  const healthy = hours !== null && hours !== undefined && hours <= HEALTHY_HOURS;

  return (
    <>
      <PageHeader title="Backup & restore" subtitle="A full backup runs every night at 23:30. You can also start one now.">
        <button type="button" className="btn btn-primary bk-btn" onClick={backUpNow} disabled={running}>
          {running ? <Loader2 size={16} className="bk-spin" /> : <DatabaseBackup size={16} />}
          {running ? "Backing up…" : "Back up now"}
        </button>
      </PageHeader>

      {result && (
        <div className={`bk-alert ${result.success ? "ok" : "bad"}`}>
          {result.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />} {result.message}
        </div>
      )}

      {summary && (
        <div className={`bk-health ${healthy ? "ok" : "warn"}`}>
          {healthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>{healthy ? "Backups are up to date" : "No recent backup"}</strong>
            <span>
              Last successful backup {ago(hours)}{summary.lastSuccess ? ` (${when(summary.lastSuccess)})` : ""}.
              {!healthy && " Check the nightly schedule, or back up now."}
            </span>
          </div>
        </div>
      )}

      <div className="stats">
        <StatCard label="Last successful backup" value={hours === null || hours === undefined ? "Never" : hours === 0 ? "Just now" : `${hours} h ago`} icon={Clock} />
        <StatCard label="Backups kept (14 days)" value={summary?.keptCount ?? "–"} icon={DatabaseBackup} />
        <StatCard label="Failed backups" value={summary?.failed ?? "–"} hint="all time" icon={AlertTriangle} />
        <StatCard label="Space used" value={summary ? size(summary.keptBytes) : "–"} hint="last 14 days" icon={HardDrive} />
      </div>

      {error && <div className="bk-alert bad"><XCircle size={18} /> {error}</div>}

      <div className="bk-grid">
        <section>
          <h2 className="bk-h">Backup history</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Started</th><th>File</th><th className="num">Size</th><th>Type</th><th>Status</th><th>Binary log position</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="bk-empty">Loading…</td></tr>}
                {!loading && !error && items.length === 0 && <tr><td colSpan={6} className="bk-empty">No backups yet.</td></tr>}
                {!loading && items.map((b) => (
                  <tr key={b.backupId}>
                    <td className="bk-nowrap">{when(b.startedAt)}</td>
                    <td className="bk-file">{b.fileName}{b.note && <span className="text-muted">{b.note}</span>}</td>
                    <td className="num">{size(b.sizeBytes)}</td>
                    <td><span className="badge badge-info">{b.method.toLowerCase()}</span></td>
                    <td><span className={`badge ${b.status === "SUCCESS" ? "badge-success" : "badge-danger"}`}>{b.status.toLowerCase()}</span></td>
                    <td className="bk-nowrap text-muted">{b.binlogFile ? `${b.binlogFile} : ${b.binlogPos}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card bk-restore">
          <h3>How to restore</h3>
          <p className="text-muted">Restores run on the server, from the project folder, so a click here can never overwrite live orders.</p>
          <ol>
            {STEPS.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <code>{s.cmd}</code>
                <span className="text-muted">{s.text}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
