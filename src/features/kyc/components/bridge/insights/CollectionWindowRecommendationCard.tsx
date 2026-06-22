import type { BridgeBankingInsights, InsightConfidence } from '../../../../../api/bridge';

type Props = {
  insights: BridgeBankingInsights;
  t: (key: string) => string;
};

const CONFIDENCE_STYLES: Record<InsightConfidence, string> = {
  HIGH: 'border-emerald-400 bg-emerald-50 text-emerald-950',
  MEDIUM: 'border-amber-400 bg-amber-50 text-amber-950',
  LOW: 'border-gray-300 bg-gray-100 text-gray-800',
};

export function CollectionWindowRecommendationCard({ insights, t }: Props) {
  const { recommendation } = insights;
  const confidenceKey =
    recommendation.confidence === 'HIGH'
      ? 'bridge.insights.confidenceHigh'
      : recommendation.confidence === 'MEDIUM'
        ? 'bridge.insights.confidenceMedium'
        : 'bridge.insights.confidenceLow';

  return (
    <section className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-sky-950 mb-3">
        {t('bridge.insights.collectionWindowTitle')}
      </h4>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {recommendation.label || t('bridge.insights.windowUnavailable')}
          </p>
          <p className="mt-1 text-sm text-gray-600">{t('bridge.insights.collectionWindowSubtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase ${CONFIDENCE_STYLES[recommendation.confidence]}`}
          >
            {t(confidenceKey)}
          </span>
          {recommendation.score > 0 && (
            <span className="text-sm font-semibold tabular-nums text-gray-700">
              {recommendation.score}/100
            </span>
          )}
        </div>
      </div>

      {recommendation.reasons.length > 0 && (
        <ul className="mb-3 space-y-1.5 text-sm text-gray-800">
          {recommendation.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {recommendation.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
          <ul className="space-y-1 text-sm text-amber-950">
            {recommendation.warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <span aria-hidden>⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
