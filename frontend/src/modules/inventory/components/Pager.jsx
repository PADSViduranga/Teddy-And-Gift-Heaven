import { ChevronLeft, ChevronRight } from "lucide-react";

// "26–50 of 312" with previous / next buttons, for long tables.
export default function Pager({ page, size, total, onPage }) {
  if (!total) return null;
  const first = page * size + 1;
  const last = Math.min((page + 1) * size, total);
  return (
    <div className="inv-pager">
      <span className="text-muted">{first}–{last} of {total.toLocaleString("en-LK")}</span>
      <button type="button" className="inv-page" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      <button type="button" className="inv-page" onClick={() => onPage(page + 1)} disabled={last >= total} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
