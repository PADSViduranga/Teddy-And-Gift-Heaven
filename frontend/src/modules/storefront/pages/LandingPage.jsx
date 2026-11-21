import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Award, Gift, Heart, Mail, PartyPopper, PenLine,
  Search, ShieldCheck, Star, Truck,
} from "lucide-react";
import PublicHeader from "../../../shared/layout/PublicHeader";
import "./LandingPage.css";

// Page 01 – Landing page (Member 1). The only page a visitor can see.
// The cards below are fixed sample content from the design. Visitors can't see the real
// catalog, so every link goes to a page that needs a login (the guard sends them to /login).
// Confirm names, prices and claims with the shop owner before launch.

const FEATURES = [
  { icon: Truck, title: "Island-wide Delivery", text: "Fast, reliable delivery to your doorstep." },
  { icon: Gift, title: "Beautiful Gift Wrapping", text: "Make it extra special." },
  { icon: ShieldCheck, title: "A Gift for Every Occasion", text: "Birthdays, anniversaries, and more." },
];

const CATEGORIES = [
  { name: "Teddy Bears", img: "cat-teddy.jpg" },
  { name: "Gift Boxes", img: "cat-gift-box.jpg" },
  { name: "Flower Gifts", img: "cat-flowers.jpg" },
  { name: "Chocolates", img: "cat-chocolates.jpg" },
  { name: "Personalized Gifts", img: "cat-personalized.jpg" },
];

const FAVOURITES = [
  { name: 'Classic Teddy Bear (12")', price: "LKR 2,750", img: "p-classic-teddy.jpg", liked: true },
  { name: 'Love Teddy Bear (14")', price: "LKR 3,490", img: "p-love-teddy.jpg" },
  { name: "Gift Hamper Box", price: "LKR 4,990", img: "p-hamper.jpg" },
  { name: "Rose Gift Bouquet", price: "LKR 5,250", img: "p-bouquet.jpg" },
];

const OCCASIONS = [
  { icon: Award, title: "Birthday Wishes", text: "The perfect surprise for special days." },
  { icon: Heart, title: "Anniversary Love", text: "Mark love and togetherness with a lasting gift." },
  { icon: PartyPopper, title: "Congratulations", text: "Celebrate life's big and small wins." },
  { icon: Star, title: "Just Because", text: "Because it's always a good time to make someone smile." },
];

const STEPS = [
  { n: "01", icon: Search, title: "Find the Perfect Gift", text: "Explore our carefully selected collection and choose something they'll love." },
  { n: "02", icon: PenLine, title: "Make It Their Own", text: "Add a personal message, gift wrap, or other thoughtful touches." },
  { n: "03", icon: Truck, title: "Send It With Love", text: "We'll pack it beautifully and deliver it safely to their doorstep." },
];

const FAQ = [
  { q: "Can I send a gift directly to someone?",
    a: "Yes. At checkout you enter the recipient's name, address and phone number, and we deliver to them on the date you choose." },
  { q: "Do you offer gift wrapping and a message?",
    a: "Yes. You can add special wrapping, a message card or name embroidery. The extra cost is shown before you pay." },
  { q: "What are the delivery options and charges?",
    a: "Delivery areas, charges and the available dates are shown at checkout." },
];

