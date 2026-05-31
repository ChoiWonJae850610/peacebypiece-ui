"use client";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminResponsiveTableShell } from "@/components/admin/common/responsiveTable/AdminResponsiveTableShell";
import {
  ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS,
  ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_CLASS,
  ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import { AppTooltip } from "@/components/common/ui";
import type { AdminStatsFactoryPerformance } from "@/lib/admin/stats/types";
import {
  formatAdminStatsCount,
  formatAdminStatsPercent,
} from "@/lib/admin/stats/dashboardPresentation";

type FactoryPerformanceTableColumns = {
  factory: string;
  delayRate: string;
  qualityRate: string;
};

type FactoryPerformanceTableProps = {
  items: AdminStatsFactoryPerformance[];
  emptyLabel: string;
  columns: FactoryPerformanceTableColumns;
  countSuffix: string;
  zeroPercentLabel: string;
  getTooltip: (item: AdminStatsFactoryPerformance) => string;
};

const FACTORY_PERFORMANCE_GRID_TEMPLATE_COLUMNS =
  "minmax(0,1.4fr) minmax(88px,0.75fr) minmax(88px,0.75fr)";

export function FactoryPerformanceTable({
  items,
  emptyLabel,
  columns,
  countSuffix,
  zeroPercentLabel,
  getTooltip,
}: FactoryPerformanceTableProps) {
  return (
    <AdminResponsiveTableShell className="min-h-[218px]">
      <div
        className={ADMIN_RESPONSIVE_TABLE_HEADER_CLASS}
        style={{ gridTemplateColumns: FACTORY_PERFORMANCE_GRID_TEMPLATE_COLUMNS }}
      >
        <span>{columns.factory}</span>
        <span>{columns.delayRate}</span>
        <span>{columns.qualityRate}</span>
      </div>
      <div className={ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.label}
              className={ADMIN_RESPONSIVE_TABLE_ROW_CLASS}
              style={{ gridTemplateColumns: FACTORY_PERFORMANCE_GRID_TEMPLATE_COLUMNS }}
            >
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="block min-w-0 cursor-help">
                  <span className={`block ${ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS}`}>
                    {item.label}
                  </span>
                  <span className={`block ${ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS}`}>
                    {formatAdminStatsCount(item.productionCount, countSuffix)}
                  </span>
                </span>
              </AppTooltip>
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="inline-flex min-w-0 cursor-help justify-start">
                  <AdminStatusBadge
                    tone={item.dueDelayRate && item.dueDelayRate > 0 ? "warning" : "success"}
                    size="xs"
                  >
                    {formatAdminStatsPercent(item.dueDelayRate, zeroPercentLabel)}
                  </AdminStatusBadge>
                </span>
              </AppTooltip>
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="inline-flex min-w-0 cursor-help justify-start">
                  <AdminStatusBadge
                    tone={item.qualityIssueRate && item.qualityIssueRate > 0 ? "warning" : "success"}
                    size="xs"
                  >
                    {formatAdminStatsPercent(item.qualityIssueRate, zeroPercentLabel)}
                  </AdminStatusBadge>
                </span>
              </AppTooltip>
            </div>
          ))
        ) : (
          <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
            {emptyLabel}
          </div>
        )}
      </div>
    </AdminResponsiveTableShell>
  );
}
