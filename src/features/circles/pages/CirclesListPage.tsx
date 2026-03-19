import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAdminCircles, type AdminCircleSummary } from '../../../api/circles';
import { CompactTable } from '../../../components/CompactTable';
import { EmptyState } from '../../../components/EmptyState';
import { StatusChip } from '../../../components/StatusChip';

type FilterType = 'ALL' | 'PUBLIC' | 'PRIVATE';

export function CirclesListPage() {
  const [type, setType] = useState<FilterType>('PUBLIC');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'circles', type],
    queryFn: () => fetchAdminCircles(type === 'ALL' ? undefined : type),
  });

  const circles = data?.circles ?? [];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg">Public circles</h1>
        <Link
          to="/circles/create"
          className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium"
        >
          Create public circle
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {(['PUBLIC', 'PRIVATE', 'ALL'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setType(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${type === f ? 'bg-daret-green text-white' : 'bg-daret-card border border-daret-border text-daret-muted hover:text-daret-fg'}`}
          >
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="bg-daret-card border border-daret-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-daret-muted">Loading…</div>
        ) : circles.length === 0 ? (
          <EmptyState
            title="No circles"
            message={type === 'PUBLIC' ? 'Create a public circle to open the marketplace.' : 'No circles match this filter.'}
          />
        ) : (
          <CompactTable
            columns={[
              { key: 'name', label: 'Name', render: (r: AdminCircleSummary) => <Link to={`/circles/${r.id}`} className="text-daret-green hover:underline">{r.name}</Link> },
              { key: 'circleType', label: 'Type', render: (r: AdminCircleSummary) => <span className="text-daret-muted">{r.circleType}</span> },
              { key: 'lifecycleStatus', label: 'Status', render: (r: AdminCircleSummary) => <StatusChip status={r.lifecycleStatus ?? '—'} /> },
              { key: 'allocationStatus', label: 'Allocation', render: (r: AdminCircleSummary) => <span className="text-daret-muted">{r.allocationStatus ?? '—'}</span> },
              { key: 'memberCount', label: 'Members', render: (r: AdminCircleSummary) => `${r.memberCount} / ${r.members}` },
              { key: 'amount', label: 'Amount', render: (r: AdminCircleSummary) => `${r.amount} ${r.currency}` },
              { key: 'joinWindowEnd', label: 'Join until', render: (r: AdminCircleSummary) => r.joinWindowEnd ? new Date(r.joinWindowEnd).toLocaleDateString() : '—' },
            ]}
            data={circles}
            keyExtractor={(r) => r.id}
          />
        )}
      </div>
    </div>
  );
}
