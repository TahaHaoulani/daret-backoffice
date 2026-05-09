import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSubmissionById,
  assignSubmission,
  markInReview,
  approveSubmission,
  rejectSubmission,
  getSignedUrl,
} from '../../../api/kyc';
import { fetchUserKycReview } from '../../users/api/usersApi';
import { useAuth } from '../../auth/AuthContext';
import { StatusChip } from '../../../components/StatusChip';
import { CountryDisplay } from '../../../components/CountryDisplay';
import { useI18n } from '../../../app/i18n/I18nContext';
import { formatFullNameLastUpper } from '../../../lib/userDisplay';
import { formatCurrency } from '../../kyc/utils/format';

const REJECT_REASONS = [
  'DOCUMENT_UNREADABLE',
  'MISMATCH_NAME_DOB',
  'PROOF_OF_ADDRESS_TOO_OLD',
  'SELFIE_MISMATCH',
  'SUSPECTED_FRAUD',
  'OTHER',
];

function hasIdDoc(mediaByType: Record<string, unknown[]>) {
  if (!mediaByType) return false;
  const hasFrontBack = (mediaByType['ID_FRONT']?.length ?? 0) > 0 && (mediaByType['ID_BACK']?.length ?? 0) > 0;
  const hasPassport = (mediaByType['PASSPORT']?.length ?? 0) > 0;
  return hasFrontBack || hasPassport;
}

interface SubmissionPreviewPanelProps {
  submissionId: string | null;
  onRefreshQueue?: () => void;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  ADMIN_DOC_VIEWED: 'granting.auditDocViewed',
};

