"use client";

import { useMemo, useRef } from "react";

import type {
  AdminFileTypeDistributionItem,
  AdminFileUsageCard,
  AdminStorageUsageSummary,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { useElementSize } from "@/lib/responsive/useElementSize";
import {
  buildFileStatusItems,
  translateStorageStatus,
} from "@/lib/admin/files/storageSummaryPresentation";

import { FileOperationsCard } from "./summary/FileOperationsCard";
import { FileTypeChartCard } from "./summary/FileTypeChartCard";
import { PlanUsageCard } from "./summary/PlanUsageCard";
import {
  getFileTypeCardGridStyle,
  getStorageSummaryGridStyle,
  getStorageSummaryLayoutMode,
} from "./summary/storageSummaryLayout";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  fileTypeDistribution?: AdminFileTypeDistributionItem[];
};

export default function FileStorageSummary({
  usageCards,
  usageSummary,
  fileTypeDistribution = [],
}: FileStorageSummaryProps) {
  const t = useAdminTranslation();
  const summaryRef = useRef<HTMLElement | null>(null);
  const { width: summaryWidth } = useElementSize(summaryRef);
  const layoutMode = getStorageSummaryLayoutMode(summaryWidth);
  const gridStyle = useMemo(
    () => getStorageSummaryGridStyle(layoutMode),
    [layoutMode],
  );
  const fileTypeGridStyle = useMemo(
    () => getFileTypeCardGridStyle(layoutMode),
    [layoutMode],
  );
  const statusLabel = translateStorageStatus(
    usageSummary.statusTone,
    usageSummary.statusLabel,
    t,
  );
  const statusItems = buildFileStatusItems({ usageCards, t });

  return (
    <section
      ref={summaryRef}
      className="shrink-0 overflow-visible rounded-[24px] border border-[var(--pbp-border)] bg-[linear-gradient(135deg,var(--pbp-surface-soft),var(--pbp-surface))] p-3 shadow-sm md:rounded-[28px] md:p-3"
    >
      <div className="flex flex-col gap-2 pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pbp-brand-soft)]">
            {t("filesSummary.visualEyebrow", "Storage control")}
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--pbp-text-primary)] md:text-xl 2xl:text-2xl">
            {t("filesSummary.visualTitle", "저장공간과 휴지통을 한 화면에서 관리합니다.")}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--pbp-text-muted)] md:text-sm">
            {t("filesSummary.visualDescription", "사용량, 파일 유형, 휴지통 상태를 먼저 확인하고 필요한 복원·삭제 작업만 처리합니다.")}
          </p>
        </div>
        <span className="w-fit rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-xs font-bold text-[var(--pbp-text-muted)] shadow-sm">
          {statusLabel}
        </span>
      </div>
      <div className="grid gap-3 md:gap-3" style={gridStyle}>
        <PlanUsageCard usageSummary={usageSummary} statusLabel={statusLabel} />
        <FileOperationsCard items={statusItems} />
        <div style={fileTypeGridStyle}>
          <FileTypeChartCard items={fileTypeDistribution} />
        </div>
      </div>
    </section>
  );
}
