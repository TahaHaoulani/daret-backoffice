import api from './client';

export interface AuditItem {
  id: string;
  eventType: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string | null } | null;
}

export interface AuditResponse {
  success: boolean;
  data?: {
    items: AuditItem[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export function fetchAuditLog(params: {
  action?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}): Promise<AuditResponse> {
  const searchParams = new URLSearchParams();
  if (params.action) searchParams.set('action', params.action);
  if (params.eventType) searchParams.set('eventType', params.eventType);
  if (params.entityType) searchParams.set('entityType', params.entityType);
  if (params.entityId) searchParams.set('entityId', params.entityId);
  if (params.actorUserId) searchParams.set('actorUserId', params.actorUserId);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.size) searchParams.set('size', String(params.size));
  return api.get(`/audit?${searchParams}`).then((r) => r.data);
}
