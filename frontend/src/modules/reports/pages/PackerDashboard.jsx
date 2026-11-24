import { Link } from "react-router-dom";
import { AlarmClock, Box, PackageOpen, PackageSearch } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getDashboard } from "../api/reportsApi";
import { fullDate, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 61 – Packer dashboard (Member 10). No prices on this page.
export default function PackerDashboard() {
  const { data: d, error, loading } = useLoad(() => getDashboard("packer"));
  return (
    <>
      <PageHeader title="Packing today" subtitle="Urgent orders first.">
        <Link to="/staff/packing" className="btn btn-primary" style={{ textDecoration: "none" }}>Open packing queue</Link>
      </PageHeader>
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {d && (
        <>
          <div className="stats">
            <StatCard label="Ready to pack" value={num(d.to_pack)} icon={PackageOpen} />
            <StatCard label="Being packed" value={num(d.packing_now)} icon={Box} />
            <StatCard label="Due by tomorrow" value={num(d.due_by_tomorrow)} icon={AlarmClock} />
            <StatCard label="Packaging running low" value={num(d.packaging_low)} hint={<Link className="rp-link" to="/staff/packaging">Check materials</Link>} icon={PackageSearch} />
          </div>
          <section className="card rp-card">
            <h3>Next to pack</h3>
            <p className="text-muted">Sorted by delivery date, then priority</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Delivery date</th><th className="num">Items</th><th className="num">Priority</th></tr></thead>
                <tbody>
                  {d.next_to_pack.length === 0 && <tr><td colSpan={4} className="text-muted">Nothing to pack.</td></tr>}
                  {d.next_to_pack.map((o) => (
                    <tr key={o.order_id}>
                      <td><Link className="rp-link" to={`/staff/packing/${o.order_id}`}>#{o.order_id}</Link></td>
                      <td>{fullDate(o.slot_date)}</td>
                      <td className="num">{num(o.items)}</td>
                      <td className="num">{num(o.priority_score)}</td>
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
