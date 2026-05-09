import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { login, type LoginResponse } from '../../api/auth';
import { useAuth } from './AuthContext';
import { useTheme } from '../../app/theme/ThemeContext';
import { useI18n } from '../../app/i18n/I18nContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { getOrCreateDeviceId, getDeviceName } from '../../lib/deviceId';
import heroImage from '../../assets/daret-financial-inclusion.png';

type LoginApiErrorBody = { code?: string; message?: string };

function translateLoginApiError(body: LoginApiErrorBody | undefined, t: (key: string) => string): string {
  const code = body?.code;
  if (code === 'INVALID_CREDENTIALS') return t('login.invalidCredentials');
  if (code === 'FORBIDDEN') return t('login.adminAccessOnly');
  if (code === 'VALIDATION_ERROR') return t('login.invalidInput');
  return body?.message || t('login.loginFailed');
}

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
        navigate('/users', { replace: true });
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
      setError(translateLoginApiError({ code: res.code, message: res.message }, t));
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(translateLoginApiError(err.response.data as LoginApiErrorBody, t));
      } else {
        setError(t('login.networkError'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] min-h-screen flex-col bg-daret-dark lg:flex-row">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden lg:hidden" aria-hidden>
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-daret-green/12 blur-3xl" />
        <div className="absolute -left-24 bottom-32 h-48 w-48 rounded-full bg-daret-green/10 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <LanguageSelector />
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg bg-daret-card/80 p-1.5 text-daret-muted shadow-sm ring-1 ring-daret-border/60 backdrop-blur-sm transition hover:text-daret-fg hover:ring-daret-border lg:bg-transparent lg:shadow-none lg:ring-0 lg:backdrop-blur-none"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-12 pt-20 sm:px-8 lg:w-[46%] lg:flex-none lg:px-10 lg:pb-12 lg:pt-12 xl:px-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-daret-green/[0.12] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-daret-green/[0.08] blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-daret-border bg-daret-card p-8 shadow-[0_4px_32px_-6px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03] dark:shadow-[0_4px_40px_-8px_rgba(0,0,0,0.45)] dark:ring-white/[0.04] sm:p-10">
            <img src="/logo.svg" alt="" className="mx-auto mb-5 h-12 w-12" width={48} height={48} />
            <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-daret-fg">{t('login.title')}</h1>
            <p className="mb-8 text-center text-sm leading-relaxed text-daret-muted">{t('login.subtitle')}</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400" role="alert">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-daret-muted">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-daret-border bg-daret-dark px-4 py-2.5 text-daret-fg placeholder-daret-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-daret-green"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-daret-muted">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-daret-border bg-daret-dark px-4 py-2.5 text-daret-fg placeholder-daret-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-daret-green"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-daret-green px-4 py-2.5 font-medium text-white transition hover:bg-daret-green-dim focus:outline-none focus:ring-2 focus:ring-daret-green focus:ring-offset-2 focus:ring-offset-daret-card disabled:opacity-50"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <aside className="relative hidden min-h-0 flex-1 overflow-hidden rounded-t-[2rem] border-t border-daret-border lg:block lg:min-h-screen lg:w-[54%] lg:flex-none lg:rounded-none lg:rounded-l-[2rem] lg:border-l lg:border-t-0">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center" width={1920} height={1280} decoding="async" fetchPriority="high" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-daret-green/35 via-transparent to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 z-[1] px-10 pb-14 pt-32 sm:px-12 lg:px-14 lg:pb-16">
          <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight text-white drop-shadow-md sm:text-3xl">
            {t('login.heroTagline1')}
          </p>
          <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/85 drop-shadow sm:text-base">{t('login.heroTagline2')}</p>
        </div>
      </aside>
    </div>
  );
}
