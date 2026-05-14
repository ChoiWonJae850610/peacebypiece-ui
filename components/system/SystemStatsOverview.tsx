import {
  SYSTEM_COMPANY_USAGE_ROWS,
  SYSTEM_PLAN_DISTRIBUTION,
  SYSTEM_RISK_ITEMS,
  SYSTEM_STORAGE_PURGE_STATS,
  SYSTEM_STORAGE_USAGE_BUCKETS,
  SYSTEM_STATS_OVERVIEW_CARDS,
  getSystemUsageSummary,
  type SystemStatTone,
} from "@/lib/system/systemStats";
import { ADMIN_STATS_CACHE_POLICIES, ADMIN_STATS_TANSTACK_QUERY_DECISION } from "@/lib/admin/stats/cachePolicy";
import { ADMIN_STATS_AGGREGATE_READINESS_ITEMS, ADMIN_STATS_AGGREGATE_READINESS_POLICY } from "@/lib/admin/stats/aggregateReadinessPolicy";
import { ADMIN_STATS_PERFORMANCE_POLICY, ADMIN_STATS_PERFORMANCE_TARGETS } from "@/lib/admin/stats/performancePolicy";
import { getI18n } from "@/lib/i18n";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_NEUTRAL_BADGE_CLASS,
  SYSTEM_PANEL_CLASS,
  SYSTEM_PROGRESS_TRACK_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTLE_CARD_CLASS,
  SYSTEM_SUBTLE_TEXT_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
  SYSTEM_WARNING_BADGE_CLASS,
} from "@/components/system/systemSemanticClassNames";

function getToneClassName(tone: SystemStatTone) {
  if (tone === "success") {
    return "border-[var(--pbp-status-success)] bg-[var(--pbp-status-success-soft)] text-[var(--pbp-status-success)]";
  }

  if (tone === "warning") {
    return "border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] text-[var(--pbp-status-warning)]";
  }

  if (tone === "danger") {
    return "border-[var(--pbp-status-danger)] bg-[var(--pbp-status-danger-soft)] text-[var(--pbp-status-danger)]";
  }

  return "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]";
}

function getProgressClassName(percent: number) {
  if (percent >= 90) {
    return "bg-[var(--pbp-status-danger)]";
  }

  if (percent >= 70) {
    return "bg-[var(--pbp-status-warning)]";
  }

  return "bg-[var(--pbp-status-success)]";
}

