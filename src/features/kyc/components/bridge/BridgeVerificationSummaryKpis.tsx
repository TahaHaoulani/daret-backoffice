import type { ReactNode } from 'react';
import type { BridgeIbanMatchResult, BridgeTransactionsSummary } from '../../../../api/bridge';
import { formatCompactNumber, formatCurrency, displayMaskedIban } from '../../utils/bridgeFormat';
import { KPI_ACCENT_STYLES, type KpiAccent } from '../../utils/bridgeUiHelpers';
import { BridgeIbanMatchBadge } from './BridgeIbanMatchBadge';

type Props = {
  ibanMatchResult: BridgeIbanMatchResult | null;
  declaredIbanMasked?: string | null;
  declaredIbanLast4?: string | null;
  accountCount: number;
  transactionsSummary: BridgeTransactionsSummary;
  t: (key: string) => string;
};

const KPI_LEFT_ACCENT: Record<KpiAccent, string> = {
  neutral: 'border-l-slate-400',
  blue: 'border-l-sky-600',
  green: 'border-l-emerald-600',
  red: 'border-l-rose-600',
};

function KpiCard({
  label,
  children,
  accent = 'neutral',
}: {
  label: string;
  children: ReactNode;
  accent?: KpiAccent;
}) {
  const styles = KPI_ACCENT_STYLES[accent];

  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 min-w-[140px] flex-1 shadow-sm border-l-[3px] ${KPI_LEFT_ACCENT[accent]}`}>
      <p className={`text-[11px] font-medium mb-1.5 ${styles.label}`}>
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

export function BridgeVerificationSummaryKpis({
  ibanMatchResult,
  declaredIbanMasked,
  declaredIbanLast4,
  accountCount,
  transactionsSummary,
  t,
}: Props) {
  const declaredDisplay = displayMaskedIban(declaredIbanMasked ?? null, declaredIbanLast4 ?? null);

  return (
    <div className="flex flex-wrap gap-3">
      <KpiCard label={t('bridge.kpiIbanMatch')} accent="neutral">
        <div className="space-y-2">
          <BridgeIbanMatchBadge result={ibanMatchResult} t={t} size="md" />
          <div>
            <p className="text-[11px] font-medium text-slate-500 mb-0.5">
              {t('bridge.declaredIban')}
            </p>
            <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">{declaredDisplay}</p>
          </div>
        </div>
      </KpiCard>
      <KpiCard label={t('bridge.kpiAccounts')} accent="blue">
        <p className={`text-xl font-semibold tabular-nums ${KPI_ACCENT_STYLES.blue.value}`}>
          {accountCount}
        </p>
      </KpiCard>
      <KpiCard label={t('bridge.kpiTransactions')} accent="neutral">
        <p className={`text-xl font-semibold tabular-nums ${KPI_ACCENT_STYLES.neutral.value}`}>
          {formatCompactNumber(transactionsSummary.count)}
        </p>
      </KpiCard>
      <KpiCard label={t('bridge.kpiInflows')} accent="green">
        <p className={`text-xl font-semibold tabular-nums ${KPI_ACCENT_STYLES.green.value}`}>
          {formatCurrency(transactionsSummary.totalInflows)}
        </p>
      </KpiCard>
      <KpiCard label={t('bridge.kpiOutflows')} accent="red">
        <p className={`text-xl font-semibold tabular-nums ${KPI_ACCENT_STYLES.red.value}`}>
          {formatCurrency(transactionsSummary.totalOutflows)}
        </p>
      </KpiCard>
    </div>
  );
}
