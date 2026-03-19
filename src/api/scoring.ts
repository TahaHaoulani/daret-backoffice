import api from './client';

export type ScoringModelStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ScoringCriterionType = 'NUMERIC_RANGE' | 'ENUM' | 'CATEGORICAL' | 'BOOLEAN';
export type ScoringRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ScoringRunItemStatus = 'MATCHED' | 'MISSING' | 'NOT_APPLICABLE' | 'ERROR';
export type ScoreBand = 'GREEN' | 'ORANGE' | 'RED';

export interface ScoringModelListItem {
  id: string;
  name: string;
  description: string | null;
  status: ScoringModelStatus;
  version: number;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
  criteriaCount: number;
  runsCount: number;
}

export interface ScoringRuleDto {
  id: string;
  valueMin: number | null;
  valueMax: number | null;
  enumValue: string | null;
  bandLabel: string | null;
  points: number;
  sortOrder: number;
}

export interface ScoringCriterionDto {
  id: string;
  key: string;
  label: string;
  criterionType: ScoringCriterionType;
  dataSource: string | null;
  sortOrder: number;
  isActive: boolean;
  /** When set, rule enum values must come from this reference-data domain (single source of truth). */
  referenceDomainCode?: string | null;
  rules: ScoringRuleDto[];
}

export interface ScoringScoreBandDto {
  id: string;
  band: ScoreBand;
  scoreMin: number;
  scoreMax: number | null;
  label: string | null;
  sortOrder: number;
}

export interface ScorecardModuleDto {
  id: string;
  moduleKey: string;
  enabled: boolean;
  sortOrder: number;
}

export interface FraudRuleDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  ruleType: string;
  severity: string | null;
  isBlocking?: boolean;
  isActive: boolean;
  /** For risk console: tooltip + side drawer */
  detailedExplanation?: string | null;
  signalsUsed?: string[] | null;
  detectionLogic?: string | null;
  exampleScenario?: string | null;
  severityRationale?: string | null;
  blockingBehavior?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FraudPolicyConfigDto {
  blockIfAnyBlockingRule?: boolean;
  redIfCriticalCount?: number;
  redIfHighCount?: number;
  orangeIfHighCount?: number;
  orangeIfMediumCount?: number;
  defaultRecommendation?: 'GREEN' | 'ORANGE' | 'RED';
}

/** Final recommendation matrix: points band -> fraud recommendation -> APPROVE | REVIEW | REJECT | ESCALATE */
export type FinalRecommendationMatrixDto = Record<string, Record<string, 'APPROVE' | 'REVIEW' | 'REJECT' | 'ESCALATE'>>;

export interface ScorecardFraudRuleDto {
  id: string;
  fraudRuleId: string;
  enabled: boolean;
  fraudRule: FraudRuleDto | null;
}

export interface ScoringModuleRegistryDto {
  key: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface ScoringModelDetail {
  id: string;
  name: string;
  description: string | null;
  status: ScoringModelStatus;
  version: number;
  baseCurrency: string;
  fraudPolicyConfig: FraudPolicyConfigDto | null;
  finalRecommendationMatrix: FinalRecommendationMatrixDto | null;
  scoreBands: ScoringScoreBandDto[];
  scorecardModules: ScorecardModuleDto[];
  scorecardFraudRules: ScorecardFraudRuleDto[];
  createdAt: string;
  updatedAt: string;
  criteria: ScoringCriterionDto[];
}

export interface ScorecardAuditLogDto {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: unknown;
  performedBy: string | null;
  createdAt: string;
}

export interface ScoringRunItemDto {
  id: string;
  criterionKey: string;
  criterionLabel: string;
  rawValue: string | null;
  normalizedValue: string | null;
  originalCurrency: string | null;
  bandLabel: string | null;
  pointsAwarded: number;
  rationale: string | null;
  status: ScoringRunItemStatus;
  sortOrder: number;
}

export interface ScoringRunSummary {
  id: string;
  status: ScoringRunStatus;
  totalScore: number | null;
  scoreBand: ScoreBand | null;
  scoreBandLabel: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  model: { id: string; name: string; version: number; status?: string; baseCurrency?: string } | null;
  items: ScoringRunItemDto[];
}

export function fetchScoringModels(params?: { status?: ScoringModelStatus }): Promise<{ success: boolean; data: ScoringModelListItem[] }> {
  const q = params?.status ? `?status=${params.status}` : '';
  return api.get(`/scoring/models${q}`).then((r) => r.data);
}

export function fetchActiveScoringModel(): Promise<{ success: boolean; data: ScoringModelDetail | null }> {
  return api.get('/scoring/models/active').then((r) => r.data);
}

export function fetchScoringModelById(id: string): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.get(`/scoring/models/${id}`).then((r) => r.data);
}

export function createScoringModel(body: { name: string; description?: string; status?: ScoringModelStatus; baseCurrency?: string }): Promise<{ success: boolean; data: { id: string; name: string; status: string } }> {
  return api.post('/scoring/models', body).then((r) => r.data);
}

/** Duplicate a scorecard with all config (criteria, rules, bands, modules, fraud rules, fraud policy, final matrix). */
export function duplicateScoringModel(sourceId: string): Promise<{ success: boolean; data: { id: string; name: string; status: string } }> {
  return api.post(`/scoring/models/${sourceId}/duplicate`).then((r) => r.data);
}

