import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  mapEmploymentStatus,
  formatPercentRatio,
  formatLoanType,
  formatKycDocumentType,
} from '../utils/format';
import type { DisplayUser, IdDocumentCompletionStatus } from '../types/displayUser';
import { FieldRow } from './FieldRow';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { CopyableValue } from './CopyableValue';
import { StatusChip } from './StatusChip';
import { getSignedUrl } from '../../../api/kyc';
import { useI18n } from '../../../app/i18n/I18nContext';
import { formatFullNameLastUpper } from '../../../lib/userDisplay';
import { useReferenceDataVersion } from '../../../app/referenceData/ReferenceDataContext';

interface UserProfileCardsProps {
  displayUser: DisplayUser;
  onCopy?: () => void;
  /** First selfie asset id to show in Identity block */
  selfieAssetId?: string;
}

const sectionIconClass = 'h-5 w-5 shrink-0';

function CardSectionTitle({ title, icon, mbClass = 'mb-4' }: { title: string; icon: ReactNode; mbClass?: string }) {
  return (
    <h3
      className={`flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-daret-fg ${mbClass}`}
    >
      <span className="inline-flex text-daret-green" aria-hidden>
        {icon}
      </span>
      {title}
    </h3>
  );
}

function IconIdentity() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconVerification() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconContact() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconAddress() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconFinancial() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function IconRiskSignals() {
  return (
    <svg className={sectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function idDocStatusLabel(status: IdDocumentCompletionStatus, t: (k: string) => string): string {
  const keys: Record<IdDocumentCompletionStatus, string> = {
    NOT_STARTED: 'kyc.idDocNotStarted',
    FRONT_ONLY: 'kyc.idDocFrontOnly',
    BACK_ONLY: 'kyc.idDocBackOnly',
    COMPLETE: 'kyc.idDocComplete',
    FAILED: 'kyc.idDocFailed',
  };
  return t(keys[status]);
}

function livenessSummary(l: DisplayUser['liveness'], t: (k: string) => string): string {
  if (!l) return t('kyc.livenessNotStarted');
  const st = String(l.status || '').toUpperCase();
  if (st === 'EXPIRED') return t('kyc.livenessExpired');
  if (st === 'IN_PROGRESS') return t('kyc.livenessInProgress');
  if (st === 'SUBMITTED') {
    return l.manualReviewRequired !== false ? t('kyc.livenessPendingReview') : t('kyc.livenessPassed');
  }
  return l.status;
}

export function UserProfileCards({ displayUser: u, onCopy, selfieAssetId }: UserProfileCardsProps) {
  const { locale, t } = useI18n();
  useReferenceDataVersion();
  const lastUpdated = u.submissionUpdatedAt ?? u.userUpdatedAt;
  const { data: signedUrlRes } = useQuery({
    queryKey: ['signed-url', selfieAssetId],
    queryFn: () => getSignedUrl(selfieAssetId!),
    enabled: !!selfieAssetId,
  });
  const selfieUrl = signedUrlRes?.data?.url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <CardSectionTitle title={t('kyc.identity')} icon={<IconIdentity />} />
          {selfieUrl && (
            <div className="mb-4">
              <img
                src={selfieUrl}
                alt={t('kyc.selfie')}
                className="rounded-lg w-20 h-20 object-cover border border-daret-border"
              />
            </div>
          )}
          <dl className="space-y-0">
            <FieldRow
              label={t('kyc.fullNameLegal')}
              value={u.fullName?.trim() ? formatFullNameLastUpper(u.fullName) : '—'}
            />
            <FieldRow label={t('kyc.civility')} value={u.civility ?? '—'} />
            <FieldRow label={t('kyc.dateOfBirth')} value={formatDate(u.dateOfBirth)} />
            <FieldRow label={t('kyc.nationality')} value={<CountryDisplay code={u.nationalityCountryCode} />} />
            <FieldRow label={t('kyc.countryOfResidence')} value={<CountryDisplay code={u.residenceCountryCode} />} />
            <FieldRow label={t('kyc.cityOfBirth')} value={u.cityOfBirth ?? '—'} />
            <FieldRow
              label={t('kyc.countryOfBirth')}
              value={<CountryDisplay code={u.countryOfBirthCountryCode} />}
            />
            <FieldRow label={t('kyc.documentType')} value={formatKycDocumentType(u.identityDocumentType)} />
            <FieldRow
              label={t('kyc.issuingCountry')}
              value={<CountryDisplay code={u.identityIssuingCountryCode} />}
            />
            <FieldRow label={t('kyc.fieldKycStatus')} value={<StatusChip status={u.kycStatus} />} />
          </dl>
        </div>

        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <CardSectionTitle title={t('kyc.verification')} icon={<IconVerification />} />
          <dl className="space-y-0">
            <FieldRow label={t('kyc.idDocuments')} value={idDocStatusLabel(u.idDocumentStatus, t)} />
            <FieldRow label={t('kyc.liveness')} value={livenessSummary(u.liveness, t)} />
            {u.liveness?.submittedAt && (
              <FieldRow label={t('kyc.livenessSubmittedAt')} value={formatDateTime(u.liveness.submittedAt)} />
            )}
          </dl>
        </div>

        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <CardSectionTitle title={t('kyc.contact')} icon={<IconContact />} />
          <dl className="space-y-0">
            <FieldRow
              label={t('users.email')}
              value={<CopyableValue value={u.email ?? ''} onCopy={onCopy} />}
            />
            <FieldRow
              label={t('users.phone')}
              value={
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <CopyableValue value={u.phoneE164 ?? ''} onCopy={onCopy} />
                  {u.phoneVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-daret-green/20 text-daret-green px-2 py-0.5 text-xs font-medium">
                      ✓ {t('kyc.phoneVerified')}
                    </span>
                  )}
                </span>
              }
            />
          </dl>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <CardSectionTitle title={t('kyc.address')} icon={<IconAddress />} />
          <dl className="space-y-0">
            <FieldRow label={t('kyc.addressLine1')} value={u.addressLine1 ?? '—'} />
            <FieldRow label={t('kyc.addressLine2')} value={u.addressLine2 ?? '—'} />
            <FieldRow label={t('kyc.city')} value={u.city ?? '—'} />
            <FieldRow label={t('kyc.postalCode')} value={u.postalCode ?? '—'} />
            <FieldRow label={t('kyc.country')} value={<CountryDisplay code={u.addressCountryCode} />} />
          </dl>
        </div>

        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <CardSectionTitle title={t('kyc.financialProfile')} icon={<IconFinancial />} />
          <dl className="space-y-0">
            <FieldRow label={t('kyc.employmentStatus')} value={mapEmploymentStatus(u.employmentStatus, locale)} />
            <FieldRow label={t('kyc.monthlyIncome')} value={formatCurrency(u.monthlyIncome, u.currency)} />
            <FieldRow label={t('kyc.monthlyExpenses')} value={formatCurrency(u.monthlyExpenses, u.currency)} />
            <FieldRow label={t('kyc.currency')} value={u.currency} />
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
            <div className="mt-4 pt-4 border-t border-daret-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-daret-muted mb-2">{t('kyc.activeLoansTitle')}</p>
              <ul className="space-y-3">
                {u.activeLoans.map((loan, i) => (
                  <li
                    key={`${loan.lenderName ?? ''}-${loan.loanType ?? ''}-${i}`}
                    className="rounded-lg border border-daret-border/80 bg-daret-dark/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-daret-fg">
                      {formatLoanType(loan.loanType)}
                      {loan.lenderName ? <span className="text-daret-muted font-normal"> · {loan.lenderName}</span> : null}
                    </p>
                    <p className="text-daret-muted text-xs mt-1">
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
      </div>

      {lastUpdated && (
        <p className="lg:col-span-2 text-xs text-daret-muted">
          {t('kyc.lastUpdated')}: {formatDateTime(lastUpdated)}
        </p>
      )}
    </div>
  );
}

/** Risk signal item for the panel. */
export interface RiskSignal {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'error';
}

export function computeRiskSignals(displayUser: DisplayUser, t: (key: string) => string): RiskSignal[] {
  const signals: RiskSignal[] = [];

  if (displayUser.nationalityCountryCode && displayUser.residenceCountryCode) {
    if (displayUser.nationalityCountryCode.toUpperCase() !== displayUser.residenceCountryCode.toUpperCase()) {
      signals.push({
        id: 'residence-mismatch',
        label: t('kyc.residenceCountryNotNationality'),
        severity: 'info',
      });
    }
  }

  if (
    displayUser.countryOfBirthCountryCode &&
    displayUser.nationalityCountryCode &&
    displayUser.countryOfBirthCountryCode.toUpperCase() !== displayUser.nationalityCountryCode.toUpperCase()
  ) {
    signals.push({
      id: 'birth-nationality-mismatch',
      label: t('kyc.birthVsNationalityMismatch'),
      severity: 'info',
    });
  }

  return signals;
}

const severityClasses = {
  info: 'text-blue-400 bg-blue-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  error: 'text-red-400 bg-red-500/10',
};

export function RiskSignalsPanel({ signals }: { signals: RiskSignal[] }) {
  const { t } = useI18n();
  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-5">
      <CardSectionTitle title={t('kyc.riskSignals')} icon={<IconRiskSignals />} mbClass="mb-3" />
      {signals.length === 0 ? (
        <p className="text-sm text-daret-muted">{t('kyc.noRiskSignals')}</p>
      ) : (
        <ul className="space-y-2">
          {signals.map((s) => (
            <li
              key={s.id}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${severityClasses[s.severity]}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
