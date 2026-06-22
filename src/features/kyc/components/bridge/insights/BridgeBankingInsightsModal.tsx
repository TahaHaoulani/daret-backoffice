import { useQuery } from '@tanstack/react-query';
import {
  fetchBridgeBankingInsights,
  fetchBridgeBankingInsightsByUser,
  type BridgeBankingInsights,
} from '../../../../../api/bridge';
import { BRIDGE } from '../../../utils/bridgeUiHelpers';
import { BankingInsightKpis } from './BankingInsightKpis';
import { BalanceEvolutionChart } from './BalanceEvolutionChart';
import { CashflowChart } from './CashflowChart';
import { CollectionWindowRecommendationCard } from './CollectionWindowRecommendationCard';

type Props = {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
} & (
  | { submissionId: string; userId?: never }
  | { userId: string; submissionId?: never }
);

function InsightsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 flex-1 min-w-[140px] rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-56 rounded-xl bg-gray-200" />
      <div className="h-48 rounded-xl bg-gray-200" />
      <div className="h-40 rounded-xl bg-gray-200" />
    </div>
  );
}

function InsightsBody({ insights, t }: { insights: BridgeBankingInsights; t: (key: string) => string }) {
  if (insights.noTransactions) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm font-medium text-amber-950">
        {t('bridge.insights.emptyNoTransactions')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {insights.mixedCurrencies && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {t('bridge.insights.mixedCurrencyNote')}
        </p>
      )}
      {insights.noBalance && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {t('bridge.insights.noBalanceWarning')}
        </p>
      )}

      <BankingInsightKpis insights={insights} t={t} />

      <section className="space-y-2">
        <h4 className={BRIDGE.sectionLabel}>{t('bridge.insights.balanceEvolutionTitle')}</h4>
        <p className="text-xs text-gray-500">{t('bridge.insights.reconstructedNote')}</p>
        <BalanceEvolutionChart insights={insights} t={t} />
      </section>

      <section className="space-y-2">
        <h4 className={BRIDGE.sectionLabel}>{t('bridge.insights.cashflowTitle')}</h4>
        <CashflowChart insights={insights} t={t} />
      </section>

      <CollectionWindowRecommendationCard insights={insights} t={t} />
    </div>
  );
}

export function BridgeBankingInsightsModal(props: Props) {
  const { open, onClose, t } = props;
  const submissionId = 'submissionId' in props ? props.submissionId : undefined;
  const userId = 'userId' in props ? props.userId : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: submissionId
      ? (['bridge-insights', 'submission', submissionId] as const)
      : (['bridge-insights', 'user', userId!] as const),
    queryFn: () =>
      submissionId
        ? fetchBridgeBankingInsights(submissionId)
        : fetchBridgeBankingInsightsByUser(userId!),
    enabled: open && !!(submissionId || userId),
  });

  if (!open) return null;

  const insights = data?.data;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-stretch justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bridge-insights-title"
    >
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label={t('bridge.close')}
        onClick={onClose}
      />
      <div className="flex h-full w-full max-w-3xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="bridge-insights-title" className="text-lg font-semibold text-gray-900">
                {t('bridge.insights.modalTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{t('bridge.insights.modalSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('bridge.close')}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading && <InsightsSkeleton />}

          {isError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-950 mb-3">{t('bridge.insights.loadError')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
              >
                {t('bridge.retry')}
              </button>
            </div>
          )}

          {!isLoading && !isError && insights && <InsightsBody insights={insights} t={t} />}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <p className="text-[11px] leading-relaxed text-gray-500">{t('bridge.insights.disclaimer')}</p>
        </footer>
      </div>
    </div>
  );
}
