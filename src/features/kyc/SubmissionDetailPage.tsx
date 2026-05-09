import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSubmissionById,
  assignSubmission,
  markInReview,
  approveSubmission,
  rejectSubmission,
  addComment,
  getSignedUrl,
} from '../../api/kyc';
import { rescoreSubmission } from '../../api/scoring';
import { useAuth } from '../auth/AuthContext';
import { mapToDisplayUser } from './types/displayUser';
import { UserProfileCards, RiskSignalsPanel, computeRiskSignals } from './components/UserProfileCards';
import { RawDataAccordion } from './components/RawDataAccordion';
import { ReviewChecklistCard } from './components/ReviewChecklistCard';
import { SubmissionStatusChip } from './components/StatusChip';
import { useI18n } from '../../app/i18n/I18nContext';
import { docTypeLabel } from './utils/docTypeLabel';

const REJECT_REASONS = [
  'DOCUMENT_UNREADABLE',
  'MISMATCH_NAME_DOB',
  'PROOF_OF_ADDRESS_TOO_OLD',
  'SELFIE_MISMATCH',
  'SUSPECTED_FRAUD',
  'OTHER',
];

type Tab = 'overview' | 'documents' | 'timeline' | 'notes' | 'scoring';

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('overview');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPreConfirmOpen, setRejectPreConfirmOpen] = useState(false);
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectNote, setRejectNote] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [docModalUrl, setDocModalUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmissionById(id!),
    enabled: !!id,
  });

  const assignMu = useMutation({
    mutationFn: () => assignSubmission(id!, user?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });
  const markInReviewMu = useMutation({
    mutationFn: () => markInReview(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });
  const approveMu = useMutation({
    mutationFn: () => approveSubmission(id!, approveNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setApproveNote('');
      setApproveConfirmOpen(false);
    },
  });
  const rejectMu = useMutation({
    mutationFn: () => rejectSubmission(id!, { reasons: rejectReasons, note: rejectNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setRejectOpen(false);
      setRejectPreConfirmOpen(false);
      setRejectReasons([]);
      setRejectNote('');
    },
  });
  const commentMu = useMutation({
    mutationFn: () => addComment(id!, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setCommentText('');
    },
  });
  const rescoreMu = useMutation({
    mutationFn: () => rescoreSubmission(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });

  async function handleViewDoc(assetId: string) {
    const res = await getSignedUrl(assetId);
    if (res.success && res.data?.url) setDocModalUrl(res.data.url);
  }

  const d = data?.data;
  const submission = d?.submission;
  const canAct = submission && !['APPROVED', 'REJECTED'].includes(submission.status);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setRejectOpen(false);
        setRejectPreConfirmOpen(false);
        setApproveConfirmOpen(false);
        setDocModalUrl(null);
        return;
      }
      if (!canAct || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!approveMu.isPending) {
          setRejectOpen(false);
          setRejectPreConfirmOpen(false);
          setApproveConfirmOpen(true);
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setApproveConfirmOpen(false);
        setRejectPreConfirmOpen(true);
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        markInReviewMu.mutate();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canAct, approveMu.isPending, markInReviewMu]);

  if (!id) {
    navigate('/kyc/queue');
    return null;
  }
  if (isLoading || !d) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-daret-muted">Loading…</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'scoring', label: 'Scoring' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <button
            onClick={() => navigate('/kyc/queue')}
            className="text-sm text-daret-muted hover:text-daret-green"
          >
            ← Back to queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex border-b border-daret-border">
              {tabs.map(({ id: t, label }) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === t
                      ? 'border-daret-green text-daret-green'
                      : 'border-transparent text-daret-muted hover:text-daret-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (() => {
              const displayUser = mapToDisplayUser(d as Parameters<typeof mapToDisplayUser>[0]);
              const riskSignals = computeRiskSignals(displayUser, t);
              return (
                <div className="space-y-6">
                  <ReviewChecklistCard data={d} />
                  <UserProfileCards
                    displayUser={displayUser}
                    onCopy={() => showToast('Copied')}
                    selfieAssetId={(d.mediaByType?.['SELFIE'] ?? [])[0]?.id}
                  />
                  <RiskSignalsPanel signals={riskSignals} />
                  <RawDataAccordion data={{ submission: d.submission, user: d.user }} defaultOpen={false} />
                </div>
              );
            })()}

            {tab === 'documents' && (
              <div className="bg-daret-card border border-daret-border rounded-xl p-5">
                <h3 className="font-medium text-daret-fg mb-4">{t('users.documents')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(d.mediaByType ?? {}).map(([type, assets]) =>
                    assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="rounded-lg border border-daret-border p-3 flex items-center justify-between"
                      >
                        <span className="text-sm text-daret-fg">{docTypeLabel(type, t)}</span>
                        <button
                          type="button"
                          onClick={() => handleViewDoc(asset.id)}
                          className="text-sm text-daret-green hover:underline shrink-0 ml-2"
                        >
                          {t('users.viewDocument')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {(!d.mediaByType || Object.keys(d.mediaByType).length === 0) && (
                  <p className="text-daret-muted text-sm">{t('users.noDocuments')}</p>
                )}
              </div>
            )}

            {tab === 'scoring' && (
              <div className="bg-daret-card border border-daret-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-daret-fg">KYC Scoring</h3>
                  <button
                    onClick={() => rescoreMu.mutate()}
                    disabled={rescoreMu.isPending}
                    className="rounded-lg border border-daret-border hover:border-daret-green text-daret-muted py-2 px-3 text-sm font-medium disabled:opacity-50"
                  >
                    {rescoreMu.isPending ? 'Triggering…' : 'Rescore'}
                  </button>
                </div>
                {d.submission?.scoringError && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-400">
                    <span className="font-medium">Last scoring error: </span>
                    {d.submission.scoringError}
                  </div>
                )}
                {!d.scoring ? (
                  <p className="text-daret-muted text-sm">No scoring run yet. Submissions are scored by the pipeline shortly after submit; you can trigger it manually with Rescore.</p>
                ) : (
                  <>
                    {d.scoring.status === 'COMPLETED' && d.scoring.finalRecommendation && (
                      <div
                        className={`rounded-xl border-2 p-4 mb-6 ${
                          d.scoring.finalRecommendation === 'APPROVE'
                            ? 'bg-green-500/10 border-green-500/50'
                            : d.scoring.finalRecommendation === 'REVIEW'
                              ? 'bg-amber-500/10 border-amber-500/50'
                              : d.scoring.finalRecommendation === 'REJECT' || d.scoring.finalRecommendation === 'BLOCK' || d.scoring.finalRecommendation === 'RED'
                                ? 'bg-red-500/10 border-red-500/50'
                                : d.scoring.finalRecommendation === 'ESCALATE'
                                  ? 'bg-purple-500/10 border-purple-500/50'
                                  : d.scoring.finalRecommendation === 'ORANGE'
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-green-500/10 border-green-500/50'
                        }`}
                      >
                        <p className="text-xs font-medium text-daret-muted uppercase tracking-wide mb-1">Final recommendation</p>
                        <p className={`text-xl font-bold uppercase ${
                          d.scoring.finalRecommendation === 'APPROVE' ? 'text-green-400' :
                          d.scoring.finalRecommendation === 'REVIEW' ? 'text-amber-400' :
                          d.scoring.finalRecommendation === 'REJECT' || d.scoring.finalRecommendation === 'BLOCK' || d.scoring.finalRecommendation === 'RED' ? 'text-red-400' :
                          d.scoring.finalRecommendation === 'ESCALATE' ? 'text-purple-400' :
                          d.scoring.finalRecommendation === 'ORANGE' ? 'text-amber-400' : 'text-green-400'
                        }`}>
                          {d.scoring.finalRecommendation}
                        </p>
                        {d.scoring.finalRecommendationReason && (
                          <p className="text-sm text-daret-muted mt-1.5">Matrix: {d.scoring.finalRecommendationReason}</p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="rounded-xl border border-daret-border bg-daret-card p-4">
                        <p className="text-xs font-medium text-daret-muted uppercase tracking-wide mb-2">Daret points</p>
                        <div className="flex flex-wrap gap-3 items-center">
                          <span className="text-daret-muted text-sm">Status</span>
                          <span className="font-medium text-daret-fg capitalize">{d.scoring.status.toLowerCase()}</span>
                          {d.scoring.totalScore != null && (
                            <>
                              <span className="text-daret-muted text-sm">·</span>
                              <span className="text-daret-fg font-medium">Score {d.scoring.totalScore}</span>
                            </>
                          )}
                        </div>
                        {d.scoring.status === 'COMPLETED' && d.scoring.scoreBand && (
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold uppercase ${
                                d.scoring.scoreBand === 'GREEN' ? 'bg-green-500/20 text-green-400' :
                                d.scoring.scoreBand === 'ORANGE' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {d.scoring.scoreBandLabel || d.scoring.scoreBand}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-daret-border bg-daret-card p-4">
                        <p className="text-xs font-medium text-daret-muted uppercase tracking-wide mb-2">Fraud recommendation</p>
                        {d.scoring.fraudRecommendation ? (
                          <>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold uppercase ${
                                d.scoring.fraudRecommendation === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
                                d.scoring.fraudRecommendation === 'RED' ? 'bg-red-500/20 text-red-400' :
                                d.scoring.fraudRecommendation === 'ORANGE' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              {d.scoring.fraudRecommendation}
                            </span>
                            {d.scoring.fraudRecommendationReason && (
                              <p className="text-sm text-daret-muted mt-1.5">{d.scoring.fraudRecommendationReason}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-daret-muted text-sm">Fraud module not run or no recommendation.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-start text-sm mb-4">
                      {d.scoring.model && (
                        <div>
                          <span className="text-daret-muted text-sm">Model</span>
                          <p className="font-medium text-daret-fg">
                            {d.scoring.model.name} (v{d.scoring.model.version})
                            {d.scoring.model.baseCurrency && (
                              <span className="text-daret-muted font-normal text-xs ml-1">· bands in {d.scoring.model.baseCurrency}</span>
                            )}
                          </p>
                        </div>
                      )}
                      {d.scoring.completedAt && (
                        <div>
                          <span className="text-daret-muted text-sm">Completed</span>
                          <p className="font-medium text-daret-fg">{new Date(d.scoring.completedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {d.scoring.errorMessage && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
                        {d.scoring.errorMessage}
                      </div>
                    )}
                    {d.scoring.fraudResults && d.scoring.fraudResults.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-daret-fg">Fraud rules</h4>
                        {(() => {
                          const triggered = d.scoring.fraudResults.filter((fr) => fr.triggered);
                          const high = triggered.filter((fr) => fr.fraudRule?.severity === 'HIGH');
                          const medium = triggered.filter((fr) => fr.fraudRule?.severity === 'MEDIUM');
                          const low = triggered.filter((fr) => fr.fraudRule?.severity === 'LOW');
                          return (
                            <>
                              {triggered.length > 0 && (
                                <div className="rounded-xl border border-daret-border bg-daret-card p-4 space-y-2">
                                  <p className="text-sm font-medium text-daret-fg">Fraud summary</p>
                                  <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-sm font-medium">
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                      {triggered.length} triggered
                                    </span>
                                    {high.length > 0 && (
                                      <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium uppercase">High: {high.length}</span>
                                    )}
                                    {medium.length > 0 && (
                                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium uppercase">Medium: {medium.length}</span>
                                    )}
                                    {low.length > 0 && (
                                      <span className="px-2.5 py-1 rounded-lg bg-daret-muted/30 text-daret-muted text-xs font-medium uppercase">Low: {low.length}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              <ul className="space-y-2">
                                {d.scoring.fraudResults.map((fr) => {
                                  const details = fr.details as Record<string, unknown> | null;
                                  const reason = details?.reason as string | undefined;
                                  return (
                                    <li
                                      key={fr.id}
                                      className={`rounded-lg border px-3 py-2.5 ${
                                        fr.triggered ? 'bg-red-500/10 border-red-500/30' : 'bg-daret-card border-daret-border'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${fr.triggered ? 'bg-red-500' : 'bg-daret-muted'}`} />
                                        <span className="font-medium text-daret-fg">{fr.fraudRule?.name ?? fr.fraudRuleId}</span>
                                        {fr.fraudRule?.severity && (
                                          <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
                                            fr.fraudRule.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                            fr.fraudRule.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-daret-muted/30 text-daret-muted'
                                          }`}>
                                            {fr.fraudRule.severity}
                                          </span>
                                        )}
                                        {fr.triggered ? (
                                          <span className="ml-auto font-medium text-red-400">Triggered</span>
                                        ) : (
                                          <span className="ml-auto text-daret-muted text-sm">OK</span>
                                        )}
                                      </div>
                                      {fr.triggered && reason && (
                                        <p className="text-sm text-daret-muted mt-1.5 pl-4 border-l-2 border-red-500/40">{reason}</p>
                                      )}
                                      {fr.triggered && details && typeof details === 'object' && !reason && Object.keys(details).length > 0 && (
                                        <pre className="text-xs text-daret-muted mt-1.5 pl-4 overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {d.scoring.items && d.scoring.items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-daret-border text-left text-daret-muted">
                              <th className="py-2 pr-4">Criterion</th>
                              <th className="py-2 pr-4">Submitted value</th>
                              <th className="py-2 pr-4">Band / rule</th>
                              <th className="py-2 pr-4">Points</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.scoring.items.map((row) => (
                              <tr key={row.id} className="border-b border-daret-border/50">
                                <td className="py-2 pr-4 font-medium text-daret-fg">{row.criterionLabel}</td>
                                <td className="py-2 pr-4 text-daret-muted">
                                  {row.rawValue != null ? (
                                    <>
                                      {row.rawValue}
                                      {row.originalCurrency && <span className="ml-1 text-daret-fg/80">{row.originalCurrency}</span>}
                                      {row.normalizedValue != null && row.originalCurrency && (
                                        <span className="block text-xs mt-0.5 text-daret-muted">→ {row.normalizedValue} {d.scoring?.model?.baseCurrency ?? 'EUR'}</span>
                                      )}
                                    </>
                                  ) : '—'}
                                </td>
                                <td className="py-2 pr-4 text-daret-muted">{row.bandLabel ?? row.rationale ?? '—'}</td>
                                <td className="py-2 pr-4 text-daret-fg">{row.pointsAwarded}</td>
                                <td className="py-2">
                                  <span className={`capitalize text-xs px-2 py-0.5 rounded ${
                                    row.status === 'MATCHED' ? 'bg-daret-green/20 text-daret-green' :
                                    row.status === 'MISSING' ? 'bg-amber-500/20 text-amber-400' :
                                    row.status === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-daret-border/50 text-daret-muted'
                                  }`}>
                                    {row.status.toLowerCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'timeline' && (
              <div className="bg-daret-card border border-daret-border rounded-xl p-5">
                <h3 className="font-medium text-daret-fg mb-4">Timeline</h3>
                <ul className="space-y-3">
                  {(d.auditEvents ?? []).map((e) => (
                    <li key={e.id} className="text-sm border-l-2 border-daret-border pl-3 py-1">
                      <span className="text-daret-green font-medium">{e.action}</span>
                      <span className="text-daret-muted ml-2">
                        {e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {(!d.auditEvents || d.auditEvents.length === 0) && (
                  <p className="text-daret-muted text-sm">No events</p>
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div className="bg-daret-card border border-daret-border rounded-xl p-5 space-y-4">
                <h3 className="font-medium text-daret-fg">Internal comments</h3>
                <ul className="space-y-2">
                  {(d.comments ?? []).map((c) => (
                    <li key={c.id} className="rounded bg-daret-dark p-3 text-sm">
                      <p className="text-daret-muted">{c.comment}</p>
                      <p className="text-daret-muted text-xs mt-1">{c.reviewerEmail} · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</p>
                    </li>
                  ))}
                </ul>
                {canAct && (
                  <div>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add internal comment…"
                      className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2 text-daret-fg placeholder-gray-500 text-sm min-h-[80px]"
                    />
                    <button
                      onClick={() => commentMu.mutate()}
                      disabled={!commentText.trim() || commentMu.isPending}
                      className="mt-2 rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Add comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-daret-card border border-daret-border rounded-xl p-5 space-y-3">
              <h3 className="font-medium text-daret-fg">Actions</h3>
              {submission && (
                <p className="text-sm text-daret-muted">
                  Status: <SubmissionStatusChip status={submission.status} />
                </p>
              )}
              {canAct && (
                <>
                  <button
                    onClick={() => assignMu.mutate()}
                    disabled={assignMu.isPending}
                    className="w-full rounded-lg border border-daret-border hover:border-daret-green text-daret-muted py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Assign to me
                  </button>
                  <button
                    onClick={() => markInReviewMu.mutate()}
                    disabled={markInReviewMu.isPending}
                    className="w-full rounded-lg border border-daret-border hover:border-daret-green text-daret-muted py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Mark in review
                  </button>
                  <div className="pt-2">
                    <input
                      type="text"
                      value={approveNote}
                      onChange={(e) => setApproveNote(e.target.value)}
                      placeholder={t('kyc.approveNoteOptional')}
                      className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRejectOpen(false);
                        setRejectPreConfirmOpen(false);
                        setApproveConfirmOpen(true);
                      }}
                      disabled={approveMu.isPending}
                      className="w-full rounded-lg bg-daret-green hover:bg-daret-green-dim text-white py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {t('granting.approve')}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApproveConfirmOpen(false);
                      setRejectPreConfirmOpen(true);
                    }}
                    className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium"
                  >
                    {t('granting.reject')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {approveConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-daret-fg mb-2">{t('granting.approveSubmission')}</h3>
            <p className="text-sm text-daret-muted mb-4">{t('granting.approveConfirmIntro')}</p>
            {approveNote.trim() ? (
              <p className="text-xs text-daret-muted mb-4 rounded-lg border border-daret-border bg-daret-dark/50 px-3 py-2">
                <span className="font-medium text-daret-fg">{t('granting.noteOptional')}: </span>
                {approveNote}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approveMu.mutate()}
                disabled={approveMu.isPending}
                className="flex-1 rounded-lg bg-daret-green hover:bg-daret-green-dim text-white py-2 text-sm font-medium disabled:opacity-50"
              >
                {t('granting.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                className="rounded-lg border border-daret-border text-daret-muted py-2 px-4 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectPreConfirmOpen && !rejectOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-daret-fg mb-2">{t('granting.rejectSubmission')}</h3>
            <p className="text-sm text-daret-muted mb-4">{t('granting.rejectPreConfirmIntro')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectPreConfirmOpen(false);
                  setRejectOpen(true);
                }}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium"
              >
                {t('granting.continueLabel')}
              </button>
              <button
                type="button"
                onClick={() => setRejectPreConfirmOpen(false)}
                className="rounded-lg border border-daret-border text-daret-muted py-2 px-4 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-daret-fg mb-4">{t('granting.rejectSubmission')}</h3>
            <p className="text-sm text-daret-muted mb-3">Select reasons:</p>
            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-daret-muted">
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
              placeholder="Note / details (optional)"
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2 text-daret-fg placeholder-gray-500 text-sm min-h-[80px] mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => rejectMu.mutate()}
                disabled={rejectMu.isPending}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium disabled:opacity-50"
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
                className="rounded-lg border border-daret-border text-daret-muted py-2 px-4 text-sm font-medium"
              >
                {t('granting.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-lg bg-daret-card border border-daret-border px-4 py-2 text-sm text-daret-fg shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}

      {docModalUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setDocModalUrl(null)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-daret-card rounded-xl p-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setDocModalUrl(null)}
                className="text-daret-muted hover:text-daret-fg"
              >
                Close
              </button>
            </div>
            <iframe src={docModalUrl} title="Document" className="w-full h-[80vh] rounded border border-daret-border" />
          </div>
        </div>
      )}
    </div>
  );
}
