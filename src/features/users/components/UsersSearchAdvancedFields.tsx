import { useI18n } from '../../../app/i18n/I18nContext';
import type { AdvancedFieldValues } from '../usersSearchState';

const DOC_STATUS = ['', 'UPLOADED', 'VALIDATED', 'REJECTED'] as const;
const LIVENESS = ['', 'PASSED', 'PENDING_REVIEW', 'FAILED', 'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED'] as const;
const REVIEW_DECISION = ['', 'APPROVE', 'REJECT'] as const;
const RISK = ['', 'GREEN', 'ORANGE', 'RED'] as const;
const EMPLOYMENT = ['', 'EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED', 'OTHER'] as const;
const DOC_TYPE = [
  '',
  'SELFIE',
  'AVATAR',
  'ID_FRONT',
  'ID_BACK',
  'PASSPORT',
  'PROOF_OF_ADDRESS',
  'PAYSLIP',
  'EMPLOYMENT_CONTRACT',
  'TAX_ASSESSMENT',
  'BANK_STATEMENT',
] as const;
const MISSING_SIDE = ['', 'FRONT', 'BACK'] as const;

function sectionTitle(t: (k: string) => string, key: string) {
  return <h3 className="text-xs font-semibold text-daret-muted uppercase tracking-wide col-span-full mt-2 mb-1">{t(key)}</h3>;
}

function fieldClass() {
  return 'w-full rounded-lg bg-daret-dark border border-daret-border px-2 py-1.5 text-daret-fg text-sm';
}

type SetVal = <K extends keyof AdvancedFieldValues>(key: K, v: AdvancedFieldValues[K]) => void;

export function UsersSearchAdvancedFields({ v, setV }: { v: AdvancedFieldValues; setV: SetVal }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-daret-border">
      {sectionTitle(t, 'users.filters.sectionIdentity')}
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.firstName')}</label>
        <input type="text" value={v.firstName} onChange={(e) => setV('firstName', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.lastName')}</label>
        <input type="text" value={v.lastName} onChange={(e) => setV('lastName', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.email')}</label>
        <input type="text" value={v.email} onChange={(e) => setV('email', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.phone')}</label>
        <input type="text" value={v.phone} onChange={(e) => setV('phone', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.dateOfBirth')}</label>
        <input type="date" value={v.dateOfBirth} onChange={(e) => setV('dateOfBirth', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.nationality')}</label>
        <input type="text" value={v.nationality} onChange={(e) => setV('nationality', e.target.value)} placeholder="MA" className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.countryOfBirth')}</label>
        <input type="text" value={v.countryOfBirth} onChange={(e) => setV('countryOfBirth', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.cityOfBirth')}</label>
        <input type="text" value={v.cityOfBirth} onChange={(e) => setV('cityOfBirth', e.target.value)} className={fieldClass()} />
      </div>

      {sectionTitle(t, 'users.filters.sectionAddress')}
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.addressCity')}</label>
        <input type="text" value={v.addressCity} onChange={(e) => setV('addressCity', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.addressZip')}</label>
        <input type="text" value={v.addressZipCode} onChange={(e) => setV('addressZipCode', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.addressCountry')}</label>
        <input type="text" value={v.addressCountry} onChange={(e) => setV('addressCountry', e.target.value)} className={fieldClass()} />
      </div>

      {sectionTitle(t, 'users.filters.sectionReview')}
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.documentStatus')}</label>
        <select value={v.documentStatus} onChange={(e) => setV('documentStatus', e.target.value)} className={fieldClass()}>
          {DOC_STATUS.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.docStatus.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.livenessStatus')}</label>
        <select value={v.livenessStatus} onChange={(e) => setV('livenessStatus', e.target.value)} className={fieldClass()}>
          {LIVENESS.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.liveness.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.reviewDecision')}</label>
        <select value={v.reviewDecision} onChange={(e) => setV('reviewDecision', e.target.value)} className={fieldClass()}>
          {REVIEW_DECISION.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.decision.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.riskLevel')}</label>
        <select value={v.riskLevel} onChange={(e) => setV('riskLevel', e.target.value)} className={fieldClass()}>
          {RISK.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.risk.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.reviewerId')}</label>
        <input type="text" value={v.reviewerId} onChange={(e) => setV('reviewerId', e.target.value)} placeholder="UUID" className={fieldClass()} />
      </div>

      {sectionTitle(t, 'users.filters.sectionFinancial')}
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.employment')}</label>
        <select value={v.professionalSituation} onChange={(e) => setV('professionalSituation', e.target.value)} className={fieldClass()}>
          {EMPLOYMENT.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.employmentOpt.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.incomeMin')}</label>
        <input type="number" inputMode="numeric" value={v.netMonthlyIncomeMin} onChange={(e) => setV('netMonthlyIncomeMin', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.incomeMax')}</label>
        <input type="number" inputMode="numeric" value={v.netMonthlyIncomeMax} onChange={(e) => setV('netMonthlyIncomeMax', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.expensesMin')}</label>
        <input type="number" inputMode="numeric" value={v.monthlyExpensesMin} onChange={(e) => setV('monthlyExpensesMin', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.expensesMax')}</label>
        <input type="number" inputMode="numeric" value={v.monthlyExpensesMax} onChange={(e) => setV('monthlyExpensesMax', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.hasActiveLoans')}</label>
        <select value={v.hasActiveLoans} onChange={(e) => setV('hasActiveLoans', e.target.value)} className={fieldClass()}>
          <option value="">{t('common.any')}</option>
          <option value="true">{t('users.filters.yes')}</option>
          <option value="false">{t('users.filters.no')}</option>
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.dtiMin')}</label>
        <input type="number" step="0.0001" value={v.debtToIncomeRatioMin} onChange={(e) => setV('debtToIncomeRatioMin', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.dtiMax')}</label>
        <input type="number" step="0.0001" value={v.debtToIncomeRatioMax} onChange={(e) => setV('debtToIncomeRatioMax', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.dispMin')}</label>
        <input type="number" inputMode="numeric" value={v.remainingDisposableIncomeMin} onChange={(e) => setV('remainingDisposableIncomeMin', e.target.value)} className={fieldClass()} />
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.dispMax')}</label>
        <input type="number" inputMode="numeric" value={v.remainingDisposableIncomeMax} onChange={(e) => setV('remainingDisposableIncomeMax', e.target.value)} className={fieldClass()} />
      </div>

      {sectionTitle(t, 'users.filters.sectionDocuments')}
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.documentType')}</label>
        <select value={v.documentType} onChange={(e) => setV('documentType', e.target.value)} className={fieldClass()}>
          {DOC_TYPE.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.docType.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.missingSide')}</label>
        <select value={v.missingDocumentSide} onChange={(e) => setV('missingDocumentSide', e.target.value)} className={fieldClass()}>
          {MISSING_SIDE.map((x) => (
            <option key={x || 'any'} value={x}>
              {x ? t(`users.filters.side.${x}`) : t('common.any')}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:col-span-2">
        <div>
          <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.submittedFrom')}</label>
          <input type="date" value={v.submittedFrom} onChange={(e) => setV('submittedFrom', e.target.value)} className={fieldClass()} />
        </div>
        <div>
          <label className="block text-[length:var(--ops-label-size)] font-medium text-daret-muted uppercase tracking-wide mb-0.5 opacity-90">{t('users.filters.submittedTo')}</label>
          <input type="date" value={v.submittedTo} onChange={(e) => setV('submittedTo', e.target.value)} className={fieldClass()} />
        </div>
      </div>
    </div>
  );
}
