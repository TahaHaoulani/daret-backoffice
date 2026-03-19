import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Internal route (uses React Router Link) */
  to?: string;
  loading?: boolean;
  /** Optional accent (e.g. amber for SLA) */
  accent?: 'default' | 'amber' | 'green';
}

export function KpiCard({ label, value, to, loading, accent = 'default' }: KpiCardProps) {
  const content = (
    <>
      <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide opacity-[var(--ops-label-opacity)] text-daret-muted">
        {label}
      </p>
      <p className="text-[length:var(--ops-value-size)] font-semibold text-daret-fg mt-0.5">
        {loading ? '—' : value}
      </p>
    </>
  );

  const baseClass =
    'rounded-xl border transition block text-left ' +
    (accent === 'amber'
      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
      : accent === 'green'
        ? 'bg-daret-green/5 border-daret-green/30 hover:border-daret-green/50'
        : 'bg-daret-card border-daret-border hover:border-daret-green/50');

  const paddingClass = 'p-4';

  if (to) {
    return (
      <Link to={to} className={`${baseClass} ${paddingClass}`}>
        {content}
      </Link>
    );
  }
  return (
    <div className={`${baseClass} ${paddingClass}`}>
      {content}
    </div>
  );
}
