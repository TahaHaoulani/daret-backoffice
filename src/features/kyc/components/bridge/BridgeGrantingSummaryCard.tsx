import { useQuery } from '@tanstack/react-query';
import {
  fetchBridgeGrantingSummary,
  fetchBridgeGrantingSummaryByUser,
  type BridgeVerificationAccount,
} from '../../../../api/bridge';
import { BRIDGE } from '../../utils/bridgeUiHelpers';
import { GrantingSummaryView } from './granting/GrantingSummaryView';

type Props = {
  t: (key: string) => string;
  enabled?: boolean;
  accounts?: BridgeVerificationAccount[];
  onOpenBalanceAnalysis?: () => void;
  onOpenSpendingAnalysis?: () => void;
} & (
  | { submissionId: string; userId?: never }
  | { userId: string; submissionId?: never }
);

function SkeletonCard({ t }: { t: (key: string) => string }) {
  return (
    <div className={`${BRIDGE.card} border-slate-200 px-5 py-4 animate-pulse`}>
      <div className="flex justify-between gap-4 mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-52 rounded bg-slate-100" />
          <div className="h-3 w-72 max-w-full rounded bg-slate-50" />
        </div>
        <div className="h-16 w-36 rounded-lg bg-slate-50" />
      </div>
      <div className="h-14 rounded-md bg-slate-50 mb-4 max-w-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 rounded-lg bg-slate-50" />
        <div className="h-28 rounded-lg bg-slate-50" />
        <div className="h-28 rounded-lg bg-slate-50" />
      </div>
      <p className="sr-only">{t('common.loading')}</p>
    </div>
  );
}

export function BridgeGrantingSummaryCard(props: Props) {
  const {
    t,
    enabled = true,
    accounts = [],
    onOpenBalanceAnalysis,
    onOpenSpendingAnalysis,
  } = props;
  const submissionId = 'submissionId' in props ? props.submissionId : undefined;
  const userId = 'userId' in props ? props.userId : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: submissionId
      ? (['bridge-granting', 'submission', submissionId] as const)
      : (['bridge-granting', 'user', userId!] as const),
    queryFn: () =>
      submissionId
        ? fetchBridgeGrantingSummary(submissionId)
        : fetchBridgeGrantingSummaryByUser(userId!),
    enabled: enabled && !!(submissionId || userId),
  });

  if (!enabled) return null;

  if (isLoading) return <SkeletonCard t={t} />;

  if (isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
        <p className="text-sm text-slate-700 mb-3">{t('bridge.granting.loadError')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('bridge.retry')}
        </button>
      </div>
    );
  }

  const summary = data?.data;
  if (!summary) return null;

  return (
    <GrantingSummaryView
      data={summary}
      t={t}
      accounts={accounts}
      onOpenBalanceAnalysis={onOpenBalanceAnalysis}
      onOpenSpendingAnalysis={onOpenSpendingAnalysis}
    />
  );
}
