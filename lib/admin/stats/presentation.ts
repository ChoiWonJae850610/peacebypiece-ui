import type { AdminFileUsagePoint, AdminStatChartPoint } from "@/lib/admin/adminDashboard.presentation";
import type { AdminStatsMetric, AdminStatsRatioPoint, AdminStatsSourceState } from "@/lib/admin/stats/types";

export type AdminStatsDashboardViewModel = {
  sourceDescription: string;
  maxFlowValue: number;
  totalFlowValue: number;
  totalPartnerCount: number;
  totalRoundCount: number;
  totalCategoryCount: number;
  workorderBars: AdminStatsBarViewModel[];
  partnerBars: AdminStatsRatioViewModel[];
  fileUsageBars: AdminStatsRatioViewModel[];
  partnerDonut: AdminStatsDonutSegment[];
  fileUsageDonut: AdminStatsDonutSegment[];
  roundBars: AdminStatsRatioViewModel[];
  categoryBars: AdminStatsRatioViewModel[];
  attachmentTrashCards: AdminStatsNumberCardViewModel[];
  keyMetrics: AdminStatsNumberCardViewModel[];
};

export type AdminStatsText = {
  dbSourceDescription: string;
  dbNotConfiguredDescription: string;
  dbErrorDescription: string;
};

export type AdminStatsBarViewModel = AdminStatChartPoint & { heightPercent: number; ariaLabel: string; isEmpty: boolean };
export type AdminStatsRatioViewModel = (AdminFileUsagePoint | AdminStatsRatioPoint) & { widthPercent: number };
export type AdminStatsDonutSegment = { label: string; value: number; percent: number; strokeDasharray: string; strokeDashoffset: number };
export type AdminStatsNumberCardViewModel = { key?: string; label: string; value: string; description?: string };

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

export function buildAdminDonutSegments(points: readonly AdminStatChartPoint[]): AdminStatsDonutSegment[] {
  const total = getAdminStatsTotalValue(points);
  let offset = 0;
  return points.map((item) => {
    const percent = total > 0 ? getAdminStatsPercent(item.value, total) : 0;
    const segment = { label: item.label, value: item.value, percent, strokeDasharray: `${percent} ${100 - percent}`, strokeDashoffset: -offset };
    offset += percent;
    return segment;
  });
}

export function buildAdminStatsDashboardViewModel(payload: {
  sourceState: AdminStatsSourceState;
  text: AdminStatsText;
  workorderFlow: readonly AdminStatChartPoint[];
  partnerDistribution: readonly AdminStatChartPoint[];
  fileUsagePoints: readonly AdminFileUsagePoint[];
  keyMetrics: readonly AdminStatsMetric[];
  productionRoundDistribution: readonly AdminStatsRatioPoint[];
  productionCategoryDistribution: readonly AdminStatsRatioPoint[];
  attachmentTrashCards: readonly AdminStatsRatioPoint[];
}): AdminStatsDashboardViewModel {
  const maxFlowValue = getAdminStatsMaxValue(payload.workorderFlow);
  const totalFlowValue = getAdminStatsTotalValue(payload.workorderFlow);
  const totalPartnerCount = getAdminStatsTotalValue(payload.partnerDistribution);
  const totalRoundCount = getAdminStatsTotalValue(payload.productionRoundDistribution);
  const totalCategoryCount = getAdminStatsTotalValue(payload.productionCategoryDistribution);

  return {
    sourceDescription: getAdminStatsSourceDescription(payload.sourceState, payload.text),
    maxFlowValue,
    totalFlowValue,
    totalPartnerCount,
    totalRoundCount,
    totalCategoryCount,
    workorderBars: payload.workorderFlow.map((item) => ({ ...item, heightPercent: item.value > 0 ? getAdminStatsPercent(item.value, maxFlowValue, 12) : 0, ariaLabel: `${item.label} ${item.value}건`, isEmpty: item.value <= 0 })),
    partnerBars: payload.partnerDistribution.map((item) => ({ ...item, limit: totalPartnerCount, valueLabel: `${item.value}`, widthPercent: getAdminStatsPercent(item.value, totalPartnerCount) })),
    fileUsageBars: payload.fileUsagePoints.map((item) => ({ ...item, widthPercent: getAdminStatsPercent(item.value, item.limit) })),
    partnerDonut: buildAdminDonutSegments(payload.partnerDistribution),
    fileUsageDonut: buildAdminDonutSegments(payload.fileUsagePoints.map((item) => ({ label: item.label, value: item.value }))),
    roundBars: payload.productionRoundDistribution.map((item) => ({ ...item, limit: totalRoundCount, valueLabel: `${item.value}`, widthPercent: getAdminStatsPercent(item.value, totalRoundCount) })),
    categoryBars: payload.productionCategoryDistribution.map((item) => ({ ...item, limit: totalCategoryCount, valueLabel: `${item.value}`, widthPercent: getAdminStatsPercent(item.value, totalCategoryCount) })),
    attachmentTrashCards: payload.attachmentTrashCards.map((item) => ({ label: item.label, value: item.valueLabel ?? `${item.value}` })),
    keyMetrics: payload.keyMetrics.map((item) => ({ key: item.key, label: item.label, value: `${item.value}`, description: item.description })),
  };
}
