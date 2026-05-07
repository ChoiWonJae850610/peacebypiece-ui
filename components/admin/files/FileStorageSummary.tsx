"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import type {
  AdminFileTypeDistributionItem,
  AdminFileUsageCard,
  AdminStorageUsageSummary,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  fileTypeDistribution?: AdminFileTypeDistributionItem[];
  isRefreshing?: boolean;
  onRefresh: () => void;
};

type FileStatusItem = {
  label: string;
  value: string;
  description?: string;
  tone?: "neutral" | "danger" | "caution";
};

function getUsageCardValue(
  cards: AdminFileUsageCard[],
  index: number,
  fallback = "-",
) {
  return cards[index]?.value ?? fallback;
}

function translateStorageValue(
  value: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (value.endsWith("개"))
    return value.replace("개", t("filesSummary.units.count", "개"));
  if (value.endsWith("일"))
    return value.replace("일", t("filesSummary.units.day", "일"));
  return value;
}

function translateStorageStatus(
  tone: AdminStorageUsageSummary["statusTone"],
  fallback: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (tone === "danger") return t("filesSummary.statuses.danger", fallback);
  if (tone === "caution") return t("filesSummary.statuses.caution", fallback);
  return t("filesSummary.statuses.normal", fallback);
}

function translateFileTypeLabel(
  label: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  const normalizedLabel = label.trim().toLowerCase();
  if (
    label === "문서" ||
    normalizedLabel === "document" ||
    normalizedLabel === "documents"
  )
    return t("filesSummary.documents", "문서");
  if (
    label === "디자인" ||
    normalizedLabel === "design" ||
    normalizedLabel === "designs"
  )
    return t("filesSummary.designs", "디자인");
  if (
    label === "작업메모" ||
    normalizedLabel === "memo" ||
    normalizedLabel === "memos"
  )
    return t("filesSummary.memos", "작업메모");
  if (
    label === "첨부파일" ||
    normalizedLabel === "attachment" ||
    normalizedLabel === "attachments"
  )
    return t("filesSummary.attachments", "첨부파일");
  return t("filesSummary.others", "기타");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0MB";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  if (bytes >= 1024 * 1024) return `${Math.max(0.01, bytes / 1024 / 1024).toFixed(2)}MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function StorageCylinder({ percent }: { percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative mx-auto mt-4 h-28 w-24" aria-hidden="true">
      <div className="absolute inset-x-2 bottom-0 h-[88px] overflow-hidden rounded-b-[28px] border-x border-b border-stone-300 bg-white shadow-inner">
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-[28px] bg-[var(--admin-theme-surface)]/20"
          style={{ height: `${Math.max(6, safePercent)}%` }}
        />
      </div>
      <div className="absolute inset-x-2 top-0 h-11 rounded-[50%] border border-stone-300 bg-white shadow-sm" />
      <div
        className="absolute inset-x-2 rounded-[50%] border border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)]/20"
        style={{ bottom: `${Math.max(0, Math.min(80, safePercent * 0.72))}px`, height: 38 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pt-3">
        <span className="rounded-full bg-white/90 px-2 py-1 text-sm font-bold text-stone-950 shadow-sm">
          {safePercent}%
        </span>
      </div>
    </div>
  );
}

function PlanUsageCard({
  usageSummary,
  statusLabel,
}: {
  usageSummary: AdminStorageUsageSummary;
  statusLabel: string;
}) {
  const usedGbLabel = `${(usageSummary.usedBytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  const remainingBytes = Math.max(0, usageSummary.limitBytes - usageSummary.usedBytes);
  const remainingLabel = formatBytes(remainingBytes);
  const planName = "Basic";
  const isDanger = usageSummary.statusTone === "danger";
  const isCaution = usageSummary.statusTone === "caution";

  return (
    <div className="flex h-full min-h-[300px] flex-col rounded-[24px] border border-stone-200 bg-gradient-to-b from-white to-stone-50 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Storage plan
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1 text-xs font-bold text-white">
              {planName}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDanger ? "bg-red-100 text-red-700" : isCaution ? "bg-amber-100 text-amber-900" : "bg-stone-950 text-white"}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          title="요금제 업그레이드 화면은 후속 버전에서 연결합니다."
        >
          업그레이드
        </button>
      </div>

      <StorageCylinder percent={usageSummary.usagePercent} />

      <div className="mt-4 text-center">
        <p className="text-2xl font-bold tracking-tight text-stone-950">
          {usageSummary.usedLabel} / {usageSummary.limitLabel}
        </p>
        <p className="mt-1 text-xs font-semibold text-stone-500">
          {usedGbLabel} 사용 · {remainingLabel} 남음
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className={`h-full rounded-full ${isDanger ? "bg-red-500" : isCaution ? "bg-amber-400" : "bg-[var(--admin-theme-surface)]"}`}
          style={{ width: `${Math.min(100, Math.max(0, usageSummary.usagePercent))}%` }}
        />
      </div>
    </div>
  );
}

function FileOperationsCard({ items }: { items: FileStatusItem[] }) {
  return (
    <div className="flex h-full min-h-[300px] flex-col rounded-[24px] border border-stone-200 bg-white px-5 py-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          File operations
        </p>
        <h3 className="mt-2 text-lg font-bold text-stone-950">파일 운영 요약</h3>
      </div>
      <div className="mt-4 grid flex-1 content-center gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-800" title={item.label}>
                {item.label}
              </p>
              {item.description ? (
                <p className="mt-0.5 truncate text-[11px] text-stone-500" title={item.description}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 text-sm font-bold ${item.tone === "danger" ? "text-red-600" : item.tone === "caution" ? "text-amber-700" : "text-stone-950"}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  items = [],
}: {
  items?: AdminFileTypeDistributionItem[];
}) {
  const t = useAdminTranslation();
  const normalizedItems = (
    items.length > 0
      ? items
      : [
          { label: t("filesSummary.documents", "문서"), value: 0, percent: 0 },
          { label: t("filesSummary.designs", "디자인"), value: 0, percent: 0 },
        ]
  ).map((item) => ({ ...item, label: translateFileTypeLabel(item.label, t) }));
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex h-full min-h-[300px] flex-col rounded-[24px] border border-stone-200 bg-white px-5 py-5">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            File type
          </p>
          <h3 className="mt-2 text-lg font-bold text-stone-950">
            {t("filesSummary.fileType", "파일 유형")}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
          {total}
          {t("filesSummary.countSuffix", "개")}
        </span>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-center justify-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg
            viewBox="0 0 88 88"
            className="h-32 w-32 -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="rgb(231 229 228)"
              strokeWidth="12"
            />
            {total > 0
              ? normalizedItems.map((item, index) => {
                  const dash = (item.value / total) * circumference;
                  const strokeDasharray = `${dash} ${circumference - dash}`;
                  const strokeDashoffset = -offset;
                  offset += dash;
                  return (
                    <circle
                      key={item.label}
                      cx="44"
                      cy="44"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                      className={
                        index === 0
                          ? "text-[var(--admin-theme-surface)]"
                          : index === 1
                            ? "text-stone-500"
                            : index === 2
                              ? "text-stone-300"
                              : "text-stone-200"
                      }
                    />
                  );
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-stone-950">{total}</span>
            <span className="text-[10px] font-semibold text-stone-400">전체</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {normalizedItems.map((item, index) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-stone-700">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? "bg-[var(--admin-theme-surface)]" : index === 1 ? "bg-stone-500" : index === 2 ? "bg-stone-300" : "bg-stone-200"}`}
                  />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </span>
                <span className="shrink-0 font-bold text-stone-950">
                  {item.value}{t("filesSummary.countSuffix", "개")} · {item.percent}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={index === 0 ? "h-full rounded-full bg-[var(--admin-theme-surface)]" : index === 1 ? "h-full rounded-full bg-stone-500" : "h-full rounded-full bg-stone-300"}
                  style={{ width: `${Math.max(2, item.percent)}%` }}
                />
              </div>
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
  fileTypeDistribution = [],
  isRefreshing = false,
  onRefresh,
}: FileStorageSummaryProps) {
  const t = useAdminTranslation();
  const attachmentCount = translateStorageValue(
    getUsageCardValue(usageCards, 1, "0개"),
    t,
  );
  const trashCount = translateStorageValue(
    getUsageCardValue(usageCards, 2, "0개"),
    t,
  );
  const statusLabel = translateStorageStatus(
    usageSummary.statusTone,
    usageSummary.statusLabel,
    t,
  );

  const statusItems: FileStatusItem[] = [
    {
      label: t("filesSummary.attachments", "전체 첨부파일"),
      value: attachmentCount,
      description: usageSummary.usedLabel,
    },
    {
      label: t("filesSummary.activeFiles", "사용중 파일"),
      value: attachmentCount,
      description: "휴지통 제외 기준",
    },
    {
      label: t("filesSummary.trash", "휴지통"),
      value: trashCount,
      description: trashCount === "0개" ? "정리 항목 없음" : "복구/영구삭제 필요",
      tone: trashCount === "0개" ? "neutral" : "caution",
    },
    {
      label: t("filesSummary.largeFiles", "대용량 파일"),
      value: "검토 예정",
      description: "10MB 이상 기준은 후속 연결",
    },
    {
      label: t("filesSummary.cleanupNeeded", "정리 필요"),
      value: "0개",
      description: "삭제 실패·보관기간 초과",
    },
  ];

  return (
    <section className="shrink-0 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar
        title={t("filesSummary.title", "저장소 사용 현황")}
        description={t(
          "filesSummary.description",
          "요금제 용량, 파일 상태, 파일 유형을 현재 기준으로 확인합니다.",
        )}
      >
        <button
          type="button"
          onClick={onRefresh}
          aria-label={t(
            "filesSummary.refreshLabel",
            "저장소 데이터 새로고침",
          )}
          title={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
          disabled={isRefreshing}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:text-stone-400"
        >
          <span aria-hidden="true">↻</span>
        </button>
      </AdminActionBar>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(260px,0.86fr)_minmax(300px,1fr)_minmax(340px,1.12fr)]">
        <PlanUsageCard usageSummary={usageSummary} statusLabel={statusLabel} />
        <FileOperationsCard items={statusItems} />
        <DonutChart items={fileTypeDistribution} />
      </div>
    </section>
  );
}
