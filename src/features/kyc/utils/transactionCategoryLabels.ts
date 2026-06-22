export type TransactionCategoryGroup = 'income' | 'essential' | 'daily' | 'discretionary' | 'risk' | 'other';

const CATEGORY_GROUP: Record<string, TransactionCategoryGroup> = {
  SALARY: 'income',
  BENEFITS: 'income',
  PENSION: 'income',
  FAMILY_SUPPORT: 'income',
  TRANSFER_IN: 'income',
  REFUND: 'income',
  OTHER_INCOME: 'income',
  RENT: 'essential',
  UTILITIES: 'essential',
  TELECOM: 'essential',
  INSURANCE: 'essential',
  TAXES: 'essential',
  LOAN_REPAYMENT: 'essential',
  BANK_FEES: 'essential',
  GROCERIES: 'daily',
  RESTAURANT: 'daily',
  TRANSPORT: 'daily',
  FUEL: 'daily',
  HEALTHCARE: 'daily',
  PHARMACY: 'daily',
  CHILDCARE: 'daily',
  EDUCATION: 'daily',
  SHOPPING: 'discretionary',
  ENTERTAINMENT: 'discretionary',
  TRAVEL: 'discretionary',
  BEAUTY: 'discretionary',
  SPORT: 'discretionary',
  SUBSCRIPTIONS: 'discretionary',
  CASH_WITHDRAWAL: 'risk',
  GAMBLING: 'risk',
  CRYPTO: 'risk',
  DEBT_COLLECTION: 'risk',
  OVERDRAFT_FEES: 'risk',
  FAILED_PAYMENT: 'risk',
  HIGH_VALUE_TRANSFER_OUT: 'risk',
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  SALARY: 'Salaire / revenus réguliers',
  BENEFITS: 'Aides / allocations',
  PENSION: 'Retraite / pension',
  FAMILY_SUPPORT: 'Aide familiale',
  TRANSFER_IN: 'Virement entrant',
  REFUND: 'Remboursement',
  OTHER_INCOME: 'Autre revenu',
  RENT: 'Loyer',
  UTILITIES: 'Énergie / utilities',
  TELECOM: 'Télécom',
  INSURANCE: 'Assurance',
  TAXES: 'Impôts / taxes',
  LOAN_REPAYMENT: 'Remboursement crédit',
  BANK_FEES: 'Frais bancaires',
  GROCERIES: 'Courses alimentaires',
  RESTAURANT: 'Restaurants',
  TRANSPORT: 'Transport',
  FUEL: 'Carburant',
  HEALTHCARE: 'Santé',
  PHARMACY: 'Pharmacie',
  CHILDCARE: 'Garde d\'enfants',
  EDUCATION: 'Éducation',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Loisirs',
  TRAVEL: 'Voyage',
  BEAUTY: 'Beauté',
  SPORT: 'Sport',
  SUBSCRIPTIONS: 'Abonnements',
  CASH_WITHDRAWAL: 'Retrait espèces',
  GAMBLING: 'Jeux d\'argent',
  CRYPTO: 'Crypto',
  DEBT_COLLECTION: 'Recouvrement',
  OVERDRAFT_FEES: 'Agios / découvert',
  FAILED_PAYMENT: 'Paiement rejeté',
  HIGH_VALUE_TRANSFER_OUT: 'Virement sortant important',
  INTERNAL_TRANSFER: 'Virement interne / transfert',
  CARD_PAYMENT: 'Paiement carte',
  TRANSFER_OUT: 'Virement sortant',
  UNKNOWN: 'Non catégorisé',
};

export const CATEGORY_BADGE_CLASSES: Record<TransactionCategoryGroup, string> = {
  income: 'border-emerald-400 bg-emerald-50 text-emerald-950',
  essential: 'border-sky-400 bg-sky-50 text-sky-950',
  daily: 'border-teal-400 bg-teal-50 text-teal-950',
  discretionary: 'border-violet-400 bg-violet-50 text-violet-950',
  risk: 'border-red-400 bg-red-50 text-red-950',
  other: 'border-gray-300 bg-gray-100 text-gray-700',
};

export function getTransactionCategoryLabel(category: string | null | undefined): string {
  if (!category) return CATEGORY_LABELS_FR.UNKNOWN;
  return CATEGORY_LABELS_FR[category] || category.replace(/_/g, ' ').toLowerCase();
}

export function getTransactionCategoryGroup(category: string | null | undefined): TransactionCategoryGroup {
  if (!category || category === 'UNKNOWN') return 'other';
  return CATEGORY_GROUP[category] || 'other';
}

export function getDisplayCategory(tx: {
  classifiedCategory?: string | null;
  categoryLabel?: string | null;
  category?: string | null;
}): { code: string; label: string; group: TransactionCategoryGroup } {
  const code = tx.classifiedCategory || 'UNKNOWN';
  const label = tx.categoryLabel || getTransactionCategoryLabel(code);
  return { code, label, group: getTransactionCategoryGroup(code) };
}

const DONUT_COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#64748b', '#94a3b8'];

export function getDonutColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length];
}

export function topCategoriesWithOther<T extends { category: string; label: string; amount: number; share: number }>(
  categories: T[],
  max = 7,
): Array<T & { colorIndex: number }> {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  if (sorted.length <= max) {
    return sorted.map((c, i) => ({ ...c, colorIndex: i }));
  }
  const top = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1);
  const otherAmount = rest.reduce((s, c) => s + c.amount, 0);
  const otherShare = rest.reduce((s, c) => s + c.share, 0);
  return [
    ...top.map((c, i) => ({ ...c, colorIndex: i })),
    {
      category: 'OTHER',
      label: 'Autres',
      amount: Math.round(otherAmount * 100) / 100,
      share: Math.round(otherShare * 100) / 100,
      colorIndex: max - 1,
    } as T & { colorIndex: number },
  ];
}
