interface KeyValueRow {
  label: string;
  value: React.ReactNode;
}

interface KeyValueGridProps {
  rows: KeyValueRow[];
  columns?: 1 | 2;
  className?: string;
}

export function KeyValueGrid({ rows, columns = 2, className = '' }: KeyValueGridProps) {
  return (
    <dl
      className={`grid gap-x-6 gap-y-2 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''} ${className}`}
    >
      {rows.map((row, i) => (
        <div key={i} className="py-2 border-b border-daret-border/50 last:border-b-0">
          <dt className="text-xs font-medium text-daret-muted uppercase tracking-wide">{row.label}</dt>
          <dd className="text-sm text-daret-fg mt-0.5">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