// a missing photo leaves the soft pink box behind it, so the page still looks fine
function Photo({ src, alt = "" }) {
  return (
    <img src={`/images/${src}`} alt={alt} loading="lazy"
      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  // there is no newsletter table, so signing up for offers means creating an account
  function onSubscribe(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") || "";
    navigate(`/login?register=1&email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="lp">
      <PublicHeader />

      {/* hero */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <p className="eyebrow lp-light">Cute companions. Lasting joy.</p>
          <h1 className="lp-hero-title">Little hugs.<br />Big comfort.</h1>
          <p className="lp-hero-text">For cosy moments, thoughtful surprises and the people who matter the most.</p>
          <div className="lp-actions">
            <Link to="/shop?category=Teddy%20Bears" className="btn btn-primary lp-btn">
              Explore our Teddy Collection <ArrowRight size={16} />
            </Link>
            <Link to="/shop" className="btn lp-btn lp-btn-ghost">Shop All Gifts</Link>
          </div>
          <div className="lp-dots" aria-hidden="true"><span className="on" /><span /><span /></div>
        </div>
        <span className="lp-hero-badge"><Heart size={14} fill="currentColor" /> Loved by 10,000+ happy customers</span>
      </section>

      {/* features strip */}
      <section className="lp-features">
        <div className="lp-wrap lp-features-grid">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="lp-feature">
              <Icon size={30} strokeWidth={1.6} />
              <div><strong>{title}</strong><span>{text}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* categories */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="eyebrow">Teddies, gift boxes, flowers and more</p>
          <h2>What would make them smile?</h2>
          <p className="lp-lead">A soft teddy, a box of sweet surprises, a fresh bouquet, or a little something for a lucky someone.</p>
          <div className="lp-cats">
            {CATEGORIES.map((c) => (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="lp-cat">
                <div className="lp-photo lp-cat-photo"><Photo src={c.img} alt={c.name} /></div>
                <span>{c.name} <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* favourites */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-row">
            <div>
              <p className="eyebrow">Our favourites for you</p>
              <h2>Easy to love. Lovely to give.</h2>
              <p className="lp-lead">Hand-picked teddy bears, gift boxes, and more for every special moment.</p>
            </div>
            <Link to="/shop" className="lp-link">View all gifts <ArrowRight size={16} /></Link>
          </div>
          <div className="lp-favs">
            {FAVOURITES.map((p) => (
              <div key={p.name} className="lp-fav">
                <Link to="/wishlist" className={`lp-heart${p.liked ? " on" : ""}`} aria-label={`Save ${p.name}`}>
                  <Heart size={16} fill={p.liked ? "currentColor" : "none"} />
                </Link>
                <Link to="/shop" className="lp-fav-link">
                  <div className="lp-photo lp-fav-photo"><Photo src={p.img} alt={p.name} /></div>
                  <div className="lp-fav-text"><span>{p.name}</span><strong>{p.price}</strong></div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* occasions */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="eyebrow">Why shop with us?</p>
          <h2>Big milestones. Little just-becauses.</h2>
          <div className="lp-occasions">
            {OCCASIONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="lp-occasion">
                <Icon size={30} strokeWidth={1.6} />
                <div><strong>{title}</strong><span>{text}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* gift wrapping */}
      <section className="lp-wrapping">
        <div className="lp-wrap lp-split">
          <div className="lp-photo lp-split-photo"><Photo src="wrap.jpg" alt="Gift being wrapped with a ribbon" /></div>
          <div>
            <p className="eyebrow">More than just a gift.</p>
            <h2 className="lp-big">A little thought.<br />Right down to<br />the ribbon.</h2>
            <p className="lp-lead">The right gift shows you care. From a soft and cosy teddy to a beautifully wrapped surprise, we help you make every moment feel a little more special.</p>
            <Link to="/shop" className="btn btn-primary lp-btn">Explore our wrapping options <ArrowRight size={16} /></Link>
            <p className="lp-note">Thoughtful wrapping, personal messages, and more at checkout.</p>
          </div>
        </div>
      </section>

      {/* premium band */}
      <section className="lp-premium">
        <div className="lp-wrap lp-premium-grid">
          <div className="lp-premium-text">
            <p className="eyebrow lp-light">Premium gifts, personal touch</p>
            <h2>Not just a gift.<br />Their kind of keepsake.</h2>
            <p>A little more personal, a lot more meaningful. Discover specially selected gifts that make every occasion unique.</p>
            <Link to="/shop?category=Personalized%20Gifts" className="btn lp-btn lp-btn-white">
              Browse personalized gifts <ArrowRight size={16} />
            </Link>
          </div>
          <Link to="/shop?category=Teddy%20Bears" className="lp-premium-card">
            <div className="lp-photo lp-premium-photo"><Photo src="premium-teddy.jpg" alt="" /></div>
            <span>Soft, huggable and always special. Find their perfect teddy. <ArrowRight size={14} /></span>
          </Link>
          <Link to="/shop?category=Personalized%20Gifts" className="lp-premium-card">
            <div className="lp-photo lp-premium-photo"><Photo src="premium-box.jpg" alt="" /></div>
            <span>Add a personal touch with custom messages. <ArrowRight size={14} /></span>
          </Link>
        </div>
      </section>

      {/* how it works */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="eyebrow">Thoughtful gifts, made simple</p>
          <h2>From a little idea to their doorstep.</h2>
          <div className="lp-steps">
            {STEPS.map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="lp-step">
                <span className="lp-step-n">{n}</span>
                <Icon size={20} strokeWidth={1.8} className="lp-step-icon" />
                <div><strong>{title}</strong><span>{text}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <div className="lp-wrap lp-faq">
          <div>
            <p className="eyebrow">Have questions?</p>
            <h2 className="lp-big">Good questions.<br />Thoughtful answers.</h2>
            <p className="lp-lead">Need a quick answer? Here are some common questions.</p>
          </div>
          <div>
            {FAQ.map((f) => (
              <details key={f.q} className="lp-qa">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* stay in touch */}
      <section className="lp-wrap">
        <div className="lp-news">
          <div>
            <p className="eyebrow">Stay in touch, get a little more</p>
            <h2>A little joy in your inbox.</h2>
            <p className="lp-lead">Get the latest offers, new arrivals and gift ideas straight to you.</p>
          </div>
          <div>
            <form className="lp-news-form" onSubmit={onSubscribe}>
              <label className="lp-news-input">
                <Mail size={18} />
                <input name="email" type="email" required placeholder="Enter your email address" aria-label="Email address" />
              </label>
              <button type="submit" className="btn btn-primary lp-btn">Subscribe <ArrowRight size={16} /></button>
            </form>
            <p className="lp-note">Don't worry, we only send useful updates and special offers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
