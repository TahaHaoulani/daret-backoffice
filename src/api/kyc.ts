import api from './client';

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_SCORING' | 'SCORING_IN_PROGRESS' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface SubmissionListItem {
  submissionId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  user: { id: string; fullName: string; email: string | null; country: string | null };
  assignedReviewer: { id: string; email: string | null } | null;
  flagsCount: number;
  missingDocsCount?: number;
}

export interface SubmissionsResponse {
  success: boolean;
  data?: {
    items: SubmissionListItem[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface SubmissionDetailResponse {
  success: boolean;
  data?: {
    submission: {
      id: string;
      userId: string;
      step: string;
      status: SubmissionStatus;
      submittedAt: string | null;
      reviewedAt: string | null;
      reviewerUserId: string | null;
      notes: string | null;
      rejectionReason: string | null;
      scoringError: string | null;
      createdAt: string;
      updatedAt: string;
    };
    user: {
      id: string;
      email: string | null;
      kycStatus: string;
      profile: Record<string, unknown> | null;
      kycProfile: Record<string, unknown> | null;
      riskProfile: Record<string, unknown> | null;
      phoneVerification: { phoneE164: string; verifiedAt: string | null } | null;
    } | null;
    reviewer: { id: string; email: string | null } | null;
    mediaByType: Record<string, Array<{ id: string; type: string; storageKey: string; mimeType: string | null; sizeBytes: number | null; status: string; createdAt: string | undefined }>>;
    comments: Array<{ id: string; comment: string; reviewerUserId: string; reviewerEmail: string | null; createdAt: string }>;
    decisions: Array<{ id: string; decision: string; reasons: string[] | null; note: string | null; requiredFixes: string[] | null; decidedBy: string; decidedAt: string }>;
    auditEvents: Array<{ id: string; eventType: string; action: string; entityType: string; entityId: string; metadata: unknown; createdAt: string }>;
    scoring?: {
      id: string;
      status: string;
      totalScore: number | null;
      scoreBand: string | null;
      scoreBandLabel: string | null;
      enabledModuleKeys: string[] | null;
      fraudRecommendation: string | null;
      fraudRecommendationReason: string | null;
      fraudSeveritySummary: Record<string, number> | null;
      fraudPolicySnapshot: unknown;
      finalRecommendation: string | null;
      finalRecommendationReason: string | null;
      errorMessage: string | null;
      startedAt: string | null;
      completedAt: string | null;
      createdAt: string | null;
      model: { id: string; name: string; version: number; status?: string; baseCurrency?: string } | null;
      items: Array<{
        id: string;
        criterionKey: string;
        criterionLabel: string;
        rawValue: string | null;
        normalizedValue: string | null;
        originalCurrency: string | null;
        bandLabel: string | null;
        pointsAwarded: number;
        rationale: string | null;
        status: string;
        sortOrder: number;
      }>;
      fraudResults?: Array<{
        id: string;
        fraudRuleId: string;
        triggered: boolean;
        severity: string | null;
        details: unknown;
        evaluatedAt: string | null;
        fraudRule: { id: string; key: string; name: string; severity: string | null } | null;
      }>;
    } | null;
  };
}

export interface SignedUrlResponse {
  success: boolean;
  data?: { url: string; expiresIn: number };
}

export function fetchSubmissions(params: {
  status?: SubmissionStatus;
  search?: string;
  country?: string;
  assignedToMe?: boolean;
  pendingSla?: boolean;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<SubmissionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.country) searchParams.set('country', params.country);
  if (params.assignedToMe === true) searchParams.set('assignedToMe', 'true');
  if (params.pendingSla === true) searchParams.set('pendingSla', 'true');
  if (params.submittedFrom) searchParams.set('submittedFrom', params.submittedFrom);
  if (params.submittedTo) searchParams.set('submittedTo', params.submittedTo);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.size) searchParams.set('size', String(params.size));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  return api.get(`/kyc/submissions?${searchParams}`).then((r) => r.data);
}

export function fetchSubmissionById(id: string): Promise<SubmissionDetailResponse> {
  return api.get(`/kyc/submissions/${id}`).then((r) => r.data);
}

export function assignSubmission(id: string, reviewerUserId?: string): Promise<{ success: boolean }> {
  return api.post(`/kyc/submissions/${id}/assign`, { reviewerUserId }).then((r) => r.data);
}

export function markInReview(id: string): Promise<{ success: boolean }> {
  return api.post(`/kyc/submissions/${id}/mark-in-review`).then((r) => r.data);
}

export function approveSubmission(id: string, note?: string): Promise<{ success: boolean }> {
  return api.post(`/kyc/submissions/${id}/approve`, { note }).then((r) => r.data);
}

export function rejectSubmission(id: string, body: { reasons?: string[]; note?: string; requiredFixes?: string[] }): Promise<{ success: boolean }> {
  return api.post(`/kyc/submissions/${id}/reject`, body).then((r) => r.data);
}

export function addComment(id: string, comment: string): Promise<{ success: boolean; data?: { commentId: string } }> {
  return api.post(`/kyc/submissions/${id}/comment`, { comment }).then((r) => r.data);
}

export function getSignedUrl(assetId: string): Promise<SignedUrlResponse> {
  return api.get(`/media/${assetId}/signed-url`).then((r) => r.data);
}

/** Liveness capture preview (same JWT pattern as user media assets). */
export function getLivenessCaptureSignedUrl(captureId: string): Promise<SignedUrlResponse> {
  return api.get(`/media/liveness-capture/${captureId}/signed-url`).then((r) => r.data);
}
