import { useEffect, useContext } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { getReferenceOptions } from '../../api/referenceData';
import { setReferenceOptions } from './referenceDataCache';
import { ReferenceDataContext } from './ReferenceDataContext';

const KYC_LABEL_DOMAINS = ['employment_status', 'profession', 'nationality_country', 'residence_country'] as const;

/**
 * Loads reference data for KYC display into the in-memory cache so format helpers (mapEmploymentStatus, getCountryName) show localized labels.
 * Bumps ref-data version when done so consumers re-render with the correct locale.
 */
export function ReferenceDataLoader() {
  const { locale } = useI18n();
  const ctx = useContext(ReferenceDataContext);

  useEffect(() => {
    let cancelled = false;
    const bump = ctx?.bumpVersion;
    (async () => {
      for (const domain of KYC_LABEL_DOMAINS) {
        if (cancelled) return;
        try {
          const options = await getReferenceOptions(domain, locale);
          if (!cancelled) setReferenceOptions(domain, locale, options.map((o) => ({ code: o.code, label: o.label })));
        } catch {
          // Keep previous cache or fallback in format.ts
        }
      }
      if (!cancelled) bump?.();
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]); // Do not depend on ctx: bumpVersion() updates context and would retrigger this effect → infinite loop + 429s

  return null;
}
