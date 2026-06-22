import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../../app/i18n/I18nContext';

export function BridgeVerificationSuccessPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-daret-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/50 border border-emerald-500/40">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-daret-fg">{t('bridge.publicSuccessTitle')}</h1>
        <p className="text-daret-muted leading-relaxed">{t('bridge.publicSuccessBody')}</p>
      </div>
    </div>
  );
}

export function BridgeVerificationErrorPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const reason = params.get('reason');

  const bodyKey = reason === 'expired'
    ? 'bridge.publicErrorExpired'
    : reason === 'user_cancelled'
      ? 'bridge.publicErrorCancelled'
      : 'bridge.publicErrorBody';

  return (
    <div className="min-h-screen bg-daret-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/40">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-daret-fg">{t('bridge.publicErrorTitle')}</h1>
        <p className="text-daret-muted leading-relaxed">{t(bodyKey)}</p>
        <p className="text-sm text-daret-muted">{t('bridge.publicErrorSupport')}</p>
      </div>
    </div>
  );
}
