import { useMemo, useState } from 'react';
import type { BridgeBankingInsights } from '../../../../../api/bridge';
import { formatCurrency, formatDate } from '../../../utils/bridgeFormat';

type Props = {
  insights: BridgeBankingInsights;
  t: (key: string) => string;
};

const CHART_W = 640;
const CHART_H = 220;
const PAD = { top: 16, right: 16, bottom: 32, left: 56 };

function buildPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

export function BalanceEvolutionChart({ insights, t }: Props) {
  const [mode, setMode] = useState<'consolidated' | 'perAccount'>('consolidated');
  const { balanceSeries, accountBalanceSeries, currency, isBalanceReconstructed } = insights;

  const chartData = useMemo(() => {
    if (mode === 'consolidated') {
      return [{ id: 'consolidated', name: t('bridge.insights.consolidated'), points: balanceSeries.map((p) => ({ date: p.date, value: p.consolidatedBalance })) }];
    }
    return accountBalanceSeries.map((a) => ({
      id: a.accountId,
      name: a.accountName,
      points: a.points.map((p) => ({ date: p.date, value: p.balance })),
    }));
  }, [mode, balanceSeries, accountBalanceSeries, t]);

  const allPoints = useMemo(() => chartData.flatMap((s) => s.points), [chartData]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (allPoints.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
        {t('bridge.insights.noBalanceSeries')}
      </p>
    );
  }

  const values = allPoints.map((d) => d.value);
  const dates = [...new Set(allPoints.map((d) => d.date))].sort();
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const LINE_COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777'];

  const seriesPaths = chartData.map((series, si) => {
    const points = dates.map((date, i) => {
      const pt = series.points.find((p) => p.date === date);
      const value = pt?.value ?? (series.points.filter((p) => p.date <= date).pop()?.value ?? minV);
      return {
        date,
        value,
        x: PAD.left + (i / Math.max(dates.length - 1, 1)) * innerW,
        y: PAD.top + innerH - ((value - minV) / span) * innerH,
      };
    });
    return { series, points, color: LINE_COLORS[si % LINE_COLORS.length] };
  });

  const yTicks = [minV, minV + span / 2, maxV];
  const hoverPoint = hoverIdx != null ? seriesPaths[0]?.points[hoverIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('consolidated')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              mode === 'consolidated'
                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {t('bridge.insights.consolidated')}
          </button>
          {accountBalanceSeries.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('perAccount')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                mode === 'perAccount'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {t('bridge.insights.perAccount')}
            </button>
          )}
        </div>
        {isBalanceReconstructed && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-950"
            title={t('bridge.insights.reconstructedTooltip')}
          >
            {t('bridge.insights.estimatedBalance')}
          </span>
        )}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full min-w-[320px] h-auto" role="img" aria-label={t('bridge.insights.balanceChartAria')}>
          {yTicks.map((tick) => {
            const y = PAD.top + innerH - ((tick - minV) / span) * innerH;
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-gray-500 text-[9px]">
                  {formatCurrency(tick, currency).replace(/\s/g, '\u00a0')}
                </text>
              </g>
            );
          })}
          {seriesPaths.map(({ points, color, series }) => (
            <path
              key={series.id}
              d={buildPath(points)}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              opacity={mode === 'perAccount' ? 0.9 : 1}
            />
          ))}
          {seriesPaths[0]?.points.map((p, i) => (
            <circle
              key={p.date}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5 : 0}
              fill="#0284c7"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
          {dates.length > 0 && seriesPaths[0] && (
            <text x={seriesPaths[0].points[0].x} y={CHART_H - 8} className="fill-gray-500 text-[9px]">
              {formatDate(dates[0])}
            </text>
          )}
          {dates.length > 1 && seriesPaths[0] && (
            <text
              x={seriesPaths[0].points[seriesPaths[0].points.length - 1].x}
              y={CHART_H - 8}
              textAnchor="end"
              className="fill-gray-500 text-[9px]"
            >
              {formatDate(dates[dates.length - 1])}
            </text>
          )}
        </svg>
        {hoverPoint && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md max-w-xs">
            <p className="font-semibold text-gray-900">{formatDate(hoverPoint.date)}</p>
            {seriesPaths.map(({ series, points, color }) => {
              const pt = points.find((p) => p.date === hoverPoint.date);
              if (!pt) return null;
              return (
                <p key={series.id} style={{ color }} className="tabular-nums">
                  {series.name}: {formatCurrency(pt.value, currency)}
                </p>
              );
            })}
          </div>
        )}
      </div>
      {mode === 'perAccount' && seriesPaths.length > 1 && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {seriesPaths.map(({ series, color }) => (
            <span key={series.id} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ backgroundColor: color }} />
              {series.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
