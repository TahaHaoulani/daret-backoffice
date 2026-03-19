import api from '../../../api/client';

export interface UserSearchItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  kycStatus: string;
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
  country?: string;
  kycStatus?: string;
  hasActiveCircles?: boolean;
  createdFrom?: string;
  createdTo?: string;
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
    if (v !== undefined && v !== '') sp.set(k, String(v));
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
