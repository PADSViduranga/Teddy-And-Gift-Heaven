import { useState } from "react";

export default function ProductPricingTable({ products, savingId, onSave }) {
  return (
    <section className="pricing-card">
      <div className="pricing-card-heading">
        <div>
          <h2>Product prices</h2>
          <p>Update the base price used before personalization charges.</p>
        </div>
      </div>
      {products.length === 0 ? (
        <p className="pricing-empty">No products are available yet.</p>
      ) : (
        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Base price</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product.productId}
                  product={product}
                  saving={savingId === product.productId}
                  onSave={onSave}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProductRow({ product, saving, onSave }) {
  const [price, setPrice] = useState(product.basePrice);

  function submit(event) {
    event.preventDefault();
    onSave(product.productId, price);
  }

  return (
    <tr>
      <td>
        <strong>{product.name}</strong>
        <span className="pricing-secondary">{product.description || "No description"}</span>
      </td>
      <td>
        <span className={product.active ? "status-pill active" : "status-pill inactive"}>
          {product.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <form className="inline-price-form" onSubmit={submit}>
          <label className="sr-only" htmlFor={`price-${product.productId}`}>
            Base price for {product.name}
          </label>
          <input
            id={`price-${product.productId}`}
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <button className="btn-secondary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </td>
      <td />
    </tr>
  );
}
