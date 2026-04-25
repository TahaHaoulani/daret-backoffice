import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminCircles,
  fetchCircleBids,
  fetchCircleAllocations,
  runAllocation,
  updateCircle,
  type AllocationsResponse,
} from '../../../api/circles';

type CircleAllocationRow = AllocationsResponse['allocations'][number];
import { CompactTable } from '../../../components/CompactTable';
import { StatusChip } from '../../../components/StatusChip';

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listData } = useQuery({
    queryKey: ['admin', 'circles', 'ALL'],
    queryFn: () => fetchAdminCircles(),
  });
  const circle = listData?.circles?.find((c) => c.id === id);

  const { data: bidsData, isLoading: bidsLoading } = useQuery({
    queryKey: ['admin', 'circles', id, 'bids'],
    queryFn: () => fetchCircleBids(id!),
    enabled: !!id,
  });

  const { data: allocData, isLoading: allocLoading } = useQuery({
    queryKey: ['admin', 'circles', id, 'allocations'],
    queryFn: () => fetchCircleAllocations(id!),
    enabled: !!id,
  });

  const runAlloc = useMutation({
    mutationFn: () => runAllocation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'circles', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'circles'] });
    },
  });

  const setOpen = useMutation({
    mutationFn: () => updateCircle(id!, { lifecycleStatus: 'OPEN' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'circles'] }),
  });

  if (!id) {
    navigate('/circles');
    return null;
  }

  const isPublic = circle?.circleType === 'PUBLIC';
  const allocationDone = circle?.allocationStatus === 'DONE';

  return (
    <div className="w-full py-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => navigate('/circles')}
          className="text-daret-muted hover:text-daret-fg text-sm"
        >
          ← Back
        </button>
        <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg">
          {circle?.name ?? id}
        </h1>
        {circle && <StatusChip status={circle.lifecycleStatus ?? '—'} />}
        {circle?.allocationStatus && (
          <span className="text-sm text-daret-muted">Allocation: {circle.allocationStatus}</span>
        )}
      </div>

      {circle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-daret-card border border-daret-border rounded-lg p-3">
            <p className="text-xs text-daret-muted">Members</p>
            <p className="font-medium text-daret-fg">{circle.memberCount} / {circle.members}</p>
          </div>
          <div className="bg-daret-card border border-daret-border rounded-lg p-3">
            <p className="text-xs text-daret-muted">Amount</p>
            <p className="font-medium text-daret-fg">{circle.amount} {circle.currency}</p>
          </div>
          <div className="bg-daret-card border border-daret-border rounded-lg p-3">
            <p className="text-xs text-daret-muted">Join window end</p>
            <p className="font-medium text-daret-fg">
              {circle.joinWindowEnd ? new Date(circle.joinWindowEnd).toLocaleString() : '—'}
            </p>
          </div>
        </div>
      )}

      {isPublic && (
        <>
          <div className="flex gap-2 mb-4">
            {circle?.lifecycleStatus === 'DRAFT' && (
              <button
                type="button"
                onClick={() => setOpen.mutate()}
                disabled={setOpen.isPending}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-medium"
              >
                Open for joining
              </button>
            )}
            {!allocationDone && bidsData && bidsData.bidCount > 0 && (
              <button
                type="button"
                onClick={() => runAlloc.mutate()}
                disabled={runAlloc.isPending}
                className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {runAlloc.isPending ? 'Running…' : 'Run allocation'}
              </button>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-daret-fg mb-2">Bids (join window stats)</h2>
            {bidsLoading ? (
              <p className="text-daret-muted">Loading…</p>
            ) : bidsData ? (
              <div className="bg-daret-card border border-daret-border rounded-xl p-4">
                <p className="text-sm text-daret-muted">
                  {bidsData.uniqueBidders} bidders, {bidsData.bidCount} total bids
                </p>
                {Object.keys(bidsData.bidsByPosition).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(bidsData.bidsByPosition).map(([pos, list]) => (
                      <div key={pos} className="text-sm">
                        <span className="font-medium text-daret-fg">Position {pos}:</span>{' '}
                        {list.length} bid(s)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-daret-fg mb-2">Allocations</h2>
            {allocLoading ? (
              <p className="text-daret-muted">Loading…</p>
            ) : allocData?.allocations?.length ? (
              <CompactTable<CircleAllocationRow>
                columns={[
                  { key: 'userId', label: 'User ID', render: (r) => <span className="font-mono text-xs">{r.userId.slice(0, 8)}…</span> },
                  { key: 'assignedPositionK', label: 'Position', render: (r) => r.assignedPositionK },
                  { key: 'clearingFeeCents', label: 'Fee (cents)', render: (r) => r.clearingFeeCents },
                  { key: 'clearingCashbackCents', label: 'Cashback (cents)', render: (r) => r.clearingCashbackCents },
                  { key: 'allocatedAt', label: 'At', render: (r) => new Date(r.allocatedAt).toLocaleString() },
                ]}
                rows={allocData.allocations}
                keyExtractor={(r) => r.userId}
              />
            ) : (
              <p className="text-daret-muted">No allocations yet. Run allocation after join window closes.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
