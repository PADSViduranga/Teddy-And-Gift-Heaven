import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import Notice from "../components/Notice";
import { money, num, useData, when } from "../components/helpers";
import { getLowStock } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 23 – Low-stock alerts (Member 4). Owner and inventory manager.
// Reads v_low_stock (subqueries: items at or below reorder level, latest supplier price).
// Alerts open and close by themselves (trigger tr_stock_items_low_stock), so there is nothing to dismiss here.

export default function LowStockPage() {
  const { data, error, loading } = useData(getLowStock, []);
  const rows = data || [];
  const out = rows.filter((r) => Number(r.qty_available) <= 0).length;

  return (
    <>
      <PageHeader title="Low-stock alerts" subtitle="Items at or below their reorder level. Reorder these first.">
        <Link to="/staff/purchase-orders" className="btn btn-outline inv-btn">Purchase orders</Link>
      </PageHeader>

      <div className="stats">
        <StatCard label="Need reordering" value={num(rows.length)} icon={AlertTriangle} />
        <StatCard label="Out of stock" value={num(out)} hint="customers can't buy these" icon={PackageX} />
        <StatCard label="Products" value={num(rows.filter((r) => r.item_kind === "PRODUCT").length)}
          hint={`${num(rows.filter((r) => r.item_kind === "PACKAGING").length)} packaging items`} icon={Boxes} />
      </div>

      <Notice>{error}</Notice>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th><th className="num">Available</th><th className="num">Reorder level</th><th>Level</th>
              <th className="num">Short by</th><th className="num">Last supplier price</th><th>Alert since</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="inv-empty">Loading…</td></tr>}
            {!loading && !rows.length && !error && <tr><td colSpan={7} className="inv-empty">Nothing is low right now.</td></tr>}
            {!loading && rows.map((r) => {
              const available = Math.max(Number(r.qty_available), 0);
              const level = Number(r.reorder_level) > 0 ? Math.min(100, (available / Number(r.reorder_level)) * 100) : 0;
              return (
                <tr key={r.item_id}>
                  <td>
                    <span className="inv-name">{r.name}</span>
                    <span className="inv-sub">{r.item_kind === "PACKAGING" ? "Packaging" : "Product"}</span>
                  </td>
                  <td className={`num ${available <= 0 ? "inv-out" : ""}`}>{num(r.qty_available)}</td>
                  <td className="num">{num(r.reorder_level)}</td>
                  <td>
                    <div className="inv-bar" title={`${Math.round(level)}% of reorder level`}>
                      <span className={available <= 0 ? "inv-bar-empty" : ""} style={{ width: `${Math.max(level, 4)}%` }} />
                    </div>
                  </td>
                  <td className="num">{num(r.shortfall)}</td>
                  <td className="num">{r.last_supplier_price ? money(r.last_supplier_price) : "–"}</td>
                  <td className="inv-nowrap text-muted">{when(r.alert_since)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
