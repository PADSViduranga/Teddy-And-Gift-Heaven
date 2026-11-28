import { useCallback, useEffect, useRef, useState } from "react";
import { getSession } from "../../../shared/utils/session";

// Small shared helpers for Member 4's pages.

export const num = (v) => (v === null || v === undefined ? "–" : Number(v).toLocaleString("en-LK"));
export const money = (v) =>
  v === null || v === undefined ? "–"
    : `LKR ${Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// for stat cards: LKR 8.2M, LKR 45,000
export const moneyShort = (v) => {
  if (v === null || v === undefined) return "–";
  const n = Number(v);
  return n >= 1e6 ? `LKR ${(n / 1e6).toFixed(1)}M` : `LKR ${n.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
};
export const when = (v) =>
  v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–";

// the role of whoever is logged in, e.g. "OWNER" or "INVENTORY_MANAGER"
export const myRole = () => getSession()?.role;
export const canManage = () => ["OWNER", "INVENTORY_MANAGER"].includes(myRole());

// Turns an error from the backend into a sentence for the user.
// Our backend already sends a plain message (e.g. "Sorry, only 2 of Big Brown Teddy left").
export function errorText(e) {
  const status = e?.response?.status;
  const body = e?.response?.data;
  if (status === 401 || status === 403) return "You don't have access to this. Log in with the right role.";
  if (body?.fields && Object.keys(body.fields).length) {
    return Object.entries(body.fields).map(([k, v]) => `${k}: ${v}`).join(" · ");
  }
  if (body?.message) return body.message;
  if (!e?.response) return "Couldn't reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
}

// Loads data for a page; reload() fetches it again after a change.
// deps: the values that should trigger a new load (filters, page number).
export function useData(loader, deps = []) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const key = JSON.stringify([...deps, tick]);
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  useEffect(() => {
    let alive = true;
    loaderRef.current()
      .then((d) => alive && setResult({ key, data: d, error: "" }))
      .catch((e) => alive && setResult({ key, data: null, error: errorText(e) }));
    return () => { alive = false; };
  }, [key]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const loading = result.key !== key;
  return { data: result.data, error: loading ? "" : result.error, loading, reload };
}

// green / amber / red badge for a stock level
export function stockBadge(row) {
  if (Number(row.qty_available) <= 0) return { cls: "badge-danger", text: "Out of stock" };
  if (Number(row.is_low)) return { cls: "badge-warning", text: "Low" };
  return { cls: "badge-success", text: "In stock" };
}

export const TYPE_LABEL = {
  SALE: "Sale", RESERVE: "Reserved", RELEASE: "Released", RECEIPT: "Received",
  DAMAGE: "Damaged", LOSS: "Lost", RETURN: "Returned", ADJUSTMENT: "Adjustment",
};
