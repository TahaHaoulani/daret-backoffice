import { useMemo, useState } from 'react';
import type { BridgeBankingInsights } from '../../../../../api/bridge';
import { formatCurrency, formatDate } from '../../../utils/bridgeFormat';

type Props = {
  insights: BridgeBankingInsights;
  t: (key: string) => string;
};

const CHART_W = 640;
const CHART_H = 200;
const PAD = { top: 12, right: 12, bottom: 36, left: 48 };

export function CashflowChart({ insights, t }: Props) {
  const { flowSeries, currency, flowGranularity } = insights;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    if (flowSeries.length === 0) return 1;
    return Math.max(...flowSeries.flatMap((f) => [f.inflows, f.outflows]), 1);
  }, [flowSeries]);

  if (flowSeries.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
        {t('bridge.insights.noFlowSeries')}
      </p>
    );
  }

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const barGroupW = innerW / flowSeries.length;
  const barW = Math.min(18, barGroupW * 0.35);

  const granularityLabel =
    flowGranularity === 'weekly'
      ? t('bridge.insights.granularityWeekly')
      : flowGranularity === 'monthly'
        ? t('bridge.insights.granularityMonthly')
        : t('bridge.insights.granularityDaily');

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{granularityLabel}</p>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[320px] h-auto" role="img" aria-label={t('bridge.insights.cashflowChartAria')}>
          <line x1={PAD.left} y1={PAD.top + innerH} x2={CHART_W - PAD.right} y2={PAD.top + innerH} stroke="#d1d5db" />
          {flowSeries.map((f, i) => {
            const cx = PAD.left + i * barGroupW + barGroupW / 2;
            const inH = (f.inflows / maxVal) * innerH;
            const outH = (f.outflows / maxVal) * innerH;
            const baseY = PAD.top + innerH;
            return (
              <g key={f.date} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
                <rect
                  x={cx - barW - 2}
                  y={baseY - inH}
                  width={barW}
                  height={inH}
                  rx={2}
                  fill="#059669"
                  opacity={hoverIdx === i ? 1 : 0.85}
                />
                <rect
                  x={cx + 2}
                  y={baseY - outH}
                  width={barW}
                  height={outH}
                  rx={2}
                  fill="#dc2626"
                  opacity={hoverIdx === i ? 1 : 0.85}
                />
              </g>
            );
          })}
        </svg>
        {hoverIdx != null && flowSeries[hoverIdx] && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-gray-900">{formatDate(flowSeries[hoverIdx].date)}</p>
            <p className="text-emerald-800">
              {t('bridge.insights.inflowsLegend')}: {formatCurrency(flowSeries[hoverIdx].inflows, currency)}
            </p>
            <p className="text-red-800">
              {t('bridge.insights.outflowsLegend')}: {formatCurrency(flowSeries[hoverIdx].outflows, currency)}
            </p>
            <p className="text-gray-700">
              {t('bridge.netMovement')}: {formatCurrency(flowSeries[hoverIdx].net, currency)}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
          {t('bridge.insights.inflowsLegend')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-600" />
          {t('bridge.insights.outflowsLegend')}
        </span>
      </div>
    </div>
  );
}
