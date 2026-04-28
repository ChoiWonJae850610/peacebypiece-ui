import type { AdminFileUsageCard, AdminRecentUploadTrendPoint, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  recentUploadTrend?: AdminRecentUploadTrendPoint[];
};

function MiniUsageChart({ points: trendPoints = [] }: { points?: AdminRecentUploadTrendPoint[] }) {
  const values = trendPoints.length > 0 ? trendPoints.map((point) => point.value) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...values);
  const chartPoints = values.map((value, index) => {
    const x = 8 + index * 18;
    const y = 48 - (value / max) * 34;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mt-4 rounded-2xl bg-white/10 p-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
        <span>최근 첨부</span>
        <span>7일</span>
      </div>
      <svg viewBox="0 0 124 56" className="mt-2 h-14 w-full" aria-hidden="true">
        <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
        {values.map((value, index) => {
          const x = 8 + index * 18;
          const y = 48 - (value / max) * 34;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" className="fill-white" />;
        })}
      </svg>
    </div>
  );
}

export default function FileStorageSummary({ usageCards, usageSummary, recentUploadTrend = [] }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";

  return (
    <section className="shrink-0 rounded-[28px] border border-stone-200 bg-stone-50 p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_1.62fr]">
        <div className="rounded-[24px] bg-stone-950 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{usageSummary.usedLabel}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isWarning ? "bg-amber-100 text-amber-900" : "bg-white/10 text-white"}`}>{usageSummary.statusLabel}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone-300">
            <span>사용량</span>
            <span>{usageSummary.usagePercent}% / {usageSummary.limitLabel}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className={`h-full rounded-full ${isWarning ? "bg-amber-300" : "bg-white"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
          </div>
          <MiniUsageChart points={recentUploadTrend} />
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {usageCards.map((card) => (
            <article key={card.label} className="flex min-h-[104px] flex-col justify-between rounded-3xl border border-stone-200 bg-white p-4">
              <p className="text-[11px] font-semibold text-stone-500">{card.label}</p>
              <p className="text-lg font-semibold tracking-tight text-stone-950">{card.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
