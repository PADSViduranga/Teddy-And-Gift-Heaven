// Number and date formatting shared by Member 10's pages.
export const num = (v) => (v === null || v === undefined ? "–" : Number(v).toLocaleString("en-LK"));
export const money = (v) =>
  v === null || v === undefined ? "–" : `LKR ${Number(v).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
export const pct = (v) => (v === null || v === undefined ? "–" : `${Number(v).toFixed(1)}%`);
export const day = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "–");
export const fullDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–";
export const monthLabel = (ym) => {
  const [y, m] = String(ym).split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
};
// short axis numbers: 12,000 -> 12K, 1,500,000 -> 1.5M
export const compact = (v) => {
  const n = Number(v);
  if (Math.abs(n) >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e4) return `${+(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString("en-LK");
};
