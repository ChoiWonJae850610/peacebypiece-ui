import type {
  AdminFileTrendPeriod,
  AdminFileTypeDistributionItem,
  AdminFileUsageCard,
  AdminRecentUploadTrendPoint,
  AdminStorageUsageSummary,
} from "@/lib/admin/adminFiles.types";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  recentUploadTrend?: AdminRecentUploadTrendPoint[];
  recentUploadTrendPeriod: AdminFileTrendPeriod;
  fileTypeDistribution?: AdminFileTypeDistributionItem[];
  isRefreshing?: boolean;
  onChangeTrendPeriod: (period: AdminFileTrendPeriod) => void;
  onRefresh: () => void;
};

const TREND_PERIODS: AdminFileTrendPeriod[] = [7, 15, 30];

function findCardValue(cards: AdminFileUsageCard[], labelIncludes: string, fallback = "-") {
  return cards.find((card) => card.label.includes(labelIncludes))?.value ?? fallback;
}

function MiniUsageChart({ points: trendPoints = [] }: { points?: AdminRecentUploadTrendPoint[] }) {
  const values = trendPoints.length > 0 ? trendPoints.map((point) => point.value) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...values);
  const chartWidth = 190;
  const chartHeight = 66;
  const step = values.length > 1 ? (chartWidth - 20) / (values.length - 1) : 0;
  const chartPoints = values
    .map((value, index) => {
      const x = 10 + index * step;
      const y = chartHeight - 10 - (value / max) * 42;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[24px] bg-white/10 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
        <span>첨부량</span>
        <span>건수</span>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mt-2 h-[74px] w-full" aria-hidden="true">
        <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
        {values.map((value, index) => {
          const x = 10 + index * step;
          const y = chartHeight - 10 - (value / max) * 42;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.6" className="fill-white" />;
        })}
      </svg>
    </div>
  );
}

function DonutChart({ items = [] }: { items?: AdminFileTypeDistributionItem[] }) {
  const normalizedItems = items.length > 0 ? items : [
    { label: "PDF", value: 0, percent: 0 },
    { label: "이미지", value: 0, percent: 0 },
    { label: "기타", value: 0, percent: 0 },
  ];
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-[24px] bg-white/10 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
        <span>파일 유형</span>
        <span>{total}개</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="h-[82px] w-[82px] shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="12" />
          {total > 0
            ? normalizedItems.map((item, index) => {
                const dash = (item.value / total) * circumference;
                const strokeDasharray = `${dash} ${circumference - dash}`;
                const strokeDashoffset = -offset;
                offset += dash;
                return (
                  <circle
                    key={item.label}
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={index === 0 ? "text-white" : index === 1 ? "text-stone-400" : "text-stone-600"}
                  />
                );
              })
            : null}
        </svg>
        <div className="min-w-0 flex-1 space-y-2">
          {normalizedItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-stone-300">{item.label}</span>
              <span className="text-white">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FileStorageSummary({
  usageCards,
  usageSummary,
  recentUploadTrend = [],
  recentUploadTrendPeriod,
  fileTypeDistribution = [],
  isRefreshing = false,
  onChangeTrendPeriod,
  onRefresh,
}: FileStorageSummaryProps) {
  const isWarning = usageSummary.statusTone === "warning";
  const attachmentCount = findCardValue(usageCards, "첨부", "0개");
  const trashCount = findCardValue(usageCards, "휴지", "0개");
  const retentionDays = findCardValue(usageCards, "복구", "-");

  const summaryItems = [
    { label: "전체 사용량", value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}` },
    { label: "첨부파일", value: attachmentCount },
    { label: "휴지통", value: trashCount },
    { label: "복구 기간", value: retentionDays },
  ];

  return (
    <section className="shrink-0 rounded-[28px] border border-stone-200 bg-stone-50 p-4">
      <div className="rounded-[26px] bg-stone-950 p-5 text-white">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TREND_PERIODS.map((period) => {
              const isActive = recentUploadTrendPeriod === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => onChangeTrendPeriod(period)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${isActive ? "bg-white text-stone-950" : "bg-white/10 text-stone-300 hover:bg-white/15"}`}
                >
                  {period}일
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="저장소 데이터 새로고침"
            title="저장소 데이터 새로고침"
            disabled={isRefreshing}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white transition hover:bg-white/15 disabled:text-stone-500"
          >
            <span aria-hidden="true">↻</span>
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="flex min-h-[240px] flex-col justify-between">
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

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <MiniUsageChart points={recentUploadTrend} />
            <DonutChart items={fileTypeDistribution} />
          </div>
        </div>
      </div>
    </section>
  );
}
