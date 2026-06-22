import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { requestBridgeVerification } from '../../../api/bridge';

type Props = {
  submissionId: string;
  userEmail: string | null | undefined;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
  setToast: (msg: string | null) => void;
};

export function BridgeVerificationRequestModal({
  submissionId,
  userEmail,
  open,
  onClose,
  onSuccess,
  t,
  setToast,
}: Props) {
  const [note, setNote] = useState('');

  const requestMu = useMutation({
    mutationFn: () => requestBridgeVerification(submissionId, note.trim() || undefined),
    onSuccess: (res) => {
      if (res.success) {
        setNote('');
        onClose();
        onSuccess();
        setToast(t('bridge.toastRequestSent'));
        window.setTimeout(() => setToast(null), 4000);
      } else {
        setToast(res.message || t('bridge.toastError'));
        window.setTimeout(() => setToast(null), 5000);
      }
    },
    onError: () => {
      setToast(t('bridge.toastError'));
      window.setTimeout(() => setToast(null), 5000);
    },
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bridge-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-daret-border bg-daret-card p-6 shadow-xl">
        <h2 id="bridge-modal-title" className="text-lg font-semibold text-daret-fg mb-3">
          {t('bridge.modalTitle')}
        </h2>
        <p className="text-sm text-daret-muted mb-4 leading-relaxed">
          {t('bridge.modalBody')}
        </p>
        <div className="mb-4">
          <p className="text-[length:var(--ops-label-size)] uppercase tracking-wide text-daret-muted mb-1">
            {t('bridge.userEmail')}
          </p>
          <p className="text-sm text-daret-fg font-medium">{userEmail || '—'}</p>
        </div>
        <label className="block mb-4">
          <span className="text-[length:var(--ops-label-size)] uppercase tracking-wide text-daret-muted">
            {t('bridge.internalNote')}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('bridge.internalNotePlaceholder')}
            className="mt-1 w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm min-h-[80px] placeholder:text-daret-muted/60"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={requestMu.isPending}
            className="rounded-lg border border-daret-border px-4 py-2 text-sm text-daret-muted hover:text-daret-fg disabled:opacity-50"
          >
            {t('bridge.cancel')}
          </button>
          <button
            type="button"
            onClick={() => requestMu.mutate()}
            disabled={requestMu.isPending}
            className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {requestMu.isPending ? t('bridge.sending') : t('bridge.sendRequest')}
          </button>
        </div>
      </div>
    </div>
  );
}
