"use client";

import { AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import {
  AdminStatsAnalysisCardShell,
  AdminStatsBarListCard,
} from "@/components/admin/dashboard/AdminStatsAnalysisCards";
import { AdminStatsInlineToggle } from "@/components/admin/dashboard/AdminStatsInlineToggle";
import {
  ADMIN_STATS_ACCENT_TEXT_CLASS,
  ADMIN_STATS_BODY_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { formatAdminStatsCount } from "@/lib/admin/stats/dashboardPresentation";

type CategoryDepthKey = "first" | "second";

type AdminStatsRatioBar = {
  label: string;
  value: number;
  widthPercent: number;
  valueLabel?: string;
};

type AdminStatsProductionSectionProps = {
  title: string;
  eyebrow: string;
  categoryDepth: CategoryDepthKey;
  categoryDepthLabels: Record<CategoryDepthKey, string>;
  selectedCategoryDepthLabel: string;
  selectedCategoryDepthBars: AdminStatsRatioBar[];
  selectedCategoryDepthTotal: number;
  normalizedSelectedCategoryLabel: string | null;
  categoryDetailTitle: string;
  categoryDetailPoints: AdminStatsRatioBar[];
  categoryDetailEmptyLabel: string;
  workorderSuffix: string;
  productionMixEmpty: string;
  selectedItemLabel: string;
  categoryDepthToggleAriaLabel: string;
  onCategoryDepthChange: (nextDepth: CategoryDepthKey) => void;
  onSelectedCategoryChange: (nextLabel: string | null) => void;
};

export function AdminStatsProductionSection({
  title,
  eyebrow,
  categoryDepth,
  categoryDepthLabels,
  selectedCategoryDepthLabel,
  selectedCategoryDepthBars,
  selectedCategoryDepthTotal,
  normalizedSelectedCategoryLabel,
  categoryDetailTitle,
  categoryDetailPoints,
  categoryDetailEmptyLabel,
  workorderSuffix,
  productionMixEmpty,
  selectedItemLabel,
  categoryDepthToggleAriaLabel,
  onCategoryDepthChange,
  onSelectedCategoryChange,
}: AdminStatsProductionSectionProps) {
  return (
    <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
      <AdminStatsAnalysisCardShell
        eyebrow={eyebrow}
        title={title}
        minHeight="tall"
        bodyClassName="mt-1.5 min-w-0 flex-1"
        actions={
          <AdminStatsInlineToggle
            items={(["first", "second"] as const).map((key) => ({
              key,
              label: categoryDepthLabels[key],
            }))}
            value={categoryDepth}
            onChange={(nextDepth) => {
              onCategoryDepthChange(nextDepth);
              onSelectedCategoryChange(null);
            }}
            ariaLabel={categoryDepthToggleAriaLabel}
          />
        }
      >
        <AdminBasicDonutChart
          points={selectedCategoryDepthBars}
          totalLabel={workorderSuffix}
          valueSuffix={workorderSuffix}
          emptyLabel={productionMixEmpty}
          compact
          selectedLabel={normalizedSelectedCategoryLabel}
          onSelectPoint={onSelectedCategoryChange}
        />
        <p className={`mt-1 text-[11px] font-semibold ${ADMIN_STATS_BODY_CLASS}`}>
          {selectedCategoryDepthLabel} ·{" "}
          {formatAdminStatsCount(selectedCategoryDepthTotal, workorderSuffix)}
        </p>
        {normalizedSelectedCategoryLabel ? (
          <p
            className={`mt-0.5 text-[11px] font-semibold ${ADMIN_STATS_ACCENT_TEXT_CLASS}`}
          >
            {selectedItemLabel}: {normalizedSelectedCategoryLabel}
          </p>
        ) : null}
      </AdminStatsAnalysisCardShell>

      <AdminStatsBarListCard
        title={categoryDetailTitle}
        points={categoryDetailPoints}
        emptyLabel={categoryDetailEmptyLabel}
      />
    </div>
  );
}
