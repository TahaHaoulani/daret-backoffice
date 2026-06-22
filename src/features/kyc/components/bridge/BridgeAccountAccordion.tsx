import type { BridgeVerificationAccount } from '../../../../api/bridge';
import {
  formatCurrency,
  formatDate,
  formatSignedAmount,
  formatTransactionPeriod,
  displayMaskedIban,
  netMovement,
} from '../../utils/bridgeFormat';
import {
  accountLabel,
  BRIDGE,
  formatAccountTypeLabel,
  getAccountIconKind,
  type AccountIconKind,
} from '../../utils/bridgeUiHelpers';

function AccountTypeIcon({ kind }: { kind: AccountIconKind }) {
  const cls = 'h-5 w-5';
  switch (kind) {
    case 'card':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'savings':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'checking':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

type Props = {
  account: BridgeVerificationAccount;
  expanded: boolean;
  onToggle: () => void;
  onViewTransactions: () => void;
  t: (key: string) => string;
};

function DetailCell({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <dt className={BRIDGE.metaLabel}>{label}</dt>
      <dd className={`${BRIDGE.metaValue} mt-0.5 ${valueClass ?? ''}`}>{value}</dd>
    </div>
  );
}

export function BridgeAccountAccordion({ account, expanded, onToggle, onViewTransactions, t }: Props) {
  const name = accountLabel(account, t('bridge.accountFallback'));
  const typeLabel = formatAccountTypeLabel(account.accountType);
  const iconKind = getAccountIconKind(account.accountType);
  const isMuted = account.transactionCount === 0;
  const summary = account.transactionsSummary;
  const net = netMovement(summary.totalInflows, summary.totalOutflows);
  const currency = account.currency || 'EUR';

  const borderAccent = account.isPrimary
    ? 'border-l-4 border-l-orange-500'
    : 'border-l-4 border-l-transparent';

  return (
    <article className={`${BRIDGE.accountRow} ${borderAccent} ${isMuted ? 'opacity-95' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${BRIDGE.accountHover}`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            account.isPrimary
              ? 'bg-orange-100 text-orange-700'
              : 'bg-sky-100 text-sky-800'
          }`}
        >
          <AccountTypeIcon kind={iconKind} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{name}</span>
            {account.bankName && (
              <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]" title={account.bankName}>
                · {account.bankName}
              </span>
            )}
            {account.isPrimary && (
              <span className="inline-flex items-center rounded-md border border-orange-400 bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-900">
                {t('bridge.primaryBadge')}
              </span>
            )}
            {typeLabel && (
              <span className="inline-flex rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700 capitalize">
                {typeLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {account.transactionCount} {t('bridge.transactionsLabel')}
            {account.latestTransactionDate && (
              <> · {t('bridge.latestTx')}: {formatDate(account.latestTransactionDate)}</>
            )}
          </p>
          {(account.ibanMasked || account.ibanLast4) && (
            <p className="text-xs font-mono text-gray-700 mt-1">
              {displayMaskedIban(account.ibanMasked, account.ibanLast4)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {account.balanceAmount != null && (
            <span
              className={`text-sm font-bold tabular-nums ${
                account.balanceAmount < 0
                  ? 'text-red-700'
                  : account.balanceAmount > 0
                    ? 'text-emerald-800'
                    : 'text-gray-900'
              }`}
            >
              {formatCurrency(account.balanceAmount, currency)}
            </span>
          )}
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className={BRIDGE.detailPanel}>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <DetailCell label={t('bridge.maskedIban')} value={displayMaskedIban(account.ibanMasked, account.ibanLast4)} />
            <DetailCell label={t('bridge.bankName')} value={account.bankName || '—'} />
            <DetailCell label={t('bridge.accountHolder')} value={account.accountHolderName || '—'} />
            <DetailCell label={t('bridge.currency')} value={account.currency || '—'} />
            <DetailCell
              label={t('bridge.balance')}
              value={
                account.balanceAmount != null
                  ? `${formatCurrency(account.balanceAmount, currency)}${account.balanceDate ? ` (${formatDate(account.balanceDate)})` : ''}`
                  : '—'
              }
              valueClass={
                account.balanceAmount != null
                  ? account.balanceAmount < 0
                    ? 'text-red-700'
                    : account.balanceAmount > 0
                      ? 'text-emerald-800'
                      : undefined
                  : undefined
              }
            />
            <DetailCell
              label={t('bridge.period')}
              value={formatTransactionPeriod(summary.periodStart, summary.periodEnd)}
            />
            <DetailCell label={t('bridge.totalInflows')} value={formatCurrency(summary.totalInflows, currency)} />
            <DetailCell label={t('bridge.totalOutflows')} value={formatCurrency(summary.totalOutflows, currency)} />
            <DetailCell label={t('bridge.netMovement')} value={formatSignedAmount(net, currency)} />
          </dl>

          {account.transactionCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewTransactions();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-sky-400 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('bridge.seeAllTransactions')}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
