interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function EmptyState({ title = 'No data', message, className = '' }: EmptyStateProps) {
  return (
    <div className={`rounded-xl border border-daret-border bg-daret-card p-12 text-center ${className}`}>
      <p className="text-daret-muted font-medium">{title}</p>
      {message && <p className="text-sm text-daret-muted mt-1">{message}</p>}
    </div>
  );
}
