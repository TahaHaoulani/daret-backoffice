import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BridgeLogo, VerifyWithBridgeButton } from '../../../components/BridgeLogo';
import { BridgeVerificationRequestModal } from './BridgeVerificationRequestModal';
import {
  fetchBridgeVerification,
  fetchBridgeVerificationByUser,
  type BridgeVerificationAccount,
  type BridgeVerificationStatus,
} from '../../../api/bridge';
import { BridgeAccountTransactionsModal } from './bridge/BridgeAccountTransactionsModal';
import { BridgeAccountAccordion } from './bridge/BridgeAccountAccordion';
import { BridgeEmptyState } from './bridge/BridgeEmptyState';
import { BridgeStatusBadge } from './bridge/BridgeStatusBadge';
import { BridgeVerificationMetadata, buildMetadataItems } from './bridge/BridgeVerificationMetadata';
import { BridgeVerificationSummaryKpis } from './bridge/BridgeVerificationSummaryKpis';
import { BRIDGE, filterActiveBridgeAccounts, filterBridgeAccountsByType, type BridgeAccountTypeFilter } from '../utils/bridgeUiHelpers';
import { BridgeBankingInsightsModal } from './bridge/insights/BridgeBankingInsightsModal';
import { BridgeSpendingInsightsModal } from './bridge/spending/BridgeSpendingInsightsModal';
import { BridgeGrantingSummaryCard } from './bridge/BridgeGrantingSummaryCard';

type RequestVerificationProps = {
  submissionId: string;
  userEmail?: string | null;
  /** When false, the request button is shown disabled (e.g. closed submission). */
  enabled?: boolean;
  onToast?: (msg: string | null) => void;
};

type Props = {
  t: (key: string) => string;
  pollWhilePending?: boolean;
  /** When true, metadata is omitted from the card (e.g. shown in sidebar chronologie). */
  hideMetadata?: boolean;
  /** Hide the in-card request button (e.g. when rendered in page header). */
  hideRequestButton?: boolean;
  requestVerification?: RequestVerificationProps;
} & (
  | { submissionId: string; userId?: never }
  | { userId: string; submissionId?: never }
);

const PENDING_STATUSES: BridgeVerificationStatus[] = ['EMAIL_SENT', 'PENDING_CONNECTION'];
const DATA_STATUSES: BridgeVerificationStatus[] = ['CONNECTED', 'DATA_RETRIEVED'];

function PendingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function PieChartIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );
}

