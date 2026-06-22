import type { EmailType } from '../../../api/emails';

type Props = {
  emailType: EmailType | null;
  t: (key: string) => string;
  className?: string;
};

export function EmailTypeBadge({ emailType, t, className = '' }: Props) {
  const key = emailType ? `emails.type.${emailType}` : 'emails.type.UNKNOWN';
  return (
    <span
      className={`inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ${className}`}
    >
      {t(key)}
    </span>
  );
}
