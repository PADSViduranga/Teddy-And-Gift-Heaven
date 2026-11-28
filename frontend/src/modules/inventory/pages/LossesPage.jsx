import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Notice from "../components/Notice";
import Pager from "../components/Pager";
import { errorText, num, TYPE_LABEL, useData, when } from "../components/helpers";
import { getItems, getLosses, recordLoss } from "../api/inventoryApi";
import "../components/inventory.css";

// Page 21 – Damaged / lost / returned (Member 4). Owner, order staff, inventory manager, packer.
// Calls sp_record_loss. A reason is always required; damage and loss can't remove reserved stock.

const EMPTY = { itemId: "", type: "DAMAGE", quantity: "1", reason: "" };
const REASONS = {
  DAMAGE: ["Torn seam", "Crushed box", "Wilted flowers", "Stained"],
  LOSS: ["Missing after stock count", "Lost in delivery"],
  RETURN: ["Customer return", "Wrong item sent back", "Failed delivery returned"],
};
const BADGE = { DAMAGE: "badge-danger", LOSS: "badge-warning", RETURN: "badge-info" };
const SIZE = 25;

export default function LossesPage() {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ kind: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const items = useData(getItems, []);
  const list = useData(() => getLosses({ type: typeFilter || undefined, page, size: SIZE }), [typeFilter, page]);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setMessage({ kind: "", text: "" });
    setSaving(true);
    try {
      await recordLoss({ itemId: Number(form.itemId), type: form.type, quantity: Number(form.quantity), reason: form.reason.trim() });
      setMessage({ kind: "success", text: "Recorded. The stock count has been updated." });
      setForm(EMPTY);
      items.reload();
      list.reload();
    } catch (err) {
      setMessage({ kind: "error", text: errorText(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Damaged, lost and returned" subtitle="Record stock that left or came back outside a normal sale" />
      <Notice kind={message.kind || "error"}>{message.text}</Notice>

      <div className="inv-split">
        <form className="card inv-stack" onSubmit={save}>
          <h3>Record stock</h3>
          <div className="field">
            <label htmlFor="l-type">What happened</label>
            <select id="l-type" className="select" value={form.type} onChange={set("type")}>
              <option value="DAMAGE">Damaged (stock goes down)</option>
              <option value="LOSS">Lost (stock goes down)</option>
              <option value="RETURN">Returned (stock goes up)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="l-item">Item</label>
            <select id="l-item" className="select" required value={form.itemId} onChange={set("itemId")}>
              <option value="">Choose an item</option>
              {(items.data || []).map((i) => (
                <option key={i.item_id} value={i.item_id}>{i.name} – {num(i.qty_available)} available</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="l-qty">Quantity</label>
            <input id="l-qty" className="input" type="number" min="1" required value={form.quantity} onChange={set("quantity")} />
          </div>
          <div className="field">
            <label htmlFor="l-reason">Reason</label>
            <input id="l-reason" className="input" list="l-reasons" required maxLength={255} value={form.reason} onChange={set("reason")} />
            <datalist id="l-reasons">{REASONS[form.type].map((r) => <option key={r} value={r} />)}</datalist>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Record"}</button>
          </div>
        </form>

        <div>
          <div className="filters">
            <select className="select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} aria-label="Type">
              <option value="">Damaged, lost and returned</option>
              <option value="DAMAGE">Damaged only</option>
              <option value="LOSS">Lost only</option>
              <option value="RETURN">Returned only</option>
            </select>
          </div>
          <Notice>{list.error}</Notice>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Item</th><th>Type</th><th className="num">Qty</th><th>Reason</th><th>Recorded by</th></tr></thead>
              <tbody>
                {list.loading && <tr><td colSpan={6} className="inv-empty">Loading…</td></tr>}
                {!list.loading && !list.data?.items?.length && <tr><td colSpan={6} className="inv-empty">Nothing recorded yet.</td></tr>}
                {!list.loading && (list.data?.items || []).map((m) => (
                  <tr key={m.movement_id}>
                    <td className="inv-nowrap text-muted">{when(m.created_at)}</td>
                    <td>{m.item_name}</td>
                    <td><span className={`badge ${BADGE[m.type]}`}>{TYPE_LABEL[m.type]}</span></td>
                    <td className="num">{num(m.quantity)}</td>
                    <td>{m.reason}</td>
                    <td>{m.created_by_name || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={SIZE} total={list.data?.total || 0} onPage={setPage} />
        </div>
      </div>
    </>
  );
}
