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

export function ReviewChecklistCard({ data }: ReviewChecklistCardProps) {
  const profile = data.user?.profile as { firstName?: string; lastName?: string } | undefined;
  const mediaByType = data.mediaByType ?? {};
  const phoneVerified = !!data.user?.phoneVerification?.verifiedAt;

  const items: { label: string; ok: boolean }[] = [
    { label: 'Identity provided', ok: !!(profile?.firstName || profile?.lastName || data.user?.email) },
    { label: 'Phone verified', ok: phoneVerified },
    { label: 'ID doc uploaded', ok: hasIdDoc(mediaByType) },
    { label: 'Proof of address', ok: (mediaByType['PROOF_OF_ADDRESS']?.length ?? 0) > 0 },
    { label: 'Selfie', ok: (mediaByType['SELFIE']?.length ?? 0) > 0 },
    { label: 'Payslip (optional)', ok: (mediaByType['PAYSLIP']?.length ?? 0) > 0 },
  ];

  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-daret-fg mb-3">Review checklist</h3>
      <ul className="space-y-2">
        {items.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            {ok ? (
              <span className="text-daret-green" aria-hidden>✔</span>
            ) : (
              <span className="text-red-400" aria-hidden>✖</span>
            )}
            <span className={ok ? 'text-daret-muted' : 'text-daret-muted'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
