"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import type {
  AdminFileTrendPeriod,
  AdminFileTypeDistributionItem,
  AdminFileUsageCard,
  AdminRecentUploadTrendPoint,
  AdminStorageUsageSummary,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

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
  const t = useAdminTranslation();
  const values = trendPoints.length > 0 ? trendPoints.map((point) => point.value) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...values);
  const chartWidth = 260;
  const chartHeight = 72;
  const step = values.length > 1 ? (chartWidth - 18) / (values.length - 1) : 0;
  const chartPoints = values
    .map((value, index) => {
      const x = 9 + index * step;
      const y = chartHeight - 10 - (value / max) * 50;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[20px] border border-stone-200 bg-white px-3 py-3.5">
      <div className="flex shrink-0 items-center justify-between text-[10px] font-semibold text-stone-500">
        <span>{t("filesSummary.uploadAmount", "첨부량")}</span>
        <span>{t("filesSummary.count", "건수")}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center pt-2 text-[var(--admin-theme-surface)]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[82px] w-full" aria-hidden="true">
          <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, index) => {
            const x = 9 + index * step;
            const y = chartHeight - 10 - (value / max) * 50;
            return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.2" fill="currentColor" />;
          })}
        </svg>
      </div>
    </div>
  );
}

function DonutChart({ items = [] }: { items?: AdminFileTypeDistributionItem[] }) {
  const t = useAdminTranslation();
  const normalizedItems = items.length > 0 ? items : [
    { label: t("filesSummary.documents", "문서"), value: 0, percent: 0 },
    { label: t("filesSummary.designs", "디자인"), value: 0, percent: 0 },
  ];
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[20px] border border-stone-200 bg-white px-3 py-3.5">
      <div className="flex shrink-0 items-center justify-between text-[10px] font-semibold text-stone-500">
        <span>{t("filesSummary.fileType", "파일 유형")}</span>
        <span>{total}{t("filesSummary.countSuffix", "개")}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-3 pt-2">
        <svg viewBox="0 0 72 72" className="h-[66px] w-[66px] shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgb(231 229 228)" strokeWidth="10" />
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
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={index === 0 ? "text-[var(--admin-theme-surface)]" : index === 1 ? "text-stone-400" : "text-stone-300"}
                  />
                );
              })
            : null}
        </svg>
        <div className="min-w-0 flex-1 space-y-1.5">
          {normalizedItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-stone-500">{item.label}</span>
              <span className="font-semibold text-stone-950">{item.percent}%</span>
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
  const t = useAdminTranslation();
  const isCaution = usageSummary.statusTone === "caution";
  const isDanger = usageSummary.statusTone === "danger";
  const attachmentCount = findCardValue(usageCards, "첨부", "0개");
  const trashCount = findCardValue(usageCards, "휴지", "0개");
  const retentionDays = findCardValue(usageCards, "보관", findCardValue(usageCards, "복구", "-"));

  const summaryItems = [
    { label: t("filesSummary.totalUsage", "전체 사용량"), value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}` },
    { label: t("filesSummary.attachments", "첨부파일"), value: attachmentCount },
    { label: t("filesSummary.trash", "휴지통"), value: trashCount },
    { label: t("filesSummary.retentionPeriod", "보관 기간"), value: retentionDays },
  ];

  return (
    <section className="shrink-0 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar
        title={t("filesSummary.title", "저장소 사용 현황")}
        description={t("filesSummary.description", "첨부파일 사용량, 최근 업로드, 파일 유형을 같은 기준으로 확인합니다.")}
      >
        <div className="flex flex-wrap gap-1.5">
          {TREND_PERIODS.map((period) => {
            const isActive = recentUploadTrendPeriod === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => onChangeTrendPeriod(period)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? "border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50"}`}
              >
                {t(`filesSummary.periods.${period}`, `${period}일`)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onRefresh}
            aria-label={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
            title={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
            disabled={isRefreshing}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:text-stone-400"
          >
            <span aria-hidden="true">↻</span>
          </button>
        </div>
      </AdminActionBar>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.72fr)_minmax(420px,1.28fr)]">
        <div className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-stone-950">{usageSummary.usedLabel}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-stone-500">{t("filesSummary.usage", "사용량")}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDanger ? "bg-red-100 text-red-700" : isCaution ? "bg-amber-100 text-amber-900" : "bg-stone-950 text-white"}`}>{usageSummary.statusLabel}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-medium text-stone-500">
            <span>{usageSummary.usagePercent}%</span>
            <span>{usageSummary.limitLabel}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
            <div className={`h-full rounded-full ${isDanger ? "bg-red-500" : isCaution ? "bg-amber-400" : "bg-[var(--admin-theme-surface)]"}`} style={{ width: `${usageSummary.usagePercent}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex min-h-[62px] flex-col justify-center rounded-2xl border border-stone-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold text-stone-500">{item.label}</p>
                <p className="mt-1.5 text-sm font-semibold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-[220px] gap-3 md:grid-cols-2">
          <MiniUsageChart points={recentUploadTrend} />
          <DonutChart items={fileTypeDistribution} />
        </div>
      </div>
    </section>
  );
}
