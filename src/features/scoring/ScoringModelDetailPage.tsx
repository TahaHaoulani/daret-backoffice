import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchScoringModelById,
  updateScoringModel,
  updateScoreBands,
  fetchScoringModules,
  updateScorecardModules,
  fetchFraudRules,
  updateScorecardFraudRule,
  updateFraudRuleBlocking,
  updateScorecardFraudPolicy,
  updateScorecardFinalMatrix,
  fetchScorecardAuditLog,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  createRule,
  updateRule,
  deleteRule,
  type ScoringCriterionType,
  type ScoringRuleDto,
  type ScoreBand,
  type FraudPolicyConfigDto,
  type FinalRecommendationMatrixDto,
  type FraudRuleDto,
} from '../../api/scoring';
import { getReferenceOptions } from '../../api/referenceData';
import { getReferenceLabel } from '../../app/referenceData/referenceDataCache';
import { useI18n } from '../../app/i18n/I18nContext';

/** Fallback when API does not yet return referenceDomainCode (backward compatibility). */
const REFERENCE_DOMAIN_BY_CRITERION_KEY: Record<string, string> = {
  employment_status: 'employment_status',
  profession: 'profession',
  nationality_country: 'nationality_country',
  residence_country: 'residence_country',
  country_of_birth: 'nationality_country',
  address_country: 'nationality_country',
};

const CRITERION_TYPES: { value: ScoringCriterionType; label: string }[] = [
  { value: 'NUMERIC_RANGE', label: 'Numeric range' },
  { value: 'ENUM', label: 'Enum' },
  { value: 'CATEGORICAL', label: 'Categorical' },
  { value: 'BOOLEAN', label: 'Boolean' },
];

/** Criterion keys that use monetary values; bands are defined in scorecard base currency. */
const FINANCIAL_CRITERION_KEYS = [
  'monthly_income',
  'monthly_expenses',
  'total_monthly_loan_payments',
  'remaining_disposable_income',
];

/** Fraud rule keys that have backend evaluators; only these can be activated for a scorecard. */
const IMPLEMENTED_FRAUD_RULE_KEYS = [
  'DUPLICATE_PHONE', 'DUPLICATE_EMAIL', 'DUPLICATE_DEVICE', 'DUPLICATE_IP',
  'AGE_INCOME_INCONSISTENCY', 'MULTIPLE_REJECTIONS',
  'PHONE_COUNTRY_MISMATCH', 'AGE_EMPLOYMENT_INCONSISTENCY', 'INCOME_EMPLOYMENT_INCONSISTENCY',
  'DEVICE_ACCOUNT_VELOCITY', 'IP_VELOCITY', 'RAPID_KYC_ATTEMPTS', 'DISPOSABLE_EMAIL_DOMAIN',
  'NATIONALITY_RESIDENCE_INCONSISTENCY',
  'IDENTITY_BIRTHPLACE_MISSING', 'IDENTITY_COUNTRY_MISMATCH', 'HIGH_DEBT_TO_INCOME', 'CRITICAL_DEBT_TO_INCOME',
  'NEGATIVE_DISPOSABLE_INCOME', 'MULTIPLE_ACTIVE_LOANS', 'MISSING_ID_DOCUMENT_SIDE', 'FAILED_LIVENESS',
  'LIVENESS_PENDING_TOO_LONG', 'FINANCIAL_PROFILE_INCONSISTENT',
];

type CriteriaFilter = 'all' | 'active' | 'inactive';

type ScorecardTab = 'informations' | 'daret-points' | 'fraud-rules' | 'module-orchestration' | 'history';

const SCORECARD_TAB_KEYS: { key: ScorecardTab; labelKey: string }[] = [
  { key: 'informations', labelKey: 'scoring.tabInformations' },
  { key: 'daret-points', labelKey: 'scoring.tabDaretPoints' },
  { key: 'fraud-rules', labelKey: 'scoring.tabFraudRules' },
  { key: 'module-orchestration', labelKey: 'scoring.tabModuleOrchestration' },
  { key: 'history', labelKey: 'scoring.tabHistory' },
];

