import type { ReactNode } from 'react';
import type { DisplayUser } from '../types/displayUser';
import { FieldRow } from './FieldRow';
import {
  formatCurrency,
  formatDate,
  mapEmploymentStatus,
  formatPercentRatio,
  formatLoanType,
} from '../utils/format';
import { useI18n } from '../../../app/i18n/I18nContext';
import { useReferenceDataVersion } from '../../../app/referenceData/ReferenceDataContext';

function IconFinancial() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CardSectionTitle({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-daret-fg">
      <span className="inline-flex text-daret-green" aria-hidden>
        {icon}
      </span>
      {title}
    </h3>
  );
}

type Props = {
  displayUser: DisplayUser;
};

export function FinancialProfileCard({ displayUser: u }: Props) {
  const { locale, t } = useI18n();
  useReferenceDataVersion();

  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-5">
      <CardSectionTitle title={t('kyc.financialProfile')} icon={<IconFinancial />} />
      <dl className="space-y-0">
        <FieldRow label={t('kyc.employmentStatus')} value={mapEmploymentStatus(u.employmentStatus, locale)} />
        <FieldRow label={t('kyc.monthlyIncome')} value={formatCurrency(u.monthlyIncome, u.currency)} />
        <FieldRow label={t('kyc.monthlyExpenses')} value={formatCurrency(u.monthlyExpenses, u.currency)} />
        <FieldRow label={t('kyc.currency')} value={u.currency} />
        <FieldRow
          label={t('kyc.bankIban')}
          value={
            u.bankIbanMasked ? (
              <span className="font-mono text-sm tabular-nums">{u.bankIbanMasked}</span>
            ) : (
              '—'
            )
          }
        />
        <FieldRow
          label={t('kyc.hasActiveLoans')}
          value={u.hasActiveLoans == null ? '—' : u.hasActiveLoans ? t('users.yes') : t('users.no')}
        />
        <FieldRow
          label={t('kyc.totalMonthlyLoanPayments')}
          value={formatCurrency(u.totalMonthlyLoanPayments, u.currency)}
        />
        <FieldRow label={t('kyc.debtToIncomeRatio')} value={formatPercentRatio(u.debtToIncomeRatio)} />
        <FieldRow
          label={t('kyc.remainingDisposableIncome')}
          value={formatCurrency(u.remainingDisposableIncome, u.currency)}
        />
      </dl>
      {u.activeLoans.length > 0 && (
        <div className="mt-4 border-t border-daret-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-daret-muted">
            {t('kyc.activeLoansTitle')}
          </p>
          <ul className="space-y-3">
            {u.activeLoans.map((loan, i) => (
              <li
                key={`${loan.lenderName ?? ''}-${loan.loanType ?? ''}-${i}`}
                className="rounded-lg border border-daret-border/80 bg-daret-dark/30 px-3 py-2 text-sm"
              >
                <p className="font-medium text-daret-fg">
                  {formatLoanType(loan.loanType)}
                  {loan.lenderName ? (
                    <span className="font-normal text-daret-muted"> · {loan.lenderName}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-daret-muted">
                  {t('kyc.loanAmount')}: {formatCurrency(loan.amount, u.currency)} · {t('kyc.monthlyPayment')}:{' '}
                  {formatCurrency(loan.monthlyPayment, u.currency)}
                  {loan.durationMonths != null ? ` · ${t('kyc.durationMonths')}: ${loan.durationMonths}` : ''}
                  {loan.startDate ? ` · ${t('kyc.startDate')}: ${formatDate(loan.startDate)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
