import { useState } from 'react';
import type { BridgeGrantingSummary } from '../../../../api/bridge';
import {
  GRANTING_THEME,
  scoreBarColor,
  severityDotClass,
  severityLabelKey,
  type GrantingSummaryViewProps,
} from './grantingSummaryTheme';
import {
  AttentionPointTransactionsModal,
  collectTransactionsByCategory,
} from './AttentionPointTransactionsModal';

function ClipboardIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function GrantingSummaryHeader({
  data,
  t,
  theme,
  expanded,
  onToggle,
}: {
  data: BridgeGrantingSummary;
  t: (key: string) => string;
  theme: (typeof GRANTING_THEME)[keyof typeof GRANTING_THEME];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex items-start gap-3 min-w-0 text-left rounded-md -ml-1 pl-1 pr-2 py-0.5 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200/70">
          <ClipboardIcon />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold text-slate-900 leading-snug">
              {t('bridge.granting.title')}
            </h4>
            <ChevronIcon expanded={expanded} />
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">{t('bridge.granting.subtitle')}</p>
          {!expanded && (
            <p className="text-[12px] text-slate-600 mt-1.5 line-clamp-2 leading-snug">
              {data.recommendation.headline}
            </p>
          )}
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${theme.statusBadge}`}
        >
          {data.recommendation.label}
        </span>
        <GrantingScoreWidget data={data} t={t} />
      </div>
    </div>
  );
}

function GrantingScoreWidget({
  data,
  t,
}: {
  data: BridgeGrantingSummary;
  t: (key: string) => string;
}) {
  const barColor = scoreBarColor(data.score.value, data.recommendation.status);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 min-w-[148px]"
      title={t('bridge.granting.scoreTooltip')}
    >
      <p className="text-[11px] text-slate-500">{t('bridge.granting.scoreShortLabel')}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-sm font-semibold tabular-nums text-slate-800">{data.score.value}</span>
        <span className="text-[11px] text-slate-400">/100</span>
      </div>
      <div
        className="mt-2 h-1 rounded-full bg-slate-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={data.score.value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('bridge.granting.scoreShortLabel')}
      >
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${data.score.value}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-1.5">
        {t(`bridge.granting.confidence${data.score.confidence}`)}
      </p>
    </div>
  );
}

function ExecutiveDecisionNote({
  data,
  theme,
}: {
  data: BridgeGrantingSummary;
  theme: (typeof GRANTING_THEME)[keyof typeof GRANTING_THEME];
}) {
  return (
    <div className={`border-l-2 ${theme.noteBorder} ${theme.noteBg} rounded-r-md px-4 py-3 max-w-3xl`}>
      <p className="text-[13px] font-semibold text-slate-900 leading-snug">{data.recommendation.headline}</p>
      <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{data.recommendation.explanation}</p>
    </div>
  );
}

function EvidencePanelHeader({ dotClass, title }: { dotClass: string; title: string }) {
  return (
    <h5 className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-slate-500 uppercase mb-3">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
      {title}
    </h5>
  );
}

function PositiveSignalItem({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="py-2 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0">
      <div className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
        </div>
      </div>
    </li>
  );
}

function AttentionPointItem({
  label,
  detail,
  severity,
  transactionCategory,
  onViewTransactions,
  t,
}: {
  label: string;
  detail: string;
  severity: string;
  transactionCategory?: string | null;
  onViewTransactions?: (category: string, title: string) => void;
  t: (key: string) => string;
}) {
  const clickable = !!transactionCategory && !!onViewTransactions;

  return (
    <li className="py-2 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 min-w-0 flex-1">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${severityDotClass(severity)}`} aria-hidden />
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
        </div>
        <span className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {t(severityLabelKey(severity))}
        </span>
      </div>
      {clickable ? (
        <button
          type="button"
          onClick={() => onViewTransactions(transactionCategory!, label)}
          className="mt-0.5 ml-3.5 text-left text-[12px] text-sky-700 hover:text-sky-900 hover:underline leading-relaxed group"
        >
          {detail}
          <span className="ml-1 text-sky-600/80 group-hover:text-sky-800">→ {t('bridge.granting.viewTransactions')}</span>
        </button>
      ) : (
        <p className="text-[12px] text-slate-500 mt-0.5 ml-3.5 leading-relaxed">{detail}</p>
      )}
    </li>
  );
}

