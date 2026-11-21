import { useState } from "react";

const emptyForm = { name: "", extraCost: "", extraMinutes: "" };

export default function PersonalizationOptionForm({ editing, onCancel, onSubmit, saving }) {
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          extraCost: editing.extraCost,
          extraMinutes: editing.extraMinutes,
        }
      : emptyForm,
  );

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="pricing-form" onSubmit={submit}>
      <h3>{editing ? "Edit personalization" : "Add personalization"}</h3>
      <label>
        Name
        <input
          required
          maxLength="80"
          name="name"
          onChange={updateField}
          value={form.name}
        />
      </label>
      <label>
        Additional cost
        <input
          required
          min="0"
          name="extraCost"
          onChange={updateField}
          step="0.01"
          type="number"
          value={form.extraCost}
        />
      </label>
      <label>
        Preparation minutes
        <input
          required
          min="0"
          name="extraMinutes"
          onChange={updateField}
          type="number"
          value={form.extraMinutes}
        />
      </label>
      <div className="pricing-form-actions">
        <button className="btn-primary" disabled={saving} type="submit">
          {saving ? "Saving..." : editing ? "Update option" : "Add option"}
        </button>
        {editing && (
          <button className="btn-quiet" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
