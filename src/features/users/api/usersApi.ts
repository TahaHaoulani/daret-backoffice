import api from '../../../api/client';

export interface UserSearchItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  /** ISO country of residence (profile or KYC legal residence). */
  country: string | null;
  kycStatus: string;
  /** Latest completed scoring band for the user, if any. */
  riskLevel: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  circlesCount: number;
  publicCirclesCount: number;
  privateCirclesCount: number;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface UserSearchParams {
  q?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  /** Country of residence (profile or KYC); alias `countryOfResidence` also sent from UI. */
  country?: string;
  countryOfResidence?: string;
  kycStatus?: string;
  hasActiveCircles?: boolean;
  createdFrom?: string;
  createdTo?: string;
  dateOfBirth?: string;
  nationality?: string;
  countryOfBirth?: string;
  cityOfBirth?: string;
  addressCity?: string;
  addressZipCode?: string;
  addressCountry?: string;
  documentStatus?: string;
  livenessStatus?: string;
  reviewDecision?: string;
  riskLevel?: string;
  reviewerId?: string;
  professionalSituation?: string;
  netMonthlyIncomeMin?: number;
  netMonthlyIncomeMax?: number;
  monthlyExpensesMin?: number;
  monthlyExpensesMax?: number;
  hasActiveLoans?: boolean;
  debtToIncomeRatioMin?: number;
  debtToIncomeRatioMax?: number;
  remainingDisposableIncomeMin?: number;
  remainingDisposableIncomeMax?: number;
  documentType?: string;
  missingDocumentSide?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'lastName' | 'kycStatus' | 'lastKycSubmittedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResponse {
  success: boolean;
  data?: {
    items: UserSearchItem[];
    page: number;
    size: number;
    total: number;
  };
}

export interface UserWorkspaceData {
  user: { id: string; email: string | null; kycStatus: string; createdAt?: string; updatedAt?: string };
  profile: Record<string, unknown> | null;
  kycProfile: Record<string, unknown> | null;
  kycIdentitySelection: {
    issuingCountryCode: string;
    documentType: 'ID_CARD' | 'PASSPORT' | 'RESIDENCE_PERMIT';
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  riskProfile: Record<string, unknown> | null;
  phoneVerification: { phoneE164: string; verifiedAt: string | null } | null;
  kyc: {
    latestSubmissionId: string;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
  } | null;
  counts: { circles: number; payments: number };
  lastLoginAt: string | null;
}

export interface UserKycData {
  submissions: Array<{
    id: string;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewer: { id: string; email: string | null } | null;
    comments: Array<{ id: string; comment: string; reviewerEmail: string | null; createdAt: string | undefined }>;
    decisions: Array<{ id: string; decision: string; reasons: unknown; note: string | null; decidedAt: string | undefined }>;
  }>;
  mediaByType: Record<string, Array<{ id: string; type: string; submissionId: string; status: string; createdAt: string | undefined }>>;
  auditEvents: Array<{ id: string; eventType: string; action: string; entityType: string; entityId: string; createdAt: string | undefined }>;
}

export interface UserCirclesData {
  circles: Array<{
    circleId: string;
    name: string;
    type: string;
    role: string;
    status: string;
    amount: number;
    currency: string;
    frequency: string;
    createdAt: string | undefined;
  }>;
}

export function fetchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '') return;
    if (typeof v === 'boolean') sp.set(k, v ? 'true' : 'false');
    else sp.set(k, String(v));
  });
  return api.get(`/users?${sp}`).then((r) => r.data);
}

export function fetchUserById(id: string): Promise<{ success: boolean; data?: UserWorkspaceData }> {
  return api.get(`/users/${id}`).then((r) => r.data);
}

export function fetchUserKyc(id: string): Promise<{ success: boolean; data?: UserKycData }> {
  return api.get(`/users/${id}/kyc`).then((r) => r.data);
}

export function fetchUserCircles(id: string): Promise<{ success: boolean; data?: UserCirclesData }> {
  return api.get(`/users/${id}/circles`).then((r) => r.data);
}

export function fetchUserPayments(id: string): Promise<{ success: boolean; data?: { payments: unknown[] } }> {
  return api.get(`/users/${id}/payments`).then((r) => r.data);
}

/** Aggregated KYC review DTO (GET /users/:id/kyc-review). */
export interface BackofficeUserKycReviewDTO {
  userSummary: {
    userId: string;
    email: string | null;
    fullName: string;
    kycStatus: string;
    kycReviewBadge: string;
    riskLevel: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyLoanPayments: number;
    disposableIncome: number;
    debtToIncomeRatio: number | null;
    currency: string;
    latestSubmissionId: string | null;
  };
  identity: Record<string, unknown>;
  address: Record<string, unknown>;
  documents: {
    selectedDocumentType: string | null;
    items: Array<{
      assetId: string;
      label: string;
      type: string;
      status: string;
      reviewBadge: string;
      createdAt: string | null;
      capturedAt: string | null;
      rejectionReason: string | null;
      extractedOcr: unknown;
    }>;
    selfie: Array<{
      assetId: string;
      status: string;
      reviewBadge: string;
      createdAt: string | null;
      capturedAt: string | null;
      rejectionReason: string | null;
    }>;
  };
  liveness: Record<string, unknown>;
  financialProfile: Record<string, unknown> | null;
  /** Payslip, tax, bank statement, employment contract (newest first). */
  incomeVerificationAssets?: Array<{
    assetId: string;
    type: string;
    status: string;
    reviewBadge: string;
    uploadedAt: string | null;
    rejectionReason: string | null;
  }>;
  activeLoans: Array<Record<string, unknown>>;
  riskSummary: { missingDocuments: string[]; flags: string[]; scoring: Record<string, unknown> | null };
  reviewHistory: Array<Record<string, unknown>>;
  system: Record<string, unknown>;
}

export function fetchUserKycReview(id: string): Promise<{ success: boolean; data?: BackofficeUserKycReviewDTO }> {
  return api.get(`/users/${id}/kyc-review`).then((r) => r.data);
}
