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

function getToneClassName(tone: SystemStatTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

function getProgressClassName(percent: number) {
  if (percent >= 90) {
    return "bg-rose-500";
  }

  if (percent >= 70) {
    return "bg-amber-500";
  }

  return "bg-emerald-700";
}

export default function SystemStatsOverview() {
  const usageSummary = getSystemUsageSummary();
  const overview = getI18n().system.overview;

  return (
    <section
      id="system-stats"
      className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
    >
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            {overview.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">
            {overview.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            {overview.description}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
          {overview.summary.replace("{totalWorkOrders}", String(usageSummary.totalWorkOrders)).replace("{averageStoragePercent}", String(usageSummary.averageStoragePercent)).replace("{riskCompanyCount}", String(usageSummary.riskCompanyCount))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:mt-5 xl:grid-cols-4">
        {SYSTEM_STATS_OVERVIEW_CARDS.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-xs font-semibold text-stone-500">{card.label}</p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getToneClassName(card.tone)}`}>
                {card.tone === "warning" ? overview.warningTone : card.tone === "success" ? overview.successTone : overview.operatingTone}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-stone-950">
              {card.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>


      <div className="mt-4 grid gap-4 xl:mt-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className="text-sm font-semibold text-stone-950">
              {overview.purgeTitle}
            </h3>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
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

        <article className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className="text-sm font-semibold text-stone-950">
              {overview.storageBucketTitle}
            </h3>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-500">
              {overview.storageBucketBadge}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SYSTEM_STORAGE_USAGE_BUCKETS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-xs font-semibold text-stone-500">{item.label}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getToneClassName(item.tone)}`}>
                    {overview.baselineBadge}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold text-stone-950">
                  {item.valueLabel}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:mt-5 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className="text-sm font-semibold text-stone-950">
              {overview.companyUsageTitle}
            </h3>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-500">
              {overview.companyUsageBadge}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {SYSTEM_COMPANY_USAGE_ROWS.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {row.companyName}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {row.planLabel} · {overview.workOrderUnit} {row.workOrderCount}건 · {overview.recentActivity} {row.recentActivityLabel}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getToneClassName(row.riskTone)}`}>
                    {row.riskLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex flex-col gap-1 text-xs text-stone-600 sm:flex-row sm:items-center sm:justify-between">
                    <span>{overview.storageUsage}</span>
                    <span>
                      {row.storageUsedLabel} / {row.storageLimitLabel} · {row.storagePercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white">
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
          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-950">
              {overview.planDistributionTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {SYSTEM_PLAN_DISTRIBUTION.map((plan) => (
                <div key={plan.id} className="rounded-xl bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="text-sm font-semibold text-stone-900">
                      {plan.label}
                    </p>
                    <span className="text-sm font-semibold text-stone-950">
                      {plan.companyCount}{overview.companyUnit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-950">
              {overview.riskTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {SYSTEM_RISK_ITEMS.map((item) => (
                <div key={item.id} className="rounded-xl bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="text-sm font-semibold text-stone-900">
                      {item.title}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getToneClassName(item.tone)}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{overview.baselineEyebrow}</p>
            <h3 className="mt-2 text-sm font-semibold text-stone-950">{overview.baselineTitle}</h3>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-600">
              {overview.baselineDescription}
            </p>
          </div>
          <span className="w-fit rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-500">
            {overview.baselineHiddenBadge}
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Cache</p>
            <h4 className="mt-2 text-sm font-semibold text-stone-950">{overview.cacheTitle}</h4>
            <p className="mt-2 text-xs leading-5 text-stone-600">{ADMIN_STATS_TANSTACK_QUERY_DECISION.reason}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_CACHE_POLICIES.map((item) => (
                <div key={item.key} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">{item.label}</span>
                    <span className="text-xs font-semibold text-stone-950">{item.staleSeconds === 0 ? overview.noCache : `${item.staleSeconds}초`}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-stone-500">{item.invalidation}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Aggregate</p>
            <h4 className="mt-2 text-sm font-semibold text-stone-950">{overview.aggregateTitle}</h4>
            <p className="mt-2 text-xs leading-5 text-stone-600">{ADMIN_STATS_AGGREGATE_READINESS_POLICY.nextStep}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_AGGREGATE_READINESS_ITEMS.slice(0, 4).map((item) => (
                <div key={item.key} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">{item.title}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-500">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Performance</p>
            <h4 className="mt-2 text-sm font-semibold text-stone-950">{overview.performanceTitle}</h4>
            <p className="mt-2 text-xs leading-5 text-stone-600">{ADMIN_STATS_PERFORMANCE_POLICY.nextStep}</p>
            <div className="mt-4 grid gap-2">
              {ADMIN_STATS_PERFORMANCE_TARGETS.slice(0, 5).map((item) => (
                <div key={item.key} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">{item.label}</span>
                    <span className="text-xs font-semibold text-stone-950">{item.target}</span>
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
