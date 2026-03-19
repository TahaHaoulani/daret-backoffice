import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchScoringModels, createScoringModel, duplicateScoringModel, activateScoringModel, deleteScoringModel, type ScoringModelListItem } from '../../api/scoring';
import { useI18n } from '../../app/i18n/I18nContext';
import { AdminTable, type AdminTableColumn, type SortDirection } from '../../components/AdminTable';

function formatTableDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const style =
    status === 'ACTIVE'
      ? 'bg-daret-green/20 text-daret-green'
      : status === 'DRAFT'
        ? 'bg-amber-500/20 text-amber-400'
        : 'bg-daret-muted/30 text-daret-muted';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${style}`}>
      {label}
    </span>
  );
}

type SortKey = 'name' | 'createdAt' | 'updatedAt' | 'criteriaCount' | 'runsCount';

function sortModels(
  list: ScoringModelListItem[],
  sortKey: SortKey | null,
  direction: SortDirection
): ScoringModelListItem[] {
  if (!sortKey) return list;
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = (a.name ?? '').localeCompare(b.name ?? '');
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'criteriaCount':
        cmp = (a.criteriaCount ?? 0) - (b.criteriaCount ?? 0);
        break;
      case 'runsCount':
        cmp = (a.runsCount ?? 0) - (b.runsCount ?? 0);
        break;
      default:
        return 0;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export function ScoringPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<ScoringModelListItem | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['scoring', 'models'],
    queryFn: () => fetchScoringModels(),
  });

  const createMu = useMutation({
    mutationFn: (body: { name: string; description?: string }) => createScoringModel(body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
      if (res.data?.id) navigate(`/scoring/${res.data.id}`);
    },
  });

  const duplicateMu = useMutation({
    mutationFn: (sourceId: string) => duplicateScoringModel(sourceId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
      if (res.data?.id) navigate(`/scoring/${res.data.id}`);
    },
  });

  const activateMu = useMutation({
    mutationFn: (id: string) => activateScoringModel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] }),
  });

  const deleteMu = useMutation({
    mutationFn: (id: string) => deleteScoringModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
      setDeleteModal(null);
    },
  });

  const models: ScoringModelListItem[] = data?.data ?? [];
  const activeModel = models.find((m) => m.status === 'ACTIVE');
  const sortedModels = useMemo(() => sortModels(models, sortKey, sortDirection), [models, sortKey, sortDirection]);

  const handleDuplicate = (m: ScoringModelListItem) => {
    duplicateMu.mutate(m.id);
  };

  const columns: AdminTableColumn<ScoringModelListItem>[] = useMemo(
    () => [
      {
        key: 'reference',
        label: t('scoring.reference'),
        sortKey: 'name',
        render: (row) => <span className="font-medium text-daret-fg">{row.name}</span>,
      },
      {
        key: 'createdAt',
        label: t('scoring.creationDate'),
        sortKey: 'createdAt',
        render: (row) => <span className="text-daret-muted">{formatTableDate(row.createdAt)}</span>,
      },
      {
        key: 'updatedAt',
        label: t('scoring.lastModified'),
        sortKey: 'updatedAt',
        render: (row) => <span className="text-daret-muted">{formatTableDate(row.updatedAt)}</span>,
      },
      {
        key: 'criteriaCount',
        label: t('scoring.criteriaCount'),
        sortKey: 'criteriaCount',
        align: 'right',
        render: (row) => <span className="text-daret-fg">{row.criteriaCount ?? 0}</span>,
      },
      {
        key: 'runs',
        label: t('scoring.runs'),
        sortKey: 'runsCount',
        align: 'right',
        render: (row) => <span className="text-daret-fg">{row.runsCount ?? 0}</span>,
      },
      {
        key: 'status',
        label: t('scoring.status'),
        render: (row) => (
          <StatusBadge
            status={row.status}
            label={
              row.status === 'ACTIVE'
                ? t('scoring.statusActive')
                : row.status === 'DRAFT'
                  ? t('scoring.statusDraft')
                  : row.status === 'ARCHIVED'
                    ? t('scoring.statusArchived')
                    : row.status
            }
          />
        ),
      },
      {
        key: 'actions',
        label: t('scoring.actions'),
        align: 'center',
        noRowClick: true,
        render: (row) => {
          const cannotDelete = row.status === 'ACTIVE' && models.length === 1;
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => navigate(`/scoring/${row.id}`)}
                className="p-2 rounded text-daret-muted hover:text-daret-fg hover:bg-daret-dark/50 transition"
                title={t('common.open')}
                aria-label={t('scoring.editScorecardAria')}
              >
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicate(row)}
                disabled={duplicateMu.isPending}
                className="p-2 rounded text-daret-muted hover:text-daret-fg hover:bg-daret-dark/50 transition disabled:opacity-50"
                title={t('scoring.duplicateScorecardTitle')}
                aria-label={t('scoring.duplicateScorecardAria')}
              >
                <DuplicateIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => !cannotDelete && setDeleteModal(row)}
                disabled={cannotDelete}
                className={`p-2 rounded transition ${cannotDelete ? 'text-daret-border cursor-not-allowed opacity-50' : 'text-daret-muted hover:text-red-400 hover:bg-red-500/10'}`}
                title={cannotDelete ? t('scoring.cannotDeleteOnlyActive') : t('scoring.deleteScorecard')}
                aria-label={t('scoring.deleteScorecard')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [models.length, duplicateMu.isPending, navigate, t]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-daret-muted">{t('common.loading')}</div>
      </div>
    );
  }

  const versionCriteriaRuns = (version: number, count: number, runs: number) =>
    t('scoring.versionCriteriaRuns')
      .replace('{{version}}', String(version))
      .replace('{{count}}', String(count))
      .replace('{{runs}}', String(runs));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-daret-fg">{t('scoring.title')}</h1>
        <button
          onClick={() => createMu.mutate({ name: t('scoring.newScorecardName') })}
          disabled={createMu.isPending}
          className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {createMu.isPending ? t('scoring.creating') : t('scoring.createScorecard')}
        </button>
      </div>

      <p className="text-daret-muted text-sm max-w-2xl">
        {t('scoring.intro')}
      </p>

      {activeModel && (
        <div className="rounded-xl border border-daret-green/40 bg-daret-green/5 p-4">
          <p className="text-sm text-daret-muted">{t('scoring.activeScorecard')}</p>
          <p className="font-medium text-daret-fg">{activeModel.name}</p>
          <p className="text-sm text-daret-muted mt-1">
            {versionCriteriaRuns(activeModel.version, activeModel.criteriaCount ?? 0, activeModel.runsCount ?? 0)}
          </p>
          <button
            onClick={() => navigate(`/scoring/${activeModel.id}`)}
            className="mt-2 text-sm text-daret-green hover:underline"
          >
            {t('scoring.editScorecard')}
          </button>
        </div>
      )}

      <div>
        <h2 className="text-base font-medium text-daret-fg mb-3">{t('scoring.scorecards')}</h2>
        {models.length === 0 ? (
          <div className="rounded-xl border border-daret-border bg-daret-card p-12 text-center">
            <p className="text-daret-muted font-medium">{t('scoring.noScorecardsYet')}</p>
            <button
              onClick={() => createMu.mutate({ name: t('scoring.newScorecardName') })}
              disabled={createMu.isPending}
              className="mt-4 rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {t('scoring.createScorecard')}
            </button>
          </div>
        ) : (
          <AdminTable<ScoringModelListItem>
            columns={columns}
            rows={sortedModels}
            keyExtractor={(row) => row.id}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={(key, dir) => {
              setSortKey(key as SortKey);
              setSortDirection(dir);
            }}
            onRowClick={(row) => navigate(`/scoring/${row.id}`)}
            emptyMessage={t('scoring.emptyMessage')}
            headerClassName="bg-teal-700/90 text-white border-b border-teal-600"
          />
        )}
      </div>

      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !deleteMu.isPending && setDeleteModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-scorecard-title"
        >
          <div
            className="bg-daret-card border border-daret-border rounded-xl shadow-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-scorecard-title" className="font-medium text-daret-fg text-lg mb-2">
              {t('scoring.deleteScorecardTitle')}
            </h3>
            <p className="text-daret-muted text-sm mb-4">
              {t('scoring.deleteScorecardWarning').replace('{{name}}', deleteModal.name)}
            </p>
            {deleteMu.isError && (
              <p className="text-red-400 text-sm mb-3">
                {(deleteMu.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('scoring.deleteScorecardError')}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleteMu.isPending}
                className="rounded-lg border border-daret-border px-4 py-2 text-sm font-medium text-daret-fg hover:bg-daret-dark/50 disabled:opacity-50"
              >
                {t('security.cancel')}
              </button>
              <button
                type="button"
                onClick={() => deleteMu.mutate(deleteModal.id)}
                disabled={deleteMu.isPending}
                className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {deleteMu.isPending ? t('common.loading') : t('scoring.deleteScorecardConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
