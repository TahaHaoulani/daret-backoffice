import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLog } from '../../api/audit';
import { useI18n } from '../../app/i18n/I18nContext';

export function AuditPage() {
  const { t } = useI18n();
  const [action, setAction] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', action, eventType, page],
    queryFn: () => fetchAuditLog({ action: action || undefined, eventType: eventType || undefined, page, size: 50 }),
  });

  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-daret-fg mb-6">{t('audit.title')}</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder={t('audit.filterByAction')}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-lg bg-daret-card border border-daret-border px-4 py-2 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green w-48"
        />
        <input
          type="text"
          placeholder={t('audit.filterByEventType')}
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-lg bg-daret-card border border-daret-border px-4 py-2 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green w-48"
        />
      </div>

      <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
        {isLoading ? (
          <div className="p-12 text-center text-daret-muted">{t('audit.loading')}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-daret-muted">{t('audit.noEventsFound')}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-daret-border text-left text-sm text-daret-muted">
                <th className="px-4 py-3 font-medium">{t('audit.time')}</th>
                <th className="px-4 py-3 font-medium">{t('audit.event')}</th>
                <th className="px-4 py-3 font-medium">{t('audit.action')}</th>
                <th className="px-4 py-3 font-medium">{t('audit.entity')}</th>
                <th className="px-4 py-3 font-medium">{t('audit.actor')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-daret-border/50 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-daret-muted whitespace-nowrap">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-daret-green font-mono">{row.eventType}</td>
                  <td className="px-4 py-3 text-sm text-daret-muted">{row.action}</td>
                  <td className="px-4 py-3 text-sm text-daret-muted">
                    {row.entityType} {row.entityId ? `· ${row.entityId.slice(0, 8)}…` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-daret-muted">{row.actor?.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-daret-border">
            <p className="text-sm text-daret-muted">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-daret-border px-3 py-1 text-sm text-daret-muted disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-daret-border px-3 py-1 text-sm text-daret-muted disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
