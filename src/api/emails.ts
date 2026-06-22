import api from './client';

export type EmailDeliveryStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'FAILED'
  | 'BOUNCED'
  | 'UNKNOWN';

export type EmailType =
  | 'BRIDGE_VERIFICATION_REQUEST'
  | 'KYC_INFORMATION_REQUEST'
  | 'APPLICATION_STATUS'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_CONFIRMATION'
  | 'INVITATION'
  | 'ONBOARDING'
  | 'GENERAL_NOTIFICATION'
  | 'SYSTEM';

export type EmailSentByType = 'SYSTEM' | 'ADMIN' | 'WORKFLOW';

export interface EmailListItem {
  id: string;
  subject: string;
  recipientEmail: string;
  recipientName?: string | null;
  templateKey: string;
  emailType: EmailType | null;
  status: EmailDeliveryStatus;
  sentBy: string;
  sentByType: EmailSentByType;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  hasHtmlPreview: boolean;
}

export interface EmailPreview {
  id: string;
  subject: string;
  recipientEmail: string;
  recipientName?: string | null;
  status: EmailDeliveryStatus;
  sentAt: string | null;
  templateKey: string;
  emailType: EmailType | null;
  sentBy: string;
  sentByType: EmailSentByType;
  previewHtml: string | null;
  previewText: string | null;
  metadata: {
    userId?: string | null;
    applicationId?: string | null;
    locale?: string;
    provider?: string;
  };
  failureReason?: string | null;
}

export interface EmailListFilters {
  search?: string;
  status?: EmailDeliveryStatus;
  emailType?: EmailType;
  dateFrom?: string;
  dateTo?: string;
}

function buildParams(filters?: EmailListFilters) {
  const params = new URLSearchParams();
  if (!filters) return params;
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.emailType) params.set('emailType', filters.emailType);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  return params;
}

export function getApplicationEmails(applicationId: string, filters?: EmailListFilters) {
  const qs = buildParams(filters).toString();
  return api
    .get<{ success: boolean; data: EmailListItem[] }>(
      `/kyc/submissions/${applicationId}/emails${qs ? `?${qs}` : ''}`,
    )
    .then((r) => r.data);
}

export function getCustomerEmails(customerId: string, filters?: EmailListFilters) {
  const qs = buildParams(filters).toString();
  return api
    .get<{ success: boolean; data: EmailListItem[] }>(`/users/${customerId}/emails${qs ? `?${qs}` : ''}`)
    .then((r) => r.data);
}

export function getEmailPreview(emailLogId: string) {
  return api
    .get<{ success: boolean; data: EmailPreview }>(`/emails/${emailLogId}`)
    .then((r) => r.data);
}
