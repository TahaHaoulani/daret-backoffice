import { getDonutColor, topCategoriesWithOther } from '../../../utils/transactionCategoryLabels';

type Slice = { label: string; amount: number; share: number; colorIndex: number };

type Props = {
  categories: Array<{ category: string; label: string; amount: number; share: number }>;
  t: (key: string) => string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

export function ExpenseDonutChart({ categories, t }: Props) {
  const slices: Slice[] = topCategoriesWithOther(categories);
  if (slices.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
        {t('bridge.spending.noExpenseData')}
      </p>
    );
  }

  const cx = 100;
  const cy = 100;
  const r = 72;
  let angle = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0" role="img" aria-label={t('bridge.spending.expenseDonutAria')}>
        {slices.map((slice) => {
          const sweep = (slice.share / 100) * 360;
          const path = describeArc(cx, cy, r, angle, angle + sweep);
          angle += sweep;
          return (
            <path
              key={slice.label}
              d={path}
              fill={getDonutColor(slice.colorIndex)}
              stroke="#fff"
              strokeWidth={1.5}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={42} fill="#fff" />
      </svg>
      <ul className="min-w-[180px] flex-1 space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getDonutColor(slice.colorIndex) }}
              />
              <span className="truncate text-gray-800">{slice.label}</span>
            </span>
            <span className="tabular-nums font-semibold text-gray-900 shrink-0">{slice.share.toFixed(1)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
