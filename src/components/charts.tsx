"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Fmt = "int" | "gbp" | "fixed0";
const FORMATS: Record<Fmt, (v: number) => string> = {
  int: (v) => Math.round(v).toLocaleString("en"),
  gbp: (v) => `£${v.toFixed(2)}`,
  fixed0: (v) => v.toFixed(0),
};

type Datum = { label: string; value: number; detail?: string };
type Tip = { x: number; y: number; value: string; label: string } | null;

/* ---------- helpers ---------- */

/** Track the rendered width so SVG text stays at true pixel size. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6));
}

export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-lg"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <div className="font-semibold text-[var(--ink)] tabular-nums">{tip.value}</div>
      <div className="text-[var(--ink-2)]">{tip.label}</div>
    </div>
  );
}

/* ---------- Column chart (vertical bars) ---------- */

export function ColumnChart({
  data,
  fmt = "int",
  unit = "",
  height = 220,
  ariaLabel,
}: {
  data: Datum[];
  fmt?: Fmt;
  unit?: string;
  height?: number;
  ariaLabel: string;
}) {
  const format = FORMATS[fmt];
  const [tip, setTip] = useState<Tip>(null);
  const [active, setActive] = useState<number | null>(null);
  const [wrap, W] = useWidth<HTMLDivElement>(560);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)));
  const top = ticks.at(-1) || 1;
  const pad = { l: 36, r: 8, t: 12, b: 26 };
  const H = height;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const band = innerW / data.length;
  const barW = Math.min(24, band * 0.62);

  const show = (i: number, el: SVGElement) => {
    const box = wrap.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setActive(i);
    setTip({
      x: r.left - box.left + r.width / 2,
      y: r.top - box.top,
      value: `${format(data[i].value)}${unit}`,
      label: data[i].detail ?? data[i].label,
    });
  };
  const hide = () => {
    setActive(null);
    setTip(null);
  };

  return (
    <div ref={wrap} className="relative w-full min-w-0 overflow-hidden">
      <svg width={W} height={H} className="block" role="img" aria-label={ariaLabel} onPointerLeave={hide}>
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / top) * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke={t === 0 ? "var(--axis)" : "var(--grid)"} strokeWidth={1} />
              <text x={pad.l - 8} y={y} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / top) * innerH;
          const x = pad.l + i * band + (band - barW) / 2;
          const y = pad.t + innerH - h;
          const r = Math.min(4, h);
          return (
            <g key={d.label}>
              <path
                d={`M${x},${pad.t + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${pad.t + innerH} Z`}
                fill="var(--series-1)"
                opacity={active === null || active === i ? 1 : 0.45}
              />
              {/* hit target: the whole band, taller than the mark */}
              <rect
                x={pad.l + i * band}
                y={pad.t}
                width={band}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.detail ?? d.label}: ${format(d.value)}${unit}`}
                onPointerEnter={(e) => show(i, e.currentTarget.previousSibling as SVGElement)}
                onFocus={(e) => show(i, e.currentTarget.previousSibling as SVGElement)}
                onBlur={hide}
                className="cursor-crosshair outline-none"
              />
              <text x={pad.l + i * band + band / 2} y={H - 8} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/* ---------- Horizontal bar list ---------- */

export function BarList({
  data,
  fmt = "int",
  ariaLabel,
}: {
  data: (Datum & { n?: number })[];
  fmt?: Fmt;
  ariaLabel: string;
}) {
  const format = FORMATS[fmt];
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[13px]" title={d.detail}>
          <span className="truncate text-[var(--ink-2)]">{d.label}</span>
          <span className="relative h-2.5">
            <span
              className="absolute inset-y-0 left-0 rounded-r-[2px] bg-[var(--series-1)] transition-opacity group-hover:opacity-80"
              style={{ width: `${Math.max(1, (d.value / max) * 100)}%`, maxHeight: 24 }}
            />
          </span>
          <span className="text-right font-mono text-[var(--ink)]">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Line chart with crosshair ---------- */

export function LineChart({
  data,
  fmt = "int",
  height = 220,
  ariaLabel,
  seriesName,
}: {
  data: { t: string; value: number }[];
  fmt?: Fmt;
  height?: number;
  ariaLabel: string;
  seriesName: string;
}) {
  const format = FORMATS[fmt];
  const id = useId();
  const [wrap, W] = useWidth<HTMLDivElement>(900);
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const pad = { l: 40, r: 64, t: 16, b: 26 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const vals = data.map((d) => d.value);
  const ticks = niceTicks(Math.max(...vals, 1));
  const top = ticks.at(-1) || 1;
  const x = (i: number) => pad.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / top) * innerH;
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z`;
  const fmtDate = (t: string) =>
    new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", timeZone: "UTC" });
  const last = data.length - 1;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const i = Math.round(((px - pad.l) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  };

  const tipLeft = hover === null ? 0 : x(hover);
  const tipTop = hover === null ? 0 : y(data[hover].value);

  if (!data.length) return <p className="text-sm text-[var(--muted)]">No history yet.</p>;
  if (data.length === 1)
    return (
      <p className="text-sm text-[var(--ink-2)]">
        One run so far: <span className="font-mono text-[var(--ink)]">{format(data[0].value)}</span>. The trend line appears after the next scrape.
      </p>
    );

  return (
    <div ref={wrap} className="relative w-full min-w-0 overflow-hidden">
      <svg
        width={W}
        height={H}
        className="block touch-none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.12" />
            <stop offset="1" stopColor="var(--series-1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--axis)" : "var(--grid)"} strokeWidth={1} />
            <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[11px] tabular-nums">
              {compact(t)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* end dot + direct end label */}
        <circle cx={x(last)} cy={y(data[last].value)} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
        <text x={x(last) + 10} y={y(data[last].value)} dy="0.32em" className="fill-[var(--ink)] text-[12px] font-semibold tabular-nums">
          {format(data[last].value)}
        </text>
        {/* De-duplicate: with 1–2 runs, first/middle/last can be the same index. */}
        {[...new Set([0, Math.floor(last / 2), last])].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-[var(--muted)] text-[11px]">
            {fmtDate(data[i].t)}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="var(--axis)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <Tooltip tip={{ x: tipLeft, y: tipTop, value: format(data[hover].value), label: `${seriesName} · ${fmtDate(data[hover].t)} UTC` }} />
      )}
    </div>
  );
}