export default function SystemStatsOverview() {
  const usageSummary = getSystemUsageSummary();
  const overview = getI18n().system.overview;

  return (
    <section
      id="system-stats"
      className={SYSTEM_PANEL_CLASS}
    >
      <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-end lg:justify-between`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pbp-text-subtle)]">
            {overview.eyebrow}
          </p>
          <h2 className={`mt-2 ${SYSTEM_SECTION_TITLE_CLASS}`}>
            {overview.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">
            {overview.description}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3 text-xs text-[var(--pbp-text-muted)]">
          {overview.summary.replace("{totalWorkOrders}", String(usageSummary.totalWorkOrders)).replace("{averageStoragePercent}", String(usageSummary.averageStoragePercent)).replace("{riskCompanyCount}", String(usageSummary.riskCompanyCount))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:mt-5 xl:grid-cols-4">
        {SYSTEM_STATS_OVERVIEW_CARDS.map((card) => (
          <article
            key={card.id}
            className={SYSTEM_MUTED_CARD_CLASS}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{card.label}</p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getToneClassName(card.tone)}`}>
                {card.tone === "warning" ? overview.warningTone : card.tone === "success" ? overview.successTone : overview.operatingTone}
              </span>
            </div>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {card.value}
            </p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>
              {card.description}
            </p>
          </article>
        ))}
      </div>


      <div className="mt-4 grid gap-4 xl:mt-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {overview.purgeTitle}
            </h3>
            <span className={SYSTEM_WARNING_BADGE_CLASS}>
              {overview.purgeBadge}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SYSTEM_STORAGE_PURGE_STATS.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 ${getToneClassName(item.tone)}`}
              >
                <p className="text-xs font-semibold opacity-80">{item.label}</p>
                <p className="mt-2 text-xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs leading-5 opacity-80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {overview.storageBucketTitle}
            </h3>
            <span className={SYSTEM_NEUTRAL_BADGE_CLASS}>
              {overview.storageBucketBadge}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SYSTEM_STORAGE_USAGE_BUCKETS.map((item) => (
              <div key={item.id} className={SYSTEM_MUTED_CARD_CLASS}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{item.label}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getToneClassName(item.tone)}`}>
                    {overview.baselineBadge}
                  </span>
                </div>
                <p className={`mt-2 text-xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                  {item.valueLabel}
                </p>
                <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:mt-5 xl:grid-cols-[1.4fr_0.8fr]">
        <article className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {overview.companyUsageTitle}
            </h3>
            <span className={SYSTEM_NEUTRAL_BADGE_CLASS}>
              {overview.companyUsageBadge}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {SYSTEM_COMPANY_USAGE_ROWS.map((row) => (
              <div
                key={row.id}
                className={SYSTEM_MUTED_CARD_CLASS}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                      {row.companyName}
                    </p>
                    <p className={`mt-1 text-xs ${SYSTEM_SUBTLE_TEXT_CLASS}`}>
                      {row.planLabel} · {overview.workOrderUnit} {row.workOrderCount}건 · {overview.recentActivity} {row.recentActivityLabel}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getToneClassName(row.riskTone)}`}>
                    {row.riskLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex flex-col gap-1 text-xs text-[var(--pbp-text-muted)] sm:flex-row sm:items-center sm:justify-between">
                    <span>{overview.storageUsage}</span>
                    <span>
                      {row.storageUsedLabel} / {row.storageLimitLabel} · {row.storagePercent}%
                    </span>
                  </div>
                  <div className={`mt-2 h-2 rounded-full ${SYSTEM_PROGRESS_TRACK_CLASS}`}>
                    <div
                      className={`h-2 rounded-full ${getProgressClassName(row.storagePercent)}`}
                      style={{ width: `${Math.min(row.storagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4">
          <article className={SYSTEM_MUTED_CARD_CLASS}>
            <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {overview.planDistributionTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {SYSTEM_PLAN_DISTRIBUTION.map((plan) => (
                <div key={plan.id} className={SYSTEM_SUBTLE_CARD_CLASS}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                      {plan.label}
                    </p>
                    <span className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                      {plan.companyCount}{overview.companyUnit}
                    </span>
                  </div>
                  <p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className={SYSTEM_MUTED_CARD_CLASS}>
            <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
              {overview.riskTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {SYSTEM_RISK_ITEMS.map((item) => (
                <div key={item.id} className={SYSTEM_SUBTLE_CARD_CLASS}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>
                      {item.title}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getToneClassName(item.tone)}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
        <div className={`flex flex-col gap-2 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">{overview.baselineEyebrow}</p>
            <h3 className={`mt-2 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{overview.baselineTitle}</h3>
            <p className={`mt-2 max-w-3xl ${SYSTEM_SMALL_TEXT_CLASS}`}>
              {overview.baselineDescription}
            </p>
          </div>
          <span className={SYSTEM_NEUTRAL_BADGE_CLASS}>
            {overview.baselineHiddenBadge}
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">Cache</p>
            <h4 className={`mt-2 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{overview.cacheTitle}</h4>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{ADMIN_STATS_TANSTACK_QUERY_DECISION.reason}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_CACHE_POLICIES.map((item) => (
                <div key={item.key} className={SYSTEM_SUBTLE_CARD_CLASS}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">{item.label}</span>
                    <span className={`text-xs font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.staleSeconds === 0 ? overview.noCache : `${item.staleSeconds}초`}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-[var(--pbp-text-subtle)]">{item.invalidation}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">Aggregate</p>
            <h4 className={`mt-2 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{overview.aggregateTitle}</h4>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{ADMIN_STATS_AGGREGATE_READINESS_POLICY.nextStep}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_AGGREGATE_READINESS_ITEMS.slice(0, 4).map((item) => (
                <div key={item.key} className={SYSTEM_SUBTLE_CARD_CLASS}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">{item.title}</span>
                    <span className="rounded-full bg-[var(--pbp-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pbp-text-subtle)]">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">Performance</p>
            <h4 className={`mt-2 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{overview.performanceTitle}</h4>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{ADMIN_STATS_PERFORMANCE_POLICY.nextStep}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_PERFORMANCE_TARGETS.slice(0, 5).map((item) => (
                <div key={item.key} className={SYSTEM_SUBTLE_CARD_CLASS}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">{item.label}</span>
                    <span className={`text-xs font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

    </section>
  );
}
