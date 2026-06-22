import type { EmailDeliveryStatus } from '../../../api/emails';

const STATUS_VARIANT: Record<EmailDeliveryStatus, string> = {
  QUEUED: 'border-slate-200 bg-slate-50 text-slate-600',
  SENT: 'border-sky-200 bg-sky-50 text-sky-800',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  OPENED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CLICKED: 'border-blue-200 bg-blue-50 text-blue-800',
  FAILED: 'border-red-200 bg-red-50 text-red-800',
  BOUNCED: 'border-orange-200 bg-orange-50 text-orange-800',
  UNKNOWN: 'border-slate-200 bg-slate-50 text-slate-500',
};

type Props = {
  status: EmailDeliveryStatus;
  t: (key: string) => string;
  className?: string;
};

export function EmailStatusBadge({ status, t, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_VARIANT[status] ?? STATUS_VARIANT.UNKNOWN} ${className}`}
      role="status"
    >
      {t(`emails.status.${status}`)}
    </span>
  );
}
