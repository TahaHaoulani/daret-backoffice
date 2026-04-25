export interface AdvancedFieldValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  countryOfBirth: string;
  cityOfBirth: string;
  addressCity: string;
  addressZipCode: string;
  addressCountry: string;
  documentStatus: string;
  livenessStatus: string;
  reviewDecision: string;
  riskLevel: string;
  reviewerId: string;
  professionalSituation: string;
  netMonthlyIncomeMin: string;
  netMonthlyIncomeMax: string;
  monthlyExpensesMin: string;
  monthlyExpensesMax: string;
  hasActiveLoans: string;
  debtToIncomeRatioMin: string;
  debtToIncomeRatioMax: string;
  remainingDisposableIncomeMin: string;
  remainingDisposableIncomeMax: string;
  documentType: string;
  missingDocumentSide: string;
  submittedFrom: string;
  submittedTo: string;
}

export function emptyAdvancedValues(): AdvancedFieldValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    countryOfBirth: '',
    cityOfBirth: '',
    addressCity: '',
    addressZipCode: '',
    addressCountry: '',
    documentStatus: '',
    livenessStatus: '',
    reviewDecision: '',
    riskLevel: '',
    reviewerId: '',
    professionalSituation: '',
    netMonthlyIncomeMin: '',
    netMonthlyIncomeMax: '',
    monthlyExpensesMin: '',
    monthlyExpensesMax: '',
    hasActiveLoans: '',
    debtToIncomeRatioMin: '',
    debtToIncomeRatioMax: '',
    remainingDisposableIncomeMin: '',
    remainingDisposableIncomeMax: '',
    documentType: '',
    missingDocumentSide: '',
    submittedFrom: '',
    submittedTo: '',
  };
}

export function advancedValuesFromSearchParams(sp: URLSearchParams): AdvancedFieldValues {
  const g = (k: string) => sp.get(k) ?? '';
  return {
    firstName: g('firstName'),
    lastName: g('lastName'),
    email: g('email'),
    phone: g('phone'),
    dateOfBirth: g('dateOfBirth'),
    nationality: g('nationality'),
    countryOfBirth: g('countryOfBirth'),
    cityOfBirth: g('cityOfBirth'),
    addressCity: g('addressCity'),
    addressZipCode: g('addressZipCode'),
    addressCountry: g('addressCountry'),
    documentStatus: g('documentStatus'),
    livenessStatus: g('livenessStatus'),
    reviewDecision: g('reviewDecision'),
    riskLevel: g('riskLevel'),
    reviewerId: g('reviewerId'),
    professionalSituation: g('professionalSituation'),
    netMonthlyIncomeMin: g('netMonthlyIncomeMin'),
    netMonthlyIncomeMax: g('netMonthlyIncomeMax'),
    monthlyExpensesMin: g('monthlyExpensesMin'),
    monthlyExpensesMax: g('monthlyExpensesMax'),
    hasActiveLoans: g('hasActiveLoans'),
    debtToIncomeRatioMin: g('debtToIncomeRatioMin'),
    debtToIncomeRatioMax: g('debtToIncomeRatioMax'),
    remainingDisposableIncomeMin: g('remainingDisposableIncomeMin'),
    remainingDisposableIncomeMax: g('remainingDisposableIncomeMax'),
    documentType: g('documentType'),
    missingDocumentSide: g('missingDocumentSide'),
    submittedFrom: g('submittedFrom'),
    submittedTo: g('submittedTo'),
  };
}
