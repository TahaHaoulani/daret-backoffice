import api from './client';

export interface ReferenceOption {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Fetch reference options for a domain (for dropdowns, scoring rules, etc.).
 * Uses admin API; requires auth.
 */
export async function getReferenceOptions(domain: string, locale: string): Promise<ReferenceOption[]> {
  const { data } = await api.get<{ success: boolean; data: ReferenceOption[] }>('/reference-data/options', {
    params: { domain, locale },
  });
  return data?.data ?? [];
}

/** Domain list item (backend returns _count.items). */
export interface ReferenceDomainListItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  _count?: { items: number };
}

/**
 * List all reference domains (for admin UI).
 */
export async function getReferenceDomains(): Promise<Array<{ id: string; code: string; name: string; description?: string | null; sortOrder: number; itemCount: number }>> {
  const { data } = await api.get<{ success: boolean; data: ReferenceDomainListItem[] }>('/reference-data/domains');
  const raw = data?.data ?? [];
  return raw.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description,
    sortOrder: d.sortOrder,
    itemCount: d._count?.items ?? 0,
  }));
}

export interface ReferenceItemWithTranslations {
  id: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  translations: Array<{ locale: string; label: string }>;
}

export interface ReferenceDomainDetail {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  items: ReferenceItemWithTranslations[];
}

/**
 * Get one domain with items and translations (for admin UI).
 */
export async function getReferenceDomainByCode(code: string): Promise<ReferenceDomainDetail | null> {
  const { data } = await api.get<{ success: boolean; data: ReferenceDomainDetail }>(`/reference-data/domains/${encodeURIComponent(code)}`);
  return data?.data ?? null;
}

/**
 * Create or update a reference item. Body: { code, sortOrder?, isActive?, labels?: { en?, fr? } }
 */
export async function upsertReferenceItem(domainCode: string, body: { code: string; sortOrder?: number; isActive?: boolean; labels?: Record<string, string> }): Promise<ReferenceItemWithTranslations> {
  const { data } = await api.post<{ success: boolean; data: ReferenceItemWithTranslations }>(`/reference-data/domains/${encodeURIComponent(domainCode)}/items`, body);
  if (!data?.data) throw new Error('Upsert failed');
  return data.data;
}

/**
 * Update item (sortOrder, isActive).
 */
export async function patchReferenceItem(itemId: string, body: { sortOrder?: number; isActive?: boolean }): Promise<ReferenceItemWithTranslations> {
  const { data } = await api.patch<{ success: boolean; data: ReferenceItemWithTranslations }>(`/reference-data/items/${itemId}`, body);
  if (!data?.data) throw new Error('Patch failed');
  return data.data;
}

/**
 * Set translation for an item.
 */
export async function putReferenceItemTranslation(itemId: string, locale: string, label: string): Promise<void> {
  await api.put(`/reference-data/items/${itemId}/translations/${encodeURIComponent(locale)}`, { label });
}
