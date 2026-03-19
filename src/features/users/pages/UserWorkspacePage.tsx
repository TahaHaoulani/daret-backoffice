import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchUserById, fetchUserKyc, fetchUserCircles, fetchUserPayments } from '../api/usersApi';
import { getSignedUrl } from '../../../api/kyc';
import { StatusChip } from '../../../components/StatusChip';
import { KeyValueGrid } from '../../../components/KeyValueGrid';
import { CopyableValue } from '../../kyc/components/CopyableValue';
import { formatDate, formatDateTime, mapEmploymentStatus, formatCurrency } from '../../kyc/utils/format';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { useI18n } from '../../../app/i18n/I18nContext';
import { useReferenceDataVersion } from '../../../app/referenceData/ReferenceDataContext';

type TabId = 'overview' | 'kyc' | 'documents' | 'circles' | 'payments' | 'notes' | 'timeline';

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: 'overview', key: 'users.overview' },
  { id: 'kyc', key: 'users.kycTab' },
  { id: 'documents', key: 'users.documentsTab' },
  { id: 'circles', key: 'users.circles' },
  { id: 'payments', key: 'users.payments' },
  { id: 'notes', key: 'users.notes' },
  { id: 'timeline', key: 'users.timeline' },
];

export function UserWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  useReferenceDataVersion(); // Re-render when ref data (e.g. employment_status) is loaded for current locale
  const [tab, setTab] = useState<TabId>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [docModalUrl, setDocModalUrl] = useState<string | null>(null);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchUserById(id!),
    enabled: !!id,
  });

  const { data: kycData } = useQuery({
    queryKey: ['admin-user-kyc', id],
    queryFn: () => fetchUserKyc(id!),
    enabled: !!id && (tab === 'kyc' || tab === 'documents' || tab === 'timeline'),
  });

  const { data: circlesData } = useQuery({
    queryKey: ['admin-user-circles', id],
    queryFn: () => fetchUserCircles(id!),
    enabled: !!id && tab === 'circles',
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['admin-user-payments', id],
    queryFn: () => fetchUserPayments(id!),
    enabled: !!id && tab === 'payments',
  });

  const d = userData?.data;
  const kyc = d?.kyc;
  const profile = d?.profile as { firstName?: string; lastName?: string; civility?: string | null; countryOfResidence?: string; countryOfBirth?: string; birthDate?: string } | null;
  const kycProfile = d?.kycProfile as {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationalityCountryCode?: string;
    residenceCountryCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
  } | null;
  const riskProfile = d?.riskProfile as { employmentStatus?: string; monthlyIncome?: number; monthlyExpenses?: number; currency?: string } | null;
  const phone = d?.phoneVerification;

  if (!id) {
    navigate('/users');
    return null;
  }
  if (userLoading || !d) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-daret-muted">{t('common.loading')}</div>
      </div>
    );
  }

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    [kycProfile?.firstName, kycProfile?.lastName].filter(Boolean).join(' ') ||
    d.user?.email ||
    '—';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="text-sm text-daret-muted hover:text-daret-green"
        >
          ← {t('users.backToResults')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-daret-fg">{fullName}</h1>
        <StatusChip status={d.user.kycStatus} type="kyc" />
        {kyc?.latestSubmissionId && (
          <Link
            to={`/kyc/submissions/${kyc.latestSubmissionId}`}
            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium"
          >
            {t('users.openKycSubmission')}
          </Link>
        )}
      </div>

      <div className="flex border-b border-daret-border mb-6">
        {TAB_KEYS.map(({ id: tabId, key }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === tabId ? 'border-daret-green text-daret-green' : 'border-transparent text-daret-muted hover:text-daret-fg'
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-daret-card border border-daret-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">{t('users.identityAndContact')}</h3>
              <KeyValueGrid
                rows={[
                  { label: t('users.civility'), value: profile?.civility ?? '—' },
                  { label: t('users.fullName'), value: fullName },
                  { label: t('users.email'), value: <CopyableValue value={d.user.email ?? ''} onCopy={() => setToast(t('common.copied'))} /> },
                  {
                    label: t('users.phone'),
                    value: phone ? (
                      <CopyableValue value={phone.phoneE164} onCopy={() => setToast(t('common.copied'))} />
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: t('users.phoneVerified'),
                    value: phone?.verifiedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-daret-green/20 text-daret-green px-2.5 py-1 text-xs font-medium">
                        ✓ {t('users.yes')}
                      </span>
                    ) : (
                      '—'
                    ),
                  },
                  { label: t('users.dateOfBirth'), value: formatDate(profile?.birthDate ?? kycProfile?.dateOfBirth) },
                  {
                    label: t('users.nationality'),
                    value: <CountryDisplay code={kycProfile?.nationalityCountryCode} />,
                  },
                  {
                    label: t('users.countryOfResidence'),
                    value: <CountryDisplay code={profile?.countryOfResidence ?? kycProfile?.residenceCountryCode} />,
                  },
                  { label: t('users.kycStatus'), value: <StatusChip status={d.user.kycStatus} type="kyc" /> },
                ]}
                columns={1}
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-daret-card border border-daret-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">{t('users.address')}</h3>
              <KeyValueGrid
                rows={[
                  { label: t('users.addressLine1'), value: kycProfile?.addressLine1 ?? '—' },
                  { label: t('users.addressLine2'), value: kycProfile?.addressLine2 ?? '—' },
                  { label: t('users.city'), value: kycProfile?.city ?? '—' },
                  { label: t('users.postalCode'), value: kycProfile?.postalCode ?? '—' },
                  {
                    label: t('users.country'),
                    value: <CountryDisplay code={kycProfile?.residenceCountryCode ?? profile?.countryOfResidence} />,
                  },
                ]}
                columns={1}
              />
            </div>
            <div className="bg-daret-card border border-daret-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide mb-4">{t('users.financialProfile')}</h3>
              <KeyValueGrid
                rows={[
                  { label: t('users.employment'), value: mapEmploymentStatus(riskProfile?.employmentStatus, locale) },
                  { label: t('users.monthlyIncome'), value: formatCurrency(riskProfile?.monthlyIncome, riskProfile?.currency) },
                  { label: t('users.monthlyExpenses'), value: formatCurrency(riskProfile?.monthlyExpenses, riskProfile?.currency) },
                  { label: t('users.currency'), value: riskProfile?.currency ?? '—' },
                ]}
                columns={1}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <UserDocumentsTab
          mediaByType={kycData?.data?.mediaByType}
          isLoading={kycData === undefined}
          onViewDoc={async (assetId) => {
            const res = await getSignedUrl(assetId);
            if (res.success && res.data?.url) setDocModalUrl(res.data.url);
          }}
          t={t}
        />
      )}

      {tab === 'kyc' && (
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg mb-4">{t('users.kycSubmissions')}</h3>
          {kycData?.data?.submissions?.length ? (
            <ul className="space-y-3">
              {kycData.data.submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-daret-border p-3"
                >
                  <div>
                    <span className="text-daret-fg font-medium">{s.status}</span>
                    <span className="text-daret-muted text-sm ml-2">
                      {t('users.submitted')} {s.submittedAt ? formatDateTime(s.submittedAt) : '—'}
                    </span>
                  </div>
                  <Link
                    to={`/kyc/submissions/${s.id}`}
                    className="text-daret-green hover:underline text-sm"
                  >
                    {t('users.openSubmission')}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-daret-muted text-sm">{t('users.noKycSubmissions')}</p>
          )}
        </div>
      )}

      {tab === 'circles' && (
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg mb-4">{t('users.circles')}</h3>
          {circlesData?.data?.circles?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-daret-muted text-left border-b border-daret-border">
                  <th className="py-2 pr-4">{t('users.circleName')}</th>
                  <th className="py-2 pr-4">{t('users.role')}</th>
                  <th className="py-2 pr-4">{t('users.status')}</th>
                  <th className="py-2 pr-4">{t('users.amount')}</th>
                  <th className="py-2">{t('users.created')}</th>
                </tr>
              </thead>
              <tbody>
                {circlesData.data.circles.map((c) => (
                  <tr key={c.circleId} className="border-b border-daret-border/50">
                    <td className="py-2 pr-4 text-daret-fg">{c.name}</td>
                    <td className="py-2 pr-4 text-daret-muted">{c.role}</td>
                    <td className="py-2 pr-4 text-daret-muted">{c.status}</td>
                    <td className="py-2 pr-4 text-daret-muted">
                      {c.amount} {c.currency}
                    </td>
                    <td className="py-2 text-daret-muted">{c.createdAt ? formatDate(c.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-daret-muted text-sm">{t('users.noCircles')}</p>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg mb-4">{t('users.payments')}</h3>
          {paymentsData?.data?.payments?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-daret-muted text-left border-b border-daret-border">
                  <th className="py-2 pr-4">{t('users.circle')}</th>
                  <th className="py-2 pr-4">{t('users.amount')}</th>
                  <th className="py-2 pr-4">{t('users.dueDate')}</th>
                  <th className="py-2">{t('users.status')}</th>
                </tr>
              </thead>
              <tbody>
                {(paymentsData.data.payments as Array<{ circleName: string; amount: number; currency: string; dueDate?: string; status: string }>).map((p, i) => (
                  <tr key={i} className="border-b border-daret-border/50">
                    <td className="py-2 pr-4 text-daret-fg">{p.circleName}</td>
                    <td className="py-2 pr-4 text-daret-muted">{p.amount} {p.currency}</td>
                    <td className="py-2 pr-4 text-daret-muted">{p.dueDate ?? '—'}</td>
                    <td className="py-2 text-daret-muted">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-daret-muted text-sm">{t('users.noPayments')}</p>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <p className="text-daret-muted text-sm">{t('users.notesHint')}</p>
          {kycData?.data?.submissions?.some((s) => s.comments?.length) ? (
            <ul className="mt-4 space-y-2">
              {kycData.data.submissions.flatMap((s) =>
                (s.comments ?? []).map((c) => (
                  <li key={c.id} className="rounded bg-daret-dark p-3 text-sm">
                    <p className="text-daret-muted">{c.comment}</p>
                    <p className="text-daret-muted text-xs mt-1">{c.reviewerEmail} · {c.createdAt ? formatDateTime(c.createdAt) : ''}</p>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="bg-daret-card border border-daret-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-daret-fg mb-4">{t('users.timelineTitle')}</h3>
          {kycData?.data?.auditEvents?.length ? (
            <ul className="space-y-2">
              {kycData.data.auditEvents.map((e) => (
                <li key={e.id} className="text-sm border-l-2 border-daret-border pl-3 py-1">
                  <span className="text-daret-green font-medium">{e.action}</span>
                  <span className="text-daret-muted ml-2">{e.createdAt ? formatDateTime(e.createdAt) : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-daret-muted text-sm">{t('users.noEvents')}</p>
          )}
        </div>
      )}

      {docModalUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setDocModalUrl(null)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-daret-card rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setDocModalUrl(null)}
                className="text-daret-muted hover:text-daret-fg"
              >
                {t('common.close')}
              </button>
            </div>
            <iframe src={docModalUrl} title="Document" className="w-full h-[80vh] rounded border border-daret-border" />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-lg bg-daret-card border border-daret-border px-4 py-2 text-sm text-daret-fg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

const DOC_TYPE_KEYS: Record<string, string> = {
  SELFIE: 'users.docTypeSelfie',
  ID_FRONT: 'users.docTypeIdFront',
  ID_BACK: 'users.docTypeIdBack',
  PASSPORT: 'users.docTypePassport',
  PROOF_OF_ADDRESS: 'users.docTypeProofOfAddress',
  PAYSLIP: 'users.docTypePayslip',
};

function docTypeLabel(type: string, t: (key: string) => string): string {
  return DOC_TYPE_KEYS[type] ? t(DOC_TYPE_KEYS[type]) : type;
}

type MediaAsset = { id: string; type: string; submissionId: string; status: string; createdAt: string | undefined };

function UserDocumentsTab({
  mediaByType,
  isLoading,
  onViewDoc,
  t,
}: {
  mediaByType: Record<string, MediaAsset[]> | undefined;
  isLoading: boolean;
  onViewDoc: (assetId: string) => void | Promise<void>;
  t: (key: string) => string;
}) {
  const firstSelfieId = mediaByType?.['SELFIE']?.[0]?.id;
  const { data: signedRes } = useQuery({
    queryKey: ['signed-url', firstSelfieId],
    queryFn: () => getSignedUrl(firstSelfieId!),
    enabled: !!firstSelfieId,
  });
  const selfiePreviewUrl = signedRes?.data?.url;

  if (isLoading) {
    return (
      <div className="bg-daret-card border border-daret-border rounded-xl p-5">
        <div className="text-daret-muted text-sm">{t('common.loading')}</div>
      </div>
    );
  }
  const media = mediaByType ?? {};
  const selfieAssets = media['SELFIE'] ?? [];
  const otherTypes = Object.keys(media).filter((k) => k !== 'SELFIE');
  const hasAny = selfieAssets.length > 0 || otherTypes.some((typ) => (media[typ]?.length ?? 0) > 0);

  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-5 space-y-6">
      <h3 className="text-sm font-semibold text-daret-fg uppercase tracking-wide">{t('users.photosAndDocuments')}</h3>
      {!hasAny ? (
        <p className="text-daret-muted text-sm">{t('users.noDocuments')}</p>
      ) : (
        <>
          {selfieAssets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-daret-muted uppercase tracking-wide mb-3">{t('users.selfie')}</h4>
              <div className="flex flex-wrap gap-4 items-start">
                {selfiePreviewUrl && (
                  <div className="rounded-lg border border-daret-border overflow-hidden shrink-0">
                    <img
                      src={selfiePreviewUrl}
                      alt={t('users.selfie')}
                      className="w-32 h-32 object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {selfieAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-lg border border-daret-border p-3 flex items-center justify-between gap-4 min-w-[200px]"
                    >
                      <span className="text-sm text-daret-fg">{docTypeLabel(asset.type, t)}</span>
                      <button
                        type="button"
                        onClick={() => onViewDoc(asset.id)}
                        className="text-sm text-daret-green hover:underline shrink-0"
                      >
                        {t('users.viewDocument')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {otherTypes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-daret-muted uppercase tracking-wide mb-3">{t('users.documents')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherTypes.flatMap((type) =>
                  (media[type] ?? []).map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-lg border border-daret-border p-3 flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-daret-fg truncate">{docTypeLabel(type, t)}</span>
                      <button
                        type="button"
                        onClick={() => onViewDoc(asset.id)}
                        className="text-sm text-daret-green hover:underline shrink-0"
                      >
                        {t('users.viewDocument')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
