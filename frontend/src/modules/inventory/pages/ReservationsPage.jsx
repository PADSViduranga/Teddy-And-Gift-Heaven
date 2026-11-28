import { useState } from "react";
import { Clock, ShoppingCart, Timer } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import Notice from "../components/Notice";
import { num, useData, when } from "../components/helpers";
import { getReservations } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 25 – Online reservations (Member 4). Owner and inventory manager.
// Stock held for online orders that aren't paid yet. The event ev_expire_reservations releases
// expired holds every minute, so this page is read-only.

const STATUS = {
  ACTIVE: { cls: "badge-info", text: "Holding" },
  CONVERTED: { cls: "badge-success", text: "Paid – sold" },
  RELEASED: { cls: "badge-warning", text: "Released" },
  EXPIRED: { cls: "badge-danger", text: "Expired" },
};

export default function ReservationsPage() {
  const [status, setStatus] = useState("ACTIVE");
  const { data, error, loading } = useData(() => getReservations(status || undefined), [status]);
  const rows = data || [];
  const active = rows.filter((r) => r.status === "ACTIVE");
  const units = active.reduce((sum, r) => sum + Number(r.quantity), 0);
  const soon = active.filter((r) => Number(r.minutes_left) <= 5).length;

  return (
    <>
      <PageHeader title="Online reservations" subtitle="Stock held for online orders until they're paid. Unpaid holds are released automatically." />

      {status === "ACTIVE" && (
        <div className="stats">
          <StatCard label="Holds now" value={num(active.length)} icon={ShoppingCart} />
          <StatCard label="Units held" value={num(units)} hint="not available to other customers" icon={Clock} />
          <StatCard label="Expiring in 5 min" value={num(soon)} icon={Timer} />
        </div>
      )}

      <div className="filters">
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="ACTIVE">Holding now</option>
          <option value="CONVERTED">Paid (sold)</option>
          <option value="RELEASED">Released</option>
          <option value="EXPIRED">Expired</option>
          <option value="">All</option>
        </select>
      </div>

      <Notice>{error}</Notice>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Product</th><th className="num">Qty</th><th>Expires</th><th>Time left</th><th>Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="inv-empty">Loading…</td></tr>}
            {!loading && !rows.length && !error && <tr><td colSpan={6} className="inv-empty">No reservations here.</td></tr>}
            {!loading && rows.map((r) => {
              const s = STATUS[r.status];
              return (
                <tr key={r.reservation_id}>
                  <td>#{r.order_id}</td>
                  <td>{r.product_name}</td>
                  <td className="num">{num(r.quantity)}</td>
                  <td className="inv-nowrap text-muted">{when(r.expires_at)}</td>
                  <td>{r.status === "ACTIVE" ? `${num(r.minutes_left)} min` : "–"}</td>
                  <td><span className={`badge ${s.cls}`}>{s.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
