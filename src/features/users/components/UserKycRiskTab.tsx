import type { ReactNode } from 'react';
import type { BackofficeUserKycReviewDTO } from '../api/usersApi';
import { KeyValueGrid } from '../../../components/KeyValueGrid';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { CopyableValue } from '../../kyc/components/CopyableValue';
import { formatCurrency, formatDate, formatDateTime, mapEmploymentStatus } from '../../kyc/utils/format';

function ClientIpBlock({
  identity,
  onCopy,
  t,
}: {
  identity: Record<string, unknown>;
  onCopy?: () => void;
  t: (key: string) => string;
}) {
  const ip = identity.clientIpAddress as string | null | undefined;
  const countryCode = identity.clientIpCountryCode as string | null | undefined;
  const cityRegion = identity.clientIpCityRegion as string | null | undefined;
  const isp = identity.clientIpIsp as string | null | undefined;
  const lookupUrl = identity.clientIpLookupUrl as string | null | undefined;
  const observedAt = identity.clientIpObservedAt as string | null | undefined;
  const eventType = identity.clientIpEventType as string | null | undefined;

  if (!ip) {
    return <span className="text-daret-muted">{t('users.kycRisk.clientIpUnavailable')}</span>;
  }

  return (
    <div className="space-y-2">
      <CopyableValue value={ip} onCopy={onCopy} className="font-mono text-sm" />
      {(countryCode || cityRegion) && (
        <div className="flex flex-wrap items-center gap-2">
          {countryCode ? <CountryDisplay code={countryCode} /> : null}
          <p className="text-xs text-daret-muted leading-snug">
            <span className="font-medium text-daret-fg/90">{t('users.kycRisk.clientIpLikelyRegion')}</span>{' '}
            <span className="text-daret-fg">
              {[cityRegion, countryCode].filter(Boolean).join(cityRegion && countryCode ? ' · ' : '')}
            </span>
          </p>
        </div>
      )}
      {isp ? <p className="text-[11px] text-daret-muted">{isp}</p> : null}
      <p className="text-[11px] text-daret-muted leading-relaxed">{t('users.kycRisk.clientIpHintApprox')}</p>
      {lookupUrl ? (
        <a
          href={lookupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-daret-green hover:underline"
        >
          {t('users.kycRisk.clientIpOpenIpinfo')}
          <span aria-hidden>↗</span>
        </a>
      ) : null}
      {(eventType || observedAt) && (
        <p className="text-[11px] text-daret-muted">
          {eventType ? <span className="font-mono">{eventType}</span> : null}
          {eventType && observedAt ? ' · ' : null}
          {observedAt ? formatDateTime(observedAt) : null}
        </p>
      )}
    </div>
  );
}

function ReviewBadge({ badge }: { badge: string }) {
  const cls =
    badge === 'VERIFIED' || badge === 'APPROVED'
      ? 'bg-daret-green/20 text-daret-green'
      : badge === 'REJECTED'
        ? 'bg-red-500/20 text-red-400'
        : badge === 'PENDING_REVIEW' || badge === 'SUBMITTED'
          ? 'bg-amber-500/20 text-amber-400'
          : 'bg-daret-muted/20 text-daret-muted';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{badge.replace(/_/g, ' ')}</span>;
}

function formatDti(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  if (n > 1) return `${n.toFixed(2)}%`;
  return `${(n * 100).toFixed(2)}%`;
}

const kycSectionIconClass = 'h-5 w-5 shrink-0';

function IconKycIdentity() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconKycAddress() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconKycDocuments() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconKycLiveness() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconKycFinancial() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconKycLoans() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconKycRisk() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconKycSystem() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconKycHistory() {
  return (
    <svg className={kycSectionIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-5">
      <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-daret-fg">
        <span className="inline-flex text-daret-green" aria-hidden>
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function loanTypeLabel(code: string): string {
  return code.replace(/_/g, ' ');
}

function incomeMediaTypeLabel(type: string, t: (key: string) => string): string {
  const key = `users.filters.docType.${type}`;
  const label = t(key);
  return label === key ? type.replace(/_/g, ' ') : label;
}

interface UserKycRiskTabProps {
  review: BackofficeUserKycReviewDTO;
  locale: string;
  onViewAsset: (assetId: string) => void;
  onViewLivenessCapture: (captureId: string) => void;
  onCopy?: () => void;
  t: (key: string) => string;
}

export function UserKycRiskTab({ review, locale, onViewAsset, onViewLivenessCapture, onCopy, t }: UserKycRiskTabProps) {
  const id = review.identity as Record<string, unknown>;
  const addr = review.address;
  const fp = review.financialProfile as {
    employmentStatus?: string;
    monthlyIncome?: number;
    monthlyExpenses?: number;
    hasActiveLoans?: boolean;
    totalMonthlyLoanPayments?: number | null;
    debtToIncomeRatio?: number | null;
    currency?: string;
    disposableIncomeAfterExpensesAndLoans?: number;
    updatedAt?: string;
  } | null;
  const liv = review.liveness as {
    sessionId?: string | null;
    status?: string | null;
    manualReviewRequired?: boolean | null;
    challengeSequence?: unknown;
    submittedAt?: string | null;
    startedAt?: string | null;
    manualReviewStatus?: string;
    captures?: Array<{ captureId: string; captureType: string; mimeType?: string | null; capturedAt?: string | null }>;
  };
  const sys = review.system as {
    overallKycStatus?: string;
    currentKycSteps?: Array<{
      step: string;
      status: string;
      badge: string;
      submittedAt?: string | null;
      reviewedAt?: string | null;
      rejectionReason?: string | null;
      notes?: string | null;
    }>;
    latestSubmission?: Record<string, unknown> | null;
  };

  const riskLevel = review.userSummary.riskLevel;
  const riskLevelCls =
    riskLevel === 'HIGH'
      ? 'text-red-400'
      : riskLevel === 'MEDIUM'
        ? 'text-amber-400'
        : riskLevel === 'LOW'
          ? 'text-daret-green'
          : 'text-daret-muted';

  const missing = review.riskSummary.missingDocuments ?? [];
  const flags = review.riskSummary.flags ?? [];
  const incomeDocs = review.incomeVerificationAssets ?? [];

  const incomeVerificationRow = {
    label: t('users.kycRisk.incomeVerification'),
    value:
      incomeDocs.length === 0 ? (
        <span className="text-daret-muted">{t('users.kycRisk.noIncomeDocuments')}</span>
      ) : (
        <ul className="space-y-2">
          {incomeDocs.map((doc) => (
            <li
              key={doc.assetId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-daret-border/40 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-daret-muted min-w-0">
                <span className="text-daret-fg">{incomeMediaTypeLabel(doc.type, t)}</span>
                {' · '}
                <ReviewBadge badge={doc.reviewBadge} />
                {doc.uploadedAt ? ` · ${formatDateTime(doc.uploadedAt)}` : ''}
                {doc.rejectionReason ? (
                  <span className="block text-amber-400/90 text-xs mt-0.5">{doc.rejectionReason}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => onViewAsset(doc.assetId)}
                className="text-daret-green hover:underline shrink-0 text-xs font-medium"
              >
                {t('users.viewDocument')}
              </button>
            </li>
          ))}
        </ul>
      ),
  };

  return (
    <div className="space-y-6">
      {(missing.length > 0 || flags.some((f) => f.startsWith('FRAUD:') || f === 'FRAUD_BLOCK')) && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium text-amber-200 mb-1">{t('users.kycRisk.attention')}</p>
          {missing.length > 0 && (
            <p className="text-daret-muted">
              {t('users.kycRisk.missingDocs')}: {missing.join(', ')}
            </p>
          )}
          {flags.filter((f) => f !== `MISSING_DOCS:${missing.join(',')}`).length > 0 && (
            <ul className="mt-2 list-disc list-inside text-daret-muted">
              {flags
                .filter((f) => !f.startsWith('MISSING_DOCS:'))
                .map((f) => (
                  <li key={f}>{f}</li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={t('users.kycRisk.identity')} icon={<IconKycIdentity />}>
          <KeyValueGrid
            columns={1}
            rows={[
              { label: t('users.civility'), value: String(id.civility ?? '—') },
              { label: t('users.kycRisk.firstName'), value: String(id.firstName ?? '—') },
              { label: t('users.kycRisk.lastName'), value: String(id.lastName ?? '—') },
              { label: t('users.dateOfBirth'), value: formatDate(id.dateOfBirth as string | undefined) },
              {
                label: t('users.nationality'),
                value: <CountryDisplay code={id.nationalityCountryCode as string | undefined} />,
              },
              {
                label: t('users.countryOfResidence'),
                value: <CountryDisplay code={id.residenceCountryCode as string | undefined} />,
              },
              { label: t('users.kycRisk.cityOfBirth'), value: String(id.cityOfBirth ?? '—') },
              {
                label: t('users.kycRisk.countryOfBirth'),
                value: <CountryDisplay code={id.countryOfBirthCountryCode as string | undefined} />,
              },
              {
                label: t('users.kycRisk.issuingCountry'),
                value: <CountryDisplay code={id.issuingCountryCode as string | undefined} />,
              },
              { label: t('users.kycRisk.documentType'), value: String(id.documentType ?? '—') },
              {
                label: t('users.kycRisk.identityConfirmedAt'),
                value: id.identityConfirmedAt ? formatDateTime(String(id.identityConfirmedAt)) : '—',
              },
              {
                label: t('users.kycRisk.clientIp'),
                value: <ClientIpBlock identity={id} onCopy={onCopy} t={t} />,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={t('users.kycRisk.address')} icon={<IconKycAddress />}>
          <KeyValueGrid
            columns={1}
            rows={[
              { label: t('users.addressLine1'), value: String(addr.streetAddress ?? '—') },
              { label: t('users.addressLine2'), value: String(addr.addressComplement ?? '—') },
              { label: t('users.city'), value: String(addr.city ?? '—') },
              { label: t('users.postalCode'), value: String(addr.postalCode ?? '—') },
              {
                label: t('users.country'),
                value: <CountryDisplay code={addr.countryCode as string | undefined} />,
              },
              {
                label: t('users.kycRisk.addressVerification'),
                value: <ReviewBadge badge={String(addr.verificationStatus ?? 'NOT_STARTED')} />,
              },
              {
                label: t('users.kycRisk.proofUploadedAt'),
                value: addr.proofUploadedAt ? formatDateTime(String(addr.proofUploadedAt)) : '—',
              },
              { label: t('users.kycRisk.proofRejection'), value: String(addr.proofRejectionReason ?? '—') },
            ]}
          />
          {addr.proofOfAddressAssetId ? (
            <button
              type="button"
              onClick={() => onViewAsset(String(addr.proofOfAddressAssetId))}
              className="mt-3 text-sm text-daret-green hover:underline"
            >
              {t('users.viewDocument')} ({t('users.docTypeProofOfAddress')})
            </button>
          ) : null}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.documents')} icon={<IconKycDocuments />}>
          <p className="text-xs text-daret-muted mb-3">
            {t('users.kycRisk.selectedType')}: {String(review.documents.selectedDocumentType ?? '—')}
          </p>
          <ul className="space-y-2">
            {review.documents.items.map((doc) => (
              <li key={doc.assetId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-daret-border px-3 py-2">
                <div>
                  <span className="text-sm text-daret-fg">{doc.label}</span>
                  <span className="ml-2">
                    <ReviewBadge badge={doc.reviewBadge} />
                  </span>
                  {doc.rejectionReason ? (
                    <p className="text-xs text-red-400 mt-1">{doc.rejectionReason}</p>
                  ) : null}
                  <p className="text-xs text-daret-muted mt-0.5">
                    {doc.createdAt ? formatDateTime(doc.createdAt) : '—'}
                  </p>
                </div>
                <button type="button" onClick={() => onViewAsset(doc.assetId)} className="text-sm text-daret-green hover:underline shrink-0">
                  {t('users.viewDocument')}
                </button>
              </li>
            ))}
          </ul>
          {review.documents.selfie.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-daret-muted uppercase mb-2">{t('users.selfie')}</p>
              <ul className="space-y-2">
                {review.documents.selfie.map((s) => (
                  <li key={s.assetId} className="flex items-center justify-between gap-2 rounded-lg border border-daret-border px-3 py-2">
                    <span className="text-sm text-daret-fg">
                      <ReviewBadge badge={s.reviewBadge} />{' '}
                      <span className="text-daret-muted text-xs ml-1">{s.createdAt ? formatDateTime(s.createdAt) : ''}</span>
                    </span>
                    <button type="button" onClick={() => onViewAsset(s.assetId)} className="text-sm text-daret-green hover:underline">
                      {t('users.viewDocument')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.liveness')} icon={<IconKycLiveness />}>
          <KeyValueGrid
            columns={1}
            rows={[
              { label: t('users.kycRisk.livenessStatus'), value: String(liv.status ?? '—') },
              { label: t('users.kycRisk.manualReview'), value: String(liv.manualReviewStatus ?? '—') },
              { label: t('users.kycRisk.challengeSequence'), value: liv.challengeSequence != null ? JSON.stringify(liv.challengeSequence) : '—' },
              { label: t('users.submitted'), value: liv.submittedAt ? formatDateTime(String(liv.submittedAt)) : '—' },
              { label: t('users.kycRisk.startedAt'), value: liv.startedAt ? formatDateTime(String(liv.startedAt)) : '—' },
            ]}
          />
          {(liv.captures ?? []).length > 0 ? (
            <ul className="mt-3 space-y-2">
              {(liv.captures ?? []).map((c) => (
                <li key={c.captureId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-daret-muted">
                    {c.captureType}
                    {c.capturedAt ? ` · ${formatDateTime(c.capturedAt)}` : ''}
                  </span>
                  <button type="button" onClick={() => onViewLivenessCapture(c.captureId)} className="text-daret-green hover:underline">
                    {t('users.viewDocument')}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-daret-muted mt-2">{t('users.kycRisk.noLiveness')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.financial')} icon={<IconKycFinancial />}>
          {!fp && incomeDocs.length === 0 ? (
            <p className="text-sm text-daret-muted">{t('common.noData')}</p>
          ) : (
            <>
              {!fp && incomeDocs.length > 0 ? (
                <p className="text-sm text-daret-muted mb-3">{t('users.kycRisk.financialProfileIncomplete')}</p>
              ) : null}
              <KeyValueGrid
                columns={1}
                rows={[
                  ...(fp
                    ? [
                        { label: t('users.employment'), value: mapEmploymentStatus(fp.employmentStatus, locale) },
                        { label: t('users.monthlyIncome'), value: formatCurrency(fp.monthlyIncome, fp.currency) },
                        { label: t('users.monthlyExpenses'), value: formatCurrency(fp.monthlyExpenses, fp.currency) },
                        { label: t('users.kycRisk.hasLoans'), value: fp.hasActiveLoans ? t('users.yes') : '—' },
                        {
                          label: t('users.kycRisk.totalLoanPayments'),
                          value: formatCurrency(fp.totalMonthlyLoanPayments ?? undefined, fp.currency),
                        },
                        {
                          label: t('users.kycRisk.dti'),
                          value: formatDti(fp.debtToIncomeRatio ?? null),
                        },
                        {
                          label: t('users.kycRisk.disposable'),
                          value: formatCurrency(fp.disposableIncomeAfterExpensesAndLoans, fp.currency),
                        },
                      ]
                    : []),
                  incomeVerificationRow,
                  ...(fp
                    ? [
                        {
                          label: t('users.kycRisk.financialUpdated'),
                          value: fp.updatedAt ? formatDateTime(fp.updatedAt) : '—',
                        },
                      ]
                    : []),
                ]}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.activeLoans')} icon={<IconKycLoans />}>
          {review.activeLoans.length === 0 ? (
            <p className="text-sm text-daret-muted">{t('users.kycRisk.noLoans')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-daret-muted border-b border-daret-border">
                    <th className="py-2 pr-3">{t('users.kycRisk.loanType')}</th>
                    <th className="py-2 pr-3">{t('users.kycRisk.lender')}</th>
                    <th className="py-2 pr-3">{t('users.amount')}</th>
                    <th className="py-2 pr-3">{t('users.kycRisk.monthlyPay')}</th>
                    <th className="py-2 pr-3">{t('users.kycRisk.duration')}</th>
                    <th className="py-2 pr-3">{t('users.kycRisk.startDate')}</th>
                    <th className="py-2">{t('users.kycRisk.notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {review.activeLoans.map((row) => {
                    const r = row as {
                      loanType?: string;
                      lenderName?: string;
                      amount?: number | null;
                      monthlyPayment?: number;
                      durationMonths?: number;
                      startDate?: string;
                      notes?: string | null;
                    };
                    return (
                      <tr key={String(row.id)} className="border-b border-daret-border/50">
                        <td className="py-2 pr-3 text-daret-fg">{loanTypeLabel(String(r.loanType))}</td>
                        <td className="py-2 pr-3 text-daret-muted">{r.lenderName}</td>
                        <td className="py-2 pr-3 text-daret-muted">{r.amount != null ? formatCurrency(r.amount, fp?.currency) : '—'}</td>
                        <td className="py-2 pr-3 text-daret-muted">{formatCurrency(r.monthlyPayment, fp?.currency)}</td>
                        <td className="py-2 pr-3 text-daret-muted">{r.durationMonths}</td>
                        <td className="py-2 pr-3 text-daret-muted">{r.startDate ? formatDate(r.startDate) : '—'}</td>
                        <td className="py-2 text-daret-muted max-w-[140px] truncate" title={r.notes ?? ''}>
                          {r.notes ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.riskSummary')} icon={<IconKycRisk />}>
          <p className={`text-sm font-medium mb-2 ${riskLevelCls}`}>
            {t('users.kycRisk.riskLevel')}: {riskLevel}
          </p>
          {review.riskSummary.scoring ? (
            <KeyValueGrid
              columns={1}
              rows={[
                {
                  label: t('users.kycRisk.scoreBand'),
                  value: String((review.riskSummary.scoring as { scoreBand?: string }).scoreBand ?? '—'),
                },
                {
                  label: t('users.kycRisk.finalRec'),
                  value: String((review.riskSummary.scoring as { finalRecommendation?: string }).finalRecommendation ?? '—'),
                },
                {
                  label: t('users.kycRisk.fraudRec'),
                  value: String((review.riskSummary.scoring as { fraudRecommendation?: string }).fraudRecommendation ?? '—'),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-daret-muted">{t('users.kycRisk.noScoring')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('users.kycRisk.system')} icon={<IconKycSystem />}>
          <KeyValueGrid
            columns={1}
            rows={[
              { label: t('users.kycStatus'), value: String(sys.overallKycStatus ?? '—') },
              {
                label: t('users.kycRisk.latestSubmission'),
                value: sys.latestSubmission?.id ? String((sys.latestSubmission as { status?: string }).status) : '—',
              },
              {
                label: t('users.submitted'),
                value: (sys.latestSubmission as { submittedAt?: string })?.submittedAt
                  ? formatDateTime(String((sys.latestSubmission as { submittedAt?: string }).submittedAt))
                  : '—',
              },
              {
                label: t('users.kycRisk.internalNotes'),
                value: String((sys.latestSubmission as { internalNotes?: string | null })?.internalNotes ?? '—'),
              },
              {
                label: t('users.kycRisk.rejectionReason'),
                value: String((sys.latestSubmission as { rejectionReason?: string | null })?.rejectionReason ?? '—'),
              },
            ]}
          />
          {(sys.currentKycSteps ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-daret-muted uppercase mb-2">{t('users.kycRisk.steps')}</p>
              <ul className="space-y-2 text-sm">
                {(sys.currentKycSteps ?? []).map((st) => (
                  <li key={st.step} className="flex flex-wrap items-center gap-2 border border-daret-border/50 rounded-lg px-2 py-1.5">
                    <span className="text-daret-fg font-medium">{st.step}</span>
                    <ReviewBadge badge={st.badge} />
                    {st.rejectionReason ? <span className="text-red-400 text-xs">{st.rejectionReason}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title={t('users.kycRisk.reviewHistory')} icon={<IconKycHistory />}>
        {review.reviewHistory.length === 0 ? (
          <p className="text-sm text-daret-muted">{t('users.noEvents')}</p>
        ) : (
          <ul className="space-y-3 max-h-[480px] overflow-y-auto">
            {review.reviewHistory.map((entry, idx) => {
              const e = entry as Record<string, unknown>;
              const type = String(e.type ?? '');
              const when = String(e.decidedAt || e.createdAt || e.submittedAt || '');
              let body: ReactNode = null;
              if (type === 'COMMENT') {
                body = (
                  <>
                    <p className="text-daret-fg mt-1">{String(e.comment ?? '')}</p>
                    <p className="text-xs text-daret-muted">{String(e.reviewerEmail ?? '')}</p>
                  </>
                );
              } else if (type === 'DECISION') {
                body = (
                  <p className="text-daret-muted mt-1">
                    {String(e.decision ?? '')}
                    {e.note ? ` — ${String(e.note)}` : ''}
                  </p>
                );
              } else if (type === 'SUBMISSION') {
                body = (
                  <p className="text-daret-muted mt-1">
                    {String(e.status ?? '')}
                    {e.internalNotes ? ` · ${String(e.internalNotes)}` : ''}
                    {e.rejectionReason ? ` · ${String(e.rejectionReason)}` : ''}
                  </p>
                );
              }
              return (
                <li key={idx} className="border-l-2 border-daret-border pl-3 text-sm">
                  <span className="text-daret-green font-medium">{type}</span>
                  {when ? <span className="text-daret-muted text-xs ml-2">{formatDateTime(when)}</span> : null}
                  {body}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
