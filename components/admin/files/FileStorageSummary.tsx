import type { AdminFileUsageCard, AdminRecentUploadTrendPoint, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  recentUploadTrend?: AdminRecentUploadTrendPoint[];
};

function findCardValue(cards: AdminFileUsageCard[], labelIncludes: string, fallback = "-") {
  return cards.find((card) => card.label.includes(labelIncludes))?.value ?? fallback;
}

function MiniUsageChart({ points: trendPoints = [] }: { points?: AdminRecentUploadTrendPoint[] }) {
  const values = trendPoints.length > 0 ? trendPoints.map((point) => point.value) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...values);
  const chartPoints = values
    .map((value, index) => {
      const x = 10 + index * 24;
      const y = 54 - (value / max) * 38;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[24px] bg-white/10 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
        <span>최근 첨부</span>
        <span>7일</span>
      </div>
      <svg viewBox="0 0 164 64" className="mt-2 h-20 w-full" aria-hidden="true">
        <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
        {values.map((value, index) => {
          const x = 10 + index * 24;
          const y = 54 - (value / max) * 38;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.6" className="fill-white" />;
        })}
      </svg>
    </div>
  );
}

export default function FileStorageSummary({ usageCards, usageSummary, recentUploadTrend = [] }: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";
  const attachmentCount = findCardValue(usageCards, "첨부", "0개");
  const trashCount = findCardValue(usageCards, "휴지", "0개");
  const retentionDays = findCardValue(usageCards, "복구", "-");

  const summaryItems = [
    { label: "전체 사용량", value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}` },
    { label: "첨부파일", value: attachmentCount },
    { label: "휴지통", value: trashCount },
    { label: "복구 가능 기간", value: retentionDays },
  ];

  return (
    <section className="shrink-0 rounded-[28px] border border-stone-200 bg-stone-50 p-4">
      <div className="rounded-[26px] bg-stone-950 p-5 text-white">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex min-h-[220px] flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tracking-tight">{usageSummary.usedLabel}</p>
                  <p className="mt-3 text-xs font-semibold text-stone-300">사용량</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isWarning ? "bg-amber-100 text-amber-900" : "bg-white/10 text-white"}`}>{usageSummary.statusLabel}</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone-300">
                <span>{usageSummary.usagePercent}%</span>
                <span>{usageSummary.limitLabel}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div className={`h-full rounded-full ${isWarning ? "bg-amber-300" : "bg-white"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 px-3 py-3">
                  <p className="text-[11px] font-semibold text-stone-300">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <MiniUsageChart points={recentUploadTrend} />
        </div>
      </div>
    </section>
  );
}