export function updateScoringModel(id: string, body: { name?: string; description?: string; status?: ScoringModelStatus; baseCurrency?: string }): Promise<{ success: boolean; data: { id: string; name: string; status: string; version?: number } }> {
  return api.patch(`/scoring/models/${id}`, body).then((r) => r.data);
}

export function updateScoreBands(
  modelId: string,
  bands: { band: ScoreBand; scoreMin: number; scoreMax: number | null; label?: string }[]
): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.put(`/scoring/models/${modelId}/score-bands`, { bands }).then((r) => r.data);
}

export function fetchScoringModules(): Promise<{ success: boolean; data: ScoringModuleRegistryDto[] }> {
  return api.get('/scoring/modules').then((r) => r.data);
}

export function updateScorecardModules(
  modelId: string,
  modules: { moduleKey: string; enabled: boolean }[]
): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.put(`/scoring/models/${modelId}/modules`, { modules }).then((r) => r.data);
}

export function fetchFraudRules(): Promise<{ success: boolean; data: FraudRuleDto[] }> {
  return api.get('/scoring/fraud-rules').then((r) => r.data);
}

export function updateScorecardFraudRule(
  modelId: string,
  fraudRuleId: string,
  enabled: boolean
): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.put(`/scoring/models/${modelId}/fraud-rules/${fraudRuleId}`, { enabled }).then((r) => r.data);
}

export function updateFraudRuleBlocking(
  fraudRuleId: string,
  isBlocking: boolean
): Promise<{ success: boolean; data: { id: string; key: string; name: string; isBlocking: boolean } }> {
  return api.patch(`/scoring/fraud-rules/${fraudRuleId}`, { isBlocking }).then((r) => r.data);
}

export function updateScorecardFraudPolicy(
  modelId: string,
  fraudPolicyConfig: FraudPolicyConfigDto | null
): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.put(`/scoring/models/${modelId}/fraud-policy`, { fraudPolicyConfig }).then((r) => r.data);
}

export function updateScorecardFinalMatrix(
  modelId: string,
  finalRecommendationMatrix: FinalRecommendationMatrixDto | null
): Promise<{ success: boolean; data: ScoringModelDetail }> {
  return api.put(`/scoring/models/${modelId}/final-matrix`, { finalRecommendationMatrix }).then((r) => r.data);
}

export function fetchScorecardAuditLog(modelId: string): Promise<{ success: boolean; data: ScorecardAuditLogDto[] }> {
  return api.get(`/scoring/models/${modelId}/audit-log`).then((r) => r.data);
}

export function activateScoringModel(id: string): Promise<{ success: boolean; data: { id: string; status: string; version: number } }> {
  return api.post(`/scoring/models/${id}/activate`).then((r) => r.data);
}

export function deleteScoringModel(id: string): Promise<{ success: boolean; message?: string }> {
  return api.delete(`/scoring/models/${id}`).then((r) => r.data);
}

export function createCriterion(modelId: string, body: {
  key: string;
  label: string;
  criterionType: ScoringCriterionType;
  dataSource?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; data: Record<string, unknown> }> {
  return api.post(`/scoring/models/${modelId}/criteria`, body).then((r) => r.data);
}

export function updateCriterion(id: string, body: { label?: string; criterionType?: ScoringCriterionType; dataSource?: string; sortOrder?: number; isActive?: boolean }): Promise<{ success: boolean; data: Record<string, unknown> }> {
  return api.patch(`/scoring/criteria/${id}`, body).then((r) => r.data);
}

export function deleteCriterion(id: string): Promise<{ success: boolean }> {
  return api.delete(`/scoring/criteria/${id}`).then((r) => r.data);
}

export function createRule(criterionId: string, body: {
  valueMin?: number;
  valueMax?: number;
  enumValue?: string;
  bandLabel?: string;
  points: number;
  sortOrder?: number;
}): Promise<{ success: boolean; data: Record<string, unknown> }> {
  return api.post(`/scoring/criteria/${criterionId}/rules`, body).then((r) => r.data);
}

export function updateRule(id: string, body: { valueMin?: number; valueMax?: number; enumValue?: string; bandLabel?: string; points?: number; sortOrder?: number }): Promise<{ success: boolean; data: Record<string, unknown> }> {
  return api.patch(`/scoring/rules/${id}`, body).then((r) => r.data);
}

export function deleteRule(id: string): Promise<{ success: boolean }> {
  return api.delete(`/scoring/rules/${id}`).then((r) => r.data);
}

export function rescoreSubmission(submissionId: string): Promise<{ success: boolean; message?: string }> {
  return api.post(`/kyc/submissions/${submissionId}/rescore`).then((r) => r.data);
}

export interface CurrencyRateDto {
  currencyCode: string;
  rateToEur: number;
  updatedAt: string | undefined;
}

export function fetchCurrencyRates(): Promise<{ success: boolean; data: CurrencyRateDto[] }> {
  return api.get('/scoring/currency-rates').then((r) => r.data);
}

export function updateCurrencyRate(currencyCode: string, body: { rateToEur: number }): Promise<{ success: boolean; data: CurrencyRateDto }> {
  return api.patch(`/scoring/currency-rates/${currencyCode}`, body).then((r) => r.data);
}
