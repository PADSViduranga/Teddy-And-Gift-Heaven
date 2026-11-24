import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, Lock, TrendingDown } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getDashboard } from "../api/reportsApi";
import { money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 60 – Inventory manager dashboard (Member 10)
export default function InventoryDashboard() {
  const { data: d, error, loading } = useLoad(() => getDashboard("inventory"));
  return (
    <>
      <PageHeader title="Stock overview" subtitle="Stock levels, losses and what's moving.">
        <Link to="/staff/reorder" className="btn btn-primary" style={{ textDecoration: "none" }}>Reorder suggestions</Link>
      </PageHeader>
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {d && (
        <>
          <div className="stats">
            <StatCard label="Low-stock items" value={num(d.low_stock)} icon={AlertTriangle} />
            <StatCard label="Stock value" value={money(d.stock_value)} hint="products at selling price" icon={Boxes} />
            <StatCard label="Losses (all time)" value={money(d.loss_value)} hint="damaged and lost" icon={TrendingDown} />
            <StatCard label="Held for online orders" value={num(d.active_reservations)} hint="active reservations" icon={Lock} />
          </div>
          <div className="rp-half">
            <section className="card rp-card">
              <h3>Running low</h3>
              <p className="text-muted">Available stock at or below the reorder level</p>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Item</th><th className="num">Available</th><th className="num">Reorder at</th></tr></thead>
                  <tbody>
                    {d.low_items.length === 0 && <tr><td colSpan={3} className="text-muted">Nothing is low.</td></tr>}
                    {d.low_items.map((i) => (
                      <tr key={i.item_id}>
                        <td>{i.name}</td>
                        <td className="num"><span className="badge badge-warning">{num(i.qty_available)}</span></td>
                        <td className="num">{num(i.reorder_level)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="card rp-card">
              <h3>In and out, last 30 days</h3>
              <p className="text-muted">Units sold against units received from suppliers</p>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Item</th><th className="num">Sold</th><th className="num">Received</th></tr></thead>
                  <tbody>
                    {d.moving_30d.length === 0 && <tr><td colSpan={3} className="text-muted">No movement in the last 30 days.</td></tr>}
                    {d.moving_30d.map((i) => (
                      <tr key={i.item_id}>
                        <td>{i.name}</td>
                        <td className="num">{num(i.sold_30d)}</td>
                        <td className="num">{num(i.received_30d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
