import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompactTable, type CompactTableColumn } from '../../../components/CompactTable';
import { useI18n } from '../../../app/i18n/I18nContext';
import { formatCurrency, formatDate, formatDateTime } from '../../kyc/utils/format';
import { formatFullNameLastUpper } from '../../../lib/userDisplay';

export type RecoveryStatus =
  | 'TO_REMIND'
  | 'LINK_SENT'
  | 'SEPA_PENDING'
  | 'PROMISE_TO_PAY'
  | 'RESOLVED'
  | 'FAILED';

export type RecoveryRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecoveryPaymentMethod = 'SEPA' | 'CARD' | 'BANK_TRANSFER';

export type RecoveryCase = {
  id: string;
  userName: string;
  email: string;
  phone: string;
  circleName: string;
  missedDueDate: string;
  amount: number;
  currency: 'MAD';
  daysLate: number;
  paymentMethod: RecoveryPaymentMethod;
  status: RecoveryStatus;
  riskLevel: RecoveryRisk;
  lastActionAt?: string;
  lastActionKey?: string;
  notes?: string;
};

const INITIAL_MOCK: RecoveryCase[] = [
  {
    id: '1',
    userName: 'Amine El Fassi',
    email: 'amine@email.com',
    phone: '+212 612 345 678',
    circleName: 'Cercle Famille Casa',
    missedDueDate: '2026-05-06',
    amount: 1500,
    currency: 'MAD',
    daysLate: 3,
    paymentMethod: 'SEPA',
    status: 'TO_REMIND',
    riskLevel: 'MEDIUM',
    lastActionAt: '2026-05-07T14:22:00.000Z',
    lastActionKey: 'recouvrement.lastActionReminder',
  },
  {
    id: '2',
    userName: 'Sara Benali',
    email: 'sara@email.com',
    phone: '+212 661 223 344',
    circleName: 'Cercle Ramadan 2026',
    missedDueDate: '2026-05-01',
    amount: 2000,
    currency: 'MAD',
    daysLate: 8,
    paymentMethod: 'CARD',
    status: 'LINK_SENT',
    riskLevel: 'HIGH',
    lastActionAt: '2026-05-08T09:15:00.000Z',
    lastActionKey: 'recouvrement.lastActionCardLink',
  },
  {
    id: '3',
    userName: 'Youssef Alaoui',
    email: 'youssef@email.com',
    phone: '+212 670 998 877',
    circleName: 'Cercle Entrepreneurs',
    missedDueDate: '2026-05-08',
    amount: 1000,
    currency: 'MAD',
    daysLate: 1,
    paymentMethod: 'SEPA',
    status: 'SEPA_PENDING',
    riskLevel: 'LOW',
    lastActionAt: '2026-05-08T16:40:00.000Z',
    lastActionKey: 'recouvrement.lastActionSepaRetry',
  },
  {
    id: '4',
    userName: 'Nadia Kabbaj',
    email: 'nadia@email.com',
    phone: '+212 655 778 899',
    circleName: 'Cercle Immo',
    missedDueDate: '2026-04-24',
    amount: 3500,
    currency: 'MAD',
    daysLate: 15,
    paymentMethod: 'BANK_TRANSFER',
    status: 'FAILED',
    riskLevel: 'HIGH',
    lastActionAt: '2026-05-02T11:05:00.000Z',
    lastActionKey: 'recouvrement.lastActionCall',
  },
  {
    id: '5',
    userName: 'Karim Tazi',
    email: 'karim.tazi@email.com',
    phone: '+212 6 44 55 66 77',
    circleName: 'Cercle Salaires',
    missedDueDate: '2026-05-03',
    amount: 950,
    currency: 'MAD',
    daysLate: 6,
    paymentMethod: 'SEPA',
    status: 'PROMISE_TO_PAY',
    riskLevel: 'MEDIUM',
    lastActionAt: '2026-05-05T08:30:00.000Z',
    lastActionKey: 'recouvrement.lastActionCall',
  },
  {
    id: '6',
    userName: 'Leila Idrissi',
    email: 'leila.idrissi@email.com',
    phone: '+212 6 88 99 00 11',
    circleName: 'Cercle Famille Casa',
    missedDueDate: '2026-04-30',
    amount: 1500,
    currency: 'MAD',
    daysLate: 9,
    paymentMethod: 'CARD',
    status: 'TO_REMIND',
    riskLevel: 'HIGH',
    lastActionAt: '2026-05-01T12:00:00.000Z',
    lastActionKey: 'recouvrement.lastActionReminder',
  },
];

