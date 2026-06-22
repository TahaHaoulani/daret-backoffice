import { useQuery } from '@tanstack/react-query';
import { getEmailPreview, type EmailListItem } from '../../../api/emails';
import { EmailStatusBadge } from './EmailStatusBadge';
import { EmailTypeBadge } from './EmailTypeBadge';
import { formatDateTime } from '../../kyc/utils/format';

type Props = {
  email: EmailListItem | null;
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
};

export function EmailPreviewModal({ email, open, onClose, t }: Props) {
  const emailId = email?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['email-preview', emailId],
    queryFn: () => getEmailPreview(emailId!),
    enabled: open && !!emailId,
  });

  if (!open || !email) return null;

  const preview = data?.data;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-preview-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 id="email-preview-title" className="text-lg font-semibold text-slate-900">
            {t('emails.previewTitle')}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('emails.colSubject')}</p>
                <p className="text-sm font-semibold text-slate-900">{preview?.subject ?? email.subject}</p>
              </div>
              <EmailStatusBadge status={preview?.status ?? email.status} t={t} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('emails.colRecipient')}</p>
                <p className="text-sm text-slate-800">{preview?.recipientEmail ?? email.recipientEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('emails.colSentAt')}</p>
                <p className="text-sm text-slate-800">
                  {formatDateTime(preview?.sentAt ?? email.sentAt ?? undefined) || '—'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <EmailTypeBadge emailType={preview?.emailType ?? email.emailType} t={t} />
              <span className="text-xs text-slate-500">
                {t('emails.sentBy')}: {preview?.sentBy ?? email.sentBy}
              </span>
            </div>
          </div>

          {isLoading && (
            <div className="animate-pulse space-y-3 rounded-lg border border-slate-200 bg-white p-6">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-32 w-full rounded bg-slate-100" />
            </div>
          )}

          {isError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t('emails.previewError')}
            </p>
          )}

          {!isLoading && !isError && preview && (
            <div className="rounded-lg border border-slate-200 bg-slate-100/60 p-4">
              {preview.previewHtml ? (
                <div
                  className="mx-auto max-w-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm [&_a]:pointer-events-none [&_a]:cursor-default [&_a]:text-sky-700 [&_img]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: preview.previewHtml }}
                />
              ) : preview.previewText ? (
                <pre className="mx-auto max-w-[720px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-6 font-sans text-sm leading-relaxed text-slate-800">
                  {preview.previewText}
                </pre>
              ) : (
                <p className="text-center text-sm text-slate-500">{t('emails.noPreview')}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('emails.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
