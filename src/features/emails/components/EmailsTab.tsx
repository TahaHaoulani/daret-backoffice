import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getApplicationEmails,
  getCustomerEmails,
  type EmailDeliveryStatus,
  type EmailListItem,
  type EmailType,
} from '../../../api/emails';
import { EmailStatusBadge } from './EmailStatusBadge';
import { EmailTypeBadge } from './EmailTypeBadge';
import { EmailPreviewModal } from './EmailPreviewModal';
import { formatDateTime } from '../../kyc/utils/format';

type Props = {
  mode: 'application' | 'customer';
  applicationId?: string;
  customerId?: string;
  t: (key: string) => string;
};

const ALL_STATUSES: EmailDeliveryStatus[] = [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'OPENED',
  'CLICKED',
  'FAILED',
  'BOUNCED',
  'UNKNOWN',
];

const ALL_TYPES: EmailType[] = [
  'BRIDGE_VERIFICATION_REQUEST',
  'KYC_INFORMATION_REQUEST',
  'APPLICATION_STATUS',
  'PAYMENT_REMINDER',
  'PAYMENT_CONFIRMATION',
  'INVITATION',
  'ONBOARDING',
  'GENERAL_NOTIFICATION',
  'SYSTEM',
];

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={i} className="border-b border-slate-100">
          {[0, 1, 2, 3, 4, 5, 6].map((c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmailsTab({ mode, applicationId, customerId, t }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EmailDeliveryStatus | ''>('');
  const [emailType, setEmailType] = useState<EmailType | ''>('');
  const [previewEmail, setPreviewEmail] = useState<EmailListItem | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      emailType: emailType || undefined,
    }),
    [search, status, emailType],
  );

  const queryKey = mode === 'application'
    ? ['application-emails', applicationId, filters]
    : ['customer-emails', customerId, filters];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => {
      if (mode === 'application' && applicationId) {
        return getApplicationEmails(applicationId, filters);
      }
      if (mode === 'customer' && customerId) {
        return getCustomerEmails(customerId, filters);
      }
      return Promise.resolve({ success: true, data: [] as EmailListItem[] });
    },
    enabled: (mode === 'application' && !!applicationId) || (mode === 'customer' && !!customerId),
  });

  const rows = data?.data ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('emails.search')}
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('emails.searchPlaceholder')}
                className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('emails.filterStatus')}
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmailDeliveryStatus | '')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t('emails.allStatuses')}</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`emails.status.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('emails.filterType')}
              </span>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value as EmailType | '')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">{t('emails.allTypes')}</option>
                {ALL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`emails.type.${type}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {isError && (
        <div className="border-b border-slate-200 px-5 py-8 text-center">
          <p className="text-sm text-red-700">{t('emails.loadError')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('emails.retry')}
          </button>
        </div>
      )}

      {!isError && !isLoading && rows.length === 0 && (
        <div className="px-5 py-12 text-center">
          <p className="text-base font-medium text-slate-900">{t('emails.emptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-500">{t('emails.emptyDescription')}</p>
        </div>
      )}

      {(isLoading || rows.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t('emails.colSentAt')}</th>
                <th className="px-4 py-3">{t('emails.colSubject')}</th>
                <th className="px-4 py-3">{t('emails.colType')}</th>
                <th className="px-4 py-3">{t('emails.colRecipient')}</th>
                <th className="px-4 py-3">{t('emails.colStatus')}</th>
                <th className="px-4 py-3">{t('emails.colSentBy')}</th>
                <th className="px-4 py-3 text-right">{t('emails.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(row.sentAt ?? undefined) || '—'}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-900" title={row.subject}>
                      {row.subject}
                    </td>
                    <td className="px-4 py-3">
                      <EmailTypeBadge emailType={row.emailType} t={t} />
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-700" title={row.recipientEmail}>
                      {row.recipientEmail}
                    </td>
                    <td className="px-4 py-3">
                      <EmailStatusBadge status={row.status} t={t} />
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-slate-600" title={row.sentBy}>
                      {row.sentBy}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setPreviewEmail(row)}
                        title={t('emails.previewTooltip')}
                        aria-label={t('emails.previewTooltip')}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-400">{t('emails.refreshing')}</p>
      )}

      <EmailPreviewModal
        email={previewEmail}
        open={!!previewEmail}
        onClose={() => setPreviewEmail(null)}
        t={t}
      />
    </div>
  );
}
