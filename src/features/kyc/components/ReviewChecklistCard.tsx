import { useI18n } from '../../../app/i18n/I18nContext';

interface ReviewChecklistCardProps {
  /** Submission detail data shape: user with profile, phoneVerification, mediaByType */
  data: {
    user?: {
      email?: string | null;
      profile?: { firstName?: string | null; lastName?: string | null } | null;
      phoneVerification?: { verifiedAt?: string | null } | null;
    } | null;
    mediaByType?: Record<string, unknown[]>;
  };
}

function hasIdDoc(mediaByType: Record<string, unknown[]>) {
  if (!mediaByType) return false;
  const hasFrontBack = (mediaByType['ID_FRONT']?.length ?? 0) > 0 && (mediaByType['ID_BACK']?.length ?? 0) > 0;
  const hasPassport = (mediaByType['PASSPORT']?.length ?? 0) > 0;
  return hasFrontBack || hasPassport;
}

function IconReviewChecklist() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

export function ReviewChecklistCard({ data }: ReviewChecklistCardProps) {
  const { t } = useI18n();
  const profile = data.user?.profile as { firstName?: string; lastName?: string } | undefined;
  const mediaByType = data.mediaByType ?? {};
  const phoneVerified = !!data.user?.phoneVerification?.verifiedAt;

  const items: { labelKey: string; ok: boolean }[] = [
    { labelKey: 'kyc.identityProvided', ok: !!(profile?.firstName || profile?.lastName || data.user?.email) },
    { labelKey: 'kyc.phoneVerified', ok: phoneVerified },
    { labelKey: 'kyc.idDocUploaded', ok: hasIdDoc(mediaByType) },
    { labelKey: 'kyc.proofOfAddress', ok: (mediaByType['PROOF_OF_ADDRESS']?.length ?? 0) > 0 },
    { labelKey: 'kyc.selfie', ok: (mediaByType['SELFIE']?.length ?? 0) > 0 },
    { labelKey: 'kyc.payslipOptional', ok: (mediaByType['PAYSLIP']?.length ?? 0) > 0 },
  ];

  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-4">
      <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-daret-fg">
        <span className="inline-flex text-daret-green" aria-hidden>
          <IconReviewChecklist />
        </span>
        {t('kyc.reviewChecklist')}
      </h3>
      <ul className="space-y-2">
        {items.map(({ labelKey, ok }) => (
          <li key={labelKey} className="flex items-center gap-2 text-sm">
            {ok ? (
              <span className="text-daret-green" aria-hidden>✔</span>
            ) : (
              <span className="text-red-400" aria-hidden>✖</span>
            )}
            <span className="text-daret-muted">{t(labelKey)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
