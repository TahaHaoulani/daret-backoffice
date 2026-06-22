import type { BridgeVerificationAccount } from '../../../../api/bridge';
import type { BridgeGrantingRecommendationStatus, BridgeGrantingSummary } from '../../../../api/bridge';

export type GrantingTheme = {
  accentBorder: string;
  statusBadge: string;
  noteBorder: string;
  noteBg: string;
  panelDot: string;
  scoreBar: string;
};

export const GRANTING_THEME: Record<BridgeGrantingRecommendationStatus, GrantingTheme> = {
  FAVORABLE: {
    accentBorder: 'border-l-emerald-500',
    statusBadge: 'border border-emerald-200 bg-emerald-50/80 text-emerald-800',
    noteBorder: 'border-l-emerald-400',
    noteBg: 'bg-slate-50/80',
    panelDot: 'bg-emerald-500',
    scoreBar: 'bg-emerald-500',
  },
  REVIEW_NEEDED: {
    accentBorder: 'border-l-sky-500',
    statusBadge: 'border border-sky-200 bg-sky-50/80 text-sky-800',
    noteBorder: 'border-l-sky-400',
    noteBg: 'bg-slate-50/80',
    panelDot: 'bg-sky-500',
    scoreBar: 'bg-sky-500',
  },
  HIGH_ATTENTION: {
    accentBorder: 'border-l-amber-500',
    statusBadge: 'border border-amber-200 bg-amber-50/70 text-amber-900',
    noteBorder: 'border-l-amber-400',
    noteBg: 'bg-amber-50/40',
    panelDot: 'bg-amber-500',
    scoreBar: 'bg-amber-500',
  },
  INSUFFICIENT_DATA: {
    accentBorder: 'border-l-slate-400',
    statusBadge: 'border border-slate-200 bg-slate-50 text-slate-600',
    noteBorder: 'border-l-slate-400',
    noteBg: 'bg-slate-50/80',
    panelDot: 'bg-slate-400',
    scoreBar: 'bg-slate-400',
  },
};

export function scoreBarColor(value: number, status: BridgeGrantingRecommendationStatus): string {
  if (status === 'FAVORABLE') return 'bg-emerald-500';
  if (status === 'INSUFFICIENT_DATA') return 'bg-slate-400';
  if (value < 35) return 'bg-amber-500';
  if (value < 65) return 'bg-sky-500';
  return 'bg-emerald-500';
}

export function severityDotClass(severity: string): string {
  if (severity === 'HIGH') return 'bg-rose-500';
  if (severity === 'MEDIUM') return 'bg-amber-500';
  return 'bg-slate-400';
}

export function severityLabelKey(severity: string): string {
  if (severity === 'HIGH') return 'bridge.granting.severityHigh';
  if (severity === 'MEDIUM') return 'bridge.granting.severityMedium';
  return 'bridge.granting.severityLow';
}

export type GrantingSummaryViewProps = {
  data: BridgeGrantingSummary;
  t: (key: string) => string;
  accounts?: BridgeVerificationAccount[];
  onOpenBalanceAnalysis?: () => void;
  onOpenSpendingAnalysis?: () => void;
};
