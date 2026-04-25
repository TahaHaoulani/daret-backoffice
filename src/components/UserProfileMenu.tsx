import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AuthUser } from '../api/auth';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../app/theme/ThemeContext';
import { useI18n, type Locale } from '../app/i18n/I18nContext';
import { getBackofficeEnvironment } from '../lib/backofficeEnv';
import { userInitials, userPrimaryLabel } from '../lib/userDisplay';

function formatMenuDateTime(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function roleBadgeText(t: (key: string) => string, role: string): string {
  const r = role.trim().toLowerCase();
  if (r === 'admin') return t('userMenu.roleAdmin');
  if (r === 'user') return t('userMenu.roleUser');
  const raw = role.replace(/_/g, ' ').trim();
  return raw ? raw.replace(/\b\w/g, (c) => c.toUpperCase()) : role;
}

function envLabelKey(env: string): string {
  if (env === 'local') return 'userMenu.envLocal';
  if (env === 'staging') return 'userMenu.envStaging';
  return 'userMenu.envProduction';
}

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, locale } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const u = user as AuthUser | null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    requestAnimationFrame(() => first?.focus());
  }, [open]);

  if (!u) return null;

  const initials = userInitials(u.fullName, u.email);
  const primary = userPrimaryLabel(u.fullName, u.email);
  const fullNameDisplay = u.fullName?.trim() || t('userMenu.noName');
  const emailDisplay = u.email?.trim() || t('userMenu.noEmail');
  const roles = [...new Set((u.roles?.length ? u.roles : u.role ? [u.role] : []).filter(Boolean))];
  const env = getBackofficeEnvironment();
  const lastLoginFormatted = formatMenuDateTime(u.lastLoginAt, locale);

  function rowClass(isInteractive = false) {
    return `px-3 py-2 text-sm ${isInteractive ? 'text-daret-fg hover:bg-daret-border/20 cursor-pointer w-full text-left flex items-center gap-2' : 'text-daret-muted'}`;
  }

  function menuNavigate() {
    close();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !menuRef.current) return;
    const focusable = [...menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
      (el) => !el.hasAttribute('disabled')
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id="backoffice-user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('userMenu.openMenuAria')}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-daret-border bg-daret-card/80 pl-1.5 pr-2 py-1.5 text-left transition hover:bg-daret-card hover:border-daret-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-daret-green/60"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-daret-green/20 text-xs font-semibold text-daret-green"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden min-w-0 sm:flex flex-col items-start leading-tight">
          <span className="max-w-[10rem] truncate text-sm font-medium text-daret-fg">{primary}</span>
          <span className="max-w-[10rem] truncate text-xs text-daret-muted">{emailDisplay !== primary ? emailDisplay : '\u00a0'}</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-daret-muted transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby="backoffice-user-menu-trigger"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-30 mt-2 w-[min(calc(100vw-1.5rem),18.5rem)] rounded-xl border border-daret-border bg-daret-card py-2 shadow-xl"
        >
          <div className="border-b border-daret-border px-4 py-3" role="none">
            <div className="flex gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-daret-green/20 text-sm font-semibold text-daret-green"
                aria-hidden
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-daret-fg">{fullNameDisplay}</p>
                <p className="truncate text-xs text-daret-muted">{emailDisplay}</p>
                {roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex rounded-full bg-daret-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-daret-green"
                      >
                        {roleBadgeText(t, r)}
                      </span>
                    ))}
                  </div>
                )}
                {u.organization?.trim() && (
                  <p className="mt-1.5 truncate text-xs text-daret-muted">
                    <span className="font-medium text-daret-fg/80">{t('userMenu.organization')}: </span>
                    {u.organization.trim()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="py-1" role="none">
            <Link
              role="menuitem"
              to={`/users/${u.id}`}
              onClick={menuNavigate}
              className={rowClass(true)}
            >
              <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('userMenu.myProfile')}
            </Link>
            <Link role="menuitem" to="/settings/security" onClick={menuNavigate} className={rowClass(true)}>
              <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('userMenu.accountSettings')}
            </Link>
            <Link role="menuitem" to="/settings/security" onClick={menuNavigate} className={rowClass(true)}>
              <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('userMenu.securitySettings')}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleTheme();
              }}
              className={rowClass(true)}
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{t('userMenu.appearance')}</span>
                <span className="text-xs font-normal text-daret-muted">
                  {theme === 'dark' ? t('userMenu.themeDark') : t('userMenu.themeLight')}
                </span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                logout();
              }}
              className={`${rowClass(true)} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('common.logOut')}
            </button>
          </div>

          <div className="mt-1 border-t border-daret-border pt-2" role="none">
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-daret-muted">{t('userMenu.adminContext')}</p>
            {env && (
              <div className={rowClass(false)}>
                <span className="font-medium text-daret-fg/90">{t('userMenu.environment')}: </span>
                {t(envLabelKey(env))}
              </div>
            )}
            {roles.length > 0 && (
              <div className={rowClass(false)}>
                <span className="font-medium text-daret-fg/90">{t('userMenu.currentRole')}: </span>
                {roles.map((r) => roleBadgeText(t, r)).join(', ')}
              </div>
            )}
            <div className={rowClass(false)}>
              <span className="font-medium text-daret-fg/90">{t('userMenu.lastLogin')}: </span>
              {lastLoginFormatted || t('userMenu.lastLoginUnknown')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
