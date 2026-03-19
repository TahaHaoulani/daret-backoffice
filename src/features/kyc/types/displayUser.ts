/**
 * Display model for the Overview tab: mapped from API submission + user + profile + kycProfile + riskProfile.
 */
export interface DisplayUser {
  userId: string;
  submissionId: string;
  fullName: string;
  dateOfBirth: string | null;
  nationalityCountryCode: string | null;
  residenceCountryCode: string | null;
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
  submissionUpdatedAt: string | null;
  userUpdatedAt: string | null;
}

export interface SubmissionDetailData {
  submission: {
    id: string;
    userId: string;
    status: string;
    updatedAt: string;
    [key: string]: unknown;
  };
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
    } | null;
    kycProfile?: {
      firstName?: string | null;
      lastName?: string | null;
      dateOfBirth?: string | null;
      nationalityCountryCode?: string | null;
      residenceCountryCode?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      postalCode?: string | null;
    } | null;
    riskProfile?: {
      employmentStatus?: string | null;
      monthlyIncome?: number | null;
      monthlyExpenses?: number | null;
      currency?: string | null;
    } | null;
    phoneVerification?: {
      phoneE164: string;
      verifiedAt: string | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export function mapToDisplayUser(data: SubmissionDetailData): DisplayUser {
  const u = data.user;
  const profile = u?.profile;
  const kyc = u?.kycProfile ?? profile;
  const risk = u?.riskProfile;
  const phone = u?.phoneVerification;

  const firstName = kyc?.firstName ?? profile?.firstName ?? '';
  const lastName = kyc?.lastName ?? profile?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '—';

  const dobRaw = (kyc as { dateOfBirth?: string } | undefined)?.dateOfBirth ?? profile?.birthDate;
  const dateOfBirth = typeof dobRaw === 'string' ? dobRaw : dobRaw != null ? String(dobRaw) : null;

  return {
    userId: u?.id ?? '',
    submissionId: data.submission?.id ?? '',
    fullName,
    dateOfBirth,
    nationalityCountryCode: (kyc as { nationalityCountryCode?: string } | undefined)?.nationalityCountryCode ?? profile?.countryOfBirth ?? null,
    residenceCountryCode: (kyc as { residenceCountryCode?: string } | undefined)?.residenceCountryCode ?? profile?.countryOfResidence ?? profile?.country ?? null,
    kycStatus: u?.kycStatus ?? 'NONE',
    email: u?.email ?? null,
    phoneE164: phone?.phoneE164 ?? null,
    phoneVerified: !!phone?.verifiedAt,
    addressLine1: (kyc as { addressLine1?: string } | undefined)?.addressLine1 ?? null,
    addressLine2: (kyc as { addressLine2?: string } | undefined)?.addressLine2 ?? null,
    city: (kyc as { city?: string } | undefined)?.city ?? null,
    postalCode: (kyc as { postalCode?: string } | undefined)?.postalCode ?? null,
    addressCountryCode: (kyc as { residenceCountryCode?: string } | undefined)?.residenceCountryCode ?? profile?.countryOfResidence ?? null,
    employmentStatus: risk?.employmentStatus ?? null,
    monthlyIncome: risk?.monthlyIncome ?? null,
    monthlyExpenses: risk?.monthlyExpenses ?? null,
    currency: risk?.currency ?? 'MAD',
    submissionUpdatedAt: data.submission?.updatedAt ?? null,
    userUpdatedAt: (u as { updatedAt?: string } | undefined)?.updatedAt ?? null,
  };
}
