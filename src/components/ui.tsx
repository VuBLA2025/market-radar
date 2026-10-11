export function KpiStrip({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  // gap-px over a border-coloured background draws hairline dividers between cells.
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 xl:grid-cols-6">
      {items.map((k) => (
        <div key={k.label} className="bg-[var(--surface)] px-4 py-3">
          <dt className="text-xs text-[var(--ink-2)]">{k.label}</dt>
          <dd className="mt-0.5 font-mono text-xl font-medium">{k.value}</dd>
          {k.hint && <dd className="text-xs text-[var(--muted)]">{k.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function Panel({ title, subtitle, children, className = "", action }: { title: string; subtitle?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      <header className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
        <div>
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--muted)]">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
    </div>
  );
}