export function ScoringModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const [criteriaFilter, setCriteriaFilter] = useState<CriteriaFilter>('all');
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [addCriterionKey, setAddCriterionKey] = useState('');
  const [addCriterionLabel, setAddCriterionLabel] = useState('');
  const [addCriterionType, setAddCriterionType] = useState<ScoringCriterionType>('NUMERIC_RANGE');
  const [addRuleOpen, setAddRuleOpen] = useState<string | null>(null);
  const [newRulePoints, setNewRulePoints] = useState(0);
  const [newRuleMin, setNewRuleMin] = useState<string>('');
  const [newRuleMax, setNewRuleMax] = useState<string>('');
  const [newRuleEnum, setNewRuleEnum] = useState('');
  const [newRuleBand, setNewRuleBand] = useState('');
  const [editingRule, setEditingRule] = useState<ScoringRuleDto | null>(null);
  const [editRulePoints, setEditRulePoints] = useState(0);
  const [editRuleMin, setEditRuleMin] = useState('');
  const [editRuleMax, setEditRuleMax] = useState('');
  const [editRuleEnum, setEditRuleEnum] = useState('');
  const [editRuleBand, setEditRuleBand] = useState('');
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bandsDraft, setBandsDraft] = useState<Array<{ band: ScoreBand; scoreMin: number; scoreMax: number | null; label: string }>>([]);
  const [bandsSaveError, setBandsSaveError] = useState<string | null>(null);
  const [scorecardTab, setScorecardTab] = useState<ScorecardTab>('informations');
  const [fraudPolicyDraft, setFraudPolicyDraft] = useState<FraudPolicyConfigDto | null>(null);
  const [fraudPolicyDraftSynced, setFraudPolicyDraftSynced] = useState(false);
  const [matrixDraft, setMatrixDraft] = useState<FinalRecommendationMatrixDto | null>(null);
  const [matrixDraftSynced, setMatrixDraftSynced] = useState(false);
  const [fraudRuleDetailDrawerRule, setFraudRuleDetailDrawerRule] = useState<FraudRuleDto | null>(null);
  const [fraudRuleTooltipRule, setFraudRuleTooltipRule] = useState<FraudRuleDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['scoring', 'model', id],
    queryFn: () => fetchScoringModelById(id!),
    enabled: !!id,
  });

  const createCriterionMu = useMutation({
    mutationFn: (body: { key: string; label: string; criterionType: ScoringCriterionType }) =>
      createCriterion(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
      setAddCriterionKey('');
      setAddCriterionLabel('');
    },
  });

  const updateCriterionMu = useMutation({
    mutationFn: ({ criterionId, isActive }: { criterionId: string; isActive: boolean }) =>
      updateCriterion(criterionId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
    },
  });

  const deleteCriterionMu = useMutation({
    mutationFn: (criterionId: string) => deleteCriterion(criterionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setSelectedCriterionId(null);
    },
  });

  const createRuleMu = useMutation({
    mutationFn: ({ criterionId, body }: { criterionId: string; body: { valueMin?: number; valueMax?: number; enumValue?: string; bandLabel?: string; points: number } }) =>
      createRule(criterionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setAddRuleOpen(null);
      setNewRulePoints(0);
      setNewRuleMin('');
      setNewRuleMax('');
      setNewRuleEnum('');
      setNewRuleBand('');
    },
  });

  const updateRuleMu = useMutation({
    mutationFn: ({
      ruleId,
      body,
    }: {
      ruleId: string;
      body: { valueMin?: number | null; valueMax?: number | null; enumValue?: string | null; bandLabel?: string | null; points?: number };
    }) =>
      updateRule(ruleId, {
        ...(body.points !== undefined ? { points: body.points } : {}),
        ...(body.valueMin != null ? { valueMin: body.valueMin } : {}),
        ...(body.valueMax != null ? { valueMax: body.valueMax } : {}),
        ...(body.enumValue != null && body.enumValue !== '' ? { enumValue: body.enumValue } : {}),
        ...(body.bandLabel != null && body.bandLabel !== '' ? { bandLabel: body.bandLabel } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setEditingRule(null);
    },
  });

  const deleteRuleMu = useMutation({
    mutationFn: (ruleId: string) => deleteRule(ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] }),
  });

  const updateNameMu = useMutation({
    mutationFn: (name: string) => updateScoringModel(id!, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      queryClient.invalidateQueries({ queryKey: ['scoring', 'models'] });
      setEditNameOpen(false);
    },
  });

  const updateBandsMu = useMutation({
    mutationFn: (bands: { band: ScoreBand; scoreMin: number; scoreMax: number | null; label?: string }[]) =>
      updateScoreBands(id!, bands),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setBandsSaveError(null);
    },
    onError: (err: { message?: string; response?: { data?: { message?: string } } }) => {
      setBandsSaveError(err?.response?.data?.message ?? err?.message ?? '__FAILED_TO_SAVE_BANDS__');
    },
  });

  const updateModulesMu = useMutation({
    mutationFn: (modules: { moduleKey: string; enabled: boolean }[]) => updateScorecardModules(id!, modules),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] }),
  });

  const updateFraudRuleMu = useMutation({
    mutationFn: ({ fraudRuleId, enabled }: { fraudRuleId: string; enabled: boolean }) =>
      updateScorecardFraudRule(id!, fraudRuleId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] }),
  });

  const updateBlockingMu = useMutation({
    mutationFn: ({ fraudRuleId, isBlocking }: { fraudRuleId: string; isBlocking: boolean }) =>
      updateFraudRuleBlocking(fraudRuleId, isBlocking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'fraud-rules'] });
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
    },
  });

  const updateFraudPolicyMu = useMutation({
    mutationFn: (config: FraudPolicyConfigDto | null) => updateScorecardFraudPolicy(id!, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setFraudPolicyDraftSynced(false);
    },
  });

  const updateMatrixMu = useMutation({
    mutationFn: (matrix: FinalRecommendationMatrixDto | null) => updateScorecardFinalMatrix(id!, matrix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring', 'model', id] });
      setMatrixDraftSynced(false);
    },
  });

  const { data: modulesData } = useQuery({
    queryKey: ['scoring', 'modules'],
    queryFn: () => fetchScoringModules(),
  });
  const { data: fraudRulesData } = useQuery({
    queryKey: ['scoring', 'fraud-rules'],
    queryFn: () => fetchFraudRules(),
  });
  const { data: auditData } = useQuery({
    queryKey: ['scoring', 'model', id, 'audit-log'],
    queryFn: () => fetchScorecardAuditLog(id!),
    enabled: !!id && scorecardTab === 'history',
  });

  const model = data?.data;
  const availableModules = modulesData?.data ?? [];
  const fraudRulesLibrary = fraudRulesData?.data ?? [];
  const auditLogs = auditData?.data ?? [];
  const defaultFraudPolicy: FraudPolicyConfigDto = {
    blockIfAnyBlockingRule: true,
    redIfCriticalCount: 1,
    redIfHighCount: 2,
    orangeIfHighCount: 1,
    orangeIfMediumCount: 2,
    defaultRecommendation: 'GREEN',
  };
  const DEFAULT_FINAL_MATRIX: FinalRecommendationMatrixDto = {
    GREEN: { GREEN: 'APPROVE', ORANGE: 'REVIEW', RED: 'REVIEW', BLOCK: 'REJECT' },
    ORANGE: { GREEN: 'REVIEW', ORANGE: 'REVIEW', RED: 'REJECT', BLOCK: 'REJECT' },
    RED: { GREEN: 'REVIEW', ORANGE: 'REJECT', RED: 'REJECT', BLOCK: 'REJECT' },
  };
  const POINTS_BANDS = ['GREEN', 'ORANGE', 'RED'] as const;
  const FRAUD_BANDS = ['GREEN', 'ORANGE', 'RED', 'BLOCK'] as const;
  const FINAL_OUTCOMES = ['APPROVE', 'REVIEW', 'REJECT', 'ESCALATE'] as const;

  useEffect(() => {
    if (!model) return;
    setFraudPolicyDraftSynced(false);
    setMatrixDraftSynced(false);
  }, [model?.id]);
  useEffect(() => {
    if (scorecardTab === 'informations' && model && !fraudPolicyDraftSynced) {
      const base = { ...defaultFraudPolicy };
      setFraudPolicyDraft(model.fraudPolicyConfig && Object.keys(model.fraudPolicyConfig).length > 0 ? { ...base, ...model.fraudPolicyConfig } : base);
      setFraudPolicyDraftSynced(true);
    }
  }, [scorecardTab, model, fraudPolicyDraftSynced]);
  useEffect(() => {
    if (scorecardTab === 'informations' && model && !matrixDraftSynced) {
      const m = model.finalRecommendationMatrix && Object.keys(model.finalRecommendationMatrix).length > 0
        ? { ...DEFAULT_FINAL_MATRIX, ...model.finalRecommendationMatrix } as FinalRecommendationMatrixDto
        : { ...DEFAULT_FINAL_MATRIX };
      setMatrixDraft(m);
      setMatrixDraftSynced(true);
    }
  }, [scorecardTab, model, matrixDraftSynced]);
  const filteredCriteria = useMemo(() => {
    if (!model?.criteria) return [];
    if (criteriaFilter === 'active') return model.criteria.filter((c) => c.isActive);
    if (criteriaFilter === 'inactive') return model.criteria.filter((c) => !c.isActive);
    return model.criteria;
  }, [model?.criteria, criteriaFilter]);

  useEffect(() => {
    if (!model?.criteria?.length) return;
    const ids = new Set(filteredCriteria.map((c) => c.id));
    if (selectedCriterionId && !ids.has(selectedCriterionId)) {
      setSelectedCriterionId(filteredCriteria[0]?.id ?? null);
    }
  }, [criteriaFilter, filteredCriteria, selectedCriterionId, model?.criteria?.length]);

  useEffect(() => {
    if (!model) return;
    if (editNameOpen) setNameDraft(model.name);
  }, [model?.name, editNameOpen]);

  useEffect(() => {
    if (!model) return;
    const bands = model.scoreBands ?? [];
    if (bands.length >= 3) {
      const order: ScoreBand[] = ['RED', 'ORANGE', 'GREEN'];
      const sorted = [...bands].sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band));
      setBandsDraft(sorted.map((b) => ({ band: b.band, scoreMin: b.scoreMin, scoreMax: b.scoreMax, label: b.label ?? '' })));
    } else {
      setBandsDraft([
        { band: 'RED', scoreMin: 0, scoreMax: 100, label: 'High risk' },
        { band: 'ORANGE', scoreMin: 100, scoreMax: 180, label: 'Review' },
        { band: 'GREEN', scoreMin: 180, scoreMax: null, label: 'Acceptable' },
      ]);
    }
  }, [model?.id, model?.scoreBands]);

  const selectedCriterion = model?.criteria?.find((c) => c.id === selectedCriterionId) ?? filteredCriteria[0]
    ?? model?.criteria?.[0];
  const rules = selectedCriterion?.rules ?? [];
  const ruleCount = rules.length;

  const referenceDomain = selectedCriterion?.referenceDomainCode ?? (selectedCriterion?.key ? REFERENCE_DOMAIN_BY_CRITERION_KEY[selectedCriterion.key] : undefined);
  const { data: referenceOptions = [] } = useQuery({
    queryKey: ['reference-data', referenceDomain, locale],
    queryFn: () => getReferenceOptions(referenceDomain!, locale),
    enabled: !!referenceDomain,
  });
  const [enumSearch, setEnumSearch] = useState('');
  const [editModalEnumSearch, setEditModalEnumSearch] = useState('');
  const filteredReferenceOptions = referenceOptions.filter(
    (o) => !enumSearch.trim() || o.label.toLowerCase().includes(enumSearch.toLowerCase()) || o.code.toLowerCase().includes(enumSearch.toLowerCase())
  );
  const filteredReferenceOptionsEdit = referenceOptions.filter(
    (o) => !editModalEnumSearch.trim() || o.label.toLowerCase().includes(editModalEnumSearch.toLowerCase()) || o.code.toLowerCase().includes(editModalEnumSearch.toLowerCase())
  );

  if (!id) {
    navigate('/scoring');
    return null;
  }
  if (isLoading || !model) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-daret-muted">Loading…</div>
      </div>
    );
  }

  function handleAddCriterion() {
    const key = addCriterionKey.trim() || `criterion_${Date.now()}`;
    const label = addCriterionLabel.trim() || key;
    createCriterionMu.mutate({ key, label, criterionType: addCriterionType });
  }

  function handleAddRule(criterionId: string, criterionType: string) {
    const body: { valueMin?: number; valueMax?: number; enumValue?: string; bandLabel?: string; points: number } = {
      points: newRulePoints,
    };
    if (criterionType === 'NUMERIC_RANGE') {
      const min = newRuleMin === '' ? undefined : Number(newRuleMin);
      const max = newRuleMax === '' ? undefined : Number(newRuleMax);
      if (min != null) body.valueMin = min;
      if (max != null) body.valueMax = max;
      if (newRuleBand) body.bandLabel = newRuleBand;
    } else {
      if (newRuleEnum) body.enumValue = newRuleEnum;
      if (newRuleBand) body.bandLabel = newRuleBand;
    }
    createRuleMu.mutate({ criterionId, body });
  }

  function openEditRule(rule: ScoringRuleDto) {
    setEditingRule(rule);
    setEditRulePoints(rule.points);
    setEditRuleMin(rule.valueMin != null ? String(rule.valueMin) : '');
    setEditRuleMax(rule.valueMax != null ? String(rule.valueMax) : '');
    setEditRuleEnum(rule.enumValue ?? '');
    setEditRuleBand(rule.bandLabel ?? '');
    setEditModalEnumSearch('');
  }

  function handleSaveEditRule() {
    if (!editingRule) return;
    const isNumeric = selectedCriterion?.criterionType === 'NUMERIC_RANGE';
    const body: { valueMin?: number; valueMax?: number; enumValue?: string; bandLabel?: string; points?: number } = {
      points: editRulePoints,
    };
    if (isNumeric) {
      if (editRuleMin !== '') body.valueMin = Number(editRuleMin);
      if (editRuleMax !== '') body.valueMax = Number(editRuleMax);
      if (editRuleBand) body.bandLabel = editRuleBand;
    } else {
      if (editRuleEnum) body.enumValue = editRuleEnum;
      if (editRuleBand) body.bandLabel = editRuleBand;
    }
    updateRuleMu.mutate({ ruleId: editingRule.id, body });
  }

  const isNumeric = selectedCriterion?.criterionType === 'NUMERIC_RANGE';

  return (
    <>
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3 text-sm text-daret-muted">
          <button
            onClick={() => navigate('/scoring')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-daret-border px-3 py-1.5 text-daret-muted hover:text-daret-fg hover:bg-daret-dark/50 transition"
            aria-label={t('scoring.goBackToScorecards')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('scoring.goBack')}
          </button>
          <span className="flex items-center gap-2">
            <button onClick={() => navigate('/scoring')} className="hover:text-daret-green">
              {t('scoring.title')}
            </button>
            <span aria-hidden>/</span>
            <span className="text-daret-fg">{model.name}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {editNameOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-xl font-semibold min-w-[200px]"
                placeholder={t('scoring.scorecardNamePlaceholder')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => updateNameMu.mutate(nameDraft.trim() || model.name)}
                disabled={updateNameMu.isPending || !nameDraft.trim()}
                className="rounded-lg bg-daret-green text-daret-dark px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {updateNameMu.isPending ? t('scoring.saving') : t('scoring.save')}
              </button>
              <button
                type="button"
                onClick={() => setEditNameOpen(false)}
                className="rounded-lg border border-daret-border text-daret-muted px-3 py-2 text-sm"
              >
                {t('scoring.cancel')}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-daret-fg">{model.name}</h1>
              <button
                type="button"
                onClick={() => setEditNameOpen(true)}
                className="p-1.5 rounded text-daret-muted hover:text-daret-green hover:bg-daret-green/10 transition"
                aria-label={t('scoring.renameAria')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </>
          )}
          <span
            className={`text-xs font-medium px-2 py-1 rounded capitalize ${
              model.status === 'ACTIVE' ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-border/50 text-daret-muted'
            }`}
          >
            {model.status === 'ACTIVE' ? t('scoring.statusActive') : model.status === 'DRAFT' ? t('scoring.statusDraft') : model.status === 'ARCHIVED' ? t('scoring.statusArchived') : model.status}
          </span>
        </div>
        {model.description && <p className="text-daret-muted text-sm">{model.description}</p>}

        <nav className="flex gap-1 border-b border-daret-border" aria-label="Scorecard sections">
          {SCORECARD_TAB_KEYS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScorecardTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                scorecardTab === tab.key
                  ? 'border-daret-green text-daret-green bg-daret-card'
                  : 'border-transparent text-daret-muted hover:text-daret-fg hover:bg-daret-dark/50'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        {scorecardTab === 'informations' && (
          <>
            <p className="text-daret-muted text-xs mt-4">
              {t('scoring.scorecardCurrencyIntro').replace('{{currency}}', model.baseCurrency ?? 'EUR')}
            </p>
            <h2 className="text-base font-semibold text-daret-fg mt-6 mb-2">{t('scoring.decisionConfiguration')}</h2>
            <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-2">
              <h3 className="font-medium text-daret-fg mb-2">{t('scoring.pointsRiskBands')}</h3>
              <p className="text-daret-muted text-xs mb-4">
                {t('scoring.pointsRiskBandsDesc')}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-daret-border text-left text-daret-muted">
                      <th className="py-2 pr-4">{t('scoring.band')}</th>
                      <th className="py-2 pr-4">{t('scoring.scoreMinInclusive')}</th>
                      <th className="py-2 pr-4">{t('scoring.scoreMaxExclusive')}</th>
                      <th className="py-2 pr-4">{t('scoring.label')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bandsDraft.map((b, idx) => (
                      <tr key={b.band} className="border-b border-daret-border/50">
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              b.band === 'GREEN' ? 'bg-green-500' : b.band === 'ORANGE' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            aria-hidden
                          />
                          <span className="ml-2 font-medium text-daret-fg capitalize">{b.band.toLowerCase()}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            value={b.scoreMin}
                            onChange={(e) => {
                              const next = [...bandsDraft];
                              next[idx] = { ...next[idx], scoreMin: parseInt(e.target.value, 10) || 0 };
                              setBandsDraft(next);
                            }}
                            className="w-24 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            value={b.scoreMax ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const next = [...bandsDraft];
                              next[idx] = { ...next[idx], scoreMax: v === '' ? null : parseInt(v, 10) ?? null };
                              setBandsDraft(next);
                            }}
                            placeholder={t('scoring.noMaxPlaceholder')}
                            className="w-24 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            value={b.label}
                            onChange={(e) => {
                              const next = [...bandsDraft];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setBandsDraft(next);
                            }}
                            placeholder={t('scoring.optionalLabelPlaceholder')}
                            className="min-w-[120px] rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bandsSaveError && (
                <p className="mt-2 text-sm text-red-400">
                  {bandsSaveError === '__FAILED_TO_SAVE_BANDS__' ? t('scoring.failedToSaveBands') : bandsSaveError}
                </p>
              )}
              <button
                type="button"
                onClick={() => updateBandsMu.mutate(bandsDraft)}
                disabled={updateBandsMu.isPending}
                className="mt-4 rounded-lg border border-daret-border hover:border-daret-green text-daret-muted hover:text-daret-fg py-2 px-3 text-sm font-medium disabled:opacity-50"
              >
                {updateBandsMu.isPending ? t('scoring.saving') : t('scoring.saveScoreBands')}
              </button>
            </div>
            <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-6">
              <h3 className="font-medium text-daret-fg mb-2">{t('scoring.fraudRecommendationPolicy')}</h3>
              <p className="text-daret-muted text-xs mb-4">
                {t('scoring.fraudRecommendationPolicyDesc')}
              </p>
              {fraudPolicyDraft && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fraudPolicyDraft.blockIfAnyBlockingRule !== false}
                      onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, blockIfAnyBlockingRule: e.target.checked }))}
                      className="rounded border-daret-border"
                    />
                    <span className="text-daret-fg">{t('scoring.blockIfAnyBlockingRule')}</span>
                  </label>
                  <div>
                    <span className="text-daret-muted block mb-1 inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                      {t('scoring.redIfCriticalCount')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fraudPolicyDraft.redIfCriticalCount ?? 1}
                      onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, redIfCriticalCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-20 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                    />
                  </div>
                  <div>
                    <span className="text-daret-muted block mb-1 inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                      {t('scoring.redIfHighCount')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fraudPolicyDraft.redIfHighCount ?? 2}
                      onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, redIfHighCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-20 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                    />
                  </div>
                  <div>
                    <span className="text-daret-muted block mb-1 inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" aria-hidden />
                      {t('scoring.orangeIfHighCount')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fraudPolicyDraft.orangeIfHighCount ?? 1}
                      onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, orangeIfHighCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-20 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                    />
                  </div>
                  <div>
                    <span className="text-daret-muted block mb-1 inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" aria-hidden />
                      {t('scoring.orangeIfMediumCount')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fraudPolicyDraft.orangeIfMediumCount ?? 2}
                      onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, orangeIfMediumCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-20 rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                    />
                  </div>
                  <div>
                    <span className="text-daret-muted block mb-1">{t('scoring.defaultNoSignals')}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={fraudPolicyDraft.defaultRecommendation ?? 'GREEN'}
                        onChange={(e) => setFraudPolicyDraft((p) => ({ ...p, defaultRecommendation: e.target.value as 'GREEN' | 'ORANGE' | 'RED' }))}
                        className="rounded bg-daret-dark border border-daret-border px-2 py-1 text-daret-fg"
                      >
                        <option value="GREEN">GREEN</option>
                        <option value="ORANGE">ORANGE</option>
                        <option value="RED">RED</option>
                      </select>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${(fraudPolicyDraft.defaultRecommendation ?? 'GREEN') === 'GREEN' ? 'bg-green-500' : (fraudPolicyDraft.defaultRecommendation ?? 'GREEN') === 'ORANGE' ? 'bg-amber-500' : 'bg-red-500'}`} aria-hidden title={(fraudPolicyDraft.defaultRecommendation ?? 'GREEN')} />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => updateFraudPolicyMu.mutate(fraudPolicyDraft ?? null)}
                disabled={updateFraudPolicyMu.isPending || !fraudPolicyDraft}
                className="mt-4 rounded-lg border border-daret-border hover:border-daret-green text-daret-muted hover:text-daret-fg py-2 px-3 text-sm font-medium disabled:opacity-50"
              >
                {updateFraudPolicyMu.isPending ? t('scoring.saving') : t('scoring.saveFraudPolicy')}
              </button>
            </div>
            <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-6">
              <h3 className="font-medium text-daret-fg mb-2">{t('scoring.finalDecisionMatrix')}</h3>
              <p className="text-daret-muted text-xs mb-4">
                {t('scoring.finalDecisionMatrixDesc')}
              </p>
              {matrixDraft && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-daret-border">
                        <th className="text-left py-2 pr-4 text-daret-muted font-normal">{t('scoring.pointsFraudMatrixHeader')}</th>
                        {FRAUD_BANDS.map((f) => (
                          <th key={f} className="py-2 px-2 text-center text-daret-muted font-normal">
                            <span className="inline-flex items-center justify-center gap-1">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${f === 'GREEN' ? 'bg-green-500' : f === 'ORANGE' ? 'bg-amber-500' : f === 'RED' ? 'bg-red-500' : 'bg-red-700'}`} aria-hidden />
                              {f}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {POINTS_BANDS.map((points) => (
                        <tr key={points} className="border-b border-daret-border/50">
                          <td className="py-2 pr-4">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${points === 'GREEN' ? 'bg-green-500' : points === 'ORANGE' ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <span className="font-medium text-daret-fg">{points}</span>
                          </td>
                          {FRAUD_BANDS.map((fraud) => (
                            <td key={fraud} className="py-1.5 px-1">
                              <select
                                value={matrixDraft[points]?.[fraud] ?? DEFAULT_FINAL_MATRIX[points]?.[fraud] ?? 'REVIEW'}
                                onChange={(e) => {
                                  const value = e.target.value as typeof FINAL_OUTCOMES[number];
                                  setMatrixDraft((prev) => ({
                                    ...prev,
                                    [points]: { ...(prev?.[points] ?? DEFAULT_FINAL_MATRIX[points]), [fraud]: value },
                                  }));
                                }}
                                className="w-full rounded bg-daret-dark border border-daret-border px-2 py-1.5 text-daret-fg text-xs"
                              >
                                {FINAL_OUTCOMES.map((out) => (
                                  <option key={out} value={out}>{out}</option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={() => updateMatrixMu.mutate(matrixDraft ?? null)}
                disabled={updateMatrixMu.isPending || !matrixDraft}
                className="mt-4 rounded-lg border border-daret-border hover:border-daret-green text-daret-muted hover:text-daret-fg py-2 px-3 text-sm font-medium disabled:opacity-50"
              >
                {updateMatrixMu.isPending ? t('scoring.saving') : t('scoring.saveFinalMatrix')}
              </button>
            </div>
            <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-6">
              <h3 className="font-medium text-daret-fg mb-2">{t('scoring.blacklistPolicyTitle')}</h3>
              <p className="text-daret-muted text-xs mb-3 leading-relaxed">
                {t('scoring.blacklistPolicyDesc')}
              </p>
              <p className="text-daret-muted text-xs leading-relaxed border-t border-daret-border/60 pt-3">
                {t('scoring.blacklistPolicyNote')}
              </p>
            </div>
          </>
        )}

        {scorecardTab === 'fraud-rules' && (
          <div className="mt-4">
            <div className="bg-daret-card border border-daret-border rounded-xl p-5">
            <h3 className="font-medium text-daret-fg mb-1">{t('scoring.fraudRulesTitle')}</h3>
            <p className="text-daret-muted text-sm mb-4">
              {t('scoring.fraudRulesDesc')}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-daret-border text-left text-daret-muted">
                    <th className="py-3 pr-4">{t('scoring.rule')}</th>
                    <th className="py-3 pr-4">{t('scoring.key')}</th>
                    <th className="py-3 pr-4">{t('scoring.category')}</th>
                    <th className="py-3 pr-4">{t('scoring.severity')}</th>
                    <th className="py-3 pr-4">{t('scoring.blocking')}</th>
                    <th className="py-3 pr-4">{t('scoring.status')}</th>
                    <th className="py-3 pr-4">{t('scoring.activeForScorecard')}</th>
                    <th className="py-3 pl-2 text-center w-24">{t('scoring.info')}</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudRulesLibrary.map((rule) => {
                    const assignment = model.scorecardFraudRules?.find((a) => a.fraudRuleId === rule.id);
                    const enabled = assignment?.enabled ?? false;
                    const implemented = IMPLEMENTED_FRAUD_RULE_KEYS.includes(rule.key);
                    return (
                      <tr key={rule.id} className="border-b border-daret-border/50 hover:bg-daret-dark/30">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-daret-fg">{rule.name}</span>
                          {rule.description && <p className="text-daret-muted text-xs mt-1 max-w-md">{rule.description}</p>}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-daret-muted">{rule.key}</td>
                        <td className="py-3 pr-4 text-daret-muted capitalize">{rule.ruleType?.toLowerCase() ?? '—'}</td>
                        <td className="py-3 pr-4">
                          {rule.severity ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
                              rule.severity === 'CRITICAL' ? 'bg-red-600/30 text-red-300' :
                              rule.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                              rule.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-daret-muted/30 text-daret-muted'
                            }`}>
                              {rule.severity}
                            </span>
                          ) : (
                            <span className="text-daret-muted">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => updateBlockingMu.mutate({ fraudRuleId: rule.id, isBlocking: !(rule.isBlocking ?? false) })}
                            disabled={updateBlockingMu.isPending}
                            className={`text-xs font-medium px-2 py-1 rounded ${rule.isBlocking ? 'bg-red-600/20 text-red-400' : 'bg-daret-border/50 text-daret-muted hover:bg-daret-border'}`}
                            title={rule.isBlocking ? 'Blocking: if triggered, fraud recommendation becomes BLOCK (when policy is enabled)' : 'Not blocking: click to mark as blocking'}
                          >
                            {rule.isBlocking ? t('scoring.blockingLabel') : t('scoring.notBlocking')}
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          {implemented ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-daret-green/20 text-daret-green">{t('scoring.implemented')}</span>
                          ) : (
                            <span className="text-xs text-daret-muted">Not implemented</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => updateFraudRuleMu.mutate({ fraudRuleId: rule.id, enabled: !enabled })}
                            disabled={updateFraudRuleMu.isPending || !implemented}
                            title={!implemented ? 'Only implemented rules can be activated' : undefined}
                            className={`text-xs font-medium px-3 py-1.5 rounded ${enabled ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-border/50 text-daret-muted hover:bg-daret-border'} ${!implemented ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {enabled ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td className="py-3 pl-2 align-middle">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => { setFraudRuleDetailDrawerRule(rule); setFraudRuleTooltipRule(null); }}
                              onMouseEnter={() => setFraudRuleTooltipRule(rule)}
                              onMouseLeave={() => setFraudRuleTooltipRule(null)}
                              className="inline-flex items-center gap-1 text-daret-muted hover:text-daret-fg focus:outline-none focus:ring-2 focus:ring-daret-fg/50 rounded px-1 py-0.5"
                              title="View rule details"
                              aria-label={`Rule details: ${rule.name}`}
                            >
                              <span className="text-base leading-none" aria-hidden>ⓘ</span>
                              <span className="text-xs text-daret-muted hover:text-daret-fg hidden sm:inline">View rule details</span>
                            </button>
                            {fraudRuleTooltipRule?.id === rule.id && (
                              <div className="absolute z-50 right-0 top-full mt-1 w-72 p-3 rounded-lg bg-daret-dark border border-daret-border shadow-xl text-left">
                                <p className="font-medium text-daret-fg">{rule.name}</p>
                                {rule.description && <p className="text-sm text-daret-muted mt-1">{rule.description}</p>}
                                <p className="text-xs mt-2"><span className="text-daret-muted">Severity:</span> <span className="font-medium">{rule.severity ?? '—'}</span></p>
                                <p className="text-xs"><span className="text-daret-muted">Blocking:</span> {rule.isBlocking ? 'Yes' : 'No'}</p>
                                {Array.isArray(rule.signalsUsed) && rule.signalsUsed.length > 0 && (
                                  <p className="text-xs mt-1"><span className="text-daret-muted">Signals used:</span><br /><span className="font-mono text-daret-fg">{rule.signalsUsed.join(', ')}</span></p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fraudRulesLibrary.length === 0 && <p className="text-daret-muted text-sm py-4">No fraud rules in library.</p>}
            </div>
          </div>
        )}

        {scorecardTab === 'module-orchestration' && (
          <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-4">
            <h3 className="font-medium text-daret-fg mb-2">{t('scoring.tabModuleOrchestration')}</h3>
            <p className="text-daret-muted text-xs mb-4">
              {t('scoring.moduleOrchestrationIntro')}
            </p>
            <ul className="space-y-3">
              {availableModules.map((mod) => {
                const config = model.scorecardModules?.find((m) => m.moduleKey === mod.key);
                const enabled = config?.enabled ?? true;
                const title = t(`scoring.modules.${mod.key}.title`);
                const desc = t(`scoring.modules.${mod.key}.description`);
                return (
                  <li key={mod.key} className="flex items-center justify-between py-2 border-b border-daret-border/50 last:border-0">
                    <div>
                      <span className="font-medium text-daret-fg">{title.startsWith('scoring.') ? mod.name : title}</span>
                      <p className="text-daret-muted text-xs mt-0.5">{desc.startsWith('scoring.') ? mod.description : desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = availableModules.map((m) => ({
                          moduleKey: m.key,
                          enabled: m.key === mod.key ? !enabled : (model.scorecardModules?.find((x) => x.moduleKey === m.key)?.enabled ?? true),
                        }));
                        updateModulesMu.mutate(next);
                      }}
                      disabled={updateModulesMu.isPending}
                      className={`text-xs font-medium px-3 py-1.5 rounded ${enabled ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-border/50 text-daret-muted'}`}
                    >
                      {enabled ? t('scoring.moduleEnabled') : t('scoring.moduleDisabled')}
                    </button>
                  </li>
                );
              })}
            </ul>
            {availableModules.length === 0 && <p className="text-daret-muted text-sm py-4">No modules registered.</p>}
          </div>
        )}

        {scorecardTab === 'history' && (
          <div className="bg-daret-card border border-daret-border rounded-xl p-5 mt-4">
            <h3 className="font-medium text-daret-fg mb-2">History of modifications</h3>
            <p className="text-daret-muted text-xs mb-4">
              Recent changes to this scorecard (module toggles, fraud rule activation, etc.).
            </p>
            <ul className="space-y-2">
              {auditLogs.map((log) => (
                <li key={log.id} className="text-sm border-l-2 border-daret-border pl-3 py-1">
                  <span className="font-medium text-daret-fg">{log.action}</span>
                  {log.entityType && <span className="text-daret-muted ml-2">{log.entityType}</span>}
                  <span className="text-daret-muted ml-2">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
            {auditLogs.length === 0 && <p className="text-daret-muted text-sm py-4">No changes recorded yet.</p>}
          </div>
        )}

        {scorecardTab === 'daret-points' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-1 bg-daret-card border border-daret-border rounded-xl p-4">
            <h3 className="font-medium text-daret-fg mb-3">Criteria</h3>
            <div className="flex gap-1 mb-3">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCriteriaFilter(f)}
                  className={`px-2 py-1.5 text-xs font-medium rounded capitalize ${
                    criteriaFilter === f
                      ? 'bg-daret-green/20 text-daret-green'
                      : 'text-daret-muted hover:bg-daret-dark hover:text-daret-fg'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
            <ul className="space-y-1">
              {filteredCriteria.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setSelectedCriterionId(c.id)}
                      className={`flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-sm truncate ${
                        selectedCriterionId === c.id || (!selectedCriterionId && c.id === filteredCriteria[0]?.id)
                          ? 'bg-daret-green/20 text-daret-green'
                          : 'text-daret-muted hover:bg-daret-dark hover:text-daret-fg'
                      }`}
                      title={FINANCIAL_CRITERION_KEYS.includes(c.key) ? `Bands in ${model.baseCurrency ?? 'EUR'}` : undefined}
                    >
                      {c.label}
                      {FINANCIAL_CRITERION_KEYS.includes(c.key) && (
                        <span className="text-daret-muted font-normal"> — {model.baseCurrency ?? 'EUR'}</span>
                      )}
                    </button>
                    <span
                      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                        c.isActive ? 'bg-daret-green/20 text-daret-green' : 'bg-daret-border/50 text-daret-muted'
                      }`}
                    >
                      {c.isActive ? 'On' : 'Off'}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCriterionMu.mutate({ criterionId: c.id, isActive: !c.isActive })}
                      disabled={updateCriterionMu.isPending}
                      className="shrink-0 text-daret-muted hover:text-daret-fg text-xs px-1.5 py-1 rounded border border-daret-border hover:border-daret-green disabled:opacity-50"
                      title={c.isActive ? 'Deactivate criterion' : 'Activate criterion'}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-daret-border space-y-2">
              <input
                type="text"
                placeholder="Key (e.g. age)"
                value={addCriterionKey}
                onChange={(e) => setAddCriterionKey(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm"
              />
              <input
                type="text"
                placeholder="Label"
                value={addCriterionLabel}
                onChange={(e) => setAddCriterionLabel(e.target.value)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm"
              />
              <select
                value={addCriterionType}
                onChange={(e) => setAddCriterionType(e.target.value as ScoringCriterionType)}
                className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm"
              >
                {CRITERION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddCriterion}
                disabled={createCriterionMu.isPending}
                className="w-full rounded-lg border border-daret-border hover:border-daret-green text-daret-muted py-2 text-sm font-medium disabled:opacity-50"
              >
                Add criterion
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-daret-card border border-daret-border rounded-xl p-5">
            {selectedCriterion ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-daret-fg">{selectedCriterion.label}</h3>
                  <button
                    onClick={() => deleteCriterionMu.mutate(selectedCriterion.id)}
                    disabled={deleteCriterionMu.isPending}
                    className="text-sm text-red-400 hover:underline disabled:opacity-50"
                  >
                    Delete criterion
                  </button>
                </div>
                <p className="text-daret-muted text-sm mb-4">
                  Key: <code className="bg-daret-dark px-1 rounded">{selectedCriterion.key}</code> · Type: {selectedCriterion.criterionType}
                  {FINANCIAL_CRITERION_KEYS.includes(selectedCriterion.key) && (
                    <span className="ml-2"> · Bands in <strong>{model.baseCurrency ?? 'EUR'}</strong></span>
                  )}
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-daret-border text-left text-daret-muted">
                      {isNumeric ? (
                        <>
                          <th className="py-2 pr-4">Minimum (inclusive) {FINANCIAL_CRITERION_KEYS.includes(selectedCriterion.key) ? `(${model.baseCurrency ?? 'EUR'})` : ''}</th>
                          <th className="py-2 pr-4">Maximum (exclusive) {FINANCIAL_CRITERION_KEYS.includes(selectedCriterion.key) ? `(${model.baseCurrency ?? 'EUR'})` : ''}</th>
                        </>
                      ) : (
                          <th className="py-2 pr-4">Value</th>
                      )}
                      <th className="py-2 pr-4">Band label</th>
                      <th className="py-2 pr-4">Points</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className="border-b border-daret-border/50">
                        {isNumeric ? (
                          <>
                            <td className="py-2 pr-4 text-daret-fg">{r.valueMin != null ? String(r.valueMin) : '—'}</td>
                            <td className="py-2 pr-4 text-daret-fg">{r.valueMax != null ? String(r.valueMax) : '—'}</td>
                          </>
                        ) : (
                            <td className="py-2 pr-4 text-daret-fg">
                              {referenceDomain && r.enumValue ? (
                                <>
                                  <span>{getReferenceLabel(referenceDomain, r.enumValue, locale) ?? r.enumValue}</span>
                                  <span className="ml-2 text-xs font-mono text-daret-muted" title="Canonical code">{r.enumValue}</span>
                                </>
                              ) : (
                                r.enumValue ?? '—'
                              )}
                            </td>
                        )}
                        <td className="py-2 pr-4 text-daret-muted">{r.bandLabel ?? '—'}</td>
                        <td className="py-2 pr-4 text-daret-fg">{r.points}</td>
                        <td className="py-2">
                          <button
                            onClick={() => openEditRule(r)}
                            className="text-daret-muted hover:text-daret-green text-xs mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRuleMu.mutate(r.id)}
                            className="text-daret-muted hover:text-red-400 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-daret-muted text-xs mt-2">
                  Displaying 1 to {ruleCount} of {ruleCount} {ruleCount === 1 ? 'element' : 'elements'}
                </p>
                {addRuleOpen === selectedCriterion.id ? (
                  <div className="mt-4 p-4 rounded-lg bg-daret-dark border border-daret-border space-y-2">
                    {isNumeric ? (
                      <>
                        <input
                          type="number"
                          placeholder="Min (inclusive)"
                          value={newRuleMin}
                          onChange={(e) => setNewRuleMin(e.target.value)}
                          className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Max (exclusive)"
                          value={newRuleMax}
                          onChange={(e) => setNewRuleMax(e.target.value)}
                          className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                        />
                      </>
                    ) : referenceOptions.length > 0 ? (
                      <div className="space-y-1">
                        {referenceOptions.length > 8 && (
                          <input
                            type="text"
                            placeholder="Search options…"
                            value={enumSearch}
                            onChange={(e) => setEnumSearch(e.target.value)}
                            className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm placeholder:text-daret-muted"
                          />
                        )}
                        <select
                          value={newRuleEnum}
                          onChange={(e) => setNewRuleEnum(e.target.value)}
                          className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                        >
                          <option value="">Select value (stored as canonical code)</option>
                          {filteredReferenceOptions.map((o) => (
                            <option key={o.code} value={o.code}>{o.label} ({o.code})</option>
                          ))}
                          {filteredReferenceOptions.length === 0 && <option value="">No match</option>}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enum value"
                        value={newRuleEnum}
                        onChange={(e) => setNewRuleEnum(e.target.value)}
                        className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Band label (optional)"
                      value={newRuleBand}
                      onChange={(e) => setNewRuleBand(e.target.value)}
                      className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Points"
                      value={newRulePoints}
                      onChange={(e) => setNewRulePoints(Number(e.target.value))}
                      className="w-full rounded bg-daret-card border border-daret-border px-3 py-2 text-daret-fg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddRule(selectedCriterion.id, selectedCriterion.criterionType)}
                        disabled={createRuleMu.isPending}
                        className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                      >
                        Add rule
                      </button>
                      <button
                        onClick={() => setAddRuleOpen(null)}
                        className="rounded-lg border border-daret-border text-daret-muted py-2 px-4 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    {createRuleMu.isError && (
                      <p className="text-sm text-red-400">
                        {(createRuleMu.error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (createRuleMu.error as Error).message}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddRuleOpen(selectedCriterion.id); setEnumSearch(''); }}
                    className="mt-4 rounded-lg border border-daret-border hover:border-daret-green text-daret-muted py-2 px-4 text-sm font-medium"
                  >
                    + Add rule
                  </button>
                )}
              </>
            ) : (
              <p className="text-daret-muted text-sm">Select a criterion or add one.</p>
            )}
          </div>
        </div>
        )}
      </div>

      {editingRule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingRule(null)}>
          <div
            className="bg-daret-card border border-daret-border rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium text-daret-fg mb-4">Edit rule</h3>
            {selectedCriterion?.criterionType === 'NUMERIC_RANGE' ? (
              <>
                <label className="block text-sm text-daret-muted mb-1">Minimum (inclusive)</label>
                <input
                  type="number"
                  value={editRuleMin}
                  onChange={(e) => setEditRuleMin(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-3"
                />
                <label className="block text-sm text-daret-muted mb-1">Maximum (exclusive)</label>
                <input
                  type="number"
                  value={editRuleMax}
                  onChange={(e) => setEditRuleMax(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-3"
                />
              </>
            ) : referenceOptions.length > 0 ? (
              <>
                <label className="block text-sm text-daret-muted mb-1">Value (canonical code)</label>
                {referenceOptions.length > 8 && (
                  <input
                    type="text"
                    placeholder="Search…"
                    value={editModalEnumSearch}
                    onChange={(e) => setEditModalEnumSearch(e.target.value)}
                    className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-2"
                  />
                )}
                <select
                  value={editRuleEnum}
                  onChange={(e) => setEditRuleEnum(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-3"
                >
                  <option value="">Select value</option>
                  {filteredReferenceOptionsEdit.map((o) => (
                    <option key={o.code} value={o.code}>{o.label} ({o.code})</option>
                  ))}
                  {filteredReferenceOptionsEdit.length === 0 && <option value="">No match</option>}
                </select>
              </>
            ) : (
              <>
                <label className="block text-sm text-daret-muted mb-1">Value</label>
                <input
                  type="text"
                  value={editRuleEnum}
                  onChange={(e) => setEditRuleEnum(e.target.value)}
                  className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-3"
                />
              </>
            )}
            <label className="block text-sm text-daret-muted mb-1">Band label (optional)</label>
            <input
              type="text"
              value={editRuleBand}
              onChange={(e) => setEditRuleBand(e.target.value)}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-3"
            />
            <label className="block text-sm text-daret-muted mb-1">Points</label>
            <input
              type="number"
              value={editRulePoints}
              onChange={(e) => setEditRulePoints(Number(e.target.value))}
              className="w-full rounded-lg bg-daret-dark border border-daret-border px-3 py-2 text-daret-fg text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEditRule}
                disabled={updateRuleMu.isPending}
                className="rounded-lg bg-daret-green hover:bg-daret-green-dim text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditingRule(null)}
                className="rounded-lg border border-daret-border text-daret-muted py-2 px-4 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {fraudRuleDetailDrawerRule && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => setFraudRuleDetailDrawerRule(null)} />
        <div className="relative w-full max-w-lg bg-daret-card border-l border-daret-border shadow-xl flex flex-col max-h-full overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-daret-border">
            <h3 className="font-semibold text-daret-fg">Rule details</h3>
            <button
              type="button"
              onClick={() => setFraudRuleDetailDrawerRule(null)}
              className="p-2 text-daret-muted hover:text-daret-fg rounded focus:outline-none focus:ring-2 focus:ring-daret-fg/50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            <div>
              <h4 className="font-medium text-daret-fg mb-1">Rule name</h4>
              <p className="text-daret-fg">{fraudRuleDetailDrawerRule.name}</p>
              <p className="font-mono text-xs text-daret-muted mt-0.5">{fraudRuleDetailDrawerRule.key}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">1. Rule overview</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.detailedExplanation ?? fraudRuleDetailDrawerRule.description ?? '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">2. Why this rule exists</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.description ?? fraudRuleDetailDrawerRule.detailedExplanation ?? '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">3. Signals used</h4>
              {Array.isArray(fraudRuleDetailDrawerRule.signalsUsed) && fraudRuleDetailDrawerRule.signalsUsed.length > 0 ? (
                <ul className="list-disc list-inside text-daret-muted font-mono text-xs space-y-0.5">
                  {fraudRuleDetailDrawerRule.signalsUsed.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-daret-muted">—</p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">4. Detection logic</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.detectionLogic ?? '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">5. Example scenario</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.exampleScenario ?? '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">6. Severity rationale</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.severityRationale ?? '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-daret-fg mb-1">7. Blocking behavior</h4>
              <p className="text-daret-muted whitespace-pre-wrap">{fraudRuleDetailDrawerRule.blockingBehavior ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
