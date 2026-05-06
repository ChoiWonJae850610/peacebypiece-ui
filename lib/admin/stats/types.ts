import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";

export type AdminStatsSourceState = "db" | "not_configured" | "error";

export type AdminStatsPeriodKey = "7d" | "15d" | "30d" | "monthly" | "all" | "custom";

export type AdminStatsMetricKey = "reviewWaiting" | "inspectionWaiting" | "inboundDelayed" | "defectCount";

export type AdminStatsMetric = {
  key: AdminStatsMetricKey;
  label: string;
  value: number;
  description: string;
};

export type AdminStatsRatioPoint = AdminStatChartPoint & {
  valueLabel?: string;
};

export type AdminStatsCurrentOverview = {
  totalProducedCount: number;
  reorderCount: number;
  dueDelayRate: number | null;
  dueDelayCount: number;
  dueDateTargetCount: number;
  qualityIssueRate: number | null;
  qualityIssueCount: number;
  qualityTargetCount: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
};

export type AdminStatsSnapshot = {
  currentOverview: AdminStatsCurrentOverview;
  summaries: AdminSummaryCard[];
  workorderFlow: AdminStatChartPoint[];
  partnerDistribution: AdminStatChartPoint[];
  fileUsagePoints: AdminFileUsagePoint[];
  keyMetrics: AdminStatsMetric[];
  productionRoundDistribution: AdminStatsRatioPoint[];
  factoryProductionDistribution: AdminStatsRatioPoint[];
  productionCategoryDistribution: AdminStatsRatioPoint[];
  attachmentTrashCards: AdminStatsRatioPoint[];
  periodOptions: { key: AdminStatsPeriodKey; label: string; active: boolean; href: string }[];
  selectedPeriod: AdminStatsPeriodKey;
  sourceState: AdminStatsSourceState;
  sourceLabel: "DB" | "DB 미설정" | "조회 실패";
};
