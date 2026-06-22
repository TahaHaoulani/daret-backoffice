import type { BridgeBankingInsights } from '../../../../../api/bridge';
import { formatCurrency } from '../../../utils/bridgeFormat';
import { KPI_ACCENT_STYLES, type KpiAccent } from '../../../utils/bridgeUiHelpers';

type Props = {
  insights: BridgeBankingInsights;
  t: (key: string) => string;
};

function KpiCard({
  label,
  value,
  accent = 'neutral',
}: {
  label: string;
  value: string;
  accent?: KpiAccent;
}) {
  const styles = KPI_ACCENT_STYLES[accent];
  return (
    <div className={`rounded-xl border px-4 py-3 min-w-[140px] flex-1 shadow-sm ${styles.shell}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${styles.label}`}>
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums ${styles.value}`}>{value}</p>
    </div>
  );
}

export function BankingInsightKpis({ insights, t }: Props) {
  const { summary, recommendation, currency } = insights;
  const fmt = (n: number | null) => formatCurrency(n, currency);

  const windowLabel = recommendation.label || t('bridge.insights.windowUnavailable');

  let windowAccent: KpiAccent = 'neutral';
  if (recommendation.confidence === 'HIGH') windowAccent = 'green';
  else if (recommendation.confidence === 'LOW') windowAccent = 'red';

  const minAccent: KpiAccent =
    summary.minObservedBalance != null && summary.minObservedBalance < 0 ? 'red' : 'neutral';

  return (
    <div className="flex flex-wrap gap-3">
      <KpiCard label={t('bridge.insights.kpiCurrentBalance')} value={fmt(summary.currentConsolidatedBalance)} accent="green" />
      <KpiCard label={t('bridge.insights.kpiMinBalance')} value={fmt(summary.minObservedBalance)} accent={minAccent} />
      <KpiCard label={t('bridge.insights.kpiAvgBalance')} value={fmt(summary.avgObservedBalance)} accent="blue" />
      <KpiCard label={t('bridge.insights.kpiAvgInflows')} value={fmt(summary.monthlyAverageInflows)} accent="green" />
      <KpiCard label={t('bridge.insights.kpiAvgOutflows')} value={fmt(summary.monthlyAverageOutflows)} accent="red" />
      <KpiCard label={t('bridge.insights.kpiRecommendedWindow')} value={windowLabel} accent={windowAccent} />
    </div>
  );
}
