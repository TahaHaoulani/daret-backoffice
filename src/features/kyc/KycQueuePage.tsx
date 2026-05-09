import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchSubmissions, type SubmissionStatus } from '../../api/kyc';
import { CountryDisplay } from '../../components/CountryDisplay';
import { formatFullNameLastUpper } from '../../lib/userDisplay';

const STATUSES: SubmissionStatus[] = ['PENDING_SCORING', 'IN_REVIEW', 'SUBMITTED', 'SCORING_IN_PROGRESS', 'APPROVED', 'REJECTED'];
const DEFAULT_STATUS: SubmissionStatus = 'IN_REVIEW';

export function KycQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as SubmissionStatus | null;
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const page = Number(searchParams.get('page')) || 1;
  const status = statusParam && STATUSES.includes(statusParam) ? statusParam : DEFAULT_STATUS;

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', status, search, page],
    queryFn: () => fetchSubmissions({ status, search: search || undefined, page, size: 20 }),
  });

  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function applyFilters() {
    const next = new URLSearchParams(searchParams);
    if (search) next.set('search', search);
    else next.delete('search');
    next.set('page', '1');
    setSearchParams(next);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-daret-fg mb-6">KYC Queue</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex rounded-lg overflow-hidden border border-daret-border bg-daret-card">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSearchParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set('status', s);
                  n.set('page', '1');
                  return n;
                });
              }}
              className={`px-4 py-2 text-sm font-medium ${
                status === s
                  ? 'bg-daret-green text-white'
                  : 'text-daret-muted hover:text-daret-fg hover:bg-daret-card'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="flex-1 rounded-lg bg-daret-dark border border-daret-border px-4 py-2 text-daret-fg placeholder-gray-500 focus:ring-2 focus:ring-daret-green"
          />
          <button
            onClick={applyFilters}
            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
        {isLoading ? (
          <div className="p-12 text-center text-daret-muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-daret-muted">No submissions found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-daret-border text-left text-sm text-daret-muted">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.submissionId}
                  className="border-b border-daret-border/50 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/kyc/submissions/${row.submissionId}`}
                      className="text-daret-green hover:underline font-medium"
                    >
                      {row.user.fullName ? formatFullNameLastUpper(row.user.fullName) : row.user.email || '—'}
                    </Link>
                    {row.user.email && (
                      <span className="block text-xs text-daret-muted">{row.user.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === 'APPROVED'
                          ? 'bg-daret-green/20 text-daret-green'
                          : row.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : row.status === 'IN_REVIEW'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-daret-muted/20 text-daret-muted'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <CountryDisplay code={row.user.country} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {row.assignedReviewer?.email ?? '—'}
                  </td>
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
                onClick={() => setSearchParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set('page', String(Math.max(1, page - 1)));
                  return n;
                })}
                disabled={page <= 1}
                className="rounded border border-daret-border px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setSearchParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set('page', String(Math.min(totalPages, page + 1)));
                  return n;
                })}
                disabled={page >= totalPages}
                className="rounded border border-daret-border px-3 py-1 text-sm text-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
