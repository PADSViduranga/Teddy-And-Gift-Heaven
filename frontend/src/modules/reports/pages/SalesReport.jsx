import { Banknote, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getSalesMonthly } from "../api/reportsApi";
import { LineChart } from "../components/Charts";
import { money, monthLabel, num, pct } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

// Page 63 – Online sales report (Member 10). View: v_sales_monthly (SUM OVER, LAG).
export default function SalesReport() {
  const { data, error, loading } = useLoad(getSalesMonthly);
  const rows = data || [];
  const last = rows[rows.length - 1];
  const total = rows.reduce((s, r) => s + Number(r.revenue), 0);
  const orders = rows.reduce((s, r) => s + Number(r.orders), 0);

  return (
    <>
      <PageHeader title="Online sales" subtitle="Paid orders by month, with the running total for each year." />
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {data && (
        <>
          <div className="stats">
            <StatCard label="Sales, all months" value={money(total)} icon={Banknote} />
            <StatCard label="Orders, all months" value={num(orders)} icon={ShoppingBag} />
            <StatCard label="Average order" value={money(orders ? total / orders : 0)} icon={Receipt} />
            <StatCard label={last ? `Growth in ${monthLabel(last.sale_month)}` : "Growth"} value={pct(last?.growth_pct)} hint="vs the month before" icon={TrendingUp} />
          </div>
          <section className="card rp-card">
            <h3>Sales by month</h3>
            <p className="text-muted">LKR, paid orders only. Hover for exact values.</p>
            <LineChart name="Sales" format={money} height={260}
              points={rows.map((r) => ({ label: monthLabel(r.sale_month), y: r.revenue }))} />
          </section>
          <section className="card rp-card">
            <h3>Month by month</h3>
            <p className="text-muted">Year to date restarts every January. Growth compares with the previous month.</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Month</th><th className="num">Orders</th><th className="num">Sales</th><th className="num">Year to date</th><th className="num">Growth</th></tr></thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.sale_month}>
                      <td>{monthLabel(r.sale_month)}</td>
                      <td className="num">{num(r.orders)}</td>
                      <td className="num">{money(r.revenue)}</td>
                      <td className="num">{money(r.revenue_year_to_date)}</td>
                      <td className={`num ${r.growth_pct > 0 ? "rp-up" : r.growth_pct < 0 ? "rp-down" : ""}`}>
                        {r.growth_pct === null ? "–" : `${r.growth_pct > 0 ? "▲" : r.growth_pct < 0 ? "▼" : ""} ${pct(Math.abs(r.growth_pct))}`}
                      </td>
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
