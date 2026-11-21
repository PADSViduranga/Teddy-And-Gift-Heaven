import { useState } from "react";

export default function QuotePreview({ products, options, onQuote, loading }) {
  const [productId, setProductId] = useState(products[0]?.productId || "");
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState({});
  const [text, setText] = useState({});

  function toggleOption(optionId) {
    setSelected((current) => ({ ...current, [optionId]: !current[optionId] }));
  }

  function submit(event) {
    event.preventDefault();
    onQuote({
      productId: Number(productId),
      quantity: Number(quantity),
      selectedOptions: options
        .filter((option) => selected[option.optionId])
        .map((option) => ({ optionId: option.optionId, customText: text[option.optionId] || null })),
    });
  }

  return (
    <section className="pricing-card">
      <div className="pricing-card-heading">
        <div>
          <h2>Price preview</h2>
          <p>Check a product total before it is added to an order.</p>
        </div>
      </div>
      {products.length === 0 ? (
        <p className="pricing-empty">Add a product before calculating a quote.</p>
      ) : (
        <form className="quote-form" onSubmit={submit}>
          <label>
            Product
            <select value={productId} onChange={(event) => setProductId(event.target.value)}>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              min="1"
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              value={quantity}
            />
          </label>
          <fieldset>
            <legend>Personalization options</legend>
            {options.length === 0 && <p className="pricing-secondary">No active options.</p>}
            {options.map((option) => (
              <div className="quote-option" key={option.optionId}>
                <label>
                  <input
                    checked={Boolean(selected[option.optionId])}
                    onChange={() => toggleOption(option.optionId)}
                    type="checkbox"
                  />
                  {option.name} (+{option.extraCost.toFixed(2)})
                </label>
                {selected[option.optionId] && (
                  <input
                    maxLength="255"
                    onChange={(event) =>
                      setText((current) => ({
                        ...current,
                        [option.optionId]: event.target.value,
                      }))
                    }
                    placeholder="Optional custom message"
                    value={text[option.optionId] || ""}
                  />
                )}
              </div>
            ))}
          </fieldset>
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Calculating..." : "Calculate total"}
          </button>
        </form>
      )}
    </section>
  );
}
