import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getDashboard } from "../api/reportsApi";
import { num, pct } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

export default function DriverDashboard() {
  const { data: d, error, loading } = useLoad(() => getDashboard("driver"));
  const perf = d?.performance?.[0];

  return (
    <>
      <PageHeader title="My deliveries" subtitle="Today's route and how you're doing.">
        <Link to="/staff/my-deliveries" className="btn btn-primary" style={{ textDecoration: "none" }}>Open my deliveries</Link>
      </PageHeader>
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {d && (
        <>
          <div className="stats">
            <StatCard label="Deliveries today" value={num(d.today.length)} icon={Truck} />
            <StatCard label="Delivered (all time)" value={num(perf?.delivered)} icon={CheckCircle2} />
            <StatCard label="On time" value={pct(perf?.on_time_pct)} icon={Clock} />
            <StatCard label="Failed" value={num(perf?.failed)} icon={XCircle} />
          </div>
          <section className="card rp-card">
            <h3>Today's route</h3>
            <p className="text-muted">In time-slot order</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Time slot</th><th>Recipient</th><th>City</th><th>Status</th></tr></thead>
                <tbody>
                  {d.today.length === 0 && <tr><td colSpan={5} className="text-muted">No deliveries today.</td></tr>}
                  {d.today.map((r) => (
                    <tr key={r.order_id}>
                      <td>#{r.order_id}</td>
                      <td>{r.time_slot}</td>
                      <td>{r.recipient}</td>
                      <td>{r.city}</td>
                      <td><span className={`badge ${r.status === "DELIVERED" ? "badge-success" : r.status === "FAILED" ? "badge-danger" : "badge-info"}`}>{r.status.toLowerCase()}</span></td>
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
