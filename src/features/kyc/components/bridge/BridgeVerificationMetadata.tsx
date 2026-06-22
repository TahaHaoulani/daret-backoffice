import { formatDateTime } from '../../utils/bridgeFormat';
import { BRIDGE } from '../../utils/bridgeUiHelpers';

type MetaItem = {
  icon: 'user' | 'mail' | 'link' | 'database' | 'calendar';
  label: string;
  value: string | null | undefined;
  format?: 'text' | 'datetime';
};

function MetaIcon({ kind }: { kind: MetaItem['icon'] }) {
  const cls = 'h-4 w-4 shrink-0 text-sky-700';
  switch (kind) {
    case 'user':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'link':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'database':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
  }
}

type Props = {
  items: MetaItem[];
};

export function BridgeVerificationMetadata({ items }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className={`flex items-start gap-3 ${BRIDGE.metaCard}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
            <MetaIcon kind={item.icon} />
          </div>
          <div className="min-w-0">
            <p className={BRIDGE.metaLabel}>{item.label}</p>
            <p className={`${BRIDGE.metaValue} truncate`} title={item.value || undefined}>
              {item.value
                ? item.format === 'datetime'
                  ? formatDateTime(item.value)
                  : item.value
                : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildMetadataItems(
  summary: {
    requestedBy: string | null;
    requestedAt: string | null;
    emailSentAt?: string | null;
    connectedAt: string | null;
    dataRetrievedAt: string | null;
  },
  t: (key: string) => string,
): MetaItem[] {
  return [
    { icon: 'user', label: t('bridge.requestedBy'), value: summary.requestedBy, format: 'text' },
    { icon: 'calendar', label: t('bridge.requestedAt'), value: summary.requestedAt, format: 'datetime' },
    { icon: 'mail', label: t('bridge.emailSentAt'), value: summary.emailSentAt, format: 'datetime' },
    { icon: 'link', label: t('bridge.connectedAt'), value: summary.connectedAt, format: 'datetime' },
    { icon: 'database', label: t('bridge.dataRetrievedAt'), value: summary.dataRetrievedAt, format: 'datetime' },
  ];
}
