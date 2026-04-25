import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../app/i18n/I18nContext';
import { fetchCronsList, fetchCronDetail, triggerCronRun, type CronJobListItem } from '../../api/crons';

function statusBadge(status: string) {
  const s = status?.toLowerCase() || '';
  if (s === 'success') return { label: 'Success', className: 'bg-green-500/20 text-green-400 border-green-500/40' };
  if (s === 'failed') return { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/40' };
  if (s === 'running') return { label: 'Running', className: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
  return { label: status || '—', className: 'bg-daret-border/50 text-daret-muted' };
}

function triggeredByLabel(by: string) {
  return by === 'MANUAL' ? 'Manual' : 'Scheduler';
}

export function CronsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['crons', 'list'],
    queryFn: () => fetchCronsList(),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['crons', 'detail', expandedKey],
    queryFn: () => fetchCronDetail(expandedKey!),
    enabled: !!expandedKey,
  });

  const triggerMu = useMutation({
    mutationFn: (key: string) => triggerCronRun(key),
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ['crons', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['crons', 'detail', key] });
    },
  });

  const list = listData?.data ?? [];
  const detail = expandedKey ? detailData?.data : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-daret-fg mb-2">{t('crons.title')}</h1>
      <p className="text-daret-muted text-sm mb-6">{t('crons.subtitle')}</p>

      {listLoading ? (
        <div className="border border-daret-border rounded-xl bg-daret-card p-12 text-center text-daret-muted">
          {t('common.loading')}
        </div>
      ) : list.length === 0 ? (
        <div className="border border-daret-border rounded-xl bg-daret-card p-12 text-center text-daret-muted">
          {t('crons.noJobs')}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((job: CronJobListItem) => (
            <div
              key={job.key}
              className="border border-daret-border rounded-xl bg-daret-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedKey(expandedKey === job.key ? null : job.key)}
                className="w-full px-5 py-4 flex flex-wrap items-center gap-4 text-left hover:bg-daret-border/5 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-daret-fg">{job.name}</span>
                    <span className="text-xs text-daret-muted font-mono">{job.key}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-daret-border/50 text-daret-muted">
                      {job.category}
                    </span>
                  </div>
                  <p className="text-sm text-daret-muted mt-0.5 truncate">{job.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-daret-muted">{job.scheduleLabel}</span>
                  {job.lastRun ? (
                    <>
                      <span className="text-daret-muted">
                        {t('crons.lastRun')}: {job.lastRun.startedAt ? new Date(job.lastRun.startedAt).toLocaleString() : '—'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded border text-xs font-medium ${statusBadge(job.lastRun.status).className}`}
                      >
                        {statusBadge(job.lastRun.status).label}
                      </span>
                      {job.lastRun.durationMs != null && (
                        <span className="text-daret-muted">{job.lastRun.durationMs}ms</span>
                      )}
                    </>
                  ) : (
                    <span className="text-daret-muted">{t('crons.neverRun')}</span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-daret-muted transition-transform ${expandedKey === job.key ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedKey === job.key && (
                <div className="border-t border-daret-border px-5 py-4 bg-daret-dark/30">
                  {detailLoading ? (
                    <p className="text-daret-muted text-sm">{t('common.loading')}</p>
                  ) : detail ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span><strong className="text-daret-fg">{t('crons.schedule')}:</strong> {detail.schedule}</span>
                        <span><strong className="text-daret-fg">{t('crons.manualRun')}:</strong> {detail.allowManualRun ? t('crons.yes') : t('crons.no')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.allowManualRun && (
                          <button
                            type="button"
                            onClick={() => triggerMu.mutate(job.key)}
                            disabled={triggerMu.isPending}
                            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                          >
                            {triggerMu.isPending ? t('crons.running') : t('crons.runNow')}
                          </button>
                        )}
                        {triggerMu.data && !triggerMu.data.success && triggerMu.variables === job.key && (
                          <span className="text-red-400 text-sm">{triggerMu.data.message}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-daret-fg mb-2">{t('crons.history')}</h4>
                        {detail.runs.length === 0 ? (
                          <p className="text-daret-muted text-sm">{t('crons.noRuns')}</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-daret-border text-left text-daret-muted">
                                  <th className="py-2 pr-4">{t('crons.startedAt')}</th>
                                  <th className="py-2 pr-4">{t('crons.status')}</th>
                                  <th className="py-2 pr-4">{t('crons.triggeredBy')}</th>
                                  <th className="py-2 pr-4">{t('crons.duration')}</th>
                                  <th className="py-2">{t('crons.details')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.runs.map((run) => (
                                  <tr key={run.id} className="border-b border-daret-border/50">
                                    <td className="py-2 pr-4 text-daret-muted whitespace-nowrap">
                                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                                    </td>
                                    <td className="py-2 pr-4">
                                      <span className={`px-2 py-0.5 rounded border text-xs ${statusBadge(run.status).className}`}>
                                        {statusBadge(run.status).label}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-4 text-daret-muted">
                                      {triggeredByLabel(run.triggeredBy)}
                                      {run.triggeredByUser?.email && (
                                        <span className="block text-xs"> {run.triggeredByUser.email}</span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-4 text-daret-muted">
                                      {run.durationMs != null ? `${run.durationMs} ms` : run.status === 'RUNNING' ? '—' : '—'}
                                    </td>
                                    <td className="py-2 text-daret-muted">
                                      {run.errorMessage && <span className="text-red-400 block truncate max-w-xs" title={run.errorMessage}>{run.errorMessage}</span>}
                                      {run.summaryMetrics && typeof run.summaryMetrics === 'object' && (
                                        <span className="text-xs">
                                          {JSON.stringify(run.summaryMetrics)}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
