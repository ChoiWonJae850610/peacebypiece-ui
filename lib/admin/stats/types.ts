import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";

export type AdminStatsSourceState = "db" | "not_configured" | "error";

export type AdminStatsSnapshot = {
  summaries: AdminSummaryCard[];
  workorderFlow: AdminStatChartPoint[];
  partnerDistribution: AdminStatChartPoint[];
  fileUsagePoints: AdminFileUsagePoint[];
  sourceState: AdminStatsSourceState;
  sourceLabel: "DB" | "DB 미설정" | "조회 실패";
};
