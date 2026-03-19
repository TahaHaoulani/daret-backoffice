interface FieldRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function FieldRow({ label, value, className = '' }: FieldRowProps) {
  return (
    <div className={`flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 border-b border-daret-border/50 last:border-b-0 ${className}`}>
      <dt className="text-xs font-medium text-daret-muted uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-daret-fg">{value}</dd>
    </div>
  );
}
