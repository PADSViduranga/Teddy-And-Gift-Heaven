import { useState } from "react";
import { Banknote, Clock, Landmark, Undo2 } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { getPayments } from "../api/reportsApi";
import { ColumnChart } from "../components/Charts";
import { money, monthLabel, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

const METHODS = [["CASH_ON_DELIVERY", "Cash on delivery"], ["BANK_TRANSFER", "Bank transfer"]];
const STATUS_BADGE = { CONFIRMED: "badge-success", PENDING: "badge-warning", REJECTED: "badge-danger", REFUNDED: "badge-info" };

// Page 68 – Payment report (Member 10). View: v_payment_report (JOIN, GROUP BY month, method, status).
export default function PaymentReport() {
  const [months, setMonths] = useState(12);
  const { data, error, loading } = useLoad(() => getPayments(months), [months]);
  const rows = data || [];
  const monthsList = [...new Set(rows.map((r) => r.pay_month))].sort();
  const confirmed = (m, method) => rows.filter((r) => r.pay_month === m && r.method === method && r.status === "CONFIRMED")
    .reduce((s, r) => s + Number(r.amount), 0);
  const byStatus = (st, key = "amount") => rows.filter((r) => r.status === st).reduce((s, r) => s + Number(r[key]), 0);

  const totals = {};
  rows.forEach((r) => {
    const k = `${r.method}|${r.status}`;
    totals[k] = totals[k] || { method: r.method, status: r.status, payments: 0, amount: 0 };
    totals[k].payments += Number(r.payments);
    totals[k].amount += Number(r.amount);
  });

  return (
    <>
      <PageHeader title="Payments" subtitle="Money received by method, and payments still open.">
        <select className="select" value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Period">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </select>
      </PageHeader>
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {data && (
        <>
          <div className="stats">
            <StatCard label="Confirmed" value={money(byStatus("CONFIRMED"))} hint={`${num(byStatus("CONFIRMED", "payments"))} payments`} icon={Banknote} />
            <StatCard label="Waiting for payment" value={money(byStatus("PENDING"))} hint={`${num(byStatus("PENDING", "payments"))} payments`} icon={Clock} />
            <StatCard label="Refunded" value={money(byStatus("REFUNDED"))} hint="cancelled orders" icon={Undo2} />
            <StatCard label="Rejected or expired" value={num(byStatus("REJECTED", "payments"))} hint="payments" icon={Landmark} />
          </div>
          <section className="card rp-card">
            <h3>Confirmed payments by month</h3>
            <p className="text-muted">LKR, split by payment method</p>
            <ColumnChart format={money} labels={monthsList.map(monthLabel)}
              series={METHODS.map(([key, name]) => ({ name, values: monthsList.map((m) => confirmed(m, key)) }))} />
          </section>
          <section className="card rp-card">
            <h3>By method and status</h3>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Method</th><th>Status</th><th className="num">Payments</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {Object.values(totals).sort((a, b) => b.amount - a.amount).map((t) => (
                    <tr key={`${t.method}-${t.status}`}>
                      <td>{METHODS.find(([k]) => k === t.method)?.[1] || t.method}</td>
                      <td><span className={`badge ${STATUS_BADGE[t.status] || "badge-info"}`}>{t.status.toLowerCase()}</span></td>
                      <td className="num">{num(t.payments)}</td>
                      <td className="num">{money(t.amount)}</td>
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
