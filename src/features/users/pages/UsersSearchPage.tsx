import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, type UserSearchItem, type UserSearchParams } from '../api/usersApi';
import { formatDateTime } from '../../kyc/utils/format';
import { CompactTable } from '../../../components/CompactTable';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { StatusChip } from '../../../components/StatusChip';
import { useI18n } from '../../../app/i18n/I18nContext';
import { formatFullNameLastUpper } from '../../../lib/userDisplay';
import { UsersSearchAdvancedFields } from '../components/UsersSearchAdvancedFields';
import {
  advancedValuesFromSearchParams,
  emptyAdvancedValues,
  type AdvancedFieldValues,
} from '../usersSearchState';

const PAGE_SIZES = [10, 25, 50] as const;

const KYC_STATUS_OPTIONS = [
  { value: '', labelKey: 'common.any' },
  { value: 'NONE', labelKey: 'status.notStarted' },
  { value: 'PENDING', labelKey: 'status.pending' },
  { value: 'PENDING_SCORING', labelKey: 'status.pendingScoring' },
  { value: 'UNDER_REVIEW', labelKey: 'status.underReview' },
  { value: 'VERIFIED', labelKey: 'status.verified' },
  { value: 'REJECTED', labelKey: 'status.rejected' },
] as const;

const CHIP_PARAM_KEYS = [
  'q',
  'kycStatus',
  'countryOfResidence',
  'country',
  'createdFrom',
  'createdTo',
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'nationality',
  'countryOfBirth',
  'cityOfBirth',
  'addressCity',
  'addressZipCode',
  'addressCountry',
  'documentStatus',
  'livenessStatus',
  'reviewDecision',
  'riskLevel',
  'reviewerId',
  'professionalSituation',
  'netMonthlyIncomeMin',
  'netMonthlyIncomeMax',
  'monthlyExpensesMin',
  'monthlyExpensesMax',
  'hasActiveLoans',
  'debtToIncomeRatioMin',
  'debtToIncomeRatioMax',
  'remainingDisposableIncomeMin',
  'remainingDisposableIncomeMax',
  'documentType',
  'missingDocumentSide',
  'submittedFrom',
  'submittedTo',
] as const;

function userWorkspaceHref(id: string): string {
  return new URL(`/users/${id}`, window.location.origin).href;
}

function riskBandClass(band: string | null): string {
  if (!band) return 'text-daret-muted';
  if (band === 'GREEN') return 'text-daret-green';
  if (band === 'ORANGE') return 'text-amber-400';
  if (band === 'RED') return 'text-red-400';
  return 'text-daret-muted';
}

