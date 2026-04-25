/**
 * Display model for the Overview tab: mapped from API submission + user + profile + kycProfile + riskProfile + media.
 */
export type IdDocumentCompletionStatus = 'NOT_STARTED' | 'FRONT_ONLY' | 'BACK_ONLY' | 'COMPLETE' | 'FAILED';

export interface DisplayLoan {
  loanType: string | null;
  lenderName: string | null;
  amount: number | null;
  monthlyPayment: number | null;
  durationMonths: number | null;
  startDate: string | null;
}

export interface DisplayUser {
  userId: string;
  submissionId: string;
  fullName: string;
  middleName: string | null;
  civility: string | null;
  dateOfBirth: string | null;
  nationalityCountryCode: string | null;
  residenceCountryCode: string | null;
  cityOfBirth: string | null;
  countryOfBirthCountryCode: string | null;
  kycStatus: string;
  email: string | null;
  phoneE164: string | null;
  phoneVerified: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  addressCountryCode: string | null;
  employmentStatus: string | null;
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  currency: string;
  hasActiveLoans: boolean | null;
  totalMonthlyLoanPayments: number | null;
  debtToIncomeRatio: number | null;
  remainingDisposableIncome: number | null;
  activeLoans: DisplayLoan[];
  identityDocumentType: string | null;
  identityIssuingCountryCode: string | null;
  idDocumentStatus: IdDocumentCompletionStatus;
  liveness: { status: string; manualReviewRequired?: boolean; submittedAt?: string | null } | null;
  submissionUpdatedAt: string | null;
  userUpdatedAt: string | null;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: () => number }).toNumber === 'function') {
    try {
      const n = (v as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function normalizeDebtToIncomeRatio(raw: unknown): number | null {
  const n = num(raw);
  if (n == null) return null;
  if (n > 1) return n / 100;
  return n;
}

/** Same rules as backend scoringValueHelpers.deriveIdDocumentCompletion (submission-linked media). */
export function deriveIdDocumentCompletionFromMedia(
  mediaByType: Record<string, Array<{ status?: string }>> | undefined,
): IdDocumentCompletionStatus {
  if (!mediaByType) return 'NOT_STARTED';
  const pick = (type: string) => mediaByType[type]?.[0];
  const by = {
    PASSPORT: pick('PASSPORT'),
    ID_FRONT: pick('ID_FRONT'),
    ID_BACK: pick('ID_BACK'),
  };
  const rejected = (row: { status?: string } | undefined) =>
    row && String(row.status || '').toUpperCase() === 'REJECTED';
  if (rejected(by.ID_FRONT) || rejected(by.ID_BACK) || rejected(by.PASSPORT)) return 'FAILED';
  if (by.PASSPORT) return 'COMPLETE';
  if (!by.ID_FRONT && !by.ID_BACK) return 'NOT_STARTED';
  if (by.ID_FRONT && !by.ID_BACK) return 'FRONT_ONLY';
  if (!by.ID_FRONT && by.ID_BACK) return 'BACK_ONLY';
  if (by.ID_FRONT && by.ID_BACK) return 'COMPLETE';
  return 'NOT_STARTED';
}

export interface SubmissionDetailData {
  submission: {
    id: string;
    userId: string;
    status: string;
    updatedAt: string;
    [key: string]: unknown;
  };
  mediaByType?: Record<string, Array<{ id: string; type?: string; status?: string; createdAt?: string }>>;
  user: {
    id: string;
    email: string | null;
    kycStatus: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      birthDate?: string | null;
      country?: string | null;
      countryOfResidence?: string | null;
      countryOfBirth?: string | null;
      cityOfBirth?: string | null;
    } | null;
    kycProfile?: {
      firstName?: string | null;
      middleName?: string | null;
      lastName?: string | null;
      civility?: string | null;
      dateOfBirth?: string | null;
      nationalityCountryCode?: string | null;
      residenceCountryCode?: string | null;
      cityOfBirth?: string | null;
      countryOfBirthCountryCode?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      postalCode?: string | null;
    } | null;
    kycIdentitySelection?: {
      issuingCountryCode?: string;
      documentType?: string;
    } | null;
    riskProfile?: {
      employmentStatus?: string | null;
      monthlyIncome?: number | null;
      monthlyExpenses?: number | null;
      currency?: string | null;
      hasActiveLoans?: boolean | null;
      totalMonthlyLoanPayments?: unknown;
      debtToIncomeRatio?: unknown;
      activeLoans?: Array<{
        loanType?: string | null;
        lenderName?: string | null;
        amount?: unknown;
        monthlyPayment?: unknown;
        durationMonths?: number | null;
        startDate?: string | Date | null;
      }>;
    } | null;
    phoneVerification?: {
      phoneE164: string;
      verifiedAt: string | null;
    } | null;
    liveness?: {
      status: string;
      manualReviewRequired?: boolean;
      submittedAt?: string | null;
      createdAt?: string | null;
    } | null;
    updatedAt?: string;
  } | null;
  [key: string]: unknown;
}

export function mapToDisplayUser(data: SubmissionDetailData): DisplayUser {
  const u = data.user;
  const profile = u?.profile;
  const kyc = u?.kycProfile ?? profile;
  const risk = u?.riskProfile;
  const phone = u?.phoneVerification;
  const sel = u?.kycIdentitySelection;

  const firstName = (kyc as { firstName?: string })?.firstName ?? profile?.firstName ?? '';
  const middleNameRaw = (kyc as { middleName?: string | null })?.middleName?.trim() || null;
  const lastName = (kyc as { lastName?: string })?.lastName ?? profile?.lastName ?? '';
  const fullName = [firstName, middleNameRaw, lastName].filter(Boolean).join(' ') || '—';

  const dobRaw = (kyc as { dateOfBirth?: string })?.dateOfBirth ?? profile?.birthDate;
  const dateOfBirth = typeof dobRaw === 'string' ? dobRaw : dobRaw != null ? String(dobRaw) : null;

  const nationalityCountryCode =
    (kyc as { nationalityCountryCode?: string })?.nationalityCountryCode ?? null;
  const residenceCountryCode =
    (kyc as { residenceCountryCode?: string })?.residenceCountryCode ??
    profile?.countryOfResidence ??
    profile?.country ??
    null;
  const cityOfBirth =
    (kyc as { cityOfBirth?: string | null })?.cityOfBirth?.trim() ||
    profile?.cityOfBirth?.trim() ||
    null;
  const countryOfBirthCountryCode =
    (kyc as { countryOfBirthCountryCode?: string })?.countryOfBirthCountryCode ?? profile?.countryOfBirth ?? null;

  const monthlyIncome = risk?.monthlyIncome != null ? Number(risk.monthlyIncome) : null;
  const monthlyExpenses = risk?.monthlyExpenses != null ? Number(risk.monthlyExpenses) : null;
  const currency = risk?.currency ?? 'MAD';

  const loans = risk?.activeLoans ?? [];
  const activeLoans: DisplayLoan[] = loans.map((l) => ({
    loanType: l.loanType ?? null,
    lenderName: l.lenderName ?? null,
    amount: num(l.amount),
    monthlyPayment: num(l.monthlyPayment),
    durationMonths: l.durationMonths != null ? Number(l.durationMonths) : null,
    startDate:
      l.startDate == null
        ? null
        : typeof l.startDate === 'string'
          ? l.startDate.split('T')[0]
          : String(l.startDate).split('T')[0],
  }));

  let totalMonthlyLoanPayments = num(risk?.totalMonthlyLoanPayments);
  if ((totalMonthlyLoanPayments == null || !Number.isFinite(totalMonthlyLoanPayments)) && activeLoans.length > 0) {
    totalMonthlyLoanPayments = activeLoans.reduce((s, x) => s + (x.monthlyPayment ?? 0), 0);
  }

  const income = monthlyIncome != null && Number.isFinite(monthlyIncome) ? monthlyIncome : null;
  const expenses = monthlyExpenses != null && Number.isFinite(monthlyExpenses) ? monthlyExpenses : null;
  const tlp = totalMonthlyLoanPayments != null && Number.isFinite(totalMonthlyLoanPayments) ? totalMonthlyLoanPayments : 0;
  let remainingDisposableIncome: number | null = null;
  if (income != null && expenses != null) {
    remainingDisposableIncome = Math.round((income - expenses - tlp) * 100) / 100;
  }

  let debtToIncomeRatio = normalizeDebtToIncomeRatio(risk?.debtToIncomeRatio);
  if (debtToIncomeRatio == null && income != null && income > 0) {
    debtToIncomeRatio = Math.round((tlp / income) * 10000) / 10000;
  }

  const hasActiveLoans =
    risk?.hasActiveLoans === true || risk?.hasActiveLoans === false
      ? risk.hasActiveLoans
      : activeLoans.length > 0
        ? true
        : null;

  const idDocumentStatus = deriveIdDocumentCompletionFromMedia(data.mediaByType);

  return {
    userId: u?.id ?? '',
    submissionId: data.submission?.id ?? '',
    fullName,
    middleName: middleNameRaw,
    civility: (kyc as { civility?: string | null })?.civility ?? null,
    dateOfBirth,
    nationalityCountryCode,
    residenceCountryCode,
    cityOfBirth,
    countryOfBirthCountryCode,
    kycStatus: u?.kycStatus ?? 'NONE',
    email: u?.email ?? null,
    phoneE164: phone?.phoneE164 ?? null,
    phoneVerified: !!phone?.verifiedAt,
    addressLine1: (kyc as { addressLine1?: string })?.addressLine1 ?? null,
    addressLine2: (kyc as { addressLine2?: string })?.addressLine2 ?? null,
    city: (kyc as { city?: string })?.city ?? null,
    postalCode: (kyc as { postalCode?: string })?.postalCode ?? null,
    addressCountryCode:
      (kyc as { residenceCountryCode?: string })?.residenceCountryCode ?? profile?.countryOfResidence ?? null,
    employmentStatus: risk?.employmentStatus ?? null,
    monthlyIncome,
    monthlyExpenses,
    currency,
    hasActiveLoans,
    totalMonthlyLoanPayments,
    debtToIncomeRatio,
    remainingDisposableIncome,
    activeLoans,
    identityDocumentType: sel?.documentType ?? null,
    identityIssuingCountryCode: sel?.issuingCountryCode ?? null,
    idDocumentStatus,
    liveness: u?.liveness ?? null,
    submissionUpdatedAt: data.submission?.updatedAt ?? null,
    userUpdatedAt: (u as { updatedAt?: string } | undefined)?.updatedAt ?? null,
  };
}
