import type { AdminFileUsagePoint, AdminStatChartPoint } from "@/lib/admin/adminDashboard.presentation";
import type { AdminStatsSourceState } from "@/lib/admin/stats/types";

export type AdminStatsDashboardViewModel = {
  sourceDescription: string;
  maxFlowValue: number;
  totalPartnerCount: number;
  workorderBars: AdminStatsBarViewModel[];
  partnerBars: AdminStatsRatioViewModel[];
  fileUsageBars: AdminStatsRatioViewModel[];
};

export type AdminStatsText = {
  dbSourceDescription: string;
  dbNotConfiguredDescription: string;
  dbErrorDescription: string;
};

export type AdminStatsBarViewModel = AdminStatChartPoint & {
  heightPercent: number;
  ariaLabel: string;
};

export type AdminStatsRatioViewModel = AdminFileUsagePoint & {
  widthPercent: number;
};

export function getAdminStatsSourceDescription(sourceState: AdminStatsSourceState, text: AdminStatsText): string {
  if (sourceState === "db") return text.dbSourceDescription;
  if (sourceState === "not_configured") return text.dbNotConfiguredDescription;
  return text.dbErrorDescription;
}

export function getAdminStatsMaxValue(points: readonly AdminStatChartPoint[]): number {
  return Math.max(1, ...points.map((item) => item.value));
}

export function getAdminStatsTotalValue(points: readonly AdminStatChartPoint[]): number {
  return points.reduce((sum, item) => sum + item.value, 0);
}

export function getAdminStatsPercent(value: number, maxValue: number, minimumPercent = 0): number {
  if (!Number.isFinite(value) || !Number.isFinite(maxValue) || maxValue <= 0) return minimumPercent;
  return Math.max(minimumPercent, Math.min(100, Math.round((value / maxValue) * 100)));
}

export function buildAdminStatsDashboardViewModel(payload: {
  sourceState: AdminStatsSourceState;
  text: AdminStatsText;
  workorderFlow: readonly AdminStatChartPoint[];
  partnerDistribution: readonly AdminStatChartPoint[];
  fileUsagePoints: readonly AdminFileUsagePoint[];
}): AdminStatsDashboardViewModel {
  const maxFlowValue = getAdminStatsMaxValue(payload.workorderFlow);
  const totalPartnerCount = getAdminStatsTotalValue(payload.partnerDistribution);

  return {
    sourceDescription: getAdminStatsSourceDescription(payload.sourceState, payload.text),
    maxFlowValue,
    totalPartnerCount,
    workorderBars: payload.workorderFlow.map((item) => ({
      ...item,
      heightPercent: getAdminStatsPercent(item.value, maxFlowValue, 8),
      ariaLabel: `${item.label} ${item.value}건`,
    })),
    partnerBars: payload.partnerDistribution.map((item) => ({
      ...item,
      limit: totalPartnerCount,
      valueLabel: `${item.value}`,
      widthPercent: getAdminStatsPercent(item.value, totalPartnerCount),
    })),
    fileUsageBars: payload.fileUsagePoints.map((item) => ({
      ...item,
      widthPercent: getAdminStatsPercent(item.value, item.limit),
    })),
  };
}
