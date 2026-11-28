import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Gift, Minus, PenLine, Plus, ShoppingCart, Truck } from "lucide-react";
import PublicHeader from "../../../shared/layout/PublicHeader";
import { money, useData } from "../../inventory/components/helpers";
import { getShopProduct } from "../api/shopApi";
import { addToCart, getCart } from "../api/cart";
import ProductPhoto from "./ProductPhoto";
import "./shop.css";

// /product/:id – one product (Member 4). Needs a customer login.
// "Add to cart" only remembers the choice in this browser (api/cart.js). Stock is held for real
// when Member 5's checkout calls sp_reserve_stock, which refuses if someone else bought it first.

const MAX_PER_ORDER = 10;

export default function ProductPage() {
  const { id } = useParams();
  const { data: p, error, loading } = useData(() => getShopProduct(id), [id]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(0);

  const inCart = p ? (getCart().find((l) => l.productId === p.item_id)?.qty || 0) : 0;
  const out = p && !Number(p.in_stock);
  // never let a customer pick more than we know is left (when 5 or fewer remain)
  const limit = p?.only_left ? Math.max(Number(p.only_left) - inCart, 0) : MAX_PER_ORDER;

  function add() {
    setAdded(addToCart(p, qty));
    setQty(1);
  }

  return (
    <div className="shop">
      <PublicHeader />
      <main className="shop-wrap">
        <Link to="/shop" className="shop-back"><ArrowLeft size={16} /> Back to shop</Link>

        {loading && <p className="shop-empty">Loading…</p>}
        {!loading && error && (
          <div className="shop-empty">
            <p>{error.includes("not found") ? "This gift isn't available any more." : error}</p>
            <Link to="/shop" className="btn btn-primary">See other gifts</Link>
          </div>
        )}

        {!loading && p && (
          <div className="shop-detail">
            <ProductPhoto src={p.image_url} alt={p.name} />

            <div>
              <Link to={`/shop?category=${p.category_id}`} className="eyebrow">{p.category}</Link>
              <h1>{p.name}</h1>
              <div className="shop-price">{money(p.price)}</div>

              <p className="shop-desc">{p.description || "A lovely gift, carefully packed by our team."}</p>

              {out && <span className="shop-stock out">Sold out – check back soon</span>}
              {!out && p.only_left && <span className="shop-stock low">Hurry, only {p.only_left} left</span>}
              {!out && !p.only_left && <span className="shop-stock in"><CheckCircle size={16} /> In stock</span>}

              {!out && (
                <div className="shop-buy">
                  <div className="shop-qty" aria-label="Quantity">
                    <button type="button" onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="One less"><Minus size={16} /></button>
                    <span aria-live="polite">{qty}</span>
                    <button type="button" onClick={() => setQty(qty + 1)} disabled={qty >= limit} aria-label="One more"><Plus size={16} /></button>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={add} disabled={limit < 1}>
                    <ShoppingCart size={16} /> {limit < 1 ? "All in your cart" : "Add to cart"}
                  </button>
                </div>
              )}

              {added > 0 && (
                <div className="shop-ok" role="status">
                  <CheckCircle size={16} /> Added. You have {added} in your cart.
                  <Link to="/cart">View cart</Link>
                </div>
              )}

              <div className="shop-perks">
                <span><PenLine size={18} /> Add a message card, wrapping or embroidery at checkout</span>
                <span><Gift size={18} /> Sent straight to your loved one on the date you choose</span>
                <span><Truck size={18} /> Island-wide delivery</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
