/**
 * In-memory cache for reference data labels by locale. Populated by ReferenceDataLoader; read by format helpers.
 * Keyed by domain then locale then code so we always show the label for the current UI locale.
 */
const cache: Record<string, Record<string, Record<string, string>>> = {};

export function setReferenceOptions(domain: string, locale: string, items: Array<{ code: string; label: string }>): void {
  if (!cache[domain]) cache[domain] = {};
  cache[domain][locale] = {};
  for (const item of items) {
    cache[domain][locale][item.code] = item.label;
  }
}

export function getReferenceLabel(domain: string, code: string, locale: string): string | undefined {
  return cache[domain]?.[locale]?.[code];
}

export function clearReferenceCache(): void {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
