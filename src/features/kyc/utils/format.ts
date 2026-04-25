/**
 * Formatting helpers for fintech backoffice: dates, currency, enums.
 * Employment and country labels use reference-data cache when available (see ReferenceDataLoader).
 */
import { getReferenceLabel } from '../../../app/referenceData/referenceDataCache';

export function formatDate(dateIso: string | null | undefined): string {
  if (!dateIso) return '—';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateIso: string | null | undefined): string {
  if (!dateIso) return '—';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} • ${time}`;
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'MAD'): string {
  if (amount == null) return '—';
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/** Debt-to-income etc.: ratio 0.35 → "35.0%". */
export function formatPercentRatio(ratio: number | null | undefined, fractionDigits = 1): string {
  if (ratio == null || Number.isNaN(ratio)) return '—';
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  MORTGAGE: 'Mortgage',
  AUTO_LOAN: 'Auto loan',
  CONSUMER_LOAN: 'Consumer loan',
  STUDENT_LOAN: 'Student loan',
  CREDIT_CARD: 'Credit card',
  MICROCREDIT: 'Microcredit',
  OTHER: 'Other',
};

export function formatLoanType(value: string | null | undefined): string {
  if (!value) return '—';
  return (
    LOAN_TYPE_LABELS[value] ??
    value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

const KYC_DOC_TYPE_LABELS: Record<string, string> = {
  ID_CARD: 'National ID card',
  PASSPORT: 'Passport',
  RESIDENCE_PERMIT: 'Residence permit',
};

export function formatKycDocumentType(value: string | null | undefined): string {
  if (!value) return '—';
  return KYC_DOC_TYPE_LABELS[value] ?? value.replace(/_/g, ' ');
}

/** Fallback English labels when reference cache is missing or wrong locale (e.g. first paint before load). */
const EMPLOYMENT_STATUS_FALLBACK: Record<string, string> = {
  EMPLOYED: 'Employed',
  SELF_EMPLOYED: 'Self-employed',
  UNEMPLOYED: 'Unemployed',
  STUDENT: 'Student',
  RETIRED: 'Retired',
  EMPLOYEE_PRIVATE: 'Private sector employee',
  EMPLOYEE_PUBLIC: 'Public sector employee',
  OTHER: 'Other',
};

export function mapEmploymentStatus(value: string | null | undefined, locale?: string): string {
  if (!value) return '—';
  const fromRef = locale ? getReferenceLabel('employment_status', value, locale) : undefined;
  return fromRef ?? EMPLOYMENT_STATUS_FALLBACK[value] ?? value.replace(/_/g, ' ');
}

export type KycStatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export function mapKycStatus(value: string | null | undefined): { label: string; variant: KycStatusVariant } {
  if (!value) return { label: '—', variant: 'default' };
  const map: Record<string, { label: string; variant: KycStatusVariant }> = {
    NONE: { label: 'Not started', variant: 'default' },
    PENDING: { label: 'Pending', variant: 'default' },
    UNDER_REVIEW: { label: 'Under review', variant: 'info' },
    VERIFIED: { label: 'Verified', variant: 'success' },
    REJECTED: { label: 'Rejected', variant: 'error' },
  };
  return map[value] ?? { label: value.replace(/_/g, ' '), variant: 'default' };
}

/** Normalize to ISO 3166-1 alpha-2 (2-char uppercase) for consistent lookup and flag. */
export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = String(code).trim();
  if (trimmed.length < 2) return null;
  const upper = trimmed.toUpperCase();
  const two = upper.slice(0, 2);
  if (two.length < 2) return null;
  return two;
}

/** Fallback names when reference-data cache is not yet loaded or code not in domain. Avoids showing raw code. */
const COUNTRY_NAME_FALLBACK: Record<string, string> = {
  MA: 'Morocco', FR: 'France', ES: 'Spain', BE: 'Belgium', DE: 'Germany', GB: 'United Kingdom',
  US: 'United States', CA: 'Canada', DZ: 'Algeria', TN: 'Tunisia', EG: 'Egypt', SA: 'Saudi Arabia',
  AE: 'United Arab Emirates', NL: 'Netherlands', IT: 'Italy', PT: 'Portugal', CH: 'Switzerland',
  SN: 'Senegal', CI: 'Ivory Coast', ML: 'Mali', NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya',
  CM: 'Cameroon', BF: 'Burkina Faso', NE: 'Niger', TG: 'Togo', BJ: 'Benin',
  __OTHER__: 'Other', __MISSING__: '—',
};

/** Canonical names for codes where reference data may have wrong/typo labels (e.g. "Franco" for FR). */
const COUNTRY_NAME_CANONICAL: Record<string, string> = {
  FR: 'France',
};

export function getCountryName(code: string | null | undefined, locale?: string): string {
  const norm = normalizeCountryCode(code);
  if (!norm) return '—';
  if (COUNTRY_NAME_CANONICAL[norm]) return COUNTRY_NAME_CANONICAL[norm];
  const fromRef = locale
    ? (getReferenceLabel('nationality_country', norm, locale) ?? getReferenceLabel('residence_country', norm, locale))
    : undefined;
  if (fromRef) return fromRef;
  return COUNTRY_NAME_FALLBACK[norm] ?? 'Unknown country';
}

/** Regional indicator symbols for flag emoji (e.g. MA -> 🇲🇦). Uses first 2 chars only. */
export function getCountryFlag(code: string | null | undefined): string {
  const norm = normalizeCountryCode(code);
  if (!norm) return '';
  const a = (norm.charCodeAt(0) - 65) + 0x1f1e6;
  const b = (norm.charCodeAt(1) - 65) + 0x1f1e6;
  if (a < 0x1f1e6 || a > 0x1f1ff || b < 0x1f1e6 || b > 0x1f1ff) return '';
  return String.fromCodePoint(a, b);
}

export interface CountryDisplayValue {
  flag: string;
  name: string;
  code: string | null;
}

/** Single source for "flag + name" display. Never duplicates raw code; unknown codes show name fallback or "—". */
export function formatCountryDisplay(code: string | null | undefined, locale?: string): CountryDisplayValue {
  const norm = normalizeCountryCode(code);
  if (!norm) return { flag: '', name: '—', code: null };
  const flag = getCountryFlag(norm);
  const name = getCountryName(norm, locale);
  return { flag, name, code: norm };
}
