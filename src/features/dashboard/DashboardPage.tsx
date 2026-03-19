import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../../api/dashboard';
import { KpiCard } from '../../components/KpiCard';
import { CompactTable } from '../../components/CompactTable';
import { StatusChip } from '../../components/StatusChip';
import { useI18n } from '../../app/i18n/I18nContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const d = data?.data;
  const counts = d?.counts ?? {};
  const myQueue = d?.myQueue ?? [];
  const recentActivity = d?.recentActivity ?? [];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg">{t('dashboard.title')}</h1>
        <Link
          to="/granting"
          className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium"
        >
          {t('dashboard.goToGranting')}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label={t('dashboard.submitted')} value={counts.SUBMITTED ?? 0} to="/granting?status=SUBMITTED" loading={isLoading} />
        <KpiCard label={t('dashboard.inReview')} value={counts.IN_REVIEW ?? 0} to="/granting?status=IN_REVIEW" loading={isLoading} />
        <KpiCard label={t('dashboard.approved')} value={counts.APPROVED ?? 0} to="/granting?status=APPROVED" loading={isLoading} />
        <KpiCard label={t('dashboard.rejected')} value={counts.REJECTED ?? 0} to="/granting?status=REJECTED" loading={isLoading} />
        <KpiCard
          label={t('dashboard.pendingSla')}
          value={d?.pendingSlaCount ?? 0}
          to="/granting?pendingSla=true"
          loading={isLoading}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.assignedToMe')}
          value={d?.assignedToMeCount ?? 0}
          to="/granting?assignedToMe=true"
          loading={isLoading}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-daret-card border border-daret-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-daret-fg mb-3">{t('dashboard.myQueue')}</h2>
          <CompactTable
            columns={[
              { key: 'user', label: t('dashboard.applicant'), render: (r) => r.user.fullName || r.user.email || '—' },
              { key: 'status', label: t('dashboard.status'), render: (r) => <StatusChip status={r.status} type="submission" /> },
              {
                key: 'submitted',
                label: t('dashboard.submittedAt'),
                render: (r) => (r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'),
              },
            ]}
            rows={myQueue}
            keyExtractor={(r) => r.submissionId}
            onRowClick={(r) => navigate(`/kyc/submissions/${r.submissionId}`)}
            isLoading={isLoading}
            emptyMessage={t('dashboard.noItemsInQueue')}
            skeletonRows={5}
          />
          <div className="mt-2">
            <Link to="/granting" className="text-sm text-daret-green hover:underline">
              {t('dashboard.viewFullQueue')}
            </Link>
          </div>
        </div>
        <div className="bg-daret-card border border-daret-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-daret-fg mb-3">{t('dashboard.recentActivity')}</h2>
          <CompactTable
            columns={[
              { key: 'action', label: t('dashboard.action'), render: (r) => r.action },
              { key: 'entity', label: t('dashboard.entity'), render: (r) => `${r.entityType || ''} ${r.entityId ? String(r.entityId).slice(0, 8) : ''}`.trim() || '—' },
              { key: 'actor', label: t('dashboard.actor'), render: (r) => r.actorEmail || '—' },
              {
                key: 'date',
                label: t('dashboard.date'),
                render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'),
              },
            ]}
            rows={recentActivity}
            keyExtractor={(r) => r.id}
            isLoading={isLoading}
            emptyMessage={t('dashboard.noRecentActivity')}
            skeletonRows={5}
          />
          <div className="mt-2">
            <Link to="/audit" className="text-sm text-daret-green hover:underline">
              View audit log →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
