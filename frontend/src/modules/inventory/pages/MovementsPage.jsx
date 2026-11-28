import { useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import Pager from "../components/Pager";
import { TYPE_LABEL, useData, when } from "../components/helpers";
import { getItems, getMovements } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 24 – Stock movements (Member 4). Owner and inventory manager.
// The full history from v_stock_movements: every stock change, who made it and why.
// LEFT JOIN in the view keeps changes made by the system (the expiry event), shown as "System".

const EMPTY = { itemId: "", type: "", from: "", to: "" };
const SIZE = 25;
const BADGE = {
  SALE: "badge-success", RECEIPT: "badge-success", RETURN: "badge-info", RESERVE: "badge-info",
  RELEASE: "badge-info", DAMAGE: "badge-danger", LOSS: "badge-danger", ADJUSTMENT: "badge-warning",
};

function toCsv(rows) {
  const lines = [["When", "Item", "Type", "Change", "Reason", "Order", "By"]];
  rows.forEach((m) => lines.push([when(m.created_at), m.item_name, TYPE_LABEL[m.type], signed(m), m.reason || "",
    m.order_id || "", m.created_by_name || "System"]));
  return lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

// show +5 for stock coming in, -5 for stock going out (reservations change "reserved", not "on hand")
function signed(m) {
  const q = Math.abs(Number(m.quantity));
  return m.direction === "IN" ? `+${q}` : `-${q}`;
}

export default function MovementsPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const items = useData(getItems, []);
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const list = useData(() => getMovements({ ...params, page, size: SIZE }), [JSON.stringify(params), page]);
  const setFilter = (key) => (e) => { setFilters({ ...filters, [key]: e.target.value }); setPage(0); };
  const rows = list.data?.items || [];

  function exportCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stock-movements.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader title="Stock movements" subtitle="Every change to stock, newest first">
        <button type="button" className="btn btn-outline inv-btn" onClick={exportCsv} disabled={!rows.length}>
          <Download size={16} /> Export this page
        </button>
      </PageHeader>

      <div className="filters">
        <select className="select" value={filters.itemId} onChange={setFilter("itemId")} aria-label="Item">
          <option value="">All items</option>
          {(items.data || []).map((i) => <option key={i.item_id} value={i.item_id}>{i.name}</option>)}
        </select>
        <select className="select inv-small" value={filters.type} onChange={setFilter("type")} aria-label="Type">
          <option value="">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="input inv-small" type="date" value={filters.from} onChange={setFilter("from")} aria-label="From date" />
        <input className="input inv-small" type="date" value={filters.to} onChange={setFilter("to")} aria-label="To date" />
        <button type="button" className="inv-link" onClick={() => { setFilters(EMPTY); setPage(0); }}>Clear</button>
      </div>

      <Notice>{list.error}</Notice>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>When</th><th>Item</th><th>Type</th><th className="num">Change</th><th>Reason</th><th>Order</th><th>By</th></tr></thead>
          <tbody>
            {list.loading && <tr><td colSpan={7} className="inv-empty">Loading…</td></tr>}
            {!list.loading && !rows.length && !list.error && <tr><td colSpan={7} className="inv-empty">No movements match these filters.</td></tr>}
            {!list.loading && rows.map((m) => (
              <tr key={m.movement_id}>
                <td className="inv-nowrap text-muted">{when(m.created_at)}</td>
                <td>{m.item_name}</td>
                <td><span className={`badge ${BADGE[m.type]}`}>{TYPE_LABEL[m.type]}</span></td>
                <td className={`num ${m.direction === "IN" ? "inv-in" : "inv-out"}`}>{signed(m)}</td>
                <td>{m.reason || "–"}</td>
                <td>{m.order_id ? `#${m.order_id}` : "–"}</td>
                <td>{m.created_by_name || <span className="text-muted">System</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} size={SIZE} total={list.data?.total || 0} onPage={setPage} />
    </>
  );
}
