/** Maps `UserMediaAssetType` / `KycDocumentType` codes to `users.docType*` i18n keys. */
const DOC_TYPE_KEYS: Record<string, string> = {
  SELFIE: 'users.docTypeSelfie',
  AVATAR: 'users.docTypeAvatar',
  ID_FRONT: 'users.docTypeIdFront',
  ID_BACK: 'users.docTypeIdBack',
  PASSPORT: 'users.docTypePassport',
  PROOF_OF_ADDRESS: 'users.docTypeProofOfAddress',
  PAYSLIP: 'users.docTypePayslip',
  EMPLOYMENT_CONTRACT: 'users.docTypeEmploymentContract',
  TAX_ASSESSMENT: 'users.docTypeTaxAssessment',
  BANK_STATEMENT: 'users.docTypeBankStatement',
};

/** Human-readable document category for backoffice (localized). */
export function docTypeLabel(type: string, t: (key: string) => string): string {
  const key = DOC_TYPE_KEYS[type];
  if (key) return t(key);
  return type
    .split('_')
    .map((w) => (w ? w.charAt(0) + w.slice(1).toLowerCase() : ''))
    .join(' ');
}
