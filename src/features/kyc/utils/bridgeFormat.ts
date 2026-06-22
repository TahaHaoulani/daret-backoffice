const FR_LOCALE = 'fr-FR';

export function formatCurrency(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat(FR_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(FR_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedAmount(amount: number, currency: string | null = 'EUR'): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat(FR_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  const sign = amount >= 0 ? '+' : '−';
  const cur = currency || 'EUR';
  return `${sign}${formatted}\u00a0${cur}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(FR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(FR_LOCALE);
}

export function formatTransactionPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return '—';
  if (start && end) return `${start} → ${end}`;
  return start || end || '—';
}

export function displayMaskedIban(ibanMasked: string | null, ibanLast4: string | null): string {
  if (ibanMasked) return ibanMasked;
  if (ibanLast4) return `•••• ${ibanLast4}`;
  return '—';
}

/** Alias for displayMaskedIban */
export const maskIban = displayMaskedIban;

export function netMovement(inflows: number, outflows: number): number {
  return Math.round((inflows - outflows) * 100) / 100;
}