export function BridgeVerificationCard(props: Props) {
  const { t, pollWhilePending = true, requestVerification, hideMetadata = false, hideRequestButton = false } = props;
  const submissionId = 'submissionId' in props ? props.submissionId : undefined;
  const userId = 'userId' in props ? props.userId : undefined;
  const scopeKey = submissionId ? (['bridge-verification', 'submission', submissionId] as const) : (['bridge-verification', 'user', userId!] as const);
  const queryClient = useQueryClient();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [txModalAccount, setTxModalAccount] = useState<BridgeVerificationAccount | null>(null);
  const [hideInactiveAccounts, setHideInactiveAccounts] = useState(true);
  const [accountTypeFilter, setAccountTypeFilter] = useState<BridgeAccountTypeFilter>('all');
  const [bridgeModalOpen, setBridgeModalOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [spendingOpen, setSpendingOpen] = useState(false);

  const showRequestButton = !!requestVerification && !hideRequestButton;
  const canRequestVerification = !!requestVerification;
  const requestEnabled = requestVerification?.enabled !== false;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: scopeKey,
    queryFn: () =>
      submissionId
        ? fetchBridgeVerification(submissionId)
        : fetchBridgeVerificationByUser(userId!),
    enabled: !!(submissionId || userId),
    refetchInterval: (query) => {
      if (!pollWhilePending) return false;
      const status = query.state.data?.data?.status;
      if (status === 'EMAIL_SENT' || status === 'PENDING_CONNECTION' || status === 'CONNECTED') {
        return 15000;
      }
      return false;
    },
  });

  const summary = data?.data;
  const accounts = summary?.accounts ?? [];
  const afterInactiveFilter = filterActiveBridgeAccounts(accounts, hideInactiveAccounts);
  const visibleAccounts = filterBridgeAccountsByType(afterInactiveFilter, accountTypeFilter);
  const hiddenByTypeCount = afterInactiveFilter.length - visibleAccounts.length;

  function toggleAccount(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className={`${BRIDGE.card} p-6`}>
        <p className="text-sm text-gray-600">{t('bridge.loading')}</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-950 mb-3">{t('bridge.loadError')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
        >
          {t('bridge.retry')}
        </button>
      </div>
    );
  }

  const status = summary.status;
  const showKpis = DATA_STATUSES.includes(status) || accounts.length > 0;
  const showMetadata = status !== 'NOT_SENT' && !hideMetadata;
  const totalTxCount = summary.transactionsSummary.count;
  const hasAccountsNoTx =
    status === 'DATA_RETRIEVED' && accounts.length > 0 && totalTxCount === 0;
  const canShowInsights =
    DATA_STATUSES.includes(status) && totalTxCount > 0 && accounts.length > 0;
  const showGrantingSummary = status !== 'NOT_SENT';

  return (
    <>
      <article className={`overflow-hidden ${BRIDGE.card}`}>
        <header className={BRIDGE.cardHeader}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={BRIDGE.title}>{t('bridge.cardTitle')}</h3>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                  {t('bridge.viaBridgeLabel')}
                  <BridgeLogo className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className={BRIDGE.subtitle}>{t('bridge.cardSubtitle')}</p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <BridgeStatusBadge status={status} t={t} />
              {showRequestButton && (
                <VerifyWithBridgeButton
                  onClick={() => setBridgeModalOpen(true)}
                  label={t('bridge.verifyWithBridge')}
                  disabled={!requestEnabled}
                  className="w-full sm:w-auto sm:min-w-[220px]"
                />
              )}
            </div>
          </div>

          {isFetching && status !== 'DATA_RETRIEVED' && (
            <p className="mt-2 text-xs font-medium text-sky-800">{t('bridge.refreshing')}</p>
          )}
        </header>

        <div className="space-y-5 p-5">
          {status === 'NOT_SENT' && (
            <BridgeEmptyState
              variant="neutral"
              title={t('bridge.emptyNotRequested')}
              description={
                canRequestVerification && requestEnabled
                  ? hideRequestButton
                    ? t('bridge.emptyNotRequestedDesc')
                    : t('bridge.emptyNotRequestedDescInline')
                  : canRequestVerification && !requestEnabled
                    ? t('bridge.cannotRequestClosed')
                    : t('bridge.emptyNotRequestedDesc')
              }
              icon={<BankIcon />}
            />
          )}

          {PENDING_STATUSES.includes(status) && (
            <>
              {showMetadata && (
                <BridgeVerificationMetadata items={buildMetadataItems(summary, t)} />
              )}
              <BridgeEmptyState
                variant="info"
                title={t('bridge.emptyPendingUser')}
                description={t('bridge.emptyPendingUserDesc')}
                icon={<PendingIcon />}
              />
            </>
          )}

          {status === 'FAILED' && (
            <>
              {showMetadata && (
                <BridgeVerificationMetadata items={buildMetadataItems(summary, t)} />
              )}
              <BridgeEmptyState
                variant="danger"
                title={t('bridge.emptyFailedTitle')}
                description={summary.failureReason || t('bridge.emptyFailedDesc')}
              />
            </>
          )}

          {status === 'EXPIRED' && (
            <>
              {showMetadata && (
                <BridgeVerificationMetadata items={buildMetadataItems(summary, t)} />
              )}
              <BridgeEmptyState
                variant="warning"
                title={t('bridge.statusExpired')}
                description={t('bridge.emptyExpiredDesc')}
              />
            </>
          )}

          {(DATA_STATUSES.includes(status) || status === 'CANCELLED') && status !== 'NOT_SENT' && (
            <>
              {showKpis && (
                <>
                  <BridgeVerificationSummaryKpis
                    ibanMatchResult={summary.ibanMatchResult}
                    declaredIbanMasked={summary.declaredIbanMasked}
                    declaredIbanLast4={summary.declaredIbanLast4}
                    accountCount={accounts.length}
                    transactionsSummary={summary.transactionsSummary}
                    t={t}
                  />
                  {showGrantingSummary && (
                    submissionId ? (
                      <BridgeGrantingSummaryCard
                        submissionId={submissionId}
                        accounts={accounts}
                        t={t}
                        onOpenBalanceAnalysis={canShowInsights ? () => setInsightsOpen(true) : undefined}
                        onOpenSpendingAnalysis={canShowInsights ? () => setSpendingOpen(true) : undefined}
                      />
                    ) : userId ? (
                      <BridgeGrantingSummaryCard
                        userId={userId}
                        accounts={accounts}
                        t={t}
                        onOpenBalanceAnalysis={canShowInsights ? () => setInsightsOpen(true) : undefined}
                        onOpenSpendingAnalysis={canShowInsights ? () => setSpendingOpen(true) : undefined}
                      />
                    ) : null
                  )}
                  {canShowInsights && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setInsightsOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <ChartIcon />
                        {t('bridge.insights.openAnalysis')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpendingOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <PieChartIcon />
                        {t('bridge.spending.openAnalysis')}
                      </button>
                    </div>
                  )}
                </>
              )}

              {showMetadata && (
                <BridgeVerificationMetadata items={buildMetadataItems(summary, t)} />
              )}

              {summary.failureReason && status !== 'FAILED' && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
                  {summary.failureReason}
                </p>
              )}

              {accounts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h4 className={BRIDGE.sectionLabel}>
                      {t('bridge.synchronizedAccounts')} (
                      {visibleAccounts.length !== accounts.length
                        ? `${visibleAccounts.length}/${accounts.length}`
                        : accounts.length}
                      )
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
                        role="group"
                        aria-label={t('bridge.accountTypeFilterLabel')}
                      >
                        {(['all', 'bank', 'card'] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setAccountTypeFilter(value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                              accountTypeFilter === value
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {t(
                              value === 'all'
                                ? 'bridge.accountTypeFilterAll'
                                : value === 'bank'
                                  ? 'bridge.accountTypeFilterBank'
                                  : 'bridge.accountTypeFilterCard',
                            )}
                          </button>
                        ))}
                      </div>
                      <label
                        htmlFor="bridge-hide-inactive-accounts"
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none"
                      >
                        <input
                          id="bridge-hide-inactive-accounts"
                          type="checkbox"
                          checked={hideInactiveAccounts}
                          onChange={(e) => setHideInactiveAccounts(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-700 focus:ring-sky-500"
                        />
                        <span>{t('bridge.hideInactiveAccounts')}</span>
                      </label>
                    </div>
                  </div>

                  {visibleAccounts.length > 0 ? (
                    visibleAccounts.map((account) => (
                      <BridgeAccountAccordion
                        key={account.id}
                        account={account}
                        expanded={expandedIds.has(account.id)}
                        onToggle={() => toggleAccount(account.id)}
                        onViewTransactions={() => setTxModalAccount(account)}
                        t={t}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      {hiddenByTypeCount > 0 && accountTypeFilter !== 'all'
                        ? t('bridge.allAccountsHiddenByTypeFilter')
                        : t('bridge.allAccountsHiddenByFilter')}
                    </p>
                  )}
                </section>
              )}

              {accounts.length === 0 && status === 'DATA_RETRIEVED' && (
                <BridgeEmptyState
                  variant="neutral"
                  title={t('bridge.noAccounts')}
                />
              )}

              {hasAccountsNoTx && (
                <BridgeEmptyState
                  variant="warning"
                  title={t('bridge.emptyNoTransactions')}
                  description={t('bridge.emptyNoTransactionsDesc')}
                />
              )}

              {summary.statements.length > 0 && (
                <ul className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  {summary.statements.map((s) => (
                    <li key={s.id}>
                      {s.documentUrl ? (
                        <a
                          href={s.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-800 hover:underline"
                        >
                          {t('bridge.statement')} {s.statementPeriodStart} – {s.statementPeriodEnd}
                        </a>
                      ) : (
                        <span className="text-gray-600">
                          {t('bridge.statement')} {s.statementPeriodStart} – {s.statementPeriodEnd}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </article>

      {txModalAccount && (
        <BridgeAccountTransactionsModal
          account={txModalAccount}
          open={!!txModalAccount}
          onClose={() => setTxModalAccount(null)}
          t={t}
        />
      )}

      {requestVerification && !hideRequestButton && (
        <BridgeVerificationRequestModal
          submissionId={requestVerification.submissionId}
          userEmail={requestVerification.userEmail}
          open={bridgeModalOpen}
          onClose={() => setBridgeModalOpen(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: scopeKey });
          }}
          t={t}
          setToast={requestVerification.onToast ?? (() => {})}
        />
      )}

      {insightsOpen && (submissionId ? (
        <BridgeBankingInsightsModal
          submissionId={submissionId}
          open={insightsOpen}
          onClose={() => setInsightsOpen(false)}
          t={t}
        />
      ) : userId ? (
        <BridgeBankingInsightsModal
          userId={userId}
          open={insightsOpen}
          onClose={() => setInsightsOpen(false)}
          t={t}
        />
      ) : null)}

      {spendingOpen && (submissionId ? (
        <BridgeSpendingInsightsModal
          submissionId={submissionId}
          open={spendingOpen}
          onClose={() => setSpendingOpen(false)}
          t={t}
          onCategorized={() => void queryClient.invalidateQueries({ queryKey: scopeKey })}
        />
      ) : userId ? (
        <BridgeSpendingInsightsModal
          userId={userId}
          open={spendingOpen}
          onClose={() => setSpendingOpen(false)}
          t={t}
          onCategorized={() => void queryClient.invalidateQueries({ queryKey: scopeKey })}
        />
      ) : null)}
    </>
  );
}
