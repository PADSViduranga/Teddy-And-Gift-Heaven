import { Package, ShoppingBag, Truck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { usePageInfo } from "./staffContext";

const OWNER_BY_PAGE = (no) =>
  no <= 2 ? 1 : no <= 11 || no === 69 ? 2 : no <= 13 ? 3 : no <= 25 ? 4 : no <= 32 ? 5 :
  no <= 38 ? 6 : no <= 44 ? 7 : no <= 51 ? 8 : no <= 57 ? 9 : 10;

// Shown until a member builds the real page. It also shows the standard staff page pattern:
// header, stat cards, filter row, table. Copy this structure when you build yours.
export default function Placeholder() {
  const page = usePageInfo();
  return (
    <>
      <PageHeader title={page?.label || "Page"} subtitle={`Page ${page?.no} · built by Member ${OWNER_BY_PAGE(page?.no || 0)}`}>
        <button className="btn btn-outline" type="button">Export</button>
        <button className="btn btn-primary" type="button">Add new</button>
      </PageHeader>
      <div className="stats">
        <StatCard label="Sample count" value="128" hint="placeholder" icon={ShoppingBag} />
        <StatCard label="Sample count" value="24" hint="placeholder" icon={Package} />
        <StatCard label="Sample count" value="9" hint="placeholder" icon={Truck} />
      </div>
      <div className="filters">
        <input className="input" placeholder="Search..." />
        <select className="select"><option>All statuses</option></select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Column</th><th>Column</th><th>Status</th><th className="num">Amount</th></tr></thead>
          <tbody>
            <tr><td>Not built yet</td><td>—</td><td><span className="badge badge-warning">Pending</span></td><td className="num">0.00</td></tr>
            <tr><td>Not built yet</td><td>—</td><td><span className="badge badge-success">Done</span></td><td className="num">0.00</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
