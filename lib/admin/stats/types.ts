import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";

export type AdminStatsSourceState = "db" | "not_configured" | "error";

export type AdminStatsPeriodKey = "7d" | "30d" | "custom";

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

export type AdminStatsFactoryPerformance = {
  label: string;
  productionCount: number;
  dueDelayRate: number | null;
  dueDelayCount: number;
  dueDateTargetCount: number;
  qualityIssueRate: number | null;
  qualityIssueCount: number;
  qualityTargetCount: number;
  dueDelayExamples: string[];
  qualityIssueExamples: string[];
};

export type AdminStatsRoundKey = "first" | "second" | "third";

export type AdminStatsCategoryByRound = Record<AdminStatsRoundKey, AdminStatsRatioPoint[]>;

export type AdminStatsCategoryDrilldownKey = "firstToSecond" | "secondToThird";

export type AdminStatsCategoryDrilldown = Record<AdminStatsCategoryDrilldownKey, Record<string, AdminStatsRatioPoint[]>>;

export type AdminStatsPeriodRange = {
  startDate: string;
  endDate: string;
  label: string;
  isCustom: boolean;
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
  productionCategoryByRound: AdminStatsCategoryByRound;
  productionCategoryDrilldown: AdminStatsCategoryDrilldown;
  reorderTopProducts: AdminStatsRatioPoint[];
  factoryPerformance: AdminStatsFactoryPerformance[];
  attachmentTrashCards: AdminStatsRatioPoint[];
  periodOptions: { key: AdminStatsPeriodKey; label: string; active: boolean; href: string }[];
  selectedPeriod: AdminStatsPeriodKey;
  selectedPeriodRange: AdminStatsPeriodRange;
  sourceState: AdminStatsSourceState;
  sourceLabel: "DB" | "DB 미설정" | "조회 실패";
};
