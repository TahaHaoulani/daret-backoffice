import api from './client';

export interface AdminCircleSummary {
  id: string;
  name: string;
  circleType: 'PRIVATE' | 'PUBLIC';
  lifecycleStatus: string | null;
  allocationStatus: string | null;
  members: number;
  memberCount: number;
  amount: number;
  currency: string;
  joinWindowStart: string | null;
  joinWindowEnd: string | null;
  createdAt: string;
}

export interface BidsResponse {
  success: boolean;
  circleId: string;
  allocationStatus: string | null;
  bidCount: number;
  uniqueBidders: number;
  bidsByPosition: Record<string, Array<{ userId: string; preferenceRank: number; maxFeeCents: number | null; minCashbackCents: number | null }>>;
}

export interface AllocationsResponse {
  success: boolean;
  circleId: string;
  allocationStatus: string | null;
  allocations: Array<{
    userId: string;
    assignedPositionK: number;
    clearingFeeCents: number;
    clearingCashbackCents: number;
    allocatedAt: string;
  }>;
}

export function fetchAdminCircles(type?: 'PUBLIC' | 'PRIVATE'): Promise<{ success: boolean; circles: AdminCircleSummary[] }> {
  const q = type ? `?type=${type}` : '';
  return api.get(`/circles${q}`).then((r) => r.data);
}

export function createPublicCircle(body: {
  name: string;
  contributionAmount: number;
  currency: string;
  durationMonths: number;
  startDate?: string;
  joinWindowStart?: string;
  joinWindowEnd?: string;
}): Promise<{ success: boolean; circle: unknown }> {
  return api.post('/circles/public', body).then((r) => r.data);
}

export function updateCircle(id: string, body: { lifecycleStatus?: string; joinWindowStart?: string; joinWindowEnd?: string; allocationStatus?: string }): Promise<{ success: boolean; circle: unknown }> {
  return api.patch(`/circles/${id}`, body).then((r) => r.data);
}

export function fetchCircleBids(id: string): Promise<BidsResponse> {
  return api.get(`/circles/${id}/bids`).then((r) => r.data);
}

export function runAllocation(id: string): Promise<{ success: boolean; assignedCount: number }> {
  return api.post(`/circles/${id}/run-allocation`).then((r) => r.data);
}

export function fetchCircleAllocations(id: string): Promise<AllocationsResponse> {
  return api.get(`/circles/${id}/allocations`).then((r) => r.data);
}
