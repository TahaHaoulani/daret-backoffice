import { useI18n } from '../app/i18n/I18nContext';
import { formatCountryDisplay } from '../features/kyc/utils/format';

const FLAG_CDN = 'https://flagcdn.com';
const FLAG_SIZE = 'w40';

/** True when the normalized code is a 2-letter A–Z value (real ISO-2), so we can show a flag image. */
function isDisplayableFlagCode(norm: string | null): boolean {
  if (!norm || norm.length !== 2) return false;
  return norm[0] >= 'A' && norm[0] <= 'Z' && norm[1] >= 'A' && norm[1] <= 'Z';
}

interface CountryDisplayProps {
  /** Country code (ISO 3166-1 alpha-2 or alpha-3; will be normalized). */
  code: string | null | undefined;
  /** Show country name next to flag. Default true. */
  showName?: boolean;
  /** Optional class for the wrapper. */
  className?: string;
  /** When true, render as inline flex with gap; otherwise minimal wrapper. */
  inline?: boolean;
}

/**
 * Renders country as flag image + optional name. Uses CDN flag images so flags
 * display correctly on all platforms (e.g. Windows where emoji flags show as letters).
 */
export function CountryDisplay({
  code,
  showName = true,
  className = '',
  inline = true,
}: CountryDisplayProps) {
  const { locale } = useI18n();
  const { name, code: norm } = formatCountryDisplay(code, locale);
  if (!norm && name === '—') return <span className={className}>—</span>;

  const showFlagImg = isDisplayableFlagCode(norm);
  const flagSrc = showFlagImg ? `${FLAG_CDN}/${FLAG_SIZE}/${norm!.toLowerCase()}.png` : null;

  const content = (
    <>
      {flagSrc ? (
        <img
          src={flagSrc}
          alt=""
          className="h-5 w-7 object-cover rounded-sm shrink-0"
          width={28}
          height={20}
          loading="lazy"
        />
      ) : null}
      {showName ? <span>{name}</span> : null}
    </>
  );
  if (inline) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
        {content}
      </span>
    );
  }
  return <span className={className}>{content}</span>;
}