function statusLabelKey(s: RecoveryStatus): string {
  const m: Record<RecoveryStatus, string> = {
    TO_REMIND: 'recouvrement.statusToRemind',
    LINK_SENT: 'recouvrement.statusLinkSent',
    SEPA_PENDING: 'recouvrement.statusSepaPending',
    PROMISE_TO_PAY: 'recouvrement.statusPromiseToPay',
    RESOLVED: 'recouvrement.statusResolved',
    FAILED: 'recouvrement.statusFailed',
  };
  return m[s];
}

function riskLabelKey(r: RecoveryRisk): string {
  const m: Record<RecoveryRisk, string> = {
    LOW: 'recouvrement.riskLow',
    MEDIUM: 'recouvrement.riskMedium',
    HIGH: 'recouvrement.riskHigh',
  };
  return m[r];
}

function methodLabelKey(m: RecoveryPaymentMethod): string {
  const map: Record<RecoveryPaymentMethod, string> = {
    SEPA: 'recouvrement.methodSepa',
    CARD: 'recouvrement.methodCard',
    BANK_TRANSFER: 'recouvrement.methodTransfer',
  };
  return map[m];
}

function statusBadgeClass(s: RecoveryStatus): string {
  if (s === 'RESOLVED') return 'bg-daret-green/15 text-daret-green border border-daret-green/25';
  if (s === 'FAILED') return 'bg-red-500/12 text-red-400 border border-red-500/25';
  if (s === 'LINK_SENT' || s === 'PROMISE_TO_PAY') return 'bg-amber-500/12 text-amber-400 border border-amber-500/25';
  if (s === 'SEPA_PENDING') return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
  return 'bg-daret-border/40 text-daret-muted border border-daret-border';
}

function riskBadgeClass(r: RecoveryRisk): string {
  if (r === 'HIGH') return 'bg-red-500/12 text-red-400 border border-red-500/20';
  if (r === 'MEDIUM') return 'bg-amber-500/12 text-amber-400 border border-amber-500/20';
  return 'bg-daret-border/30 text-daret-muted border border-daret-border';
}

const KPI_LATE = 24;
const KPI_TOTAL_MAD = 18450;
const KPI_USERS = 19;
const KPI_PENDING_ACTIONS = 7;

