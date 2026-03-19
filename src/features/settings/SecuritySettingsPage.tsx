import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getSecurityMe,
  securityMfaReset,
  securityRecoveryRegenerate,
  securityRevokeDevice,
  securityRevokeAllDevices,
} from '../../api/auth';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../../app/i18n/I18nContext';

export function SecuritySettingsPage() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getSecurityMe>>['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState(false);
  const [regenerateModal, setRegenerateModal] = useState(false);
  const [revokeAllModal, setRevokeAllModal] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getSecurityMe()
      .then((res) => {
        if (res.success && res.data) setSummary(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleResetMfa() {
    if (!resetCode.trim()) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await securityMfaReset(
        /^[A-F0-9-]{8,}$/i.test(resetCode.replace(/\s/g, '')) ? { recoveryCode: resetCode.trim() } : { code: resetCode.trim() }
      );
      if (res.success) {
        setResetModal(false);
        setResetCode('');
        logout();
      } else {
        setActionError(t('mfa.invalidCode'));
      }
    } catch {
      setActionError(t('mfa.invalidCode'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegenerateRecovery() {
    if (!regenerateCode.trim()) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await securityRecoveryRegenerate({ code: regenerateCode.trim() });
      if (res.success && res.data?.recoveryCodes) {
        setRegenerateModal(false);
        setRegenerateCode('');
        const codes = res.data.recoveryCodes.join('\n');
        await navigator.clipboard.writeText(codes);
        if (summary) setSummary({ ...summary, recoveryCodesRemainingCount: res.data.recoveryCodes.length });
      } else {
        setActionError(t('mfa.invalidCode'));
      }
    } catch {
      setActionError(t('mfa.invalidCode'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeDevice(deviceId: string) {
    try {
      await securityRevokeDevice(deviceId);
      const res = await getSecurityMe();
      if (res.success && res.data) setSummary(res.data);
    } catch {
      // ignore
    }
  }

  async function handleRevokeAll() {
    setActionLoading(true);
    try {
      await securityRevokeAllDevices();
      setRevokeAllModal(false);
      logout();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-daret-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl py-4">
      <h1 className="text-xl font-semibold text-daret-fg mb-6">{t('security.title')}</h1>

      <section className="bg-daret-card border border-daret-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-daret-fg mb-3">{t('security.mfaStatus')}</h2>
        <p className="text-sm text-daret-muted mb-2">
          {summary?.mfaEnabled ? t('security.mfaEnabled') : t('security.mfaDisabled')}
          {summary?.enrolledAt && ` · ${t('security.enrolledAt')} ${new Date(summary.enrolledAt).toLocaleDateString()}`}
          {summary?.lastUsedAt && ` · ${t('security.lastUsedAt')} ${new Date(summary.lastUsedAt).toLocaleString()}`}
        </p>
        <p className="text-sm text-daret-muted mb-4">
          {t('security.recoveryCodesRemaining')}: {summary?.recoveryCodesRemainingCount ?? 0}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRegenerateModal(true)}
            className="rounded-lg border border-daret-border text-daret-muted hover:text-daret-fg px-3 py-1.5 text-sm"
          >
            {t('security.regenerateRecovery')}
          </button>
          <button
            type="button"
            onClick={() => { setResetModal(true); setActionError(null); }}
            className="rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-sm"
          >
            {t('security.resetMfa')}
          </button>
        </div>
      </section>

      <section className="bg-daret-card border border-daret-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-daret-fg mb-3">{t('security.connectedDevices')}</h2>
        {summary?.devices?.length ? (
          <ul className="space-y-3">
            {summary.devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm border-b border-daret-border/50 pb-2 last:border-0">
                <div>
                  <p className="text-daret-fg font-medium">{d.deviceName || d.deviceId}</p>
                  <p className="text-daret-muted text-xs">
                    {d.lastSeenAt && `${t('security.lastSeen')} ${new Date(d.lastSeenAt).toLocaleString()}`}
                    {d.ipLast && ` · ${d.ipLast}`}
                  </p>
                  {d.trustedUntil && (
                    <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${new Date(d.trustedUntil) > new Date() ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-muted/20 text-daret-muted'}`}>
                      {new Date(d.trustedUntil) > new Date() ? t('security.trusted') : t('security.expired')} · {new Date(d.trustedUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeDevice(d.id)}
                  className="text-daret-muted hover:text-red-400 text-xs"
                >
                  {t('security.revokeDevice')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-daret-muted text-sm">{t('common.noData')}</p>
        )}
        <button
          type="button"
          onClick={() => setRevokeAllModal(true)}
          className="mt-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-sm"
        >
          {t('security.revokeAllDevices')}
        </button>
      </section>

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-daret-fg mb-2">{t('security.resetMfa')}</h3>
            <p className="text-sm text-daret-muted mb-4">{t('security.resetMfaConfirm')}</p>
            {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder={t('mfa.enterCode')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2 text-daret-fg mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setResetModal(false); setResetCode(''); setActionError(null); }} className="flex-1 rounded-lg border border-daret-border py-2 text-sm text-daret-fg">
                {t('security.cancel')}
              </button>
              <button onClick={handleResetMfa} disabled={actionLoading || !resetCode.trim()} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm disabled:opacity-50">
                {t('security.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {regenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-daret-fg mb-2">{t('security.regenerateRecovery')}</h3>
            <p className="text-sm text-daret-muted mb-4">{t('security.regenerateRecoveryConfirm')}</p>
            {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
            <input
              type="text"
              inputMode="numeric"
              value={regenerateCode}
              onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('mfa.enterCode')}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2 text-daret-fg mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRegenerateModal(false); setRegenerateCode(''); setActionError(null); }} className="flex-1 rounded-lg border border-daret-border py-2 text-sm text-daret-fg">
                {t('security.cancel')}
              </button>
              <button onClick={handleRegenerateRecovery} disabled={actionLoading || regenerateCode.length < 6} className="flex-1 rounded-lg bg-daret-green hover:bg-daret-green-dim text-white py-2 text-sm disabled:opacity-50">
                {t('security.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {revokeAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-daret-fg mb-2">{t('security.revokeAllDevices')}</h3>
            <p className="text-sm text-daret-muted mb-4">{t('security.revokeAllConfirm')}</p>
            <div className="flex gap-2">
              <button onClick={() => setRevokeAllModal(false)} className="flex-1 rounded-lg border border-daret-border py-2 text-sm text-daret-fg">
                {t('security.cancel')}
              </button>
              <button onClick={handleRevokeAll} disabled={actionLoading} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm disabled:opacity-50">
                {t('security.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
