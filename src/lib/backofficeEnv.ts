/** Client-safe deployment tier for backoffice UI (set `VITE_BACKOFFICE_ENV` to override). */
export type BackofficeEnvironmentLabel = 'local' | 'staging' | 'production';

export function getBackofficeEnvironment(): BackofficeEnvironmentLabel | null {
  const raw = import.meta.env.VITE_BACKOFFICE_ENV;
  if (typeof raw === 'string') {
    const n = raw.trim().toLowerCase();
    if (n === 'local' || n === 'staging' || n === 'production') return n;
  }
  if (import.meta.env.DEV) return 'local';
  if (import.meta.env.PROD) return 'production';
  return null;
}
