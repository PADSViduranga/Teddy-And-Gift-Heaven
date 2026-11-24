import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, Clock, PackageOpen, ShoppingBag, Truck, XCircle } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getDashboard } from "../api/reportsApi";
import { HBars, LineChart } from "../components/Charts";
import { day, money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 58 – Owner dashboard (Member 10)
export default function OwnerDashboard() {
  const { data: d, error, loading } = useLoad(() => getDashboard("owner"));
  return (
    <>
      <PageHeader title="Good day!" subtitle="Here's how the shop is doing today." />
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {d && (
        <>
          <div className="stats">
            <StatCard label="Orders today" value={num(d.orders_today)} icon={ShoppingBag} />
            <StatCard label="Sales today" value={money(d.revenue_today)} icon={Banknote} />
            <StatCard label="Awaiting payment" value={num(d.awaiting_payment)} icon={Clock} />
            <StatCard label="To pack" value={num(d.to_pack)} icon={PackageOpen} />
          </div>
          <div className="stats">
            <StatCard label="Out for delivery" value={num(d.out_for_delivery)} icon={Truck} />
            <StatCard label="Failed deliveries (7 days)" value={num(d.failed_7d)} icon={XCircle} />
            <StatCard label="Low-stock items" value={num(d.low_stock)} hint={<Link className="rp-link" to="/staff/stock/low">See alerts</Link>} icon={AlertTriangle} />
          </div>
          <div className="rp-two">
            <section className="card rp-card">
              <h3>Sales, last 14 days</h3>
              <p className="text-muted">Paid orders, by order date</p>
              <LineChart name="Sales" format={money}
                points={d.sales_last_14_days.map((r) => ({ label: day(r.sale_date), y: r.revenue }))} />
            </section>
            <section className="card rp-card">
              <h3>Top 5 products</h3>
              <p className="text-muted">Units sold, all time · <Link className="rp-link" to="/staff/reports/best-sellers">Full report</Link></p>
              <HBars format={num} items={d.top_products.map((p) => ({ name: p.name, value: p.units_sold }))} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
