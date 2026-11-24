import { useState } from "react";
import { compact } from "./format";
import "./charts.css";

// Small SVG charts for Member 10's pages. No chart library needed.
// Rules: one y-axis, thin marks, 4px rounded bar ends, hover tooltips, legend only for 2+ series.

const W = 720, PAD = { t: 16, r: 56, b: 28, l: 48 };

// round steps for the y-axis: tries 4, 5 or 6 steps and keeps the one with the least empty space
function niceScale(v) {
  if (!(v > 0)) return { max: 1, ticks: 4 };
  let best = null;
  [4, 5, 6].forEach((ticks) => {
    const raw = v / ticks;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= raw);
    if (!best || step * ticks < best.max) best = { max: step * ticks, ticks };
  });
  return best;
}

function Axis({ max, h, ticks }) {
  const ys = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);
  return (
    <>
      <g className="rp-grid">
        {ys.map((v) => {
          const y = PAD.t + (h - PAD.t - PAD.b) * (1 - v / max);
          return <line key={v} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} />;
        })}
      </g>
      <g className="rp-axis">
        {ys.map((v) => {
          const y = PAD.t + (h - PAD.t - PAD.b) * (1 - v / max);
          return <text key={v} x={PAD.l - 8} y={y + 4} textAnchor="end">{compact(v)}</text>;
        })}
      </g>
    </>
  );
}

// a column path with a 4px rounded top and a square base
function columnPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

// one series over time: line with a light area wash, crosshair tooltip, value at the end
export function LineChart({ points, format = compact, height = 240, name = "Value" }) {
  const [hover, setHover] = useState(null);
  if (!points?.length) return <p className="text-muted">No data for this period.</p>;
  const { max, ticks } = niceScale(Math.max(...points.map((p) => Number(p.y) || 0)));
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const x = (i) => PAD.l + (points.length === 1 ? iw / 2 : (iw * i) / (points.length - 1));
  const y = (v) => PAD.t + ih * (1 - (Number(v) || 0) / max);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.y)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD.t + ih} L${x(0)},${PAD.t + ih} Z`;
  const step = Math.max(1, Math.ceil(points.length / 8));
  const last = points[points.length - 1];

  return (
    <div className="rp-chart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={name}>
        <Axis max={max} h={height} ticks={ticks} />
        <g className="rp-axis">
          {points.map((p, i) => (i % step === 0 || i === points.length - 1) && (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle">{p.label}</text>
          ))}
        </g>
        <path d={area} className="rp-area" fill="var(--series-1)" />
        <path d={line} className="rp-line" stroke="var(--series-1)" />
        <circle cx={x(points.length - 1)} cy={y(last.y)} r="4" className="rp-dot" fill="var(--series-1)" />
        <text x={x(points.length - 1) + 8} y={y(last.y) + 4} className="rp-endlabel">{compact(last.y)}</text>
        {hover !== null && (
          <>
            <line className="rp-cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} />
            <circle cx={x(hover)} cy={y(points[hover].y)} r="5" className="rp-dot" fill="var(--series-1)" />
          </>
        )}
        {points.map((p, i) => (
          <rect key={i} className="rp-hit" x={x(i) - iw / points.length / 2} y={PAD.t}
            width={Math.max(iw / points.length, 6)} height={ih} onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="rp-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].y) / height) * 100}%` }}>
          <strong>{points[hover].label}</strong>{name}: {format(points[hover].y)}
        </div>
      )}
    </div>
  );
}

// columns for categories; one or more series side by side (legend from 2 series)
export function ColumnChart({ labels, series, format = compact, height = 260 }) {
  const [hover, setHover] = useState(null);
  if (!labels?.length || !series?.length) return <p className="text-muted">No data.</p>;
  const { max, ticks } = niceScale(Math.max(...series.flatMap((s) => s.values.map((v) => Number(v) || 0))));
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const band = iw / labels.length;
  const barW = Math.min(24, (band * 0.7 - 2 * (series.length - 1)) / series.length);
  const groupW = barW * series.length + 2 * (series.length - 1);

  return (
    <div className="rp-chart" onMouseLeave={() => setHover(null)}>
      {series.length > 1 && (
        <div className="rp-legend">
          {series.map((s, i) => <span key={s.name}><i style={{ background: `var(--series-${i + 1})` }} />{s.name}</span>)}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={series.map((s) => s.name).join(", ")}>
        <Axis max={max} h={height} ticks={ticks} />
        <g className="rp-axis">
          {labels.map((l, i) => <text key={l} x={PAD.l + band * i + band / 2} y={height - 8} textAnchor="middle">{l}</text>)}
        </g>
        {labels.map((l, i) => series.map((s, k) => {
          const v = Number(s.values[i]) || 0;
          const h = ih * (v / max);
          const bx = PAD.l + band * i + (band - groupW) / 2 + k * (barW + 2);
          const on = hover && hover.i === i && hover.k === k;
          return (
            <path key={`${l}-${s.name}`} d={columnPath(bx, PAD.t + ih - h, barW, Math.max(h, 0.5))}
              fill={`var(--series-${k + 1})`} className={`rp-bar${on ? " on" : ""}`}
              onMouseEnter={() => setHover({ i, k, x: bx + barW / 2, y: PAD.t + ih - h })} />
          );
        }))}
      </svg>
      {hover && (
        <div className="rp-tip" style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / height) * 100}%` }}>
          <strong>{labels[hover.i]}</strong>
          {series.length > 1 && <i style={{ background: `var(--series-${hover.k + 1})` }} />}
          {series[hover.k].name}: {format(series[hover.k].values[hover.i])}
        </div>
      )}
    </div>
  );
}

// a ranked list with horizontal bars (top products and similar)
export function HBars({ items, format = compact }) {
  if (!items?.length) return <p className="text-muted">No data.</p>;
  const max = Math.max(...items.map((i) => Number(i.value) || 0)) || 1;
  return (
    <div className="rp-hbars rp-chart">
      {items.map((it) => (
        <div key={it.name} className="rp-hbar" title={`${it.name}: ${format(it.value)}`}>
          <span className="rp-hbar-name">{it.name}</span>
          <span className="rp-hbar-track"><span className="rp-hbar-fill" style={{ width: `${(Number(it.value) / max) * 100}%`, display: "block" }} /></span>
          <span className="rp-hbar-val">{format(it.value)}</span>
        </div>
      ))}
    </div>
  );
}
