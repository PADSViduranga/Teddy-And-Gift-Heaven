// A coloured message box: kind = "error" or "success".
export default function Notice({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`inv-notice inv-notice-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}
