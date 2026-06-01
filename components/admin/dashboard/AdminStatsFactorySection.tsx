"use client";

import {
  AdminStatsAnalysisCardShell,
  AdminStatsBarListCard,
} from "@/components/admin/dashboard/AdminStatsAnalysisCards";
import { FactoryPerformanceTable } from "@/components/admin/dashboard/AdminStatsFactoryPerformanceTable";
import type { AdminStatsFactoryPerformance } from "@/lib/admin/stats/types";

type AdminStatsRatioBar = {
  label: string;
  value: number;
  widthPercent: number;
  valueLabel?: string;
};

type FactoryPerformanceLabels = {
  factory: string;
  delayRate: string;
  qualityRate: string;
};

type AdminStatsFactorySectionProps = {
  factoryProductionBars: AdminStatsRatioBar[];
  factoryPerformanceItems: AdminStatsFactoryPerformance[];
  factoryPerformanceTitle: string;
  factoryPerformanceEmpty: string;
  delayQualityEyebrow: string;
  delayQualityTitle: string;
  columns: FactoryPerformanceLabels;
  countSuffix: string;
  zeroPercentLabel: string;
  getTooltip: (item: AdminStatsFactoryPerformance) => string;
};

export function AdminStatsFactorySection({
  factoryProductionBars,
  factoryPerformanceItems,
  factoryPerformanceTitle,
  factoryPerformanceEmpty,
  delayQualityEyebrow,
  delayQualityTitle,
  columns,
  countSuffix,
  zeroPercentLabel,
  getTooltip,
}: AdminStatsFactorySectionProps) {
  return (
    <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
      <AdminStatsBarListCard
        title={factoryPerformanceTitle}
        points={factoryProductionBars}
        emptyLabel={factoryPerformanceEmpty}
      />
      <AdminStatsAnalysisCardShell
        eyebrow={delayQualityEyebrow}
        title={delayQualityTitle}
        minHeight="tall"
        bodyClassName="mt-3 flex-1"
      >
        <FactoryPerformanceTable
          items={factoryPerformanceItems}
          emptyLabel={factoryPerformanceEmpty}
          columns={columns}
          countSuffix={countSuffix}
          zeroPercentLabel={zeroPercentLabel}
          getTooltip={getTooltip}
        />
      </AdminStatsAnalysisCardShell>
    </div>
  );
}
