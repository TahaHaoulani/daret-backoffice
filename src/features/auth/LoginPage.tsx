import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, type LoginResponse } from '../../api/auth';
import { useAuth } from './AuthContext';
import { useTheme } from '../../app/theme/ThemeContext';
import { useI18n } from '../../app/i18n/I18nContext';
import { getOrCreateDeviceId, getDeviceName } from '../../lib/deviceId';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res: LoginResponse = await login({
        email,
        password,
        deviceId: getOrCreateDeviceId(),
        deviceName: getDeviceName(),
      });
      if (res.success && res.data) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
        navigate('/dashboard', { replace: true });
        return;
      }
      if (res.success && res.mfaRequired && res.mfaTicket) {
        sessionStorage.setItem('mfaTicket', res.mfaTicket);
        if (res.user) setUser(res.user);
        if (res.mfaSetupRequired) {
          navigate('/mfa/setup', { replace: true });
        } else {
          navigate('/mfa/verify', { replace: true });
        }
        return;
      }
      setError(res.message || t('login.loginFailed'));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('login.networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-daret-dark px-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-daret-muted hover:text-daret-fg hover:bg-daret-card transition"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>
      <div className="w-full max-w-md">
        <div className="bg-daret-card border border-daret-border rounded-xl p-8 shadow-xl">
          <img src="/logo.svg" alt="Daret" className="h-12 w-12 mx-auto mb-4 text-daret-green" />
          <h1 className="text-2xl font-semibold text-daret-fg mb-2">{t('login.title')}</h1>
          <p className="text-daret-muted text-sm mb-6">{t('login.subtitle')}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-daret-muted mb-1">{t('login.email')}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2.5 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-daret-muted mb-1">{t('login.password')}</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-4 py-2.5 text-daret-fg placeholder-daret-muted focus:ring-2 focus:ring-daret-green focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-daret-green hover:bg-daret-green-dim text-white font-medium py-2.5 px-4 transition disabled:opacity-50"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
