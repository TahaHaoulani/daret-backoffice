import api from './client';

export interface CronJobLastRun {
  id: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  triggeredBy: string;
  triggeredByUser: { id: string; email: string | null } | null;
  errorMessage: string | null;
  summaryMetrics: Record<string, unknown> | null;
  durationMs: number | null;
}

export interface CronJobListItem {
  key: string;
  name: string;
  description: string;
  schedule: string;
  scheduleLabel: string;
  category: string;
  allowManualRun: boolean;
  lastRun: CronJobLastRun | null;
}

export interface CronJobRunItem {
  id: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  triggeredBy: string;
  triggeredByUser: { id: string; email: string | null } | null;
  errorMessage: string | null;
  summaryMetrics: Record<string, unknown> | null;
  durationMs: number | null;
}

export interface CronJobDetail {
  key: string;
  name: string;
  description: string;
  schedule: string;
  scheduleLabel: string;
  category: string;
  allowManualRun: boolean;
  runs: CronJobRunItem[];
}

export function fetchCronsList(): Promise<{ success: boolean; data?: CronJobListItem[] }> {
  return api.get('/crons').then((r) => r.data);
}

export function fetchCronDetail(key: string): Promise<{ success: boolean; data?: CronJobDetail }> {
  return api.get(`/crons/${encodeURIComponent(key)}`).then((r) => r.data);
}

export function triggerCronRun(key: string): Promise<{ success: boolean; runId?: string; message?: string }> {
  return api.post(`/crons/${encodeURIComponent(key)}/run`).then((r) => r.data);
}
