import type { BridgeVerificationStatus } from '../../../../api/bridge';
import { BADGE_VARIANT_CLASSES, getBridgeStatusVariant, STATUS_LABEL_KEYS } from '../../utils/bridgeUiHelpers';

type Props = {
  status: BridgeVerificationStatus;
  t: (key: string) => string;
  className?: string;
};

export function BridgeStatusBadge({ status, t, className = '' }: Props) {
  const variant = getBridgeStatusVariant(status);
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${BADGE_VARIANT_CLASSES[variant]} ${className}`}
      role="status"
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}
