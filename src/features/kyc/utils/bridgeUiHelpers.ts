import type { BridgeIbanMatchResult, BridgeVerificationStatus } from '../../../api/bridge';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

/** High-contrast badge styles on light surfaces — readable in both data-theme modes. */
export const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'border-emerald-400 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-400 bg-amber-50 text-amber-950',
  info: 'border-sky-400 bg-sky-50 text-sky-950',
  danger: 'border-red-400 bg-red-50 text-red-950',
  neutral: 'border-gray-300 bg-gray-100 text-gray-800',
};

export type KpiAccent = 'neutral' | 'blue' | 'green' | 'red';

export const KPI_ACCENT_STYLES: Record<
  KpiAccent,
  { shell: string; label: string; value: string }
> = {
  neutral: {
    shell: 'border-gray-200 bg-white border-l-4 border-l-gray-400',
    label: 'text-gray-600',
    value: 'text-gray-900',
  },
  blue: {
    shell: 'border-gray-200 bg-white border-l-4 border-l-sky-600',
    label: 'text-gray-600',
    value: 'text-sky-950',
  },
  green: {
    shell: 'border-gray-200 bg-white border-l-4 border-l-emerald-600',
    label: 'text-gray-600',
    value: 'text-emerald-950',
  },
  red: {
    shell: 'border-gray-200 bg-white border-l-4 border-l-red-600',
    label: 'text-gray-600',
    value: 'text-red-950',
  },
};

/** Shared Bridge module text/surface tokens (data-theme safe). */
export const BRIDGE = {
  card: 'rounded-xl border border-gray-200 bg-white shadow-sm',
  cardHeader: 'border-b border-gray-200 bg-gray-50 px-5 py-4',
  title: 'text-base font-semibold text-gray-900',
  subtitle: 'text-sm text-gray-600',
  sectionLabel: 'text-xs font-semibold uppercase tracking-wider text-gray-600',
  metaCard: 'rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm',
  metaLabel: 'text-[10px] font-semibold uppercase tracking-wider text-gray-500',
  metaValue: 'text-sm font-medium text-gray-900',
  accountRow: 'rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden',
  accountHover: 'hover:bg-gray-50',
  detailPanel: 'border-t border-gray-200 bg-gray-50 px-4 py-4',
} as const;

export const STATUS_LABEL_KEYS: Record<BridgeVerificationStatus, string> = {
  NOT_SENT: 'bridge.statusNotSent',
  EMAIL_SENT: 'bridge.statusEmailSent',
  PENDING_CONNECTION: 'bridge.statusPending',
  CONNECTED: 'bridge.statusConnected',
  DATA_RETRIEVED: 'bridge.statusDataRetrieved',
  FAILED: 'bridge.statusFailed',
  EXPIRED: 'bridge.statusExpired',
  CANCELLED: 'bridge.statusCancelled',
};

export function getBridgeStatusVariant(status: BridgeVerificationStatus): BadgeVariant {
  switch (status) {
    case 'DATA_RETRIEVED':
    case 'CONNECTED':
      return 'success';
    case 'EMAIL_SENT':
    case 'PENDING_CONNECTION':
      return 'info';
    case 'FAILED':
      return 'danger';
    case 'EXPIRED':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getIbanMatchVariant(result: BridgeIbanMatchResult | null): BadgeVariant {
  if (result === 'MATCH') return 'success';
  if (result === 'MISMATCH') return 'danger';
  return 'warning';
}

export type AccountIconKind = 'checking' | 'card' | 'savings' | 'default';

export function getAccountIconKind(accountType: string | null): AccountIconKind {
  const t = (accountType || '').toLowerCase();
  if (t.includes('card') || t.includes('credit')) return 'card';
  if (t.includes('saving') || t.includes('livret')) return 'savings';
  if (t.includes('check') || t.includes('current') || t.includes('courant')) return 'checking';
  return 'default';
}

export function accountLabel(
  account: {
    accountName: string | null;
    bankName: string | null;
    ibanMasked: string | null;
    ibanLast4: string | null;
  },
  fallback: string,
): string {
  if (account.accountName) return account.accountName;
  if (account.bankName) return account.bankName;
  if (account.ibanMasked) return account.ibanMasked;
  if (account.ibanLast4) return `•••• ${account.ibanLast4}`;
  return fallback;
}

export function formatAccountTypeLabel(accountType: string | null): string | null {
  if (!accountType) return null;
  return accountType.replace(/_/g, ' ');
}

/** Hide accounts with no transaction history or negligible balance (|balance| < 1). */
export const BRIDGE_INACTIVE_BALANCE_THRESHOLD = 1;

export function isInactiveBridgeAccount(account: {
  transactionCount: number;
  balanceAmount: number | null;
}): boolean {
  if (account.transactionCount === 0) return true;
  if (
    account.balanceAmount != null &&
    Math.abs(account.balanceAmount) < BRIDGE_INACTIVE_BALANCE_THRESHOLD
  ) {
    return true;
  }
  return false;
}

export function filterActiveBridgeAccounts<T extends { transactionCount: number; balanceAmount: number | null }>(
  accounts: T[],
  hideInactive: boolean,
): T[] {
  if (!hideInactive) return accounts;
  return accounts.filter((a) => !isInactiveBridgeAccount(a));
}

export type BridgeAccountTypeFilter = 'all' | 'bank' | 'card';

export function filterBridgeAccountsByType<T extends { accountType: string | null }>(
  accounts: T[],
  typeFilter: BridgeAccountTypeFilter,
): T[] {
  if (typeFilter === 'all') return accounts;
  return accounts.filter((a) => {
    const kind = getAccountIconKind(a.accountType);
    if (typeFilter === 'card') return kind === 'card';
    return kind !== 'card';
  });
}
