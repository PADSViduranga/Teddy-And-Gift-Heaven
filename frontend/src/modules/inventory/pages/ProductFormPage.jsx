import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import { errorText, money, num, useData } from "../components/helpers";
import { addProduct, getCategories, getProduct, updateProduct } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 18 – Add product (/staff/products/new) and Edit product (/staff/products/:id/edit). Member 4.
// Adding calls sp_add_product: the product and its opening stock are saved together or not at all.
// Editing never changes price or stock: price -> Pricing page (Member 6), stock -> Stock adjustment.

const EMPTY = { name: "", categoryId: "", price: "", description: "", imageUrl: "", reorderLevel: "5", openingQty: "0", active: true };

export default function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const categories = useData(getCategories, []);

  // when editing, fill the form with the saved product
  useEffect(() => {
    if (!editing) return;
    getProduct(id)
      .then((p) => {
        setCurrent(p);
        setForm({
          name: p.name, categoryId: String(p.category_id), price: p.price, description: p.description || "",
          imageUrl: p.image_url || "", reorderLevel: String(p.reorder_level), openingQty: "0", active: Boolean(Number(p.is_active)),
        });
      })
      .catch((e) => setError(errorText(e)));
  }, [editing, id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const common = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      reorderLevel: Number(form.reorderLevel),
    };
    try {
      if (editing) {
        await updateProduct(id, { ...common, active: form.active });
      } else {
        await addProduct({ ...common, price: Number(form.price), openingQty: Number(form.openingQty) });
      }
      navigate("/staff/products");
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={editing ? "Edit product" : "Add product"}
        subtitle={editing ? "Change the details customers and staff see" : "Add something new to sell"} />

      <form className="card" onSubmit={save}>
        <Notice>{error}</Notice>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="p-name">Product name</label>
            <input id="p-name" className="input" required maxLength={120} value={form.name} onChange={set("name")} />
          </div>
          <div className="field">
            <label htmlFor="p-cat">Category</label>
            <select id="p-cat" className="select" required value={form.categoryId} onChange={set("categoryId")}>
              <option value="">Choose a category</option>
              {(categories.data || []).map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="p-price">Price (LKR)</label>
            {editing ? (
              <>
                <input id="p-price" className="input" value={money(current?.price)} disabled />
                <p className="inv-hint">Change prices on the Pricing page, so the price history is kept.</p>
              </>
            ) : (
              <input id="p-price" className="input" type="number" min="0" step="0.01" required value={form.price} onChange={set("price")} />
            )}
          </div>
          <div className="field">
            <label htmlFor="p-reorder">Reorder level</label>
            <input id="p-reorder" className="input" type="number" min="0" required value={form.reorderLevel} onChange={set("reorderLevel")} />
            <p className="inv-hint">A low-stock alert opens when available stock drops to this number.</p>
          </div>

          <div className="field">
            <label htmlFor="p-stock">{editing ? "Stock on hand" : "Opening stock"}</label>
            {editing ? (
              <>
                <input id="p-stock" className="input" value={`${num(current?.qty_on_hand)} (${num(current?.qty_available)} available)`} disabled />
                <p className="inv-hint">Use <Link className="inv-link" to="/staff/stock/adjust">Stock adjustment</Link> to change it.</p>
              </>
            ) : (
              <input id="p-stock" className="input" type="number" min="0" required value={form.openingQty} onChange={set("openingQty")} />
            )}
          </div>
          <div className="field">
            <label htmlFor="p-img">Image link (optional)</label>
            <input id="p-img" className="input" type="url" maxLength={255} placeholder="https://…" value={form.imageUrl} onChange={set("imageUrl")} />
          </div>

          <div className="field inv-full">
            <label htmlFor="p-desc">Description (optional)</label>
            <textarea id="p-desc" className="input inv-textarea" value={form.description} onChange={set("description")} />
          </div>

          {editing && (
            <label className="inv-check inv-full">
              <input type="checkbox" checked={form.active} onChange={set("active")} /> On sale (customers can see and buy it)
            </label>
          )}
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save product"}</button>
          <Link className="btn btn-outline inv-btn" to="/staff/products">Cancel</Link>
        </div>
      </form>
    </>
  );
}