export function RecouvrementPage() {
  const { t } = useI18n();
  const [cases, setCases] = useState<RecoveryCase[]>(() => INITIAL_MOCK.map((c) => ({ ...c, notes: c.notes ?? '' })));
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [minDaysLate, setMinDaysLate] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [drawerCaseId, setDrawerCaseId] = useState<string | null>(null);
  const [drawerNotes, setDrawerNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const drawerCase = useMemo(() => cases.find((c) => c.id === drawerCaseId) ?? null, [cases, drawerCaseId]);

  useEffect(() => {
    if (drawerCase) setDrawerNotes(drawerCase.notes ?? '');
  }, [drawerCaseId, drawerCase]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const minDays = minDaysLate.trim() ? parseInt(minDaysLate, 10) : NaN;
    const fromTs = dueFrom ? new Date(dueFrom).setHours(0, 0, 0, 0) : null;
    const toTs = dueTo ? new Date(dueTo).setHours(23, 59, 59, 999) : null;

    return cases.filter((c) => {
      if (needle) {
        const blob = `${c.userName} ${c.email} ${c.phone}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      if (statusFilter && c.status !== statusFilter) return false;
      if (riskFilter && c.riskLevel !== riskFilter) return false;
      if (methodFilter && c.paymentMethod !== methodFilter) return false;
      if (fromTs != null && new Date(c.missedDueDate).getTime() < fromTs) return false;
      if (toTs != null && new Date(c.missedDueDate).getTime() > toTs) return false;
      if (!Number.isNaN(minDays) && c.daysLate < minDays) return false;
      return true;
    });
  }, [cases, q, statusFilter, riskFilter, methodFilter, dueFrom, dueTo, minDaysLate]);

  const updateCase = useCallback((id: string, patch: Partial<RecoveryCase>) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, lastActionAt: patch.lastActionAt ?? now } : c)),
    );
  }, []);

  const openDrawer = useCallback((id: string) => setDrawerCaseId(id), []);
  const closeDrawer = useCallback(() => setDrawerCaseId(null), []);

  useEffect(() => {
    if (!drawerCaseId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerCaseId, closeDrawer]);

  const persistDrawerNotes = useCallback(() => {
    if (!drawerCaseId) return;
    setCases((prev) => prev.map((c) => (c.id === drawerCaseId ? { ...c, notes: drawerNotes } : c)));
  }, [drawerCaseId, drawerNotes]);

  const resetFilters = useCallback(() => {
    setQ('');
    setStatusFilter('');
    setRiskFilter('');
    setMethodFilter('');
    setDueFrom('');
    setDueTo('');
    setMinDaysLate('');
    setShowMoreFilters(false);
  }, []);

  const applySearch = useCallback(() => {
    /* filters are live via useMemo; button affirms UX parity with SAV */
  }, []);

  const columns: CompactTableColumn<RecoveryCase>[] = useMemo(
    () => [
      {
        key: 'user',
        label: t('recouvrement.colUser'),
        className: 'min-w-[9rem]',
        render: (row) => (
          <span className="font-medium text-daret-fg">{formatFullNameLastUpper(row.userName)}</span>
        ),
      },
      {
        key: 'contact',
        label: t('recouvrement.colContact'),
        className: 'min-w-[11rem]',
        render: (row) => (
          <div className="text-xs leading-snug">
            <div className="text-daret-muted">{row.email}</div>
            <div className="text-daret-muted">{row.phone}</div>
          </div>
        ),
      },
      {
        key: 'circle',
        label: t('recouvrement.colCircle'),
        className: 'min-w-[8rem]',
        render: (row) => <span className="text-daret-fg text-sm">{row.circleName}</span>,
      },
      {
        key: 'due',
        label: t('recouvrement.colMissedDue'),
        className: 'whitespace-nowrap',
        render: (row) => <span className="text-sm text-daret-muted">{formatDate(row.missedDueDate)}</span>,
      },
      {
        key: 'amount',
        label: t('recouvrement.colAmount'),
        className: 'whitespace-nowrap',
        render: (row) => <span className="text-sm font-medium text-daret-fg">{formatCurrency(row.amount, row.currency)}</span>,
      },
      {
        key: 'days',
        label: t('recouvrement.colDaysLate'),
        className: 'w-24',
        render: (row) => (
          <span className={row.daysLate >= 10 ? 'text-red-400 font-medium' : row.daysLate >= 5 ? 'text-amber-400' : 'text-daret-muted'}>
            {row.daysLate}
          </span>
        ),
      },
      {
        key: 'method',
        label: t('recouvrement.colMethod'),
        className: 'min-w-[6rem]',
        render: (row) => <span className="text-xs text-daret-muted">{t(methodLabelKey(row.paymentMethod))}</span>,
      },
      {
        key: 'status',
        label: t('recouvrement.colStatus'),
        className: 'min-w-[7rem]',
        render: (row) => (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(row.status)}`}>
            {t(statusLabelKey(row.status))}
          </span>
        ),
      },
      {
        key: 'risk',
        label: t('recouvrement.colRisk'),
        className: 'w-20',
        render: (row) => (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskBadgeClass(row.riskLevel)}`}>
            {t(riskLabelKey(row.riskLevel))}
          </span>
        ),
      },
      {
        key: 'last',
        label: t('recouvrement.colLastAction'),
        className: 'min-w-[8rem]',
        render: (row) => (
          <div className="text-[11px] text-daret-muted leading-snug">
            {row.lastActionKey ? <div>{t(row.lastActionKey)}</div> : <span>—</span>}
            {row.lastActionAt ? <div className="text-[10px] opacity-80 mt-0.5">{formatDateTime(row.lastActionAt)}</div> : null}
          </div>
        ),
      },
      {
        key: 'actions',
        label: t('recouvrement.colActions'),
        className: 'min-w-[12rem] align-top',
        render: (row) => (
          <div className="flex flex-wrap gap-1" data-stop-row-click onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="rounded-md border border-daret-border bg-daret-dark/40 px-2 py-0.5 text-[11px] font-medium text-daret-muted hover:border-daret-green/40 hover:text-daret-fg"
              onClick={() => {
                updateCase(row.id, { lastActionKey: 'recouvrement.lastActionReminder' });
                showToast(t('recouvrement.toastRemind'));
              }}
            >
              {t('recouvrement.actionRemind')}
            </button>
            <button
              type="button"
              className="rounded-md border border-daret-border bg-daret-dark/40 px-2 py-0.5 text-[11px] font-medium text-daret-muted hover:border-daret-green/40 hover:text-daret-fg"
              onClick={() => {
                updateCase(row.id, { lastActionKey: 'recouvrement.lastActionSepaRetry', status: 'SEPA_PENDING' });
                showToast(t('recouvrement.toastRetrySepa'));
              }}
            >
              {t('recouvrement.actionRetrySepa')}
            </button>
            <button
              type="button"
              className="rounded-md border border-daret-border bg-daret-dark/40 px-2 py-0.5 text-[11px] font-medium text-daret-muted hover:border-daret-green/40 hover:text-daret-fg"
              onClick={() => {
                updateCase(row.id, { lastActionKey: 'recouvrement.lastActionCardLink', status: 'LINK_SENT' });
                showToast(t('recouvrement.toastCardLink'));
              }}
            >
              {t('recouvrement.actionSendCardLink')}
            </button>
            <button
              type="button"
              className="rounded-md border border-daret-border bg-daret-dark/40 px-2 py-0.5 text-[11px] font-medium text-daret-muted hover:border-daret-green/40 hover:text-daret-fg"
              onClick={() => {
                updateCase(row.id, { status: 'RESOLVED', lastActionKey: 'recouvrement.lastActionResolved' });
                showToast(t('recouvrement.toastResolved'));
              }}
            >
              {t('recouvrement.actionMarkResolved')}
            </button>
            <button
              type="button"
              className="rounded-md border border-daret-green/35 bg-daret-green/10 px-2 py-0.5 text-[11px] font-medium text-daret-green hover:bg-daret-green/20"
              onClick={() => openDrawer(row.id)}
            >
              {t('recouvrement.actionViewDetails')}
            </button>
          </div>
        ),
      },
    ],
    [t, showToast, updateCase, openDrawer],
  );

  return (
    <div className="w-full min-w-0 max-w-none">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[length:var(--ops-heading-size)] font-semibold text-daret-fg">{t('recouvrement.title')}</h1>
          <span
            className="inline-flex shrink-0 items-center rounded-full border border-daret-green/35 bg-daret-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-daret-green"
            title={t('recouvrement.betaBadgeAria')}
            aria-label={t('recouvrement.betaBadgeAria')}
          >
            {t('recouvrement.betaBadge')}
          </span>
        </div>
        <p className="mt-1 text-sm text-daret-muted max-w-2xl">{t('recouvrement.subtitle')}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
        {[
          { label: t('recouvrement.kpiLatePayments'), value: String(KPI_LATE) },
          { label: t('recouvrement.kpiTotalToRecover'), value: formatCurrency(KPI_TOTAL_MAD, 'MAD') },
          { label: t('recouvrement.kpiUsersAffected'), value: String(KPI_USERS) },
          { label: t('recouvrement.kpiPendingActions'), value: String(KPI_PENDING_ACTIONS) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-daret-border bg-daret-card px-4 py-3 shadow-sm"
          >
            <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90">{kpi.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-daret-fg">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-daret-border bg-daret-card p-4 sm:p-5 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-0 flex-1 lg:max-w-md">
            <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
              {t('recouvrement.freeSearch')}
            </label>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('recouvrement.searchPlaceholder')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg placeholder:text-daret-muted/70"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
              {t('recouvrement.filterStatus')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg"
            >
              <option value="">{t('recouvrement.statusAll')}</option>
              <option value="TO_REMIND">{t('recouvrement.statusToRemind')}</option>
              <option value="LINK_SENT">{t('recouvrement.statusLinkSent')}</option>
              <option value="SEPA_PENDING">{t('recouvrement.statusSepaPending')}</option>
              <option value="PROMISE_TO_PAY">{t('recouvrement.statusPromiseToPay')}</option>
              <option value="RESOLVED">{t('recouvrement.statusResolved')}</option>
              <option value="FAILED">{t('recouvrement.statusFailed')}</option>
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
              {t('recouvrement.filterRisk')}
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg"
            >
              <option value="">{t('recouvrement.riskAll')}</option>
              <option value="LOW">{t('recouvrement.riskLow')}</option>
              <option value="MEDIUM">{t('recouvrement.riskMedium')}</option>
              <option value="HIGH">{t('recouvrement.riskHigh')}</option>
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
              {t('recouvrement.filterPaymentMethod')}
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg"
            >
              <option value="">{t('recouvrement.methodAll')}</option>
              <option value="SEPA">{t('recouvrement.methodSepa')}</option>
              <option value="CARD">{t('recouvrement.methodCard')}</option>
              <option value="BANK_TRANSFER">{t('recouvrement.methodTransfer')}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                {t('recouvrement.dueFrom')}
              </label>
              <input
                type="date"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
                className="rounded-lg bg-daret-dark border border-daret-border px-2 py-2 text-sm text-daret-fg"
              />
            </div>
            <div>
              <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                {t('recouvrement.dueTo')}
              </label>
              <input
                type="date"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
                className="rounded-lg bg-daret-dark border border-daret-border px-2 py-2 text-sm text-daret-fg"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:ml-auto">
            <button
              type="button"
              onClick={applySearch}
              className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium"
            >
              {t('recouvrement.search')}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-daret-border text-daret-muted hover:bg-daret-border/15 px-4 py-2 text-sm font-medium"
            >
              {t('recouvrement.reset')}
            </button>
            <button
              type="button"
              onClick={() => setShowMoreFilters((v) => !v)}
              className="rounded-lg border border-daret-border text-daret-muted hover:bg-daret-border/15 px-4 py-2 text-sm font-medium"
            >
              {t('recouvrement.moreFilters')}
            </button>
          </div>
        </div>
        {showMoreFilters && (
          <div className="mt-4 pt-4 border-t border-daret-border">
            <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
              {t('recouvrement.minDaysLate')}
            </label>
            <input
              type="number"
              min={0}
              value={minDaysLate}
              onChange={(e) => setMinDaysLate(e.target.value)}
              placeholder="0"
              className="w-full max-w-[12rem] rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg"
            />
          </div>
        )}
      </section>

      <div className="overflow-x-auto -mx-1 px-1">
        <CompactTable<RecoveryCase>
          columns={columns}
          rows={filtered}
          keyExtractor={(r) => r.id}
          emptyMessage={t('recouvrement.emptyFiltered')}
          skeletonRows={0}
        />
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-lg border border-daret-border bg-daret-card px-4 py-2.5 text-sm text-daret-fg shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}

      {drawerCase && (
        <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('recouvrement.drawerClose')}
            onClick={() => {
              persistDrawerNotes();
              closeDrawer();
            }}
          />
          <div className="relative flex h-full w-full max-w-md flex-col border-l border-daret-border bg-daret-card shadow-xl">
            <div className="flex items-center justify-between border-b border-daret-border px-4 py-3">
              <h2 className="text-base font-semibold text-daret-fg">{t('recouvrement.drawerTitle')}</h2>
              <button
                type="button"
                onClick={() => {
                  persistDrawerNotes();
                  closeDrawer();
                }}
                className="rounded-lg px-2 py-1 text-sm text-daret-muted hover:bg-daret-border/20 hover:text-daret-fg"
              >
                {t('recouvrement.drawerClose')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
              <div>
                <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                  {t('recouvrement.drawerIdentity')}
                </p>
                <p className="font-medium text-daret-fg">{formatFullNameLastUpper(drawerCase.userName)}</p>
                <p className="text-daret-muted text-xs mt-1">{drawerCase.email}</p>
                <p className="text-daret-muted text-xs">{drawerCase.phone}</p>
              </div>
              <div>
                <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                  {t('recouvrement.drawerCircle')}
                </p>
                <p className="text-daret-fg">{drawerCase.circleName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                    {t('recouvrement.drawerAmount')}
                  </p>
                  <p className="font-semibold text-daret-fg">{formatCurrency(drawerCase.amount, drawerCase.currency)}</p>
                </div>
                <div>
                  <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                    {t('recouvrement.drawerDue')}
                  </p>
                  <p className="text-daret-fg">{formatDate(drawerCase.missedDueDate)}</p>
                </div>
                <div>
                  <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                    {t('recouvrement.drawerDaysLate')}
                  </p>
                  <p className="text-daret-fg">{drawerCase.daysLate}</p>
                </div>
                <div>
                  <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                    {t('recouvrement.drawerStatus')}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(drawerCase.status)}`}>
                    {t(statusLabelKey(drawerCase.status))}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                  {t('recouvrement.drawerPreferredMethod')}
                </p>
                <p className="text-daret-fg">{t(methodLabelKey(drawerCase.paymentMethod))}</p>
              </div>
              <div>
                <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-2">
                  {t('recouvrement.drawerTimeline')}
                </p>
                <ul className="space-y-2 border-l border-daret-border pl-3">
                  {(
                    [
                      'recouvrement.timelinePaymentFailed',
                      'recouvrement.timelineReminderSent',
                      'recouvrement.timelineCardLinkGenerated',
                      'recouvrement.timelineManualFollowUp',
                    ] as const
                  ).map((key) => (
                    <li key={key} className="text-xs text-daret-muted relative">
                      <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-daret-border" aria-hidden />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
                  {t('recouvrement.drawerNotes')}
                </label>
                <textarea
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  onBlur={persistDrawerNotes}
                  placeholder={t('recouvrement.drawerNotesPlaceholder')}
                  className="w-full min-h-[100px] rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-sm text-daret-fg placeholder:text-daret-muted/70"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
