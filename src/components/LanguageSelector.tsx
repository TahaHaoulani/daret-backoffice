import { useState, useRef, useEffect } from 'react';
import { useI18n, SUPPORTED_LOCALES } from '../app/i18n/I18nContext';
import type { Locale } from '../app/i18n/I18nContext';

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

export function LanguageSelector() {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm text-daret-muted hover:text-daret-fg hover:bg-daret-card transition"
        aria-label={t('common.language')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <LocaleFlag locale={locale} />
        <span className="font-medium">{t(locale === 'en' ? 'common.english' : 'common.french')}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border border-daret-border bg-daret-card shadow-lg z-20 min-w-[80px]">
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-sm font-medium transition flex items-center gap-2 ${
                locale === loc
                  ? 'text-daret-green bg-daret-green/10'
                  : 'text-daret-muted hover:text-daret-fg hover:bg-daret-border/10'
              }`}
            >
              <LocaleFlag locale={loc} />
              {t(loc === 'en' ? 'common.english' : 'common.french')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
