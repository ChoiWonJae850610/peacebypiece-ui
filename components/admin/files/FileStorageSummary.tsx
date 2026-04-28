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
  const chartHeight = 48;
  const step = values.length > 1 ? (chartWidth - 18) / (values.length - 1) : 0;
  const chartPoints = values
    .map((value, index) => {
      const x = 9 + index * step;
      const y = chartHeight - 10 - (value / max) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[20px] bg-white/10 px-3 py-2.5">
      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-300">
        <span>첨부량</span>
        <span>건수</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center pt-1">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[44px] w-full" aria-hidden="true">
        <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
        {values.map((value, index) => {
          const x = 9 + index * step;
          const y = chartHeight - 10 - (value / max) * 28;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.2" className="fill-white" />;
        })}
        </svg>
      </div>
    </div>
  );
}

function DonutChart({ items = [] }: { items?: AdminFileTypeDistributionItem[] }) {
  const normalizedItems = items.length > 0 ? items : [
    { label: "문서", value: 0, percent: 0 },
    { label: "디자인", value: 0, percent: 0 },
  ];
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[20px] bg-white/10 px-3 py-2.5">
      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-300">
        <span>파일 유형</span>
        <span>{total}개</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-3 pt-1.5">
        <svg viewBox="0 0 72 72" className="h-[44px] w-[44px] shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="11" />
          {total > 0
            ? normalizedItems.map((item, index) => {
                const dash = (item.value / total) * circumference;
                const strokeDasharray = `${dash} ${circumference - dash}`;
                const strokeDashoffset = -offset;
                offset += dash;
                return (
                  <circle
                    key={item.label}
                    cx="36"
                    cy="36"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="11"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={index === 0 ? "text-white" : index === 1 ? "text-stone-400" : "text-stone-600"}
                  />
                );
              })
            : null}
        </svg>
        <div className="min-w-0 flex-1 space-y-1">
          {normalizedItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-stone-300">{item.label}</span>
              <span className="font-semibold text-white">{item.percent}%</span>
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
    <section className="shrink-0 rounded-[28px] border border-stone-200 bg-stone-50 p-3">
      <div className="relative h-[276px] overflow-hidden rounded-[26px] bg-stone-950 p-5 text-white">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TREND_PERIODS.map((period) => {
              const isActive = recentUploadTrendPeriod === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => onChangeTrendPeriod(period)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? "bg-white text-stone-950" : "bg-white/10 text-stone-300 hover:bg-white/15"}`}
                >
                  {period}일
                </button>
              );
            })}
          </div>

        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="저장소 데이터 새로고침"
          title="저장소 데이터 새로고침"
          disabled={isRefreshing}
          className="absolute right-5 top-[68px] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 disabled:text-stone-500"
        >
          <span aria-hidden="true">↻</span>
        </button>

        <div className="grid h-[196px] gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="flex min-h-0 flex-col">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{usageSummary.usedLabel}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-stone-300">사용량</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isWarning ? "bg-amber-100 text-amber-900" : "bg-white/10 text-white"}`}>{usageSummary.statusLabel}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-stone-300">
                <span>{usageSummary.usagePercent}%</span>
                <span>{usageSummary.limitLabel}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                <div className={`h-full rounded-full ${isWarning ? "bg-amber-300" : "bg-white"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="flex h-[44px] flex-col justify-center rounded-2xl bg-white/10 px-3">
                  <p className="text-[10px] font-semibold text-stone-300">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid h-full grid-rows-2 gap-3">
            <MiniUsageChart points={recentUploadTrend} />
            <DonutChart items={fileTypeDistribution} />
          </div>
        </div>
      </div>
    </section>
  );
}
