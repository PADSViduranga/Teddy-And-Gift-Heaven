import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Gift, Heart, Search, ShoppingCart, User } from "lucide-react";
import "./PublicHeader.css";

// Promo text from the design. Confirm the free-delivery rule with the owner before launch.
const PROMO = "Free island-wide delivery on orders over LKR 10,000";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/my-orders", label: "Orders" },
  { to: "/wishlist", label: "Wishlist" },
];

// Shared header for the landing page and the customer pages.
// Every link except Home needs a login; the route guard sends visitors to /login.
export default function PublicHeader() {
  const navigate = useNavigate();

  function onSearch(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q") || "";
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="ph">
      <div className="ph-promo">
        <Gift size={14} />
        <span>{PROMO}</span>
        <span className="ph-promo-sep">|</span>
        <span className="ph-promo-extra">Thoughtful gifts, always at Teddy &amp; Gift Heaven</span>
        <Heart size={12} className="ph-promo-extra" />
      </div>

      <div className="ph-bar">
        <Link to="/" className="ph-logo" aria-label="Teddy & Gift Heaven home">
          <span>Teddy &amp; Gift</span>
          <span>Heaven <Heart size={18} strokeWidth={2.5} /></span>
        </Link>

        <nav className="ph-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <form className="ph-search" role="search" onSubmit={onSearch}>
          <Search size={16} />
          <input name="q" type="search" placeholder="Search for teddy, gifts..." aria-label="Search" />
        </form>

        <div className="ph-icons">
          <Link to="/notifications" aria-label="Notifications" className="ph-icon">
            <Bell size={20} /><span className="ph-dot" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="ph-icon"><ShoppingCart size={20} /></Link>
          <Link to="/account" aria-label="My account" className="ph-icon ph-user"><User size={18} /></Link>
        </div>
      </div>
    </header>
  );
}
