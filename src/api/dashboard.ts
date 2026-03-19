import api from './client';

export interface DashboardMyQueueItem {
  submissionId: string;
  status: string;
  submittedAt: string | null;
  user: { id: string; fullName: string; email: string | null; country: string | null };
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  eventType: string;
  entityType: string;
  entityId: string;
  createdAt: string | null;
  actorEmail: string | null;
}

export interface DashboardData {
  pendingSlaCount: number;
  assignedToMeCount: number;
  counts: Record<string, number>;
  myQueue: DashboardMyQueueItem[];
  recentActivity: DashboardActivityItem[];
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return api.get('/dashboard').then((r) => r.data);
}
