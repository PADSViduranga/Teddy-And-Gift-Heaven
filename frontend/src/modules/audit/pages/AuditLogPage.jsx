import { useEffect, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Download, History, Package, Tag, Users } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getActivity, getAuditLog, getAuditSummary } from "../api/auditApi";
import "./AuditLogPage.css";

// Page 12 – Audit log viewer (Member 3). Owner only. Read-only: audit rows can't be changed.

const TYPES = [
  { value: "", label: "All changes" },
  { value: "products", label: "Product price" },
  { value: "orders", label: "Order change" },
  { value: "payments", label: "Payment" },
  { value: "stock_movements", label: "Stock change" },
  { value: "users", label: "User account" },
];
const ACTIONS = ["", "INSERT", "UPDATE", "DELETE"];
const EMPTY = { table: "", action: "", search: "", from: "", to: "" };
const SIZE = 25;

const when = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const parse = (json) => { try { return json ? JSON.parse(json) : {}; } catch { return {}; } };
const MONEY = /price|amount|cost|cash/;
// money keeps two decimals (JSON turns 2500.00 into 2500)
const show = (v, key = "") => {
  if (v === null || v === undefined || v === "") return "—";
  if (MONEY.test(key) && !isNaN(v)) return Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return String(v);
};

// which fields changed: "price: 2500.00 → 2750.00"; for new rows, the values that were set
function changes(entry) {
  const oldV = parse(entry.oldValue);
  const newV = parse(entry.newValue);
  if (entry.action === "INSERT") {
    return Object.entries(newV).filter(([, v]) => v !== null).map(([k, v]) => ({ key: k, to: show(v, k) }));
  }
  return Object.keys({ ...oldV, ...newV })
    .filter((k) => JSON.stringify(oldV[k]) !== JSON.stringify(newV[k]))
    .map((k) => ({ key: k, from: show(oldV[k], k), to: show(newV[k], k) }));
}

const ACTION_BADGE = { INSERT: "badge-success", UPDATE: "badge-info", DELETE: "badge-danger" };

function toCsv(items) {
  const rows = [["When", "Change", "Record", "Action", "Changed by", "Role", "Details"]];
  items.forEach((e) =>
    rows.push([when(e.changedAt), e.changeType, `${e.tableName} #${e.recordId}`, e.action, e.changedBy, e.roleName,
      changes(e).map((c) => (c.from !== undefined ? `${c.key}: ${c.from} -> ${c.to}` : `${c.key}: ${c.to}`)).join("; ")]));
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAuditSummary().then(setSummary).catch(() => {});
    getActivity(8).then(setActivity).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    getAuditLog({ ...params, page, size: SIZE })
      .then(setData)
      .catch((e) => setError(e.response?.status === 401 || e.response?.status === 403
        ? "You need to be logged in as the owner to see the audit log."
        : "Couldn't load the audit log. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [filters, page]);

  function setFilter(key, value) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function exportCsv() {
    const blob = new Blob([toCsv(data.items)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-page-${page + 1}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const first = data.total === 0 ? 0 : page * SIZE + 1;
  const last = Math.min((page + 1) * SIZE, data.total);

  return (
    <>
      <PageHeader title="Audit log"
        subtitle="Every change to prices, orders, payments, stock and user accounts. Entries can't be edited or deleted.">
        <button type="button" className="btn btn-outline al-btn" onClick={exportCsv} disabled={!data.items.length}>
          <Download size={16} /> Export CSV
        </button>
      </PageHeader>

      <div className="stats">
        <StatCard label="Changes today" value={summary?.changesToday ?? "–"} icon={History} />
        <StatCard label="Price changes (7 days)" value={summary?.priceChangesThisWeek ?? "–"} icon={Tag} />
        <StatCard label="Stock changes today" value={summary?.stockChangesToday ?? "–"} icon={Package} />
        <StatCard label="Staff active today" value={summary?.activeUsersToday ?? "–"} icon={Users} />
      </div>

      <div className="al-grid">
        <section>
          <div className="filters">
            <select className="select" value={filters.table} onChange={(e) => setFilter("table", e.target.value)} aria-label="Type of change">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="select al-small" value={filters.action} onChange={(e) => setFilter("action", e.target.value)} aria-label="Action">
              {ACTIONS.map((a) => <option key={a} value={a}>{a ? a.charAt(0) + a.slice(1).toLowerCase() : "Any action"}</option>)}
            </select>
            <input className="input al-small" type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} aria-label="From date" />
            <input className="input al-small" type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} aria-label="To date" />
            <input className="input" type="search" placeholder="Record ID or staff name" value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)} />
            <button type="button" className="al-clear" onClick={() => { setFilters(EMPTY); setPage(0); }}>Clear</button>
          </div>

          {error && <div className="al-error">{error}</div>}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>When</th><th>Change</th><th>Record</th><th>Changed by</th><th>What changed</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="al-empty">Loading…</td></tr>}
                {!loading && !error && data.items.length === 0 && (
                  <tr><td colSpan={5} className="al-empty">No changes match these filters.</td></tr>
                )}
                {!loading && data.items.map((e) => (
                  <tr key={e.auditId}>
                    <td className="al-when">{when(e.changedAt)}</td>
                    <td>
                      <strong className="al-type">{e.changeType}</strong>
                      <span className={`badge ${ACTION_BADGE[e.action] || "badge-info"}`}>{e.action.toLowerCase()}</span>
                    </td>
                    <td className="al-record">{e.tableName} #{e.recordId}</td>
                    <td>
                      <span className="al-who">{e.changedBy}</span>
                      <span className="text-muted al-role">{e.roleName.replace("_", " ").toLowerCase()}</span>
                    </td>
                    <td>
                      <ul className="al-changes">
                        {changes(e).map((c) => (
                          <li key={c.key}>
                            <span className="al-key">{c.key.replace(/_/g, " ")}</span>
                            {c.from !== undefined && <><span className="al-old">{c.from}</span><span className="al-arrow">→</span></>}
                            <span className="al-new">{c.to}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="al-pager">
            <span className="text-muted">{first}–{last} of {data.total}</span>
            <button type="button" className="al-page" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>
            <button type="button" className="al-page" disabled={last >= data.total} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
          </div>
        </section>

        <aside className="card al-activity">
          <h3><Activity size={18} /> Recent activity</h3>
          {activity.length === 0 && <p className="text-muted">Nothing yet.</p>}
          <ol>
            {activity.map((a, i) => (
              <li key={i} className={a.source === "BACKUP" ? "is-backup" : ""}>
                <strong>{a.activity}</strong>
                <span className="text-muted">{a.detail}</span>
                <span className="al-time">{when(a.happenedAt)} · {a.changedBy}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
