import { useEffect } from 'react';
import type { BridgeTransaction, BridgeVerificationAccount } from '../../../../api/bridge';
import {
  formatCurrency,
  formatDate,
  formatSignedAmount,
  formatTransactionPeriod,
  netMovement,
} from '../../utils/bridgeFormat';
import { accountLabel, BRIDGE, KPI_ACCENT_STYLES } from '../../utils/bridgeUiHelpers';
import { BridgeTransactionCategoryBadge } from './BridgeTransactionCategoryBadge';

type Props = {
  account: BridgeVerificationAccount;
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
};

function SummaryPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'green' | 'red';
}) {
  const styles =
    tone === 'green'
      ? KPI_ACCENT_STYLES.green
      : tone === 'red'
        ? KPI_ACCENT_STYLES.red
        : KPI_ACCENT_STYLES.neutral;

  return (
    <div className={`rounded-lg border px-3 py-2 min-w-[120px] flex-1 shadow-sm ${styles.shell}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${styles.label}`}>{label}</p>
      <p className={`text-sm font-bold tabular-nums mt-0.5 ${styles.value}`}>{value}</p>
    </div>
  );
}

export function BridgeAccountTransactionsModal({ account, open, onClose, t }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title = accountLabel(account, t('bridge.accountFallback'));
  const summary = account.transactionsSummary;
  const currency = account.currency || 'EUR';
  const net = netMovement(summary.totalInflows, summary.totalOutflows);
  const period = formatTransactionPeriod(summary.periodStart, summary.periodEnd);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bridge-tx-modal-title"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden ${BRIDGE.card} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`shrink-0 ${BRIDGE.cardHeader} px-6 py-4`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="bridge-tx-modal-title" className="text-lg font-semibold text-gray-900">
                {t('bridge.transactionsModalTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {title} · {account.transactionCount} {t('bridge.transactionsLabel')} · {period}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('bridge.close')}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SummaryPill label={t('bridge.txCount')} value={String(summary.count)} />
            <SummaryPill label={t('bridge.kpiInflows')} value={formatCurrency(summary.totalInflows, currency)} tone="green" />
            <SummaryPill label={t('bridge.kpiOutflows')} value={formatCurrency(summary.totalOutflows, currency)} tone="red" />
            <SummaryPill
              label={t('bridge.netMovement')}
              value={formatSignedAmount(net, currency)}
              tone={net >= 0 ? 'green' : 'red'}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 bg-white">
          {account.transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-600">{t('bridge.noTransactions')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                <tr className="border-b border-gray-200">
                  <th className="px-5 py-3">{t('bridge.txDate')}</th>
                  <th className="px-5 py-3">{t('bridge.txLabel')}</th>
                  <th className="px-5 py-3">{t('bridge.txCategory')}</th>
                  <th className="px-5 py-3">{t('bridge.txCounterparty')}</th>
                  <th className="px-5 py-3 text-right">{t('bridge.txAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {account.transactions.map((tx: BridgeTransaction) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600 tabular-nums">
                      {formatDate(tx.bookingDate || tx.transactionDate)}
                    </td>
                    <td
                      className="px-5 py-3 font-medium text-gray-900 max-w-[240px] truncate"
                      title={tx.label || undefined}
                    >
                      {tx.label || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {tx.classifiedCategory || tx.categoryLabel ? (
                        <BridgeTransactionCategoryBadge tx={tx} t={t} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-gray-600 max-w-[160px] truncate"
                      title={tx.counterparty || undefined}
                    >
                      {tx.counterparty || '—'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-mono text-sm font-bold tabular-nums ${
                          tx.amount >= 0 ? 'text-emerald-800' : 'text-red-800'
                        }`}
                      >
                        {formatSignedAmount(tx.amount, tx.currency || currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
