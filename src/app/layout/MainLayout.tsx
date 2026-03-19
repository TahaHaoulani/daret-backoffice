import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { ReferenceDataProvider } from '../referenceData/ReferenceDataContext';
import { ReferenceDataLoader } from '../referenceData/ReferenceDataLoader';
import type { Locale } from '../i18n/I18nContext';

const FLAG_CDN = 'https://flagcdn.com/w40';
/** Locale to ISO 3166-1 alpha-2 for flag image (en → GB, fr → FR). */
const localeFlagCode: Record<Locale, string> = { en: 'gb', fr: 'fr' };

function LocaleFlag({ locale }: { locale: Locale }) {
  return (
    <img
      src={`${FLAG_CDN}/${localeFlagCode[locale]}.png`}
      alt=""
      className="h-4 w-6 object-cover rounded-sm shrink-0"
      width={24}
      height={16}
      loading="lazy"
    />
  );
}

const navKeys = [
  { to: '/dashboard', key: 'nav.dashboard' },
  { to: '/users', key: 'nav.users' },
  { to: '/granting', key: 'nav.granting' },
  { to: '/scoring', key: 'nav.scoring' },
  { to: '/circles', key: 'nav.circles' },
] as const;

const adminNavItems = [
  { to: '/audit', key: 'nav.auditLog' },
  { to: '/crons', key: 'nav.crons' },
  { to: '/settings/reference-data', key: 'nav.referenceData' },
  { to: '/settings/security', key: 'nav.settings' },
] as const;

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const isAdminActive = adminNavItems.some(({ to }) => location.pathname === to || location.pathname.startsWith(to === '/settings/security' ? '/settings' : to === '/crons' ? '/crons' : to));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ReferenceDataProvider>
      <div className="min-h-screen bg-daret-dark flex flex-col">
        <ReferenceDataLoader />
        <header className="border-b border-daret-border bg-daret-card/50 sticky top-0 z-10 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 gap-4">
          <Link to="/dashboard" className="flex items-center shrink-0 text-daret-green hover:opacity-90 transition" aria-label="Daret Backoffice">
            <img src="/logo.svg" alt="Daret" className="h-8 w-8" />
          </Link>
          <nav className="flex items-center gap-6 flex-1 justify-center min-w-0">
              {navKeys.map(({ to, key }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition whitespace-nowrap ${
                    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
                      ? 'text-daret-green'
                      : 'text-daret-muted hover:text-daret-fg'
                  }`}
                >
                  {t(key)}
                </Link>
              ))}
              <div className="relative" ref={adminRef}>
                <button
                  type="button"
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`text-sm font-medium transition whitespace-nowrap flex items-center gap-1 ${
                    isAdminActive ? 'text-daret-green' : 'text-daret-muted hover:text-daret-fg'
                  }`}
                  aria-expanded={adminOpen}
                  aria-haspopup="true"
                >
                  {t('nav.admin')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {adminOpen && (
                  <div className="absolute left-0 top-full mt-1 py-1 rounded-lg border border-daret-border bg-daret-card shadow-lg z-20 min-w-[160px]">
                    {adminNavItems.map(({ to, key }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setAdminOpen(false)}
                        className={`block px-3 py-2 text-sm font-medium transition ${
                          location.pathname === to || (to === '/settings/security' && location.pathname.startsWith('/settings/security')) || (to === '/crons' && location.pathname.startsWith('/crons')) || (to === '/settings/reference-data' && location.pathname.startsWith('/settings/reference-data'))
                            ? 'text-daret-green bg-daret-green/10'
                            : 'text-daret-muted hover:text-daret-fg hover:bg-daret-border/10'
                        }`}
                      >
                        {t(key)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-daret-muted hover:text-daret-fg hover:bg-daret-card transition"
                aria-label={t('common.language')}
                aria-expanded={langOpen}
              >
                <LocaleFlag locale={locale} />
                <span className="font-medium">{t(locale === 'en' ? 'common.english' : 'common.french')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border border-daret-border bg-daret-card shadow-lg z-20 min-w-[80px]">
                  {(['en', 'fr'] as Locale[]).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => { setLocale(loc); setLangOpen(false); }}
                      className={`w-full px-3 py-1.5 text-left text-sm font-medium transition flex items-center gap-2 ${locale === loc ? 'text-daret-green bg-daret-green/10' : 'text-daret-muted hover:text-daret-fg hover:bg-daret-border/10'}`}
                    >
                      <LocaleFlag locale={loc} />
                      {t(loc === 'en' ? 'common.english' : 'common.french')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-daret-muted hover:text-daret-fg hover:bg-daret-card transition"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <span className="text-sm text-daret-muted truncate max-w-[180px] sm:max-w-none">{user?.email ?? '—'}</span>
            <button type="button" onClick={logout} className="text-sm text-daret-muted hover:text-daret-fg whitespace-nowrap">
              {t('common.logOut')}
            </button>
          </div>
        </div>
      </header>
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </ReferenceDataProvider>
  );
}
