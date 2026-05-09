import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfileMenu } from '../../components/UserProfileMenu';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useI18n } from '../i18n/I18nContext';
import { ReferenceDataProvider } from '../referenceData/ReferenceDataContext';
import { ReferenceDataLoader } from '../referenceData/ReferenceDataLoader';

function pathMatchesNav(pathname: string, to: string): boolean {
  if (pathname === to) return true;
  return pathname.startsWith(`${to}/`);
}

/** Active state for a child under the Admin dropdown. */
function pathMatchesAdminChild(pathname: string, to: string): boolean {
  if (to === '/settings/security') return pathname.startsWith('/settings/security');
  if (to === '/settings/reference-data') return pathname.startsWith('/settings/reference-data');
  if (to === '/crons') return pathname === '/crons' || pathname.startsWith('/crons/');
  return pathname === to || pathname.startsWith(`${to}/`);
}

const navKeys = [
  { to: '/users', key: 'nav.users' },
  { to: '/granting', key: 'nav.granting' },
  { to: '/recouvrement', key: 'nav.recouvrement' },
  { to: '/scoring', key: 'nav.scoring' },
  { to: '/circles', key: 'nav.circles' },
] as const;

const adminNavItems = [
  { to: '/audit', key: 'nav.auditLog' },
  { to: '/crons', key: 'nav.crons' },
  { to: '/settings/reference-data', key: 'nav.referenceData' },
  { to: '/settings/security', key: 'nav.settings' },
] as const;

function isAdminSectionActive(pathname: string): boolean {
  return adminNavItems.some(({ to }) => pathMatchesAdminChild(pathname, to));
}

/** Primary nav + Admin trigger: calm pill active state (not full-height block). */
function getNavItemClasses(isActive: boolean): string {
  const base =
    'inline-flex min-h-9 max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daret-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-daret-card';
  if (isActive) {
    return `${base} border border-daret-green/30 bg-daret-green/12 text-daret-green shadow-sm`;
  }
  return `${base} border border-transparent text-daret-muted hover:border-daret-border/70 hover:bg-daret-border/20 hover:text-daret-fg`;
}

function getAdminDropdownItemClasses(isActive: boolean): string {
  const base =
    'mx-1 block rounded-lg px-3 py-2 text-sm font-medium transition-[color,background-color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daret-green/35 focus-visible:ring-offset-1 focus-visible:ring-offset-daret-card';
  if (isActive) {
    return `${base} border border-daret-green/25 bg-daret-green/10 text-daret-green`;
  }
  return `${base} border border-transparent text-daret-muted hover:bg-daret-border/20 hover:text-daret-fg`;
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const pathname = location.pathname;
  const adminActive = isAdminSectionActive(pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ReferenceDataProvider>
      <div className="min-h-screen bg-daret-dark flex flex-col">
        <ReferenceDataLoader />
        <header className="sticky top-0 z-10 w-full border-b border-daret-border bg-daret-card/80 backdrop-blur-sm">
        <div className="flex h-16 min-h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center">
            <Link
              to="/users"
              className="flex items-center rounded-lg text-daret-green transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daret-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-daret-card"
              aria-label="Daret Backoffice"
            >
              <img src="/logo.svg" alt="Daret" className="h-8 w-8" width={32} height={32} />
            </Link>
          </div>
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1 sm:gap-1.5 sm:px-2">
              {/* Scroll only the main links: overflow-x-auto on a parent clips absolutely positioned dropdowns. */}
              <div className="flex min-w-0 max-w-full items-center justify-center gap-1 overflow-x-auto py-0.5 sm:gap-1.5">
                {navKeys.map(({ to, key }) => (
                  <Link key={to} to={to} className={getNavItemClasses(pathMatchesNav(pathname, to))}>
                    {t(key)}
                  </Link>
                ))}
              </div>
              <div
                className="relative shrink-0 py-0.5"
                ref={adminRef}
                onMouseEnter={() => setAdminOpen(true)}
                onMouseLeave={() => setAdminOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`${getNavItemClasses(adminActive)} ${adminOpen && !adminActive ? 'border-daret-border/60 bg-daret-border/15' : ''}`}
                  aria-expanded={adminOpen}
                  aria-haspopup="true"
                >
                  {t('nav.admin')}
                  <svg className="h-3.5 w-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {adminOpen && (
                  <div className="absolute left-1/2 top-full z-50 min-w-[13.5rem] -translate-x-1/2 pt-1 sm:left-0 sm:translate-x-0 sm:min-w-[15rem]">
                    <div className="rounded-xl border border-daret-border bg-daret-card py-1 shadow-lg ring-1 ring-daret-border/40">
                      {adminNavItems.map(({ to, key }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setAdminOpen(false)}
                          className={getAdminDropdownItemClasses(pathMatchesAdminChild(pathname, to))}
                        >
                          {t(key)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          </nav>
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-3">
            <div className="shrink-0">
              <LanguageSelector />
            </div>
            <UserProfileMenu />
          </div>
        </div>
      </header>
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </ReferenceDataProvider>
  );
}
