import { Link, useSearchParams } from "react-router-dom";
import PublicHeader from "../../../shared/layout/PublicHeader";
import { money, useData } from "../../inventory/components/helpers";
import { getShopCategories, getShopProducts } from "../api/shopApi";
import ProductPhoto from "./ProductPhoto";
import "./shop.css";

// /shop – the customer catalog (Member 4). Needs a customer login (RequireLogin in App.jsx).
// Filters live in the address (?q=teddy&category=1&sort=price_asc), so the header search box,
// the back button and shared links all work. Only active products are listed; customers see
// "Only N left" or "Sold out", never exact stock counts.

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "";

  const categories = useData(getShopCategories, []);
  const products = useData(
    () => getShopProducts({ search: q || undefined, categoryId: category || undefined, sort: sort || undefined }),
    [q, category, sort]);

  // change one filter, keep the others
  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  const rows = products.data || [];
  const current = (categories.data || []).find((c) => String(c.category_id) === category);

  return (
    <div className="shop">
      <PublicHeader />
      <main className="shop-wrap">
        <div className="shop-head">
          <div>
            <p className="eyebrow">Shop</p>
            <h1>{current ? current.name : "All gifts"}</h1>
            <p className="text-muted">Teddy bears, gift boxes, flowers and more, delivered with love.</p>
          </div>
        </div>

        <div className="shop-chips" role="group" aria-label="Categories">
          <button type="button" className={`shop-chip${!category ? " on" : ""}`} onClick={() => setParam("category", "")}>All</button>
          {(categories.data || []).map((c) => (
            <button key={c.category_id} type="button"
              className={`shop-chip${String(c.category_id) === category ? " on" : ""}`}
              onClick={() => setParam("category", String(c.category_id))}>{c.name}</button>
          ))}
        </div>

        <div className="shop-tools">
          <input className="input" type="search" placeholder="Search gifts…" value={q}
            onChange={(e) => setParam("q", e.target.value)} aria-label="Search gifts" />
          <select className="select" value={sort} onChange={(e) => setParam("sort", e.target.value)} aria-label="Sort">
            <option value="">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          {!products.loading && <span className="shop-count">{rows.length} {rows.length === 1 ? "gift" : "gifts"}</span>}
        </div>

        {products.error && <div className="shop-error" role="alert">{products.error}</div>}
        {products.loading && <p className="shop-empty">Loading gifts…</p>}
        {!products.loading && !products.error && !rows.length && (
          <p className="shop-empty">No gifts match{q ? ` “${q}”` : ""}. Try another search or category.</p>
        )}

        {!products.loading && rows.length > 0 && (
          <div className="shop-grid">
            {rows.map((p) => {
              const out = !Number(p.in_stock);
              return (
                <Link key={p.item_id} to={`/product/${p.item_id}`} className={`shop-card${out ? " sold-out" : ""}`}>
                  <ProductPhoto src={p.image_url} alt={p.name}>
                    {out && <span className="shop-tag out">Sold out</span>}
                    {!out && p.only_left && <span className="shop-tag low">Only {p.only_left} left</span>}
                  </ProductPhoto>
                  <div className="shop-card-text">
                    <span className="shop-card-cat">{p.category}</span>
                    <span className="shop-card-name">{p.name}</span>
                    <span className="shop-price">{money(p.price)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
