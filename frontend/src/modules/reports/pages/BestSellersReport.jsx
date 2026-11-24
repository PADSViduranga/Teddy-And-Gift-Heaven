import PageHeader from "../../../shared/components/PageHeader";
import { getCategories, getProducts } from "../api/reportsApi";
import { HBars } from "../components/Charts";
import { fullDate, money, num } from "../components/format";
import useLoad from "../components/useLoad";
import "./reports.css";

const SLOW_DAYS = 60;

// Page 64 – Best sellers and slow-moving stock (Member 10).
// Views: v_product_sales (LEFT JOIN keeps products that never sold, RANK()) and v_category_sales (RIGHT JOIN).
export default function BestSellersReport() {
  const products = useLoad(getProducts);
  const categories = useLoad(getCategories);
  const rows = products.data || [];
  const slow = rows.filter((p) => Number(p.units_sold) === 0 || p.days_since_last_sale > SLOW_DAYS)
    .sort((a, b) => Number(a.units_sold) - Number(b.units_sold));

  return (
    <>
      <PageHeader title="Best sellers & slow stock" subtitle="What sells, what doesn't, and how each category is doing." />
      {(products.error || categories.error) && <div className="rp-error">{products.error || categories.error}</div>}
      {products.loading && <p className="rp-loading">Loading…</p>}
      {products.data && (
        <div className="rp-two">
          <section className="card rp-card">
            <h3>Top 10 products</h3>
            <p className="text-muted">Units sold, paid orders</p>
            <HBars format={num} items={rows.slice(0, 10).map((p) => ({ name: `${p.sales_rank}. ${p.name}`, value: p.units_sold }))} />
          </section>
          <section className="card rp-card">
            <h3>Slow-moving stock</h3>
            <p className="text-muted">Never sold, or no sale in {SLOW_DAYS} days. Consider a discount or stop reordering.</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th className="num">Sold</th><th>Last sale</th><th className="num">In stock</th></tr></thead>
                <tbody>
                  {slow.length === 0 && <tr><td colSpan={4} className="text-muted">Everything is selling.</td></tr>}
                  {slow.map((p) => (
                    <tr key={p.item_id}>
                      <td>{p.name}</td>
                      <td className="num">{Number(p.units_sold) === 0 ? <span className="badge badge-danger">never</span> : num(p.units_sold)}</td>
                      <td>{p.last_sold_at ? fullDate(p.last_sold_at) : "–"}</td>
                      <td className="num">{num(p.qty_on_hand)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
      {categories.data && (
        <section className="card rp-card">
          <h3>By category</h3>
          <p className="text-muted">Every category is listed, including ones with no products or sales yet.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Category</th><th className="num">Products</th><th className="num">Units sold</th><th className="num">Sales</th></tr></thead>
              <tbody>
                {categories.data.map((c) => (
                  <tr key={c.category_id}>
                    <td>{c.category}</td>
                    <td className="num">{num(c.products)}</td>
                    <td className="num">{num(c.units_sold)}</td>
                    <td className="num">{money(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
