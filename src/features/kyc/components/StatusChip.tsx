import { mapKycStatus, type KycStatusVariant } from '../utils/format';

interface StatusChipProps {
  status: string;
  /** Override for non-KYC statuses (e.g. submission status). */
  variant?: KycStatusVariant;
  label?: string;
}

const variantClasses: Record<KycStatusVariant, string> = {
  default: 'bg-daret-muted/20 text-daret-muted',
  success: 'bg-daret-green/20 text-daret-green',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export function StatusChip({ status, variant: variantOverride, label }: StatusChipProps) {
  const mapped = mapKycStatus(status);
  const variant = variantOverride ?? mapped.variant;
  const displayLabel = label ?? mapped.label;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {displayLabel}
    </span>
  );
}

/** For submission status (APPROVED, REJECTED, etc.) we use same chip style with custom mapping. */
const submissionVariant: Record<string, KycStatusVariant> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
};

export function SubmissionStatusChip({ status }: { status: string }) {
  const variant = submissionVariant[status] ?? 'default';
  const label = status.replace(/_/g, ' ');
  return <StatusChip status={status} variant={variant} label={label} />;
}
