import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSubmissions, type SubmissionListItem, type SubmissionStatus } from '../../../api/kyc';
import { StatusChip } from '../../../components/StatusChip';
import { CompactTable } from '../../../components/CompactTable';
import { SubmissionPreviewPanel } from '../components/SubmissionPreviewPanel';
import { useI18n } from '../../../app/i18n/I18nContext';

const STATUSES: SubmissionStatus[] = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'];

function slaBadge(submittedAt: string | null): { label: string; className: string } | null {
  if (!submittedAt) return null;
  const hours = (Date.now() - new Date(submittedAt).getTime()) / (60 * 60 * 1000);
  if (hours >= 48) return { label: '>48h', className: 'bg-red-500/20 text-red-400' };
  if (hours >= 24) return { label: '>24h', className: 'bg-amber-500/20 text-amber-400' };
  return null;
}

export function GrantingQueuePage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as SubmissionStatus | null;
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');
  const [assignedToMe, setAssignedToMe] = useState(searchParams.get('assignedToMe') === 'true');
  const [pendingSla, setPendingSla] = useState(searchParams.get('pendingSla') === 'true');
  const selectedId = searchParams.get('selected');
  const page = Number(searchParams.get('page')) || 1;
  const status = statusParam && STATUSES.includes(statusParam) ? statusParam : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['granting-submissions', status, search, country, assignedToMe, pendingSla, page],
    queryFn: () =>
      fetchSubmissions({
        status,
        search: search || undefined,
        country: country || undefined,
        assignedToMe: assignedToMe || undefined,
        pendingSla: pendingSla || undefined,
        page,
        size: 20,
        sort: 'submittedAt',
        order: 'asc',
      }),
  });

  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function applyFilters() {
    const next = new URLSearchParams(searchParams);
    if (search) next.set('search', search);
    else next.delete('search');
    if (country) next.set('country', country);
    else next.delete('country');
    next.set('assignedToMe', String(assignedToMe));
    next.set('pendingSla', String(pendingSla));
    next.set('page', '1');
    setSearchParams(next);
  }

  function onSelect(row: SubmissionListItem) {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set('selected', row.submissionId);
      return n;
    });
  }

  const columns = [
    {
      key: 'sla',
      label: 'SLA',
      className: 'w-14',
      render: (row: SubmissionListItem) => {
        const badge = slaBadge(row.submittedAt);
        if (!badge) return <span className="text-daret-muted">—</span>;
        return <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>;
      },
    },
    {
      key: 'submitted',
      label: t('granting.submitted'),
      render: (row: SubmissionListItem) => (row.submittedAt ? new Date(row.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'),
    },
    {
      key: 'user',
      label: t('granting.user'),
      render: (row: SubmissionListItem) => (
        <span className="text-daret-green font-medium">
          {row.user.fullName || row.user.email || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('granting.status'),
      render: (row: SubmissionListItem) => <StatusChip status={row.status} type="submission" />,
    },
    {
      key: 'missing',
      label: 'Missing',
      className: 'w-14',
      render: (row: SubmissionListItem) => {
        const n = row.missingDocsCount ?? 0;
        if (n === 0) return <span className="text-daret-muted">—</span>;
        return (
          <span className="inline-flex items-center gap-0.5 text-red-400 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden />
            {n}
          </span>
        );
      },
    },
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: (row: SubmissionListItem) =>
        row.assignedReviewer?.email ? (
          <span className="inline-flex rounded-full bg-daret-muted/20 px-2 py-0.5 text-xs text-daret-muted">
            {row.assignedReviewer.email.split('@')[0]}
          </span>
        ) : (
          <span className="text-daret-muted">—</span>
        ),
    },
  ];

  return (
    <div className="ops-container max-w-[1320px] mx-auto px-4 py-4">
      <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg mb-4">{t('granting.title')}</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-daret-border bg-daret-card">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSearchParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set('status', s);
                  n.set('page', '1');
                  return n;
                });
              }}
              className={`px-3 py-1.5 text-sm font-medium ${
                (status ?? '') === s ? 'bg-daret-green text-white' : 'text-daret-muted hover:text-daret-fg hover:bg-daret-card'
              }`}
            >
              {s === 'SUBMITTED' ? t('granting.pending') : s === 'IN_REVIEW' ? t('dashboard.inReview') : s === 'APPROVED' ? t('dashboard.approved') : t('dashboard.rejected')}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-daret-muted">
          <input type="checkbox" checked={assignedToMe} onChange={(e) => setAssignedToMe(e.target.checked)} />
          {t('granting.assignedToMe')}
        </label>
        <label className="flex items-center gap-2 text-sm text-daret-muted">
          <input type="checkbox" checked={pendingSla} onChange={(e) => setPendingSla(e.target.checked)} />
          {t('granting.onlyPendingSla')}
        </label>
        <input
          type="search"
          placeholder={t('granting.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg placeholder-daret-muted w-40 text-sm"
        />
        <input
          type="text"
          placeholder={t('granting.countryPlaceholder')}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg placeholder-daret-muted w-20 text-sm"
        />
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-3 py-1.5 text-sm font-medium"
        >
          {t('granting.searchButton')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <CompactTable<SubmissionListItem>
            columns={columns}
            rows={items}
            keyExtractor={(row) => row.submissionId}
            onRowClick={(row) => onSelect(row)}
            isLoading={isLoading}
            emptyMessage={t('granting.noSubmissionsFound')}
            skeletonRows={12}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-sm text-daret-muted">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.set('page', String(Math.max(1, page - 1))); return n; })}
                  disabled={page <= 1}
                  className="rounded border border-daret-border px-2 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
                >
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.set('page', String(Math.min(totalPages, page + 1))); return n; })}
                  disabled={page >= totalPages}
                  className="rounded border border-daret-border px-2 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1 min-h-[400px] flex flex-col">
          <div className="sticky top-4">
            <SubmissionPreviewPanel
              submissionId={selectedId ?? null}
              onRefreshQueue={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
