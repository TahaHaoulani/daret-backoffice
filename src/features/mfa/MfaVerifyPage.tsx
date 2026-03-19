import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mfaChallengeVerify, mfaChallengeRecovery } from '../../api/auth';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../../app/theme/ThemeContext';
import { useI18n } from '../../app/i18n/I18nContext';
import { getOrCreateDeviceId, getDeviceName } from '../../lib/deviceId';

export function MfaVerifyPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ticket = sessionStorage.getItem('mfaTicket');
    if (!ticket) {
      navigate('/login', { replace: true });
      return;
    }
    setMfaTicket(ticket);
  }, [navigate]);

  async function handleVerify() {
    if (!mfaTicket) return;
    const body = {
      deviceId: getOrCreateDeviceId(),
      deviceName: getDeviceName(),
      rememberDevice,
    };
    setError(null);
    setLoading(true);
    try {
      const res = useRecovery
        ? await mfaChallengeRecovery(mfaTicket, { ...body, recoveryCode: recoveryCode.trim() })
        : await mfaChallengeVerify(mfaTicket, { ...body, code: code.trim() });
      if (res.success && res.data) {
        sessionStorage.removeItem('mfaTicket');
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken!);
        if (res.data.user) setUser(res.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError(t('mfa.invalidCode'));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('mfa.invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = useRecovery ? recoveryCode.trim().length >= 8 : code.replace(/\D/g, '').length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-daret-dark px-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-daret-muted hover:text-daret-fg hover:bg-daret-card transition"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>
      <div className="w-full max-w-md bg-daret-card border border-daret-border rounded-xl p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-daret-fg mb-2">{t('mfa.verifyTitle')}</h1>
        <p className="text-sm text-daret-muted mb-6">{t('mfa.verifySubtitle')}</p>
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 mb-4">
            {error}
          </div>
        )}
        {!useRecovery ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-daret-muted mb-1">{t('mfa.enterCode')}</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2.5 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green"
                placeholder="000000"
              />
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-daret-muted mb-1">{t('mfa.recoveryCodePlaceholder')}</label>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2.5 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green font-mono"
              placeholder="XXXX-XXXX-XXXX"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setUseRecovery((u) => !u)}
          className="text-sm text-daret-green hover:underline mb-4"
        >
          {useRecovery ? t('mfa.verifySubtitle') : t('mfa.useRecoveryCode')}
        </button>
        <label className="flex items-center gap-2 text-sm text-daret-muted mb-4">
          <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} />
          {t('mfa.rememberDevice')}
        </label>
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || !canSubmit}
          className="w-full rounded-lg bg-daret-green hover:bg-daret-green-dim text-white font-medium py-2.5 px-4 transition disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('mfa.continue')}
        </button>
      </div>
    </div>
  );
}
