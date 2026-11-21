// A number card for dashboards and the top of list pages.
export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="stat-card">
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
      {Icon && <span className="stat-icon"><Icon size={20} /></span>}
    </div>
  );
}
