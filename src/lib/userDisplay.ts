/**
 * Given names unchanged, family name (last whitespace-delimited segment) in ALL CAPS.
 * e.g. "Achraf Chrokat" → "Achraf CHROKAT". Single token or email-like strings unchanged.
 */
export function formatFullNameLastUpper(fullName: string | null | undefined): string {
  const s = fullName?.trim();
  if (!s) return '';
  if (s.includes('@')) return s;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? s;
  const last = parts[parts.length - 1].toUpperCase();
  return `${parts.slice(0, -1).join(' ')} ${last}`;
}

/** Two-letter initials for avatar; name first, else email. */
export function userInitials(fullName: string | null | undefined, email: string | null | undefined): string {
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[parts.length - 1][0];
      if (a && b) return (a + b).toUpperCase();
    }
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    if (name.length === 1) return name.toUpperCase();
  }
  const e = email?.trim();
  if (e && e.length >= 1) return e[0].toUpperCase();
  return '?';
}

/** Primary line for compact nav button: name, else email, else em dash. */
export function userPrimaryLabel(fullName: string | null | undefined, email: string | null | undefined): string {
  const n = fullName?.trim();
  if (n) return formatFullNameLastUpper(n);
  const e = email?.trim();
  if (e) return e;
  return '—';
}
