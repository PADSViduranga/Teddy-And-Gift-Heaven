import { Repeat, UserCheck, Users, Wallet } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getCustomerSummary, getCustomers } from "../api/reportsApi";
import { fullDate, money, num, pct } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

const QUARTER = { 1: ["Top 25%", "badge-success"], 2: ["Upper middle", "badge-info"], 3: ["Lower middle", "badge-info"], 4: ["Bottom 25%", "badge-warning"] };

// Page 66 – Customer report (Member 10). View: v_customer_report (LEFT JOIN, NTILE()).
export default function CustomerReport() {
  const summary = useLoad(getCustomerSummary);
  const list = useLoad(() => getCustomers(50));
  const s = summary.data;

  return (
    <>
      <PageHeader title="Customers" subtitle="Who buys, how often, and how much. Spending groups split customers into four equal parts." />
      {(summary.error || list.error) && <div className="rp-error">{summary.error || list.error}</div>}
      {s && (
        <div className="stats">
          <StatCard label="Registered customers" value={num(s.customers)} icon={Users} />
          <StatCard label="Have ordered" value={num(s.with_orders)} icon={UserCheck} />
          <StatCard label="Came back" value={pct(s.repeat_pct)} hint={`${num(s.repeat_customers)} repeat customers`} icon={Repeat} />
          <StatCard label="Average spend" value={money(s.avg_spent)} hint="per customer who ordered" icon={Wallet} />
        </div>
      )}
      {list.loading && <p className="rp-loading">Loading…</p>}
      {list.data && (
        <section className="card rp-card">
          <h3>Top 50 customers</h3>
          <p className="text-muted">By total spent on paid orders</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Customer</th><th>Phone</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th><th>Spending group</th></tr></thead>
              <tbody>
                {list.data.map((c) => {
                  const [label, badge] = QUARTER[c.spending_quarter] || ["–", "badge-info"];
                  return (
                    <tr key={c.user_id}>
                      <td>{c.full_name}</td>
                      <td>{c.phone}</td>
                      <td className="num">{num(c.orders)}</td>
                      <td className="num">{money(c.total_spent)}</td>
                      <td>{c.last_order_at ? fullDate(c.last_order_at) : "–"}</td>
                      <td><span className={`badge ${badge}`}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
