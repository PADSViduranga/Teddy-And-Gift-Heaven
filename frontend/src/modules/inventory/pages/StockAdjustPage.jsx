import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import Pager from "../components/Pager";
import { errorText, num, useData, when } from "../components/helpers";
import { adjustStock, getItems, getMovements, getOwners, getSummary } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 20 – Stock adjustment (Member 4). Owner and inventory manager.
// For corrections after a stock count. Calls sp_adjust_stock: a reason is required, and changes
// bigger than the approval limit need the owner's approval (checked again by the database).

const EMPTY = { itemId: "", direction: "add", qty: "", reason: "", approvedBy: "" };
const SIZE = 10;

export default function StockAdjustPage() {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ kind: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const items = useData(getItems, []);
  const owners = useData(getOwners, []);
  const summary = useData(getSummary, []);
  const history = useData(() => getMovements({ type: "ADJUSTMENT", page, size: SIZE }), [page]);

  const limit = Number(summary.data?.approval_limit || 0);
  const item = (items.data || []).find((i) => String(i.item_id) === form.itemId);
  const qty = Number(form.qty || 0);
  const delta = form.direction === "add" ? qty : -qty;
  const needsApproval = limit > 0 && qty > limit;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setMessage({ kind: "", text: "" });
    setSaving(true);
    try {
      await adjustStock({
        itemId: Number(form.itemId), qtyDelta: delta, reason: form.reason.trim(),
        approvedBy: form.approvedBy ? Number(form.approvedBy) : null,
      });
      setMessage({ kind: "success", text: `Saved: ${item?.name} ${delta > 0 ? "+" : ""}${delta}.` });
      setForm(EMPTY);
      items.reload();
      history.reload();
    } catch (err) {
      setMessage({ kind: "error", text: errorText(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Stock adjustment" subtitle="Correct the count after a stock check. Every change is logged with your name." />
      <Notice kind={message.kind || "error"}>{message.text}</Notice>

      <div className="inv-split">
        <form className="card inv-stack" onSubmit={save}>
          <h3>New adjustment</h3>
          <div className="field">
            <label htmlFor="a-item">Item</label>
            <select id="a-item" className="select" required value={form.itemId} onChange={set("itemId")}>
              <option value="">Choose a product or packaging item</option>
              {(items.data || []).map((i) => (
                <option key={i.item_id} value={i.item_id}>
                  {i.name}{i.item_kind === "PACKAGING" ? " (packaging)" : ""} – {num(i.qty_on_hand)} on hand
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="a-dir">Change</label>
            <select id="a-dir" className="select" value={form.direction} onChange={set("direction")}>
              <option value="add">Add stock (found more)</option>
              <option value="remove">Remove stock (counted less)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="a-qty">Quantity</label>
            <input id="a-qty" className="input" type="number" min="1" required value={form.qty} onChange={set("qty")} />
            {limit > 0 && <p className="inv-hint">More than {limit} needs the owner's approval.</p>}
          </div>
          {needsApproval && (
            <div className="field">
              <label htmlFor="a-owner">Approved by</label>
              <select id="a-owner" className="select" required value={form.approvedBy} onChange={set("approvedBy")}>
                <option value="">Choose the owner</option>
                {(owners.data || []).map((o) => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="a-reason">Reason</label>
            <input id="a-reason" className="input" required maxLength={255} placeholder="e.g. Monthly stock count"
              value={form.reason} onChange={set("reason")} />
          </div>
          {item && qty > 0 && (
            <div className="inv-preview">
              <span>On hand after saving</span>
              <strong>{num(item.qty_on_hand)} → {num(Number(item.qty_on_hand) + delta)}</strong>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save adjustment"}</button>
          </div>
        </form>

        <div>
          <h3>Recent adjustments</h3>
          <Notice>{history.error}</Notice>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Item</th><th className="num">Change</th><th>Reason</th><th>By</th><th>Approved by</th></tr></thead>
              <tbody>
                {history.loading && <tr><td colSpan={6} className="inv-empty">Loading…</td></tr>}
                {!history.loading && !history.data?.items?.length && (
                  <tr><td colSpan={6} className="inv-empty">No adjustments yet.</td></tr>
                )}
                {!history.loading && (history.data?.items || []).map((m) => (
                  <tr key={m.movement_id}>
                    <td className="inv-nowrap text-muted">{when(m.created_at)}</td>
                    <td>{m.item_name}</td>
                    <td className={`num ${m.quantity > 0 ? "inv-in" : "inv-out"}`}>{m.quantity > 0 ? "+" : ""}{num(m.quantity)}</td>
                    <td>{m.reason}</td>
                    <td>{m.created_by_name || "–"}</td>
                    <td>{m.approved_by_name || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={SIZE} total={history.data?.total || 0} onPage={setPage} />
        </div>
      </div>
    </>
  );
}