export function SubmissionPreviewPanel({ submissionId, onRefreshQueue }: SubmissionPreviewPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectPreConfirmOpen, setRejectPreConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => fetchSubmissionById(submissionId!),
    enabled: !!submissionId,
  });

  const userId = data?.data?.user?.id;
  const { data: kycReviewRes } = useQuery({
    queryKey: ['admin-user-kyc-review', userId],
    queryFn: () => fetchUserKycReview(userId!),
    enabled: !!userId,
  });
  const kycReview = kycReviewRes?.data;

  const selfieAssetId = data?.data?.mediaByType?.['SELFIE']?.[0]?.id;
  const { data: signedUrlRes } = useQuery({
    queryKey: ['signed-url', selfieAssetId],
    queryFn: () => getSignedUrl(selfieAssetId!),
    enabled: !!selfieAssetId,
  });
  const selfieUrl = signedUrlRes?.data?.url;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
    queryClient.invalidateQueries({ queryKey: ['granting-submissions'] });
    onRefreshQueue?.();
  };

  const assignMu = useMutation({
    mutationFn: () => assignSubmission(submissionId!, user?.id),
    onSuccess: invalidate,
  });
  const markInReviewMu = useMutation({
    mutationFn: () => markInReview(submissionId!),
    onSuccess: invalidate,
  });
  const approveMu = useMutation({
    mutationFn: () => approveSubmission(submissionId!, approveNote),
    onSuccess: () => {
      invalidate();
      setApproveConfirmOpen(false);
      setApproveNote('');
    },
  });
  const rejectMu = useMutation({
    mutationFn: () => rejectSubmission(submissionId!, { reasons: rejectReasons, note: rejectNote }),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      setRejectPreConfirmOpen(false);
      setRejectReasons([]);
      setRejectNote('');
    },
  });

  const anyModalOpen = approveConfirmOpen || rejectPreConfirmOpen || rejectOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setApproveConfirmOpen(false);
      setRejectPreConfirmOpen(false);
      setRejectOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [anyModalOpen]);

  if (!submissionId) {
    return (
      <div className="bg-daret-card border border-daret-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[320px] text-daret-muted text-sm">
        <p>{t('granting.selectSubmissionToPreview')}</p>
      </div>
    );
  }

  if (isLoading || !data?.data) {
    return (
      <div className="bg-daret-card border border-daret-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[320px] text-daret-muted text-sm">
        <span className="inline-block h-4 w-32 rounded bg-daret-muted/20 animate-pulse" />
        <span className="mt-2">{t('common.loading')}</span>
      </div>
    );
  }

  const d = data.data;
  const submission = d.submission;
  const mediaByType = d.mediaByType ?? {};
  const canAct = submission && !['APPROVED', 'REJECTED'].includes(submission.status);
  const profile = d.user?.profile as { firstName?: string; lastName?: string; countryOfResidence?: string } | undefined;
  const joinedProfile = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : '';
  const fullName = joinedProfile
    ? formatFullNameLastUpper(joinedProfile)
    : (d.user?.email ?? '—');
  const lastEvents = (d.auditEvents ?? []).slice(0, 5);

  const phoneVerified = !!(d.user as { phoneVerification?: { verifiedAt?: string | null } } | undefined)?.phoneVerification?.verifiedAt;
  const docChecklist: { labelKey: string; ok: boolean }[] = [
    { labelKey: 'kyc.identityProvided', ok: !!(profile?.firstName || profile?.lastName || d.user?.email) },
    { labelKey: 'kyc.phoneVerified', ok: phoneVerified },
    { labelKey: 'kyc.idDocUploaded', ok: hasIdDoc(mediaByType) },
    { labelKey: 'kyc.proofOfAddress', ok: (mediaByType['PROOF_OF_ADDRESS']?.length ?? 0) > 0 },
    { labelKey: 'kyc.selfie', ok: (mediaByType['SELFIE']?.length ?? 0) > 0 },
    { labelKey: 'kyc.payslipOptional', ok: (mediaByType['PAYSLIP']?.length ?? 0) > 0 },
  ];

  return (
    <div className="bg-daret-card border border-daret-border rounded-xl p-4 flex flex-col gap-4 min-h-0 overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-daret-fg">{t('granting.quickPreview')}</h3>
        <Link
          to={`/kyc/submissions/${submissionId}`}
          className="text-xs text-daret-green hover:underline"
        >
          {t('granting.openFullCase')}
        </Link>
      </div>

      <div>
        <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-0.5">
          {t('granting.identity')}
        </p>
        <div className="flex gap-3 items-start">
          {selfieUrl && (
            <img
              src={selfieUrl}
              alt={t('kyc.selfie')}
              className="rounded-lg w-14 h-14 object-cover border border-daret-border flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-daret-fg">{fullName}</p>
            <p className="text-xs text-daret-muted">{d.user?.email ?? '—'}</p>
            <p className="text-xs text-daret-muted">
              <CountryDisplay code={profile?.countryOfResidence} className="text-daret-muted" />
            </p>
            <p className="mt-1">
              <StatusChip status={submission.status} type="submission" />
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
          {t('granting.docChecklist')}
        </p>
        <ul className="space-y-0.5 text-sm">
          {docChecklist.map(({ labelKey, ok }) => (
            <li key={labelKey} className="flex items-center gap-2">
              {ok ? <span className="text-daret-green">✔</span> : <span className="text-red-400">✖</span>}
              <span className={ok ? 'text-gray-300' : 'text-daret-muted'}>{t(labelKey)}</span>
            </li>
          ))}
        </ul>
      </div>

      {kycReview && (
        <div className="rounded-lg border border-daret-border bg-daret-dark/40 p-3 space-y-2 text-xs">
          <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90">
            {t('granting.kycSummaryTitle')}
          </p>
          <p className="text-gray-300">
            <span className="text-daret-muted">{t('granting.kycSummaryIdentity')}: </span>
            {kycReview.userSummary.fullName?.trim()
              ? formatFullNameLastUpper(kycReview.userSummary.fullName)
              : '—'}
          </p>
          <p className="text-gray-300">
            <span className="text-daret-muted">{t('granting.kycSummaryDocs')}: </span>
            {(kycReview.documents.items?.length ?? 0) + (kycReview.documents.selfie?.length ?? 0) > 0
              ? `${kycReview.documents.items.length} ID / doc · ${kycReview.documents.selfie.length} selfie`
              : '—'}
          </p>
          <p className="text-gray-300">
            <span className="text-daret-muted">{t('granting.kycSummaryLiveness')}: </span>
            {String((kycReview.liveness as { status?: string }).status ?? '—')}
            {(kycReview.liveness as { captures?: unknown[] }).captures?.length
              ? ` · ${(kycReview.liveness as { captures: unknown[] }).captures.length} capture(s)`
              : ''}
          </p>
          <p className="text-gray-300">
            <span className="text-daret-muted">{t('granting.kycSummaryFinancial')}: </span>
            {formatCurrency(kycReview.userSummary.monthlyIncome, kycReview.userSummary.currency)} /{' '}
            {formatCurrency(kycReview.userSummary.monthlyExpenses, kycReview.userSummary.currency)} →{' '}
            <span className={kycReview.userSummary.disposableIncome < 0 ? 'text-red-400' : 'text-daret-green'}>
              {formatCurrency(kycReview.userSummary.disposableIncome, kycReview.userSummary.currency)}
            </span>
          </p>
          <p className="text-gray-300">
            <span className="text-daret-muted">{t('granting.kycSummaryLoans')}: </span>
            {kycReview.activeLoans.length} · {formatCurrency(kycReview.userSummary.monthlyLoanPayments, kycReview.userSummary.currency)}
            /mo
          </p>
          {kycReview.riskSummary.flags.length > 0 && (
            <p className="text-amber-400/90">
              <span className="text-daret-muted">{t('granting.kycSummaryFlags')}: </span>
              {kycReview.riskSummary.flags.slice(0, 4).join(' · ')}
              {kycReview.riskSummary.flags.length > 4 ? '…' : ''}
            </p>
          )}
          {(kycReview.system as { latestSubmission?: { internalNotes?: string | null } })?.latestSubmission?.internalNotes ? (
            <p className="text-daret-muted line-clamp-3">
              <span className="uppercase text-[10px]">{t('granting.kycSummaryNotes')}: </span>
              {String((kycReview.system as { latestSubmission?: { internalNotes?: string | null } }).latestSubmission?.internalNotes)}
            </p>
          ) : null}
          <Link
            to={`/users/${userId}?tab=kycRisk`}
            className="inline-block text-daret-green hover:underline font-medium"
          >
            {t('granting.kycSummaryOpenUser')}
          </Link>
        </div>
      )}

      {lastEvents.length > 0 && (
        <div>
          <p className="text-[length:var(--ops-label-size)] font-medium uppercase tracking-wide text-daret-muted opacity-90 mb-1">
            {t('granting.lastActions')}
          </p>
          <ul className="space-y-0.5 text-xs text-daret-muted">
            {lastEvents.map((e) => (
              <li key={e.id}>
                {AUDIT_ACTION_LABELS[e.action] ? t(AUDIT_ACTION_LABELS[e.action]) : e.action} — {e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canAct && (
        <div className="mt-auto pt-2 border-t border-daret-border space-y-2">
          <button
            type="button"
            onClick={() => assignMu.mutate()}
            disabled={assignMu.isPending}
            className="w-full rounded-lg border border-daret-border hover:border-daret-green text-gray-300 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t('granting.assignToMe')}
          </button>
          <button
            type="button"
            onClick={() => markInReviewMu.mutate()}
            disabled={markInReviewMu.isPending}
            className="w-full rounded-lg border border-daret-border hover:border-daret-green text-gray-300 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t('granting.markInReview')}
          </button>
          <button
            type="button"
            onClick={() => {
              setRejectPreConfirmOpen(false);
              setRejectOpen(false);
              setApproveConfirmOpen(true);
            }}
            disabled={approveMu.isPending}
            className="w-full rounded-lg bg-daret-green hover:bg-daret-green-dim text-white py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {t('granting.approve')}
          </button>
          <button
            type="button"
            onClick={() => {
              setApproveConfirmOpen(false);
              setRejectPreConfirmOpen(true);
            }}
            className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white py-1.5 text-xs font-medium"
          >
            {t('granting.reject')}
          </button>
        </div>
      )}

      {approveConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-4 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-daret-fg mb-2">{t('granting.approveSubmission')}</h3>
            <p className="text-xs text-daret-muted mb-3">{t('granting.approveConfirmIntro')}</p>
            <input
              type="text"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder={t('granting.noteOptional')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approveMu.mutate()}
                disabled={approveMu.isPending}
                className="flex-1 rounded-lg bg-daret-green hover:bg-daret-green-dim text-white py-1.5 text-sm font-medium"
              >
                {t('granting.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                className="rounded-lg border border-daret-border text-gray-300 py-1.5 px-3 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectPreConfirmOpen && !rejectOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-4 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-daret-fg mb-2">{t('granting.rejectSubmission')}</h3>
            <p className="text-xs text-daret-muted mb-3">{t('granting.rejectPreConfirmIntro')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectPreConfirmOpen(false);
                  setRejectOpen(true);
                }}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-1.5 text-sm font-medium"
              >
                {t('granting.continueLabel')}
              </button>
              <button
                type="button"
                onClick={() => setRejectPreConfirmOpen(false)}
                className="rounded-lg border border-daret-border text-gray-300 py-1.5 px-3 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-4 max-w-md w-full max-h-[90vh] overflow-auto">
            <h3 className="text-sm font-semibold text-daret-fg mb-2">{t('granting.rejectSubmission')}</h3>
            <div className="space-y-1 mb-2">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(r)}
                    onChange={(e) =>
                      setRejectReasons((prev) =>
                        e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)
                      )
                    }
                  />
                  {r.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('granting.noteOptional')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-1.5 text-daret-fg text-sm min-h-[60px] mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => rejectMu.mutate()}
                disabled={rejectMu.isPending}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-1.5 text-sm font-medium"
              >
                {t('granting.reject')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReasons([]);
                  setRejectNote('');
                }}
                className="rounded-lg border border-daret-border text-gray-300 py-1.5 px-3 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
