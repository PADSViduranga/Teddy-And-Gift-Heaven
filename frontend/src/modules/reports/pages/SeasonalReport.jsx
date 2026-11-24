import PageHeader from "../../../shared/components/PageHeader";
import { getSeasonal } from "../api/reportsApi";
import { ColumnChart } from "../components/Charts";
import { money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

const SEASONS = ["Valentine's Day", "Mother's Day", "Christmas", "Regular days"];

// Page 65 – Seasonal demand (Member 10). View: v_seasonal_demand (CASE on dates, GROUP BY season and year).
export default function SeasonalReport() {
  const { data, error, loading } = useLoad(getSeasonal);
  const rows = data || [];
  const years = [...new Set(rows.map((r) => r.season_year))].sort().slice(-3); // last 3 years, fixed colour order
  const value = (season, year, key) => rows.find((r) => r.season === season && r.season_year === year)?.[key] ?? 0;

  return (
    <>
      <PageHeader title="Seasonal demand" subtitle="How busy each gift season is compared with regular days, by delivery date." />
      {error && <div className="rp-error">{error}</div>}
      {loading && <p className="rp-loading">Loading…</p>}
      {data && (
        <>
          <section className="card rp-card">
            <h3>Orders per delivery day</h3>
            <p className="text-muted">Plan stock and delivery capacity for the weeks that run several times busier.</p>
            <ColumnChart labels={SEASONS} format={num}
              series={years.map((y) => ({ name: String(y), values: SEASONS.map((s) => value(s, y, "orders_per_day")) }))} />
          </section>
          <section className="card rp-card">
            <h3>Season by season</h3>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Season</th><th>Year</th><th className="num">Orders</th><th className="num">Delivery days</th><th className="num">Orders per day</th><th className="num">Sales</th><th className="num">Average order</th></tr></thead>
                <tbody>
                  {[...rows].sort((a, b) => b.season_year - a.season_year || SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season)).map((r) => (
                    <tr key={`${r.season}-${r.season_year}`}>
                      <td>{r.season}</td>
                      <td>{r.season_year}</td>
                      <td className="num">{num(r.orders)}</td>
                      <td className="num">{num(r.delivery_days)}</td>
                      <td className="num"><strong>{num(r.orders_per_day)}</strong></td>
                      <td className="num">{money(r.revenue)}</td>
                      <td className="num">{money(r.avg_order)}</td>
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