function RecommendedActionItem({ index, label, detail }: { index: number; label: string; detail: string }) {
  return (
    <li className="py-2 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0">
      <div className="flex gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 tabular-nums">
          {index}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
        </div>
      </div>
    </li>
  );
}

function DecisionSupportFooter({
  disclaimer,
  t,
  onOpenBalanceAnalysis,
  onOpenSpendingAnalysis,
}: {
  disclaimer: string;
  t: (key: string) => string;
  onOpenBalanceAnalysis?: () => void;
  onOpenSpendingAnalysis?: () => void;
}) {
  const hasActions = onOpenBalanceAnalysis || onOpenSpendingAnalysis;

  return (
    <footer className="mt-5 pt-4 border-t border-slate-100">
      {hasActions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <p className="text-[11px] font-medium text-slate-500">{t('bridge.granting.analysisActions')}</p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {onOpenBalanceAnalysis && (
              <button
                type="button"
                onClick={onOpenBalanceAnalysis}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <ChartBarIcon />
                {t('bridge.granting.viewBalanceAnalysis')}
              </button>
            )}
            {onOpenSpendingAnalysis && (
              <button
                type="button"
                onClick={onOpenSpendingAnalysis}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <ChartBarIcon />
                {t('bridge.granting.viewSpendingAnalysis')}
              </button>
            )}
          </div>
        </div>
      )}
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
        <InfoIcon />
        <span>{disclaimer}</span>
      </p>
    </footer>
  );
}

export function GrantingSummaryView({
  data,
  t,
  accounts = [],
  onOpenBalanceAnalysis,
  onOpenSpendingAnalysis,
}: GrantingSummaryViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [txModal, setTxModal] = useState<{ category: string; title: string } | null>(null);
  const theme = GRANTING_THEME[data.recommendation.status];

  const modalTransactions = txModal
    ? collectTransactionsByCategory(accounts, txModal.category, t('bridge.accountFallback'))
    : [];

  function handleViewTransactions(category: string, title: string) {
    setTxModal({ category, title });
  }

  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white shadow-sm border-l-[3px] ${theme.accentBorder} px-5 py-4`}
    >
      <GrantingSummaryHeader
        data={data}
        t={t}
        theme={theme}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />

      {expanded && (
        <>
      <div className="mt-4">
        <ExecutiveDecisionNote data={data} theme={theme} />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="rounded-lg border border-slate-100 bg-white p-3">
          <EvidencePanelHeader dotClass="bg-emerald-500" title={t('bridge.granting.positiveSignals')} />
          {data.positiveSignals.length === 0 ? (
            <p className="text-[12px] text-slate-500">{t('bridge.granting.noPositiveSignals')}</p>
          ) : (
            <ul>
              {data.positiveSignals.map((s) => (
                <PositiveSignalItem key={s.label} label={s.label} detail={s.detail} />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-3">
          <EvidencePanelHeader dotClass={theme.panelDot} title={t('bridge.granting.attentionPoints')} />
          {data.attentionPoints.length === 0 ? (
            <p className="text-[12px] text-slate-500">{t('bridge.granting.noAttentionPoints')}</p>
          ) : (
            <ul>
              {data.attentionPoints.map((p) => (
                <AttentionPointItem
                  key={`${p.label}-${p.detail}`}
                  label={p.label}
                  detail={p.detail}
                  severity={p.severity}
                  transactionCategory={p.transactionCategory}
                  onViewTransactions={accounts.length > 0 ? handleViewTransactions : undefined}
                  t={t}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-3">
          <EvidencePanelHeader dotClass="bg-sky-500" title={t('bridge.granting.recommendedActions')} />
          {data.recommendedActions.length === 0 ? (
            <p className="text-[12px] text-slate-500">{t('bridge.granting.noActions')}</p>
          ) : (
            <ol className="list-none">
              {data.recommendedActions.map((a, i) => (
                <RecommendedActionItem key={a.label} index={i + 1} label={a.label} detail={a.detail} />
              ))}
            </ol>
          )}
        </section>
      </div>

      <DecisionSupportFooter
        disclaimer={data.disclaimer}
        t={t}
        onOpenBalanceAnalysis={onOpenBalanceAnalysis}
        onOpenSpendingAnalysis={onOpenSpendingAnalysis}
      />
        </>
      )}

      <AttentionPointTransactionsModal
        open={!!txModal}
        onClose={() => setTxModal(null)}
        title={txModal?.title ?? ''}
        transactions={modalTransactions}
        t={t}
      />
    </article>
  );
}
