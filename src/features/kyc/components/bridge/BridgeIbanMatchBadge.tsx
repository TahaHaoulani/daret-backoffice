import type { BridgeIbanMatchResult } from '../../../../api/bridge';
import { BADGE_VARIANT_CLASSES, getIbanMatchVariant } from '../../utils/bridgeUiHelpers';

type Props = {
  result: BridgeIbanMatchResult | null;
  t: (key: string) => string;
  size?: 'sm' | 'md';
};

export function BridgeIbanMatchBadge({ result, t, size = 'sm' }: Props) {
  const variant = getIbanMatchVariant(result);
  const label =
    result === 'MATCH'
      ? t('bridge.ibanVerified')
      : result === 'MISMATCH'
        ? t('bridge.ibanMismatchShort')
        : t('bridge.ibanNotAvailableShort');

  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${sizeClass} ${BADGE_VARIANT_CLASSES[variant]}`}
      role="status"
    >
      {label}
    </span>
  );
}
