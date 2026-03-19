import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, type UserSearchItem, type UserSearchParams } from '../api/usersApi';
import { CompactTable } from '../../../components/CompactTable';
import { StatusChip } from '../../../components/StatusChip';
import { useI18n } from '../../../app/i18n/I18nContext';

const PAGE_SIZES = [10, 25, 50] as const;

const KYC_STATUS_OPTIONS = [
  { value: '', labelKey: 'common.any' },
  { value: 'NONE', labelKey: 'status.notStarted' },
  { value: 'PENDING', labelKey: 'status.pending' },
  { value: 'UNDER_REVIEW', labelKey: 'status.underReview' },
  { value: 'VERIFIED', labelKey: 'status.verified' },
  { value: 'REJECTED', labelKey: 'status.rejected' },
] as const;

function initials(fullName: string, email: string | null): string {
  const s = fullName?.trim();
  if (s) {
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '—';
}

export function UsersSearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [firstName, setFirstName] = useState(searchParams.get('firstName') ?? '');
  const [lastName, setLastName] = useState(searchParams.get('lastName') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');
  const [kycStatus, setKycStatus] = useState(searchParams.get('kycStatus') ?? '');
  const [createdFrom, setCreatedFrom] = useState(searchParams.get('createdFrom') ?? '');
  const [createdTo, setCreatedTo] = useState(searchParams.get('createdTo') ?? '');
  const page = Number(searchParams.get('page')) || 1;
  const size = Math.min(50, Math.max(10, Number(searchParams.get('size')) || 25));
  const sortByParam = searchParams.get('sortBy');
  const sortOrderParam = searchParams.get('sortOrder');
  const sortBy: UserSearchParams['sortBy'] =
    sortByParam === 'lastName' || sortByParam === 'createdAt' || sortByParam === 'kycStatus' || sortByParam === 'lastKycSubmittedAt'
      ? sortByParam
      : 'createdAt';
  const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';

  const params: UserSearchParams = {
    page,
    size,
    sortBy,
    sortOrder,
  };
  if (q) params.q = q;
  if (firstName) params.firstName = firstName;
  if (lastName) params.lastName = lastName;
  if (email) params.email = email;
  if (phone) params.phone = phone;
  if (country) params.country = country;
  if (kycStatus) params.kycStatus = kycStatus;
  if (createdFrom) params.createdFrom = createdFrom;
  if (createdTo) params.createdTo = createdTo;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchUsers(params),
  });

  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / size);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (firstName) next.set('firstName', firstName);
    if (lastName) next.set('lastName', lastName);
    if (email) next.set('email', email);
    if (phone) next.set('phone', phone);
    if (country) next.set('country', country);
    if (kycStatus) next.set('kycStatus', kycStatus);
    if (createdFrom) next.set('createdFrom', createdFrom);
    if (createdTo) next.set('createdTo', createdTo);
    next.set('page', '1');
    next.set('size', String(size));
    if (sortBy !== 'createdAt') next.set('sortBy', sortBy);
    if (sortOrder !== 'desc') next.set('sortOrder', sortOrder);
    setSearchParams(next);
    refetch();
  }

  function handleSort(sortKey: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const nextOrder = sortBy === sortKey && sortOrder === 'desc' ? 'asc' : 'desc';
      next.set('sortBy', sortKey);
      next.set('sortOrder', nextOrder);
      next.set('page', '1');
      return next;
    });
  }

  function handleReset() {
    setQ('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCountry('');
    setKycStatus('');
    setCreatedFrom('');
    setCreatedTo('');
    setSearchParams({ page: '1', size: String(size), sortBy: 'createdAt', sortOrder: 'desc' });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
  }

  function setPageSize(s: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('size', String(s));
      next.set('page', '1');
      return next;
    });
  }

  const columns = [
    {
      key: 'avatar',
      label: '',
      className: 'w-10',
      render: (row: UserSearchItem) => (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-daret-muted/30 text-xs font-medium text-daret-muted">
          {initials(row.fullName, row.email)}
        </span>
      ),
    },
    { key: 'name', label: t('users.name'), sortKey: 'lastName', render: (row: UserSearchItem) => row.fullName || '—' },
    { key: 'email', label: t('users.email'), render: (row: UserSearchItem) => row.email ?? '—' },
    {
      key: 'createdAt',
      label: t('users.createdAt'),
      sortKey: 'createdAt',
      render: (row: UserSearchItem) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
    {
      key: 'kycStatus',
      label: 'KYC',
      sortKey: 'kycStatus',
      render: (row: UserSearchItem) => <StatusChip status={row.kycStatus} type="kyc" />,
    },
    {
      key: 'open',
      label: '',
      className: 'w-10 text-right',
      render: (row: UserSearchItem) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/users/${row.id}`);
          }}
          className="rounded p-1 text-daret-muted hover:bg-white/10 hover:text-daret-green"
          aria-label="Open"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="ops-container max-w-[1320px] mx-auto px-4 py-4">
      <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg mb-4">{t('users.title')}</h1>

      <form onSubmit={handleSearch} className="bg-daret-card border border-daret-border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
              {t('users.freeSearch')}
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('users.searchPlaceholder')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg placeholder-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
              {t('users.kycStatus')}
            </label>
            <select
              value={kycStatus}
              onChange={(e) => setKycStatus(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
            >
              {KYC_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'any'} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
              {t('users.country')}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. MA, FR"
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 grid grid-cols-2 gap-1">
              <div>
                <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                  From
                </label>
                <input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-2 py-1.5 text-daret-fg text-sm"
                />
              </div>
              <div>
                <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                  To
                </label>
                <input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-2 py-1.5 text-daret-fg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {showMoreFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 pt-2 border-t border-daret-border">
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
              />
            </div>
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
              />
            </div>
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
              />
            </div>
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
              />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="submit"
            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-3 py-1.5 text-sm font-medium"
          >
{t('users.searchButton')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-daret-border text-daret-muted px-3 py-1.5 text-sm font-medium hover:bg-daret-border/10"
            >
              {t('users.reset')}
          </button>
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            className="text-sm text-daret-muted hover:text-daret-fg"
          >
            {showMoreFilters ? t('common.fewerFilters') : t('common.moreFilters')}
          </button>
        </div>
      </form>

      <CompactTable<UserSearchItem>
        columns={columns}
        rows={items}
        keyExtractor={(row) => row.id}
        onRowClick={(row, e) => {
          if (e.ctrlKey || e.metaKey) {
            window.open(`/users/${row.id}`, '_blank', 'noopener,noreferrer');
          } else {
            navigate(`/users/${row.id}`);
          }
        }}
        isLoading={isLoading}
        emptyMessage={t('users.noUsersFound')}
        skeletonRows={12}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-2 text-sm text-daret-muted">
          <span>
            Page {page} of {totalPages || 1} ({total} total)
          </span>
          <select
            value={size}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-daret-border bg-daret-card text-daret-muted px-2 py-1 text-sm"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} per page
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded border border-daret-border px-2 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || totalPages === 0}
            className="rounded border border-daret-border px-2 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
