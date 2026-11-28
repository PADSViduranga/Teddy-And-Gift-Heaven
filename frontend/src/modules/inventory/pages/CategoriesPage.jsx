import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import { errorText, num, useData } from "../components/helpers";
import { addCategory, deleteCategory, getCategories, renameCategory } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 19 – Categories (Member 4). Owner and inventory manager.
// A category that still has products can't be deleted: the database's foreign key refuses it.

export default function CategoriesPage() {
  const { data, error, loading, reload } = useData(getCategories, []);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState({ kind: "", text: "" });

  async function run(action, done) {
    setMessage({ kind: "", text: "" });
    try {
      await action();
      setMessage({ kind: "success", text: done });
      reload();
      return true;
    } catch (e) {
      setMessage({ kind: "error", text: errorText(e) });
      return false;
    }
  }

  async function add(e) {
    e.preventDefault();
    if (await run(() => addCategory(name.trim()), `Added “${name.trim()}”.`)) setName("");
  }

  async function saveEdit(c) {
    if (await run(() => renameCategory(c.category_id, editName.trim()), "Category renamed.")) setEditId(null);
  }

  function remove(c) {
    if (!window.confirm(`Delete the category “${c.name}”?`)) return;
    run(() => deleteCategory(c.category_id), `Deleted “${c.name}”.`);
  }

  return (
    <>
      <PageHeader title="Categories" subtitle="Group products so customers and staff can find them" />
      <Notice kind={message.kind || "error"}>{message.text}</Notice>
      <Notice>{error}</Notice>

      <div className="inv-split">
        <form className="card" onSubmit={add}>
          <h3>Add a category</h3>
          <div className="field">
            <label htmlFor="c-name">Name</label>
            <input id="c-name" className="input" required maxLength={80} placeholder="e.g. Candles" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-actions"><button className="btn btn-primary" type="submit">Add category</button></div>
        </form>

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Category</th><th className="num">Products</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={3} className="inv-empty">Loading…</td></tr>}
              {!loading && (data || []).map((c) => (
                <tr key={c.category_id}>
                  <td>
                    {editId === c.category_id ? (
                      <input className="input" value={editName} maxLength={80} autoFocus aria-label="New name"
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(c)} />
                    ) : <span className="inv-name">{c.name}</span>}
                  </td>
                  <td className="num">{num(c.product_count)}</td>
                  <td className="inv-actions">
                    {editId === c.category_id ? (
                      <>
                        <button type="button" className="inv-link" onClick={() => saveEdit(c)}>Save</button>
                        <button type="button" className="inv-link" onClick={() => setEditId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="inv-link" onClick={() => { setEditId(c.category_id); setEditName(c.name); }}>Rename</button>
                        <button type="button" className="inv-link inv-link-danger" onClick={() => remove(c)}
                          disabled={Number(c.product_count) > 0}
                          title={Number(c.product_count) > 0 ? "Move or remove its products first" : undefined}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