function parseNum(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function hasAdvancedInParams(sp: URLSearchParams): boolean {
  const keys = CHIP_PARAM_KEYS.filter((k) => k !== 'q' && k !== 'kycStatus' && k !== 'countryOfResidence' && k !== 'country' && k !== 'createdFrom' && k !== 'createdTo');
  return keys.some((k) => (sp.get(k) ?? '').trim() !== '');
}

export function UsersSearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMoreFilters, setShowMoreFilters] = useState(() =>
    typeof window !== 'undefined' ? hasAdvancedInParams(new URLSearchParams(window.location.search)) : false
  );

  const [q, setQ] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [adv, setAdv] = useState<AdvancedFieldValues>(emptyAdvancedValues);

  const syncFromUrl = useCallback(() => {
    const sp = searchParams;
    setQ(sp.get('q') ?? '');
    setKycStatus(sp.get('kycStatus') ?? '');
    setCountryOfResidence(sp.get('countryOfResidence') ?? sp.get('country') ?? '');
    setCreatedFrom(sp.get('createdFrom') ?? '');
    setCreatedTo(sp.get('createdTo') ?? '');
    setAdv(advancedValuesFromSearchParams(sp));
    if (hasAdvancedInParams(sp)) setShowMoreFilters(true);
  }, [searchParams]);

  useEffect(() => {
    // Sync URL → form when chips/back navigation change query (controlled duplicate state).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync only entry point
    syncFromUrl();
  }, [syncFromUrl]);

  const page = Number(searchParams.get('page')) || 1;
  const size = Math.min(50, Math.max(10, Number(searchParams.get('size')) || 25));
  const sortByParam = searchParams.get('sortBy');
  const sortOrderParam = searchParams.get('sortOrder');
  const sortBy: NonNullable<UserSearchParams['sortBy']> =
    sortByParam === 'lastName' || sortByParam === 'createdAt' || sortByParam === 'kycStatus' || sortByParam === 'lastKycSubmittedAt'
      ? sortByParam
      : 'createdAt';
  const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';

  const params: UserSearchParams = useMemo(() => {
    const p: UserSearchParams = { page, size, sortBy, sortOrder };
    if (q.trim()) p.q = q.trim();
    if (kycStatus) p.kycStatus = kycStatus;
    if (countryOfResidence.trim()) p.countryOfResidence = countryOfResidence.trim();
    if (createdFrom) p.createdFrom = createdFrom;
    if (createdTo) p.createdTo = createdTo;

    const a = adv;
    if (a.firstName.trim()) p.firstName = a.firstName.trim();
    if (a.lastName.trim()) p.lastName = a.lastName.trim();
    if (a.email.trim()) p.email = a.email.trim();
    if (a.phone.trim()) p.phone = a.phone.trim();
    if (a.dateOfBirth) p.dateOfBirth = a.dateOfBirth;
    if (a.nationality.trim()) p.nationality = a.nationality.trim();
    if (a.countryOfBirth.trim()) p.countryOfBirth = a.countryOfBirth.trim();
    if (a.cityOfBirth.trim()) p.cityOfBirth = a.cityOfBirth.trim();
    if (a.addressCity.trim()) p.addressCity = a.addressCity.trim();
    if (a.addressZipCode.trim()) p.addressZipCode = a.addressZipCode.trim();
    if (a.addressCountry.trim()) p.addressCountry = a.addressCountry.trim();
    if (a.documentStatus) p.documentStatus = a.documentStatus;
    if (a.livenessStatus) p.livenessStatus = a.livenessStatus;
    if (a.reviewDecision) p.reviewDecision = a.reviewDecision;
    if (a.riskLevel) p.riskLevel = a.riskLevel;
    if (a.reviewerId.trim()) p.reviewerId = a.reviewerId.trim();
    if (a.professionalSituation) p.professionalSituation = a.professionalSituation;
    const incMin = parseNum(a.netMonthlyIncomeMin);
    const incMax = parseNum(a.netMonthlyIncomeMax);
    if (incMin !== undefined) p.netMonthlyIncomeMin = Math.round(incMin);
    if (incMax !== undefined) p.netMonthlyIncomeMax = Math.round(incMax);
    const expMin = parseNum(a.monthlyExpensesMin);
    const expMax = parseNum(a.monthlyExpensesMax);
    if (expMin !== undefined) p.monthlyExpensesMin = Math.round(expMin);
    if (expMax !== undefined) p.monthlyExpensesMax = Math.round(expMax);
    if (a.hasActiveLoans === 'true') p.hasActiveLoans = true;
    if (a.hasActiveLoans === 'false') p.hasActiveLoans = false;
    const dtiMin = parseNum(a.debtToIncomeRatioMin);
    const dtiMax = parseNum(a.debtToIncomeRatioMax);
    if (dtiMin !== undefined) p.debtToIncomeRatioMin = dtiMin;
    if (dtiMax !== undefined) p.debtToIncomeRatioMax = dtiMax;
    const dispMin = parseNum(a.remainingDisposableIncomeMin);
    const dispMax = parseNum(a.remainingDisposableIncomeMax);
    if (dispMin !== undefined) p.remainingDisposableIncomeMin = Math.round(dispMin);
    if (dispMax !== undefined) p.remainingDisposableIncomeMax = Math.round(dispMax);
    if (a.documentType) p.documentType = a.documentType;
    if (a.missingDocumentSide) p.missingDocumentSide = a.missingDocumentSide;
    if (a.submittedFrom) p.submittedFrom = a.submittedFrom;
    if (a.submittedTo) p.submittedTo = a.submittedTo;
    return p;
  }, [
    page,
    size,
    sortBy,
    sortOrder,
    q,
    kycStatus,
    countryOfResidence,
    createdFrom,
    createdTo,
    adv,
  ]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchUsers(params),
  });

  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / size);

  function appendFilterParams(next: URLSearchParams) {
    if (q.trim()) next.set('q', q.trim());
    if (kycStatus) next.set('kycStatus', kycStatus);
    if (countryOfResidence.trim()) next.set('countryOfResidence', countryOfResidence.trim());
    if (createdFrom) next.set('createdFrom', createdFrom);
    if (createdTo) next.set('createdTo', createdTo);
    const a = adv;
    const setIf = (k: string, v: string) => {
      if (v.trim()) next.set(k, v.trim());
    };
    setIf('firstName', a.firstName);
    setIf('lastName', a.lastName);
    setIf('email', a.email);
    setIf('phone', a.phone);
    if (a.dateOfBirth) next.set('dateOfBirth', a.dateOfBirth);
    setIf('nationality', a.nationality);
    setIf('countryOfBirth', a.countryOfBirth);
    setIf('cityOfBirth', a.cityOfBirth);
    setIf('addressCity', a.addressCity);
    setIf('addressZipCode', a.addressZipCode);
    setIf('addressCountry', a.addressCountry);
    if (a.documentStatus) next.set('documentStatus', a.documentStatus);
    if (a.livenessStatus) next.set('livenessStatus', a.livenessStatus);
    if (a.reviewDecision) next.set('reviewDecision', a.reviewDecision);
    if (a.riskLevel) next.set('riskLevel', a.riskLevel);
    setIf('reviewerId', a.reviewerId);
    if (a.professionalSituation) next.set('professionalSituation', a.professionalSituation);
    if (a.netMonthlyIncomeMin.trim()) next.set('netMonthlyIncomeMin', a.netMonthlyIncomeMin.trim());
    if (a.netMonthlyIncomeMax.trim()) next.set('netMonthlyIncomeMax', a.netMonthlyIncomeMax.trim());
    if (a.monthlyExpensesMin.trim()) next.set('monthlyExpensesMin', a.monthlyExpensesMin.trim());
    if (a.monthlyExpensesMax.trim()) next.set('monthlyExpensesMax', a.monthlyExpensesMax.trim());
    if (a.hasActiveLoans) next.set('hasActiveLoans', a.hasActiveLoans);
    if (a.debtToIncomeRatioMin.trim()) next.set('debtToIncomeRatioMin', a.debtToIncomeRatioMin.trim());
    if (a.debtToIncomeRatioMax.trim()) next.set('debtToIncomeRatioMax', a.debtToIncomeRatioMax.trim());
    if (a.remainingDisposableIncomeMin.trim()) next.set('remainingDisposableIncomeMin', a.remainingDisposableIncomeMin.trim());
    if (a.remainingDisposableIncomeMax.trim()) next.set('remainingDisposableIncomeMax', a.remainingDisposableIncomeMax.trim());
    if (a.documentType) next.set('documentType', a.documentType);
    if (a.missingDocumentSide) next.set('missingDocumentSide', a.missingDocumentSide);
    if (a.submittedFrom) next.set('submittedFrom', a.submittedFrom);
    if (a.submittedTo) next.set('submittedTo', a.submittedTo);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    appendFilterParams(next);
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
    setKycStatus('');
    setCountryOfResidence('');
    setCreatedFrom('');
    setCreatedTo('');
    setAdv(emptyAdvancedValues());
    setSearchParams({ page: '1', size: String(size), sortBy: 'createdAt', sortOrder: 'desc' });
  }

  function removeChip(param: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(param);
      if (param === 'country') next.delete('countryOfResidence');
      if (param === 'countryOfResidence') next.delete('country');
      next.set('page', '1');
      return next;
    });
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

  const setAdvField = useCallback(<K extends keyof AdvancedFieldValues>(key: K, value: AdvancedFieldValues[K]) => {
    setAdv((prev) => ({ ...prev, [key]: value }));
  }, []);

  const chips = useMemo(() => {
    const sp = searchParams;
    const out: { param: string; label: string }[] = [];
    const add = (param: string, label: string) => out.push({ param, label });

    const g = (k: string) => (sp.get(k) ?? '').trim();
    if (g('q')) add('q', `${t('users.freeSearch')}: ${g('q')}`);
    if (g('kycStatus')) add('kycStatus', `${t('users.kycStatus')}: ${t(`status.${kycStatusToLabelKey(g('kycStatus'))}`)}`);
    const c = g('countryOfResidence') || g('country');
    if (c) add('countryOfResidence', `${t('users.countryOfResidence')}: ${c}`);
    if (g('createdFrom')) add('createdFrom', `${t('users.dateFrom')}: ${g('createdFrom')}`);
    if (g('createdTo')) add('createdTo', `${t('users.dateTo')}: ${g('createdTo')}`);

    if (g('firstName')) add('firstName', `${t('users.filters.firstName')}: ${g('firstName')}`);
    if (g('lastName')) add('lastName', `${t('users.filters.lastName')}: ${g('lastName')}`);
    if (g('email')) add('email', `${t('users.filters.email')}: ${g('email')}`);
    if (g('phone')) add('phone', `${t('users.filters.phone')}: ${g('phone')}`);
    if (g('dateOfBirth')) add('dateOfBirth', `${t('users.filters.dateOfBirth')}: ${g('dateOfBirth')}`);
    if (g('nationality')) add('nationality', `${t('users.filters.nationality')}: ${g('nationality')}`);
    if (g('countryOfBirth')) add('countryOfBirth', `${t('users.filters.countryOfBirth')}: ${g('countryOfBirth')}`);
    if (g('cityOfBirth')) add('cityOfBirth', `${t('users.filters.cityOfBirth')}: ${g('cityOfBirth')}`);
    if (g('addressCity')) add('addressCity', `${t('users.filters.addressCity')}: ${g('addressCity')}`);
    if (g('addressZipCode')) add('addressZipCode', `${t('users.filters.addressZip')}: ${g('addressZipCode')}`);
    if (g('addressCountry')) add('addressCountry', `${t('users.filters.addressCountry')}: ${g('addressCountry')}`);
    if (g('documentStatus')) add('documentStatus', `${t('users.filters.documentStatus')}: ${t(`users.filters.docStatus.${g('documentStatus')}`)}`);
    if (g('livenessStatus')) add('livenessStatus', `${t('users.filters.livenessStatus')}: ${t(`users.filters.liveness.${g('livenessStatus')}`)}`);
    if (g('reviewDecision')) add('reviewDecision', `${t('users.filters.reviewDecision')}: ${t(`users.filters.decision.${g('reviewDecision')}`)}`);
    if (g('riskLevel')) add('riskLevel', `${t('users.filters.riskLevel')}: ${t(`users.filters.risk.${g('riskLevel')}`)}`);
    if (g('reviewerId')) add('reviewerId', `${t('users.filters.reviewerId')}: ${g('reviewerId')}`);
    if (g('professionalSituation'))
      add('professionalSituation', `${t('users.filters.employment')}: ${t(`users.filters.employmentOpt.${g('professionalSituation')}`)}`);
    if (g('netMonthlyIncomeMin')) add('netMonthlyIncomeMin', `${t('users.filters.incomeMin')}: ${g('netMonthlyIncomeMin')}`);
    if (g('netMonthlyIncomeMax')) add('netMonthlyIncomeMax', `${t('users.filters.incomeMax')}: ${g('netMonthlyIncomeMax')}`);
    if (g('monthlyExpensesMin')) add('monthlyExpensesMin', `${t('users.filters.expensesMin')}: ${g('monthlyExpensesMin')}`);
    if (g('monthlyExpensesMax')) add('monthlyExpensesMax', `${t('users.filters.expensesMax')}: ${g('monthlyExpensesMax')}`);
    if (g('hasActiveLoans')) add('hasActiveLoans', `${t('users.filters.hasActiveLoans')}: ${g('hasActiveLoans') === 'true' ? t('users.filters.yes') : t('users.filters.no')}`);
    if (g('debtToIncomeRatioMin')) add('debtToIncomeRatioMin', `${t('users.filters.dtiMin')}: ${g('debtToIncomeRatioMin')}`);
    if (g('debtToIncomeRatioMax')) add('debtToIncomeRatioMax', `${t('users.filters.dtiMax')}: ${g('debtToIncomeRatioMax')}`);
    if (g('remainingDisposableIncomeMin')) add('remainingDisposableIncomeMin', `${t('users.filters.dispMin')}: ${g('remainingDisposableIncomeMin')}`);
    if (g('remainingDisposableIncomeMax')) add('remainingDisposableIncomeMax', `${t('users.filters.dispMax')}: ${g('remainingDisposableIncomeMax')}`);
    if (g('documentType')) add('documentType', `${t('users.filters.documentType')}: ${t(`users.filters.docType.${g('documentType')}`)}`);
    if (g('missingDocumentSide')) add('missingDocumentSide', `${t('users.filters.missingSide')}: ${t(`users.filters.side.${g('missingDocumentSide')}`)}`);
    if (g('submittedFrom')) add('submittedFrom', `${t('users.filters.submittedFrom')}: ${g('submittedFrom')}`);
    if (g('submittedTo')) add('submittedTo', `${t('users.filters.submittedTo')}: ${g('submittedTo')}`);

    return out;
  }, [searchParams, t]);

  const columns = [
    {
      key: 'name',
      label: t('users.name'),
      sortKey: 'lastName',
      render: (row: UserSearchItem) => (row.fullName ? formatFullNameLastUpper(row.fullName) : '—'),
    },
    { key: 'email', label: t('users.email'), render: (row: UserSearchItem) => row.email ?? '—' },
    {
      key: 'countryOfResidence',
      label: t('users.countryOfResidence'),
      render: (row: UserSearchItem) =>
        row.country ? <CountryDisplay code={row.country} /> : <span className="text-daret-muted">—</span>,
    },
    {
      key: 'createdAt',
      label: t('users.createdAt'),
      sortKey: 'createdAt',
      render: (row: UserSearchItem) => formatDateTime(row.createdAt),
    },
    {
      key: 'kycStatus',
      label: 'KYC',
      sortKey: 'kycStatus',
      render: (row: UserSearchItem) => <StatusChip status={row.kycStatus} type="kyc" />,
    },
    {
      key: 'riskLevel',
      label: t('users.riskLevel'),
      render: (row: UserSearchItem) => (
        <span className={`text-xs font-medium ${riskBandClass(row.riskLevel)}`}>{row.riskLevel ?? '—'}</span>
      ),
    },
    {
      key: 'open',
      label: '',
      className: 'w-10 text-right',
      render: (row: UserSearchItem) => (
        <button
          type="button"
          data-stop-row-click
          onClick={(e) => {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
              window.open(userWorkspaceHref(row.id), '_blank', 'noopener,noreferrer');
            } else {
              navigate(`/users/${row.id}`);
            }
          }}
          className="rounded p-1 text-daret-muted hover:bg-white/10 hover:text-daret-green"
          aria-label={t('common.open')}
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

      <form onSubmit={handleSearch} className="bg-daret-card border border-daret-border rounded-xl p-4 mb-3">
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
              {t('users.countryOfResidence')}
            </label>
            <input
              type="text"
              value={countryOfResidence}
              onChange={(e) => setCountryOfResidence(e.target.value)}
              placeholder="MA, FR…"
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 grid grid-cols-2 gap-1">
              <div>
                <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">
                  {t('users.dateFrom')}
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
                  {t('users.dateTo')}
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
        {showMoreFilters && <UsersSearchAdvancedFields v={adv} setV={setAdvField} />}
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-daret-border/60 mt-2">
          <button type="submit" className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-3 py-1.5 text-sm font-medium">
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
          {chips.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-daret-green hover:underline ml-auto sm:ml-0"
            >
              {t('users.clearAllFilters')}
            </button>
          )}
        </div>
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((c) => (
            <span
              key={c.param}
              className="inline-flex items-center gap-1 rounded-full border border-daret-border bg-daret-dark/80 pl-2.5 pr-1 py-0.5 text-xs text-daret-fg"
            >
              <span className="max-w-[220px] truncate">{c.label}</span>
              <button
                type="button"
                onClick={() => removeChip(c.param)}
                className="rounded-full p-0.5 text-daret-muted hover:bg-daret-border/40 hover:text-daret-fg"
                aria-label={t('common.close')}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <CompactTable<UserSearchItem>
        columns={columns}
        rows={items}
        keyExtractor={(row) => row.id}
        onRowClick={(row, e) => {
          const openNewTab = e.ctrlKey || e.metaKey || (e as React.MouseEvent).button === 1;
          if (openNewTab) {
            e.preventDefault();
            window.open(userWorkspaceHref(row.id), '_blank', 'noopener,noreferrer');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 px-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-daret-muted">
          <span>
            Page {page} of {totalPages || 1} ({total} total)
          </span>
          <select
            value={size}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-daret-border bg-daret-card text-daret-muted px-2 py-1 text-sm max-w-full"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} / page
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
            {t('common.previous')}
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || totalPages === 0}
            className="rounded border border-daret-border px-2 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

function kycStatusToLabelKey(s: string): string {
  const map: Record<string, string> = {
    NONE: 'notStarted',
    PENDING: 'pending',
    PENDING_SCORING: 'pendingScoring',
    UNDER_REVIEW: 'underReview',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  };
  return map[s] || 'notStarted';
}
