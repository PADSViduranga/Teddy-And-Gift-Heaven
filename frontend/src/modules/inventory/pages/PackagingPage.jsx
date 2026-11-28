import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import { errorText, num, stockBadge, useCanManage, useData } from "../components/helpers";
import { addPackaging, getPackaging, updatePackaging } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 22 – Packaging materials (Member 4). Owner and inventory manager can add and edit;
// packers can view the levels. Boxes, ribbons, cards and wrapping paper use the same stock rules
// as products (they are stock_items too), so low-stock alerts work for them as well.

const EMPTY = { name: "", unit: "piece", reorderLevel: "10", openingQty: "0" };

export default function PackagingPage() {
  const manage = useCanManage();
  const { data, error, loading, reload } = useData(getPackaging, []);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ kind: "", text: "" });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function startEdit(p) {
    setEditId(p.item_id);
    setForm({ name: p.name, unit: p.unit || "piece", reorderLevel: String(p.reorder_level), openingQty: "0" });
    setMessage({ kind: "", text: "" });
  }

  async function save(e) {
    e.preventDefault();
    setMessage({ kind: "", text: "" });
    const body = { name: form.name.trim(), unit: form.unit.trim(), reorderLevel: Number(form.reorderLevel), openingQty: Number(form.openingQty) };
    try {
      if (editId) await updatePackaging(editId, body); else await addPackaging(body);
      setMessage({ kind: "success", text: editId ? "Saved." : `Added “${body.name}”.` });
      setForm(EMPTY);
      setEditId(null);
      reload();
    } catch (err) {
      setMessage({ kind: "error", text: errorText(err) });
    }
  }

  const table = (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Material</th><th>Unit</th><th className="num">On hand</th><th className="num">Reorder at</th><th>Status</th>{manage && <th />}</tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={6} className="inv-empty">Loading…</td></tr>}
          {!loading && !data?.length && !error && <tr><td colSpan={6} className="inv-empty">No packaging materials yet.</td></tr>}
          {!loading && (data || []).map((p) => {
            const badge = stockBadge(p);
            return (
              <tr key={p.item_id}>
                <td><span className="inv-name">{p.name}</span></td>
                <td>{p.unit}</td>
                <td className="num"><strong>{num(p.qty_on_hand)}</strong></td>
                <td className="num">{num(p.reorder_level)}</td>
                <td><span className={`badge ${badge.cls}`}>{badge.text}</span></td>
                {manage && <td className="inv-actions"><button type="button" className="inv-link" onClick={() => startEdit(p)}>Edit</button></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <PageHeader title="Packaging materials" subtitle="Boxes, ribbons, cards and wrapping paper" />
      <Notice kind={message.kind || "error"}>{message.text}</Notice>
      <Notice>{error}</Notice>

      {!manage ? table : (
        <div className="inv-split">
          <form className="card inv-stack" onSubmit={save}>
            <h3>{editId ? "Edit material" : "Add a material"}</h3>
            <div className="field">
              <label htmlFor="k-name">Name</label>
              <input id="k-name" className="input" required maxLength={120} placeholder="e.g. Red ribbon" value={form.name} onChange={set("name")} />
            </div>
            <div className="field">
              <label htmlFor="k-unit">Counted in</label>
              <input id="k-unit" className="input" required maxLength={20} list="k-units" value={form.unit} onChange={set("unit")} />
              <datalist id="k-units"><option value="piece" /><option value="metre" /><option value="roll" /><option value="sheet" /></datalist>
            </div>
            <div className="field">
              <label htmlFor="k-reorder">Reorder level</label>
              <input id="k-reorder" className="input" type="number" min="0" required value={form.reorderLevel} onChange={set("reorderLevel")} />
            </div>
            {editId ? (
              <p className="inv-hint">To change the amount in stock, use <Link className="inv-link" to="/staff/stock/adjust">Stock adjustment</Link>.</p>
            ) : (
              <div className="field">
                <label htmlFor="k-open">Opening stock</label>
                <input id="k-open" className="input" type="number" min="0" required value={form.openingQty} onChange={set("openingQty")} />
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">{editId ? "Save" : "Add material"}</button>
              {editId && <button className="btn btn-outline" type="button" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
            </div>
          </form>
          {table}
        </div>
      )}
    </>
  );
}
