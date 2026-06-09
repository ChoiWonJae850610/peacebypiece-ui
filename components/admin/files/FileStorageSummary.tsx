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
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import AppBadge from "@/components/common/ui/AppBadge";

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
    <WaflPageHero
      sectionRef={summaryRef}
      eyebrow={t("filesSummary.visualEyebrow", "Storage management")}
      title={t("filesSummary.visualTitle", "저장공간과 휴지통을 관리합니다.")}
      description={t(
        "filesSummary.visualDescription",
        "파일 사용량, 파일 유형, 휴지통 상태를 확인하고 필요한 정리 작업을 처리합니다.",
      )}
      badges={
        <AppBadge tone="neutral" size="md">
          {statusLabel}
        </AppBadge>
      }
      bodyClassName="mt-4"
    >
      <div className="grid gap-3 md:gap-3" style={gridStyle}>
        <PlanUsageCard usageSummary={usageSummary} statusLabel={statusLabel} />
        <FileOperationsCard items={statusItems} />
        <div style={fileTypeGridStyle}>
          <FileTypeChartCard items={fileTypeDistribution} />
        </div>
      </div>
    </WaflPageHero>
  );
}
