import { useState } from "react";
import { AlertTriangle, Boxes, PackageX, TrendingDown } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getStockLoss } from "../api/reportsApi";
import { money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 67 – Stock and loss report (Member 10). View: v_stock_loss (LEFT JOINs, conditional SUM).
export default function StockLossReport() {
  const { data, error, loading } = useLoad(getStockLoss);
  const [filter, setFilter] = useState("all");
  const rows = data || [];
  const shown = rows.filter((r) => filter === "all" || (filter === "low" ? Number(r.is_low) : Number(r.damaged) + Number(r.lost) > 0));
  const sum = (k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

  return (
    <>
      <PageHeader title="Stock & losses" subtitle="What's on the shelves, what it's worth, and what was damaged or lost." />
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {data && (
        <>
          <div className="stats">
            <StatCard label="Stock value" value={money(sum("stock_value"))} hint="at selling price" icon={Boxes} />
            <StatCard label="Low-stock items" value={num(rows.filter((r) => Number(r.is_low)).length)} icon={AlertTriangle} />
            <StatCard label="Units damaged or lost" value={num(sum("damaged") + sum("lost"))} icon={PackageX} />
            <StatCard label="Value lost" value={money(sum("loss_value"))} icon={TrendingDown} />
          </div>
          <div className="filters">
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Show">
              <option value="all">All items</option>
              <option value="low">Low stock only</option>
              <option value="loss">Items with losses only</option>
            </select>
            <span className="text-muted">{shown.length} items</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Item</th><th>Type</th><th className="num">On hand</th><th className="num">Available</th><th className="num">Stock value</th><th className="num">Damaged</th><th className="num">Lost</th><th className="num">Value lost</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.item_id}>
                    <td>{r.name}</td>
                    <td className="text-muted">{String(r.item_kind).toLowerCase()}</td>
                    <td className="num">{num(r.qty_on_hand)}</td>
                    <td className="num">{Number(r.is_low) ? <span className="badge badge-warning">{num(r.qty_available)} low</span> : num(r.qty_available)}</td>
                    <td className="num">{r.stock_value === null ? "–" : money(r.stock_value)}</td>
                    <td className="num">{num(r.damaged)}</td>
                    <td className="num">{num(r.lost)}</td>
                    <td className="num">{r.loss_value === null ? "–" : money(r.loss_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
