import { Link } from "react-router-dom";
import { ClipboardList, Clock, FileCheck2, ShoppingBag } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getDashboard } from "../api/reportsApi";
import { fullDate, money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 59 – Order staff dashboard (Member 10)
export default function OrderStaffDashboard() {
  const { data: d, error, loading } = useLoad(() => getDashboard("order-staff"));
  return (
    <>
      <PageHeader title="Orders and payments" subtitle="What needs your attention right now.">
        <Link to="/staff/orders/confirm" className="btn btn-primary" style={{ textDecoration: "none" }}>Orders to confirm</Link>
      </PageHeader>
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {d && (
        <>
          <div className="stats">
            <StatCard label="Awaiting payment" value={num(d.awaiting_payment)} icon={Clock} />
            <StatCard label="Transfer slips to check" value={num(d.slips_to_check)} icon={FileCheck2} />
            <StatCard label="Still editable" value={num(d.still_editable)} hint="before packing starts" icon={ClipboardList} />
            <StatCard label="Orders today" value={num(d.orders_today)} icon={ShoppingBag} />
          </div>
          <section className="card rp-card">
            <h3>Waiting longest for payment</h3>
            <p className="text-muted">Unpaid orders expire automatically, so check these first.</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {d.oldest_waiting.length === 0 && <tr><td colSpan={4} className="text-muted">Nothing waiting.</td></tr>}
                  {d.oldest_waiting.map((o) => (
                    <tr key={o.order_id}>
                      <td><Link className="rp-link" to={`/staff/orders/${o.order_id}`}>#{o.order_id}</Link></td>
                      <td>{o.customer}</td>
                      <td>{fullDate(o.created_at)}</td>
                      <td className="num">{money(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
