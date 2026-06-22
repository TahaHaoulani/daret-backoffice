import api from './client';

export type BridgeVerificationStatus =
  | 'NOT_SENT'
  | 'EMAIL_SENT'
  | 'PENDING_CONNECTION'
  | 'CONNECTED'
  | 'DATA_RETRIEVED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export type BridgeIbanMatchResult = 'MATCH' | 'MISMATCH' | 'NOT_AVAILABLE';

export interface BridgeTransaction {
  id: string;
  bookingDate: string | null;
  transactionDate: string | null;
  label: string | null;
  amount: number;
  currency: string | null;
  category: string | null;
  counterparty: string | null;
  classifiedCategory?: string | null;
  categoryType?: string | null;
  categoryLabel?: string | null;
  categoryConfidenceScore?: number | null;
  categoryRule?: string | null;
}

export interface BridgeTransactionsSummary {
  count: number;
  periodStart: string | null;
  periodEnd: string | null;
  totalInflows: number;
  totalOutflows: number;
  averageMonthlyInflow: number | null;
}

export interface BridgeVerificationAccount {
  id: string;
  bankName: string | null;
  accountName: string | null;
  accountType: string | null;
  accountHolderName: string | null;
  ibanMasked: string | null;
  ibanLast4: string | null;
  currency: string | null;
  balanceAmount: number | null;
  balanceDate: string | null;
  isPrimary: boolean;
  bridgeAccountId: string | null;
  transactionCount: number;
  latestTransactionDate: string | null;
  transactionsSummary: BridgeTransactionsSummary;
  transactions: BridgeTransaction[];
}

export interface BridgeVerificationSummary {
  requestId?: string;
  status: BridgeVerificationStatus;
  requestedAt: string | null;
  requestedBy: string | null;
  emailSentAt?: string | null;
  connectedAt: string | null;
  dataRetrievedAt: string | null;
  ibanMatchResult: BridgeIbanMatchResult | null;
  declaredIbanMasked?: string | null;
  declaredIbanLast4?: string | null;
  failureReason: string | null;
  internalNote?: string | null;
  accounts: BridgeVerificationAccount[];
  primaryAccount?: {
    bankName: string | null;
    accountName: string | null;
    accountHolderName: string | null;
    ibanMasked: string | null;
    ibanLast4: string | null;
    currency: string | null;
    balanceAmount: number | null;
    balanceDate: string | null;
  } | null;
  transactionsSummary: BridgeTransactionsSummary;
  statements: Array<{
    id: string;
    statementPeriodStart: string | null;
    statementPeriodEnd: string | null;
    documentUrl: string | null;
    fileStorageKey: string | null;
  }>;
}

export interface BridgeVerificationRequestResponse {
  success: boolean;
  data?: {
    requestId: string;
    status: BridgeVerificationStatus;
    requestedAt: string;
    emailSentAt: string | null;
  };
  code?: string;
  message?: string;
}

export function fetchBridgeVerification(submissionId: string) {
  return api
    .get<{ success: boolean; data: BridgeVerificationSummary }>(`/kyc/submissions/${submissionId}/bridge-verification`)
    .then((r) => r.data);
}

export function fetchBridgeVerificationByUser(userId: string) {
  return api
    .get<{ success: boolean; data: BridgeVerificationSummary }>(`/users/${userId}/bridge-verification`)
    .then((r) => r.data);
}

export function requestBridgeVerification(submissionId: string, note?: string) {
  return api
    .post<BridgeVerificationRequestResponse>(`/kyc/submissions/${submissionId}/bridge-verification/request`, { note })
    .then((r) => r.data);
}

export type InsightConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BridgeBankingInsights {
  periodStart: string | null;
  periodEnd: string | null;
  currency: string;
  mixedCurrencies: boolean;
  isBalanceReconstructed: boolean;
  eligibleAccountCount: number;
  flowGranularity: 'daily' | 'weekly' | 'monthly';
  summary: {
    currentConsolidatedBalance: number | null;
    minObservedBalance: number | null;
    avgObservedBalance: number | null;
    monthlyAverageInflows: number | null;
    monthlyAverageOutflows: number | null;
    netCashflow: number | null;
    currency: string;
  };
  balanceSeries: Array<{
    date: string;
    consolidatedBalance: number;
    accounts: Array<{ accountId: string; accountName: string; balance: number | null }>;
  }>;
  accountBalanceSeries: Array<{
    accountId: string;
    accountName: string;
    points: Array<{ date: string; balance: number }>;
  }>;
  flowSeries: Array<{
    date: string;
    inflows: number;
    outflows: number;
    net: number;
  }>;
  recommendation: {
    recommendedStartDay: number | null;
    recommendedEndDay: number | null;
    label: string | null;
    confidence: InsightConfidence;
    score: number;
    reasons: string[];
    warnings: string[];
  };
  detectedPatterns: {
    recurringInflows: Array<{
      label: string;
      typicalDay: number;
      averageAmount: number;
      occurrences: number;
      confidence: InsightConfidence;
    }>;
    largeOutflows: Array<{
      label: string;
      typicalDay: number;
      averageAmount: number;
      occurrences: number;
    }>;
  };
  insufficientData: boolean;
  noTransactions: boolean;
  noBalance: boolean;
}

