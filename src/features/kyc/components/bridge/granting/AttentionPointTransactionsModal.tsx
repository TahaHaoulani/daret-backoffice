import { useEffect } from 'react';
import type { BridgeTransaction, BridgeVerificationAccount } from '../../../../api/bridge';
import { formatDate, formatSignedAmount } from '../../../utils/bridgeFormat';
import { accountLabel, BRIDGE } from '../../../utils/bridgeUiHelpers';
import { BridgeTransactionCategoryBadge } from '../BridgeTransactionCategoryBadge';

export type AttentionPointTransactionRow = BridgeTransaction & {
  accountLabel: string;
  accountCurrency: string;
};

export function collectTransactionsByCategory(
  accounts: BridgeVerificationAccount[],
  category: string,
  accountFallback: string,
): AttentionPointTransactionRow[] {
  const rows: AttentionPointTransactionRow[] = [];
  for (const account of accounts) {
    const label = accountLabel(account, accountFallback);
    const currency = account.currency || 'EUR';
    for (const tx of account.transactions) {
      if (tx.classifiedCategory === category) {
        rows.push({ ...tx, accountLabel: label, accountCurrency: currency });
      }
    }
  }
  return rows.sort((a, b) => {
    const da = a.bookingDate || a.transactionDate || '';
    const db = b.bookingDate || b.transactionDate || '';
    return db.localeCompare(da);
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  transactions: AttentionPointTransactionRow[];
  t: (key: string) => string;
};

export function AttentionPointTransactionsModal({
  open,
  onClose,
  title,
  transactions,
  t,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[135] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attention-tx-modal-title"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden ${BRIDGE.card} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="attention-tx-modal-title" className="text-base font-semibold text-slate-900">
                {title}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {transactions.length} {t('bridge.transactionsLabel')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('bridge.close')}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto min-h-0">
          {transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">{t('bridge.granting.noMatchingTransactions')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] font-medium text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2.5">{t('bridge.txDate')}</th>
                  <th className="px-4 py-2.5">{t('bridge.txLabel')}</th>
                  <th className="px-4 py-2.5">{t('bridge.granting.colAccount')}</th>
                  <th className="px-4 py-2.5">{t('bridge.txCategory')}</th>
                  <th className="px-4 py-2.5 text-right">{t('bridge.txAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-slate-600">
                      {formatDate(tx.bookingDate || tx.transactionDate)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 max-w-[220px] truncate" title={tx.label || undefined}>
                      {tx.label || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[140px] truncate">{tx.accountLabel}</td>
                    <td className="px-4 py-2.5">
                      <BridgeTransactionCategoryBadge tx={tx} t={t} />
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          tx.amount >= 0 ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        {formatSignedAmount(tx.amount, tx.currency || tx.accountCurrency)}
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
