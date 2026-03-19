/** Shared status chip for KYC and submission statuses. Ops consistency: SUBMITTED=amber, IN_REVIEW=blue, APPROVED=green, REJECTED=red. */
type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantClasses: Record<Variant, string> = {
  default: 'bg-daret-muted/20 text-daret-muted',
  success: 'bg-daret-green/20 text-daret-green',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const KYC_MAP: Record<string, { label: string; variant: Variant }> = {
  NONE: { label: 'Not started', variant: 'default' },
  PENDING: { label: 'Pending', variant: 'warning' },
  PENDING_SCORING: { label: 'Pending scoring', variant: 'warning' },
  UNDER_REVIEW: { label: 'Under review', variant: 'info' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'error' },
};

const SUBMISSION_MAP: Record<string, Variant> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
};

interface StatusChipProps {
  status: string;
  variant?: Variant;
  label?: string;
  /** 'kyc' | 'submission' for auto label/variant */
  type?: 'kyc' | 'submission';
}

export function StatusChip({ status, variant: variantOverride, label: labelOverride, type = 'kyc' }: StatusChipProps) {
  let variant: Variant = 'default';
  let label = status.replace(/_/g, ' ');

  if (type === 'kyc' && KYC_MAP[status]) {
    label = KYC_MAP[status].label;
    variant = KYC_MAP[status].variant;
  } else if (type === 'submission' && SUBMISSION_MAP[status]) {
    variant = SUBMISSION_MAP[status];
  }

  if (variantOverride) variant = variantOverride;
  if (labelOverride) label = labelOverride;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