export function fetchBridgeBankingInsights(submissionId: string) {
  return api
    .get<{ success: boolean; data: BridgeBankingInsights }>(
      `/kyc/submissions/${submissionId}/bridge-verification/insights`,
    )
    .then((r) => r.data);
}

export function fetchBridgeBankingInsightsByUser(userId: string) {
  return api
    .get<{ success: boolean; data: BridgeBankingInsights }>(`/users/${userId}/bridge-verification/insights`)
    .then((r) => r.data);
}

export interface BridgeSpendingCategoryBreakdown {
  category: string;
  label: string;
  group: string;
  amount: number;
  share: number;
  transactionCount?: number;
  averageConfidence?: number | null;
}

export interface BridgeSpendingInsights {
  periodStart: string | null;
  periodEnd: string | null;
  currency: string;
  granularity: string;
  summary: {
    totalExpenses: number;
    totalIncome: number;
    net: number;
    transactionCount: number;
    categorizedCount: number;
    unknownCount: number;
  };
  expenseBreakdown: {
    type: string;
    total: number;
    categories: BridgeSpendingCategoryBreakdown[];
  };
  incomeBreakdown: {
    type: string;
    total: number;
    categories: BridgeSpendingCategoryBreakdown[];
  };
  expenseTimeSeries: {
    granularity: string;
    series: Array<{ date: string; amount: number }>;
  };
  incomeTimeSeries: {
    granularity: string;
    series: Array<{ date: string; amount: number }>;
  };
  recurringExpenses: Array<{
    label: string;
    category: string;
    categoryLabel?: string;
    recurringGroupKey?: string;
    averageAmount: number;
    firstDate?: string | null;
    lastDate?: string | null;
    occurrences: number;
  }>;
  riskSignals: Array<{
    category: string;
    label: string;
    severity: string;
    count: number;
    totalAmount: number;
    samples: Array<{ id?: string; date: string | null; label: string | null; amount: number }>;
  }>;
  insufficientData: boolean;
}

export function fetchBridgeSpendingInsights(submissionId: string) {
  return api
    .get<{ success: boolean; data: BridgeSpendingInsights }>(
      `/kyc/submissions/${submissionId}/bridge-verification/spending-insights`,
    )
    .then((r) => r.data);
}

export function fetchBridgeSpendingInsightsByUser(userId: string) {
  return api
    .get<{ success: boolean; data: BridgeSpendingInsights }>(
      `/users/${userId}/bridge-verification/spending-insights`,
    )
    .then((r) => r.data);
}

export type BridgeGrantingRecommendationStatus =
  | 'FAVORABLE'
  | 'REVIEW_NEEDED'
  | 'HIGH_ATTENTION'
  | 'INSUFFICIENT_DATA';

export interface BridgeGrantingSummary {
  recommendation: {
    status: BridgeGrantingRecommendationStatus;
    label: string;
    headline: string;
    explanation: string;
  };
  score: {
    value: number;
    label: string;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  positiveSignals: Array<{ label: string; detail: string }>;
  attentionPoints: Array<{
    severity: string;
    label: string;
    detail: string;
    transactionCategory?: string | null;
    transactionCount?: number | null;
  }>;
  recommendedActions: Array<{ priority: string; label: string; detail: string }>;
  periodStart: string | null;
  periodEnd: string | null;
  currency: string;
  insufficientData: boolean;
  disclaimer: string;
}

export function fetchBridgeGrantingSummary(submissionId: string) {
  return api
    .get<{ success: boolean; data: BridgeGrantingSummary }>(
      `/kyc/submissions/${submissionId}/bridge-verification/granting-summary`,
    )
    .then((r) => r.data);
}

export function fetchBridgeGrantingSummaryByUser(userId: string) {
  return api
    .get<{ success: boolean; data: BridgeGrantingSummary }>(
      `/users/${userId}/bridge-verification/granting-summary`,
    )
    .then((r) => r.data);
}
