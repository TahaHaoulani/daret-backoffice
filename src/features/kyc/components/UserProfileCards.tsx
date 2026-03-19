import { useQuery } from '@tanstack/react-query';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  mapEmploymentStatus,
} from '../utils/format';
import type { DisplayUser } from '../types/displayUser';
import { FieldRow } from './FieldRow';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { CopyableValue } from './CopyableValue';
import { StatusChip } from './StatusChip';
import { getSignedUrl } from '../../../api/kyc';
import { useI18n } from '../../../app/i18n/I18nContext';
import { useReferenceDataVersion } from '../../../app/referenceData/ReferenceDataContext';

interface UserProfileCardsProps {
  displayUser: DisplayUser;
  onCopy?: () => void;
  /** First selfie asset id to show in Identity block */
  selfieAssetId?: string;
}

export function UserProfileCards({ displayUser: u, onCopy, selfieAssetId }: UserProfileCardsProps) {
  const { locale } = useI18n();
  useReferenceDataVersion(); // Re-render when ref data (e.g. employment_status labels) is loaded for current locale
  const lastUpdated = u.submissionUpdatedAt ?? u.userUpdatedAt;
  const { data: signedUrlRes } = useQuery({
    queryKey: ['signed-url', selfieAssetId],
    queryFn: () => getSignedUrl(selfieAssetId!),
    enabled: !!selfieAssetId,
  });
  const selfieUrl = signedUrlRes?.data?.url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: Identity & Contact */}
      <div className="space-y-6">
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">Identity</h3>
          {selfieUrl && (
            <div className="mb-4">
              <img
                src={selfieUrl}
                alt="Selfie"
                className="rounded-lg w-20 h-20 object-cover border border-daret-border"
              />
            </div>
          )}
          <dl className="space-y-0">
            <FieldRow label="Full name (legal)" value={u.fullName} />
            <FieldRow label="Date of birth" value={formatDate(u.dateOfBirth)} />
            <FieldRow label="Nationality" value={<CountryDisplay code={u.nationalityCountryCode} />} />
            <FieldRow label="Country of residence" value={<CountryDisplay code={u.residenceCountryCode} />} />
            <FieldRow
              label="KYC status"
              value={<StatusChip status={u.kycStatus} />}
            />
          </dl>
        </div>

        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">Contact</h3>
          <dl className="space-y-0">
            <FieldRow
              label="Email"
              value={<CopyableValue value={u.email ?? ''} onCopy={onCopy} />}
            />
            <FieldRow
              label="Phone"
              value={
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <CopyableValue value={u.phoneE164 ?? ''} onCopy={onCopy} />
                  {u.phoneVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-daret-green/20 text-daret-green px-2 py-0.5 text-xs font-medium">
                      ✓ Verified
                    </span>
                  )}
                </span>
              }
            />
          </dl>
        </div>
      </div>

      {/* Right column: Address & Financial */}
      <div className="space-y-6">
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">Address</h3>
          <dl className="space-y-0">
            <FieldRow label="Address line 1" value={u.addressLine1 ?? '—'} />
            <FieldRow label="Address line 2" value={u.addressLine2 ?? '—'} />
            <FieldRow label="City" value={u.city ?? '—'} />
            <FieldRow label="Postal code" value={u.postalCode ?? '—'} />
            <FieldRow label="Country" value={<CountryDisplay code={u.addressCountryCode} />} />
          </dl>
        </div>

        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">Financial profile</h3>
          <dl className="space-y-0">
            <FieldRow label="Employment status" value={mapEmploymentStatus(u.employmentStatus, locale)} />
            <FieldRow label="Monthly income" value={formatCurrency(u.monthlyIncome, u.currency)} />
            <FieldRow label="Monthly expenses" value={formatCurrency(u.monthlyExpenses, u.currency)} />
            <FieldRow label="Currency" value={u.currency} />
          </dl>
        </div>
      </div>

      {lastUpdated && (
        <p className="lg:col-span-2 text-xs text-daret-muted">
          Last updated: {formatDateTime(lastUpdated)}
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

export function computeRiskSignals(displayUser: DisplayUser): RiskSignal[] {
  const signals: RiskSignal[] = [];

  if (displayUser.nationalityCountryCode && displayUser.residenceCountryCode) {
    if (displayUser.nationalityCountryCode.toUpperCase() !== displayUser.residenceCountryCode.toUpperCase()) {
      signals.push({
        id: 'residence-mismatch',
        label: 'Residence country ≠ Nationality',
        severity: 'info',
      });
    }
  }

  // Placeholders for future heuristics (not shown when empty; we could add "Document missing" etc. when we have doc state)
  // if (!hasRequiredDocs) signals.push({ id: 'doc-missing', label: 'Document missing', severity: 'warning' });
  // if (multipleSubmissions) signals.push({ id: 'multiple', label: 'Multiple submissions', severity: 'info' });

  return signals;
}

const severityClasses = {
  info: 'text-blue-400 bg-blue-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  error: 'text-red-400 bg-red-500/10',
};

export function RiskSignalsPanel({ signals }: { signals: RiskSignal[] }) {
  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-3">Risk signals</h3>
      {signals.length === 0 ? (
        <p className="text-sm text-daret-muted">No notable signals</p>
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
