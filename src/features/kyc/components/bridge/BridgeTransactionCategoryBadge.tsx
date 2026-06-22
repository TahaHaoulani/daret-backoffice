import { CATEGORY_BADGE_CLASSES, getDisplayCategory } from '../../utils/transactionCategoryLabels';

type Props = {
  tx: {
    classifiedCategory?: string | null;
    categoryLabel?: string | null;
    category?: string | null;
    categoryConfidenceScore?: number | null;
  };
  t: (key: string) => string;
};

export function BridgeTransactionCategoryBadge({ tx, t }: Props) {
  const { label, group } = getDisplayCategory(tx);
  const confidence = tx.categoryConfidenceScore;
  const title =
    confidence != null
      ? `${t('bridge.spending.autoClassified')} · ${t('bridge.spending.confidence')} ${confidence} %`
      : t('bridge.spending.autoClassified');

  return (
    <span
      className={`inline-flex max-w-[160px] truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE_CLASSES[group]}`}
      title={title}
    >
      {label}
    </span>
  );
}
