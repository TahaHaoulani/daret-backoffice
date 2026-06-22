import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addUserToBlacklist, removeUserFromBlacklist, type BlacklistReasonCode, type UserBlacklistState } from '../api/usersApi';

type Props = {
  userId: string;
  blacklist: UserBlacklistState | undefined;
  t: (key: string) => string;
  setToast: (msg: string | null) => void;
};

const REASON_OPTIONS: { value: BlacklistReasonCode; labelKey: string }[] = [
  { value: 'FRAUD_SUSPECTED', labelKey: 'users.blacklist.reasonFraudSuspected' },
  { value: 'IDENTITY_RISK', labelKey: 'users.blacklist.reasonIdentityRisk' },
  { value: 'PAYMENT_RISK', labelKey: 'users.blacklist.reasonPaymentRisk' },
  { value: 'ABUSE', labelKey: 'users.blacklist.reasonAbuse' },
  { value: 'MANUAL_DECISION', labelKey: 'users.blacklist.reasonManualDecision' },
  { value: 'OTHER', labelKey: 'users.blacklist.reasonOther' },
];

export function UserBlacklistActions({ userId, blacklist: blacklistProp, t, setToast }: Props) {
  const blacklist: UserBlacklistState = blacklistProp ?? { active: false };
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'add' | 'remove' | null>(null);
  const [reasonCode, setReasonCode] = useState<BlacklistReasonCode>('MANUAL_DECISION');
  const [comment, setComment] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [iban, setIban] = useState('');
  const [removeComment, setRemoveComment] = useState('');

  const addMu = useMutation({
    mutationFn: () =>
      addUserToBlacklist(userId, {
        reasonCode,
        reasonComment: comment.trim(),
        nationalId: nationalId.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        iban: iban.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setModal(null);
      setComment('');
      setNationalId('');
      setPassportNumber('');
      setIban('');
      setToast(t('users.blacklist.toastAdded'));
      window.setTimeout(() => setToast(null), 4000);
    },
    onError: () => {
      setToast(t('users.blacklist.toastError'));
      window.setTimeout(() => setToast(null), 5000);
    },
  });

  const removeMu = useMutation({
    mutationFn: () => removeUserFromBlacklist(userId, { deactivationReason: removeComment.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setModal(null);
      setRemoveComment('');
      setToast(t('users.blacklist.toastRemoved'));
      window.setTimeout(() => setToast(null), 4000);
    },
    onError: () => {
      setToast(t('users.blacklist.toastError'));
      window.setTimeout(() => setToast(null), 5000);
    },
  });

  const isActive = blacklist.active === true;
  const busy = addMu.isPending || removeMu.isPending;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isActive && (
          <span className="inline-flex items-center rounded-md border border-red-500/35 bg-red-950/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-100">
            {t('users.blacklist.badge')}
          </span>
        )}
        {!isActive ? (
          <button
            type="button"
            onClick={() => {
              setReasonCode('MANUAL_DECISION');
              setComment('');
              setNationalId('');
              setPassportNumber('');
              setIban('');
              setModal('add');
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 py-0 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-daret-card)]"
          >
            {t('users.blacklist.addButton')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRemoveComment('');
              setModal('remove');
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-daret-border bg-daret-dark px-3 py-0 text-sm font-medium text-daret-fg transition hover:border-daret-green/40 hover:text-daret-green focus:outline-none focus-visible:ring-2 focus-visible:ring-daret-green/40"
          >
            {t('users.blacklist.removeButton')}
          </button>
        )}
      </div>

      {modal === 'add' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="blacklist-add-title">
          <div className="w-full max-w-md rounded-xl border border-daret-border bg-daret-card p-6 shadow-xl">
            <h2 id="blacklist-add-title" className="text-lg font-semibold text-daret-fg">
              {t('users.blacklist.modalAddTitle')}
            </h2>
            <p className="mt-2 text-sm text-daret-muted leading-relaxed">
              {t('users.blacklist.modalAddBody')}
            </p>
            <label className="mt-4 block text-sm font-medium text-daret-fg">
              {t('users.blacklist.reasonLabel')}
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as BlacklistReasonCode)}
                className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-3 py-2 text-sm text-daret-fg"
              >
                {REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-medium text-daret-fg">
              {t('users.blacklist.commentLabel')}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-3 py-2 text-sm text-daret-fg"
                required
              />
            </label>
            <p className="mt-3 text-xs text-daret-muted">{t('users.blacklist.optionalIdentifiersHint')}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="block text-xs font-medium text-daret-fg">
                {t('users.blacklist.nationalIdOptional')}
                <input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-2 py-1.5 text-sm text-daret-fg"
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-daret-fg">
                {t('users.blacklist.passportOptional')}
                <input
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-2 py-1.5 text-sm text-daret-fg"
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-daret-fg">
                {t('users.blacklist.ibanOptional')}
                <input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-2 py-1.5 text-sm text-daret-fg"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-daret-muted hover:text-daret-fg"
              >
                {t('users.blacklist.cancel')}
              </button>
              <button
                type="button"
                disabled={busy || !comment.trim()}
                onClick={() => addMu.mutate()}
                className="rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-daret-card)] disabled:cursor-not-allowed disabled:bg-daret-border disabled:text-daret-muted disabled:opacity-70 disabled:shadow-none disabled:hover:bg-daret-border"
              >
                {t('users.blacklist.confirmAdd')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'remove' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="blacklist-remove-title">
          <div className="w-full max-w-md rounded-xl border border-daret-border bg-daret-card p-6 shadow-xl">
            <h2 id="blacklist-remove-title" className="text-lg font-semibold text-daret-fg">
              {t('users.blacklist.modalRemoveTitle')}
            </h2>
            <p className="mt-2 text-sm text-daret-muted leading-relaxed">
              {t('users.blacklist.modalRemoveBody')}
            </p>
            <label className="mt-4 block text-sm font-medium text-daret-fg">
              {t('users.blacklist.commentLabel')}
              <textarea
                value={removeComment}
                onChange={(e) => setRemoveComment(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-daret-border bg-daret-dark px-3 py-2 text-sm text-daret-fg"
                required
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-daret-muted hover:text-daret-fg"
              >
                {t('users.blacklist.cancel')}
              </button>
              <button
                type="button"
                disabled={busy || !removeComment.trim()}
                onClick={() => removeMu.mutate()}
                className="rounded-lg border border-daret-border bg-daret-dark px-4 py-2 text-sm font-medium text-daret-fg hover:border-daret-green/50 hover:text-daret-green disabled:opacity-40"
              >
                {t('users.blacklist.confirmRemove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
