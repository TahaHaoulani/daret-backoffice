import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBridgeSpendingInsights,
  fetchBridgeSpendingInsightsByUser,
  type BridgeSpendingInsights,
} from '../../../../../api/bridge';
import { formatCurrency, formatDate } from '../../../utils/bridgeFormat';
import { BRIDGE, KPI_ACCENT_STYLES, type KpiAccent } from '../../../utils/bridgeUiHelpers';
import { ExpenseDonutChart } from './ExpenseDonutChart';

type Props = {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
  onCategorized?: () => void;
} & (
  | { submissionId: string; userId?: never }
  | { userId: string; submissionId?: never }
);

function Kpi({ label, value, accent = 'neutral' }: { label: string; value: string; accent?: KpiAccent }) {
  const s = KPI_ACCENT_STYLES[accent];
  return (
    <div className={`rounded-xl border px-3 py-2 min-w-[120px] flex-1 shadow-sm ${s.shell}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${s.label}`}>{label}</p>
      <p className={`text-base font-bold tabular-nums ${s.value}`}>{value}</p>
    </div>
  );
}

function InsightsBody({ data, t }: { data: BridgeSpendingInsights; t: (key: string) => string }) {
  const cur = data.currency;
  const coverage =
    data.summary.transactionCount > 0
      ? Math.round((data.summary.categorizedCount / data.summary.transactionCount) * 100)
      : 0;

  const insights: string[] = [];
  const topExp = data.expenseBreakdown.categories[0];
  if (topExp && topExp.share >= 10) {
    insights.push(t('bridge.spending.insightTopExpense').replace('{label}', topExp.label).replace('{pct}', String(topExp.share)));
  }
  if (data.recurringExpenses.length > 0) {
    insights.push(t('bridge.spending.insightRecurring').replace('{label}', data.recurringExpenses[0].label));
  }
  if (data.riskSignals.length > 0) {
    insights.push(t('bridge.spending.insightRisk').replace('{count}', String(data.riskSignals.length)));
  }
  if (data.summary.net < 0) {
    insights.push(t('bridge.spending.insightNegativeNet'));
  }

  const maxExpense = Math.max(...data.expenseTimeSeries.series.map((p) => p.amount), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Kpi label={t('bridge.spending.kpiCategorized')} value={`${data.summary.categorizedCount}/${data.summary.transactionCount}`} accent="blue" />
        <Kpi label={t('bridge.spending.kpiCoverage')} value={`${coverage} %`} accent={coverage >= 70 ? 'green' : 'neutral'} />
        <Kpi label={t('bridge.spending.kpiExpenses')} value={formatCurrency(data.summary.totalExpenses, cur)} accent="red" />
        <Kpi label={t('bridge.spending.kpiIncome')} value={formatCurrency(data.summary.totalIncome, cur)} accent="green" />
        <Kpi label={t('bridge.spending.kpiNet')} value={formatCurrency(data.summary.net, cur)} accent={data.summary.net >= 0 ? 'green' : 'red'} />
        <Kpi label={t('bridge.spending.kpiRecurring')} value={String(data.recurringExpenses.length)} accent="neutral" />
      </div>

      <section>
        <h4 className={BRIDGE.sectionLabel}>{t('bridge.spending.expenseBreakdownTitle')}</h4>
        <ExpenseDonutChart categories={data.expenseBreakdown.categories} t={t} />
      </section>

      <section>
        <h4 className={`${BRIDGE.sectionLabel} mb-2`}>{t('bridge.spending.categoryTableTitle')}</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">{t('bridge.spending.colCategory')}</th>
                <th className="px-3 py-2 text-right">{t('bridge.spending.colAmount')}</th>
                <th className="px-3 py-2 text-right">{t('bridge.spending.colShare')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.expenseBreakdown.categories.map((c) => (
                <tr key={c.category}>
                  <td className="px-3 py-2 text-gray-900">{c.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(c.amount, cur)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.share.toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data.expenseTimeSeries.series.length > 0 && (
        <section>
          <h4 className={`${BRIDGE.sectionLabel} mb-2`}>{t('bridge.spending.expenseEvolutionTitle')}</h4>
          <div className="flex items-end gap-1 h-32 border-b border-gray-200 pb-1">
            {data.expenseTimeSeries.series.map((p) => (
              <div key={p.date} className="flex-1 flex flex-col items-center justify-end h-full min-w-[8px]" title={`${p.date}: ${formatCurrency(p.amount, cur)}`}>
                <div
                  className="w-full max-w-[24px] rounded-t bg-red-500/80"
                  style={{ height: `${Math.max(4, (p.amount / maxExpense) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span>{formatDate(data.expenseTimeSeries.series[0]?.date)}</span>
            <span>{formatDate(data.expenseTimeSeries.series[data.expenseTimeSeries.series.length - 1]?.date)}</span>
          </div>
        </section>
      )}

      {data.recurringExpenses.length > 0 && (
        <section>
          <h4 className={`${BRIDGE.sectionLabel} mb-2`}>{t('bridge.spending.recurringTitle')}</h4>
          <ul className="space-y-2">
            {data.recurringExpenses.map((r) => (
              <li key={r.recurringGroupKey || r.label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{r.label}</span>
                <span className="text-gray-600"> · ~{formatCurrency(r.averageAmount, cur)} · {r.occurrences}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.riskSignals.length > 0 && (
        <section>
          <h4 className={`${BRIDGE.sectionLabel} mb-2`}>{t('bridge.spending.riskTitle')}</h4>
          <ul className="space-y-2">
            {data.riskSignals.map((r) => (
              <li key={r.category} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <span className="font-semibold">{t('bridge.spending.attentionPoint')}: </span>
                {r.label} — {formatCurrency(r.totalAmount, cur)} ({r.count})
              </li>
            ))}
          </ul>
        </section>
      )}

      {insights.length > 0 && (
        <section>
          <h4 className={`${BRIDGE.sectionLabel} mb-2`}>{t('bridge.spending.insightsTitle')}</h4>
          <ul className="space-y-1.5 text-sm text-gray-800">
            {insights.map((line) => (
              <li key={line} className="flex gap-2"><span className="text-sky-600">•</span>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function BridgeSpendingInsightsModal(props: Props) {
  const { open, onClose, t, onCategorized } = props;
  const submissionId = 'submissionId' in props ? props.submissionId : undefined;
  const userId = 'userId' in props ? props.userId : undefined;
  const categorizedRef = useRef(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: submissionId
      ? (['bridge-spending', 'submission', submissionId] as const)
      : (['bridge-spending', 'user', userId!] as const),
    queryFn: () =>
      submissionId
        ? fetchBridgeSpendingInsights(submissionId)
        : fetchBridgeSpendingInsightsByUser(userId!),
    enabled: open && !!(submissionId || userId),
  });

  useEffect(() => {
    if (!open) {
      categorizedRef.current = false;
      return;
    }
    if (data?.success && !categorizedRef.current && onCategorized) {
      categorizedRef.current = true;
      onCategorized();
    }
  }, [open, data?.success, onCategorized]);

  if (!open) return null;

  const insights = data?.data;

  return (
    <div className="fixed inset-0 z-[130] flex items-stretch justify-end bg-black/50" role="dialog" aria-modal="true">
      <button type="button" className="flex-1 cursor-default" aria-label={t('bridge.close')} onClick={onClose} />
      <div className="flex h-full w-full max-w-3xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{t('bridge.spending.modalTitle')}</h2>
                <span
                  className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-950"
                  title={t('bridge.spending.estimatedTooltip')}
                >
                  {t('bridge.spending.estimatedBadge')}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{t('bridge.spending.modalSubtitle')}</p>
              {insights?.periodStart && insights?.periodEnd && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(insights.periodStart)} → {formatDate(insights.periodEnd)}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              {t('bridge.close')}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading && <p className="text-sm text-gray-600">{t('common.loading')}</p>}
          {isError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-950 mb-3">{t('bridge.spending.loadError')}</p>
              <button type="button" onClick={() => refetch()} className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-900">
                {t('bridge.retry')}
              </button>
            </div>
          )}
          {!isLoading && !isError && insights?.insufficientData && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm text-amber-950">
              {t('bridge.spending.emptyNoTransactions')}
            </p>
          )}
          {!isLoading && !isError && insights && !insights.insufficientData && (
            <InsightsBody data={insights} t={t} />
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <p className="text-[11px] leading-relaxed text-gray-500">{t('bridge.spending.disclaimer')}</p>
        </footer>
      </div>
    </div>
  );
}
