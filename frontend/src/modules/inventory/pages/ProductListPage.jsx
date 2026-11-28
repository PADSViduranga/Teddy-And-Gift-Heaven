import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, PackageX, Plus, Wallet } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import Notice from "../components/Notice";
import { money, moneyShort, num, stockBadge, useCanManage, useData } from "../components/helpers";
import { getCategories, getProducts, getSummary } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 17 – Products (Member 4). Owner, order staff and inventory manager can view;
// only owner and inventory manager see "Add product" and "Edit".

export default function ProductListPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [filter, setFilter] = useState("");
  const manage = useCanManage();

  const summary = useData(() => manage ? getSummary() : Promise.resolve(null), [manage]);
  const categories = useData(getCategories, []);
  const products = useData(
    () => getProducts({ search: search || undefined, categoryId: categoryId || undefined, filter: filter || undefined }),
    [search, categoryId, filter]);

  const s = summary.data || {};
  const rows = products.data || [];

  return (
    <>
      <PageHeader title="Products" subtitle="Everything the shop sells, with live stock levels">
        {manage && (
          <Link to="/staff/products/new" className="btn btn-primary inv-btn"><Plus size={16} /> Add product</Link>
        )}
      </PageHeader>

      {manage && <div className="stats">
        <StatCard label="Products" value={num(s.products)} hint={`${num(s.active_products)} on sale`} icon={Boxes} />
        <StatCard label="Low stock" value={num(s.low_items)} hint="at or below reorder level" icon={AlertTriangle} />
        <StatCard label="Out of stock" value={num(s.out_of_stock)} hint="nothing left to sell" icon={PackageX} />
        <StatCard label="Stock value" value={moneyShort(s.stock_value)} hint="on hand × price" icon={Wallet} />
      </div>}

      <div className="filters">
        <input className="input" type="search" placeholder="Search products…" value={search}
          onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {(categories.data || []).map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Stock filter">
          <option value="">All stock levels</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="inactive">Not on sale</option>
        </select>
      </div>

      <Notice>{products.error}</Notice>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th><th>Category</th><th className="num">Price</th>
              <th className="num">On hand</th><th className="num">Reserved</th><th className="num">Available</th>
              <th>Status</th>{manage && <th />}
            </tr>
          </thead>
          <tbody>
            {products.loading && <tr><td colSpan={8} className="inv-empty">Loading…</td></tr>}
            {!products.loading && !rows.length && !products.error && (
              <tr><td colSpan={8} className="inv-empty">No products match these filters.</td></tr>
            )}
            {!products.loading && rows.map((p) => {
              const badge = stockBadge(p);
              return (
                <tr key={p.item_id}>
                  <td>
                    <span className="inv-name">{p.name}</span>
                    {!Number(p.is_active) && <span className="inv-sub">Not on sale</span>}
                  </td>
                  <td>{p.category}</td>
                  <td className="num">{money(p.price)}</td>
                  <td className="num">{num(p.qty_on_hand)}</td>
                  <td className="num">{num(p.qty_reserved)}</td>
                  <td className="num"><strong>{num(p.qty_available)}</strong></td>
                  <td><span className={`badge ${badge.cls}`}>{badge.text}</span></td>
                  {manage && (
                    <td className="inv-actions"><Link className="inv-link" to={`/staff/products/${p.item_id}/edit`}>Edit</Link></td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
