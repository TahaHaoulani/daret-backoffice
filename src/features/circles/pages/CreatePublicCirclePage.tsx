import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPublicCircle } from '../../../api/circles';

export function CreatePublicCirclePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [contributionAmount, setContributionAmount] = useState(5000);
  const [currency, setCurrency] = useState('MAD');
  const [durationMonths, setDurationMonths] = useState(12);
  const [joinWindowStart, setJoinWindowStart] = useState('');
  const [joinWindowEnd, setJoinWindowEnd] = useState('');

  const create = useMutation({
    mutationFn: () =>
      createPublicCircle({
        name: name || 'Public Circle',
        contributionAmount,
        currency,
        durationMonths,
        joinWindowStart: joinWindowStart || undefined,
        joinWindowEnd: joinWindowEnd || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'circles'] });
      navigate('/circles');
    },
  });

  return (
    <div className="w-full py-4 max-w-xl">
      <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg mb-4">Create public circle</h1>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div>
          <label className="block text-sm font-medium text-daret-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
            placeholder="Public Circle"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-daret-muted mb-1">Contribution (cents)</label>
            <input
              type="number"
              min={0}
              value={contributionAmount}
              onChange={(e) => setContributionAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-daret-muted mb-1">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.slice(0, 8))}
              className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-daret-muted mb-1">Duration (months) = N members</label>
          <input
            type="number"
            min={1}
            max={60}
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-daret-muted mb-1">Join window start (ISO)</label>
          <input
            type="datetime-local"
            value={joinWindowStart}
            onChange={(e) => setJoinWindowStart(e.target.value)}
            className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-daret-muted mb-1">Join window end (ISO)</label>
          <input
            type="datetime-local"
            value={joinWindowEnd}
            onChange={(e) => setJoinWindowEnd(e.target.value)}
            className="w-full rounded-lg border border-daret-border bg-daret-card px-3 py-2 text-daret-fg"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/circles')}
            className="rounded-lg border border-daret-border px-4 py-2 text-sm font-medium text-daret-muted hover:text-daret-fg"
          >
            Cancel
          </button>
        </div>
        {create.isError && (
          <p className="text-sm text-red-500">{(create.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
