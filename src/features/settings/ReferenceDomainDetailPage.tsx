import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReferenceDomainByCode,
  upsertReferenceItem,
  patchReferenceItem,
  putReferenceItemTranslation,
} from '../../api/referenceData';
import { useI18n } from '../../app/i18n/I18nContext';

const SUPPORTED_LOCALES = ['en', 'fr'] as const;

export function ReferenceDomainDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const [newCode, setNewCode] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newLabelFr, setNewLabelFr] = useState('');
  const [editingTranslation, setEditingTranslation] = useState<{ itemId: string; locale: string } | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  const { data: domain, isLoading } = useQuery({
    queryKey: ['reference-data', 'domain', code],
    queryFn: () => getReferenceDomainByCode(code!),
    enabled: !!code,
  });

  const upsertMu = useMutation({
    mutationFn: (body: { code: string; labels: Record<string, string> }) =>
      upsertReferenceItem(code!, { code: body.code, labels: body.labels }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-data', 'domain', code] });
      queryClient.invalidateQueries({ queryKey: ['reference-data', 'domains'] });
      setNewCode('');
      setNewLabelEn('');
      setNewLabelFr('');
    },
  });

  const patchMu = useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: { isActive?: boolean } }) =>
      patchReferenceItem(itemId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-data', 'domain', code] });
      queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
  });

  const putTranslationMu = useMutation({
    mutationFn: ({ itemId, locale: loc, label }: { itemId: string; locale: string; label: string }) =>
      putReferenceItemTranslation(itemId, loc, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-data', 'domain', code] });
      queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setEditingTranslation(null);
    },
  });

  function getLabel(item: { translations: Array<{ locale: string; label: string }> }, loc: string): string {
    return item.translations.find((tr) => tr.locale === loc)?.label ?? '';
  }

  function openEditTranslation(itemId: string, loc: string, current: string) {
    setEditingTranslation({ itemId, locale: loc });
    setEditLabelValue(current);
  }

  function saveEditTranslation() {
    if (!editingTranslation) return;
    putTranslationMu.mutate({ itemId: editingTranslation.itemId, locale: editingTranslation.locale, label: editLabelValue });
  }

  if (!code) {
    navigate('/settings/reference-data');
    return null;
  }
  if (isLoading || !domain) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-daret-muted">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/settings/reference-data')}
          className="text-sm text-daret-muted hover:text-daret-green"
        >
          ← {t('nav.referenceData')}
        </button>
        <h1 className="text-xl font-semibold text-daret-fg">{domain.name}</h1>
        <span className="font-mono text-sm text-daret-muted">{domain.code}</span>
      </div>

      <div className="rounded-lg border border-daret-border bg-daret-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-daret-border bg-daret-dark/50">
              <th className="text-left py-3 px-4 font-medium text-daret-fg">Code</th>
              {SUPPORTED_LOCALES.map((loc) => (
                <th key={loc} className="text-left py-3 px-4 font-medium text-daret-fg">Label ({loc})</th>
              ))}
              <th className="text-left py-3 px-4 font-medium text-daret-fg">Status</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {domain.items.map((item) => (
              <tr key={item.id} className="border-b border-daret-border/50 hover:bg-daret-dark/30">
                <td className="py-3 px-4 font-mono text-daret-fg">{item.code}</td>
                {SUPPORTED_LOCALES.map((loc) => {
                  const label = getLabel(item, loc);
                  const isEditing = editingTranslation?.itemId === item.id && editingTranslation?.locale === loc;
                  return (
                    <td key={loc} className="py-3 px-4 text-daret-fg">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            className="flex-1 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveEditTranslation}
                            disabled={putTranslationMu.isPending}
                            className="rounded bg-daret-green text-daret-dark px-2 py-1 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTranslation(null)}
                            className="rounded border border-daret-border px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditTranslation(item.id, loc, label)}
                          className="text-left hover:bg-daret-dark/50 rounded px-1 -mx-1 min-w-0 w-full"
                        >
                          {label || '—'}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.isActive ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-border/50 text-daret-muted'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => patchMu.mutate({ itemId: item.id, body: { isActive: !item.isActive } })}
                    disabled={patchMu.isPending}
                    className="text-daret-muted hover:text-daret-fg text-xs"
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-daret-border bg-daret-card p-4 space-y-3">
        <h2 className="font-medium text-daret-fg">Add item</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-daret-muted mb-1">Code</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              placeholder="e.g. MY_CODE"
              className="rounded bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-daret-muted mb-1">Label (en)</label>
            <input
              type="text"
              value={newLabelEn}
              onChange={(e) => setNewLabelEn(e.target.value)}
              className="rounded bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-daret-muted mb-1">Label (fr)</label>
            <input
              type="text"
              value={newLabelFr}
              onChange={(e) => setNewLabelFr(e.target.value)}
              className="rounded bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm w-48"
            />
          </div>
          <button
            type="button"
            onClick={() => upsertMu.mutate({ code: newCode.trim(), labels: { en: newLabelEn.trim(), fr: newLabelFr.trim() } })}
            disabled={upsertMu.isPending || !newCode.trim()}
            className="rounded-lg bg-daret-green text-daret-dark px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {upsertMu.isPending ? 'Adding…' : 'Add item'}
          </button>
        </div>
        {upsertMu.isError && (
          <p className="text-sm text-red-400">{(upsertMu.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}
