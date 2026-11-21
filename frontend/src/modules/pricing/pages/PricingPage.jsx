import { useEffect, useState } from "react";
import {
  createPersonalizationOption,
  getPersonalizationOptions,
  getProducts,
  getQuote,
  updatePersonalizationOption,
  updatePersonalizationOptionStatus,
  updateProductPrice,
} from "../api/pricingApi";
import PersonalizationOptionForm from "../components/PersonalizationOptionForm";
import ProductPricingTable from "../components/ProductPricingTable";
import QuotePreview from "../components/QuotePreview";
import "./PricingPage.css";

export default function PricingPage() {
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingOption, setSavingOption] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([getProducts(), getPersonalizationOptions()])
      .then(([loadedProducts, loadedOptions]) => {
        setProducts(loadedProducts);
        setOptions(loadedOptions);
      })
      .catch(() => setError("Pricing data could not be loaded. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  async function savePrice(productId, basePrice) {
    setSavingId(productId);
    setError("");
    setNotice("");
    try {
      const updated = await updateProductPrice(productId, basePrice);
      setProducts((current) =>
        current.map((product) => (product.productId === productId ? updated : product)),
      );
      setNotice("Product price updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Product price could not be updated.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveOption(form) {
    setSavingOption(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        name: form.name,
        extraCost: Number(form.extraCost),
        extraMinutes: Number(form.extraMinutes),
      };
      const saved = editing
        ? await updatePersonalizationOption(editing.optionId, payload)
        : await createPersonalizationOption(payload);
      setOptions((current) =>
        editing
          ? current.map((option) => (option.optionId === saved.optionId ? saved : option))
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditing(null);
      setNotice(editing ? "Personalization option updated." : "Personalization option added.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Personalization option could not be saved.");
    } finally {
      setSavingOption(false);
    }
  }

  async function toggleOption(option) {
    try {
      const updated = await updatePersonalizationOptionStatus(option.optionId, !option.active);
      setOptions((current) =>
        current.map((item) => (item.optionId === updated.optionId ? updated : item)),
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Option status could not be updated.");
    }
  }

  async function calculateQuote(payload) {
    setQuoteLoading(true);
    setError("");
    try {
      setQuote(await getQuote(payload));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "The quote could not be calculated.");
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }

  if (loading) return <main className="pricing-page"><p>Loading pricing...</p></main>;

  return (
    <main className="pricing-page">
      <header className="pricing-page-heading">
        <div>
          <p className="pricing-eyebrow">Owner workspace</p>
          <h1>Personalization &amp; Pricing</h1>
          <p>Manage product prices and the finishing touches customers can add to gifts.</p>
        </div>
      </header>
      {error && <div className="pricing-alert error" role="alert">{error}</div>}
      {notice && <div className="pricing-alert success" role="status">{notice}</div>}
      <ProductPricingTable products={products} savingId={savingId} onSave={savePrice} />
      <div className="pricing-grid">
        <section className="pricing-card">
          <div className="pricing-card-heading">
            <div>
              <h2>Personalization options</h2>
              <p>Active options are available for all products.</p>
            </div>
          </div>
          {options.length === 0 ? (
            <p className="pricing-empty">No personalization options configured.</p>
          ) : (
            <div className="option-list">
              {options.map((option) => (
                <div className="option-row" key={option.optionId}>
                  <div>
                    <strong>{option.name}</strong>
                    <span className="pricing-secondary">
                      +{option.extraCost.toFixed(2)} · {option.extraMinutes} minutes
                    </span>
                  </div>
                  <div className="option-actions">
                    <span className={option.active ? "status-pill active" : "status-pill inactive"}>
                      {option.active ? "Active" : "Inactive"}
                    </span>
                    <button className="btn-quiet" onClick={() => setEditing(option)} type="button">
                      Edit
                    </button>
                    <button className="btn-quiet" onClick={() => toggleOption(option)} type="button">
                      {option.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PersonalizationOptionForm
            key={editing?.optionId || "new"}
            editing={editing}
            onCancel={() => setEditing(null)}
            onSubmit={saveOption}
            saving={savingOption}
          />
        </section>
        <QuotePreview
          loading={quoteLoading}
          onQuote={calculateQuote}
          options={options.filter((option) => option.active)}
          products={products.filter((product) => product.active)}
        />
      </div>
      {quote && (
        <section className="pricing-card quote-result">
          <h2>Quote total</h2>
          <div className="quote-breakdown">
            <span>Base subtotal <strong>{quote.baseSubtotal.toFixed(2)}</strong></span>
            <span>Personalization <strong>{quote.personalizationSubtotal.toFixed(2)}</strong></span>
            <span className="quote-total">Total <strong>{quote.total.toFixed(2)}</strong></span>
          </div>
        </section>
      )}
    </main>
  );
}
