import type { AdminStatsPeriodTopMode } from "@/lib/admin/stats/types";
import type { getI18n } from "@/lib/i18n";

export type AdminStatsSectionKey = "production" | "factory" | "period";

export type AdminStatsTranslator = (path: string, fallback?: string) => string;

export type AdminStatsPageText = ReturnType<typeof getI18n>["admin"]["dashboardPage"];

export type AdminStatsRatioBarPoint = {
  label: string;
  value: number;
  valueLabel?: string;
  limit: number;
  widthPercent: number;
};

export type AdminStatsSectionTab = {
  key: AdminStatsSectionKey;
  label: string;
  description: string;
};

export type AdminStatsPeriodSummaryItem = {
  key: AdminStatsPeriodTopMode;
  label: string;
  value: string;
  description: string;
};

const ADMIN_STATS_TRANSLATABLE_LABELS: Record<string, string> = {
  "전체 작업지시서": "statsUi.summaries.totalWorkorders.label",
  "DB 기준 전체 작업지시서 수": "statsUi.summaries.totalWorkorders.description",
  "협력업체 수": "statsUi.summaries.partnerCount.label",
  "활성 협력업체 수": "statsUi.summaries.partnerCount.description",
  "파일 사용량": "statsUi.summaries.fileUsage.label",
  "현재 첨부파일 사용량": "statsUi.summaries.fileUsage.description",
  "완료된 작업지시서": "statsUi.summaries.completedInPeriod.label",
  "선택 기간 안에 완료 처리된 작업": "statsUi.summaries.completedInPeriod.description",
  작성: "statsUi.flowBuckets.writing",
  검토: "statsUi.flowBuckets.review",
  발주: "statsUi.flowBuckets.order",
  입고: "statsUi.flowBuckets.inbound",
  완료: "statsUi.flowBuckets.completed",
  공장: "statsUi.partnerBuckets.factory",
  원단: "statsUi.partnerBuckets.fabric",
  부자재: "statsUi.partnerBuckets.subsidiary",
  외주: "statsUi.partnerBuckets.outsourcing",
  "전체 사용량": "statsUi.fileUsage.total",
  첨부파일: "statsUi.fileUsage.active",
  휴지통: "statsUi.fileUsage.trash",
  "1차": "statsUi.productionRounds.first",
  "2차": "statsUi.productionRounds.second",
  "3차 이상": "statsUi.productionRounds.thirdOrMore",
  "3차": "statsUi.productionRounds.thirdOrMore",
  "분류 미지정": "statsUi.unknownLabel",
  "7일": "statsUi.periods.sevenDays",
  "30일": "statsUi.periods.thirtyDays",
};

export function translateAdminStatsLabel(label: string, translate: AdminStatsTranslator) {
  const translationKey = ADMIN_STATS_TRANSLATABLE_LABELS[label];
  return translationKey ? translate(translationKey, label) : label;
}

export function translateAdminStatsText<T extends { label: string; description?: string }>(items: readonly T[], translate: AdminStatsTranslator): T[] {
  return items.map((item) => ({
    ...item,
    label: translateAdminStatsLabel(item.label, translate),
    description: item.description ? translateAdminStatsLabel(item.description, translate) : item.description,
  }));
}

export function formatAdminStatsCount(value: number | undefined, suffix = "") {
  const normalizedValue = Math.max(0, Math.round(value ?? 0)).toLocaleString("ko-KR");
  if (!suffix) return normalizedValue;
  const shouldUseSpacing = /^[A-Za-z%]+$/.test(suffix);
  return shouldUseSpacing ? `${normalizedValue} ${suffix}` : `${normalizedValue}${suffix}`;
}

export function formatAdminStatsPercent(value: number | null | undefined, pendingLabel: string) {
  if (value === null || value === undefined) return pendingLabel;
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

export function formatAdminStatsStorageGb(bytes: number, limitBytes: number) {
  const usedGb = bytes / 1024 / 1024 / 1024;
  const limitGb = limitBytes / 1024 / 1024 / 1024;
  return `${usedGb.toFixed(2)}GB / ${limitGb.toFixed(2)}GB`;
}

export function formatAdminStatsStorageMb(bytes: number, usedSuffix: string) {
  return `${(bytes / 1024 / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}MB ${usedSuffix}`;
}

export function buildAdminStatsRatioBars(points: Array<{ label: string; value: number; valueLabel?: string }>): AdminStatsRatioBarPoint[] {
  const total = points.reduce((sum, item) => sum + item.value, 0);
  return points.map((item) => ({
    ...item,
    limit: total,
    valueLabel: item.valueLabel ?? String(item.value),
    widthPercent: total > 0 ? Math.max(4, Math.round((item.value / total) * 100)) : 0,
  }));
}

export function buildAdminStatsPeriodSummaryItems(payload: {
  pageText: AdminStatsPageText;
  translate: AdminStatsTranslator;
  completedCount: number;
  reorderCount: number;
  qualityIssueCount: number;
}): AdminStatsPeriodSummaryItem[] {
  const countSuffix = payload.translate("workorderCountSuffix", payload.pageText.workorderCountSuffix);
  return [
    {
      key: "completed",
      label: payload.translate("periodSummaryCompletedLabel", payload.pageText.periodSummaryCompletedLabel),
      value: formatAdminStatsCount(payload.completedCount, countSuffix),
      description: payload.translate("periodSummaryCompletedDescription", payload.pageText.periodSummaryCompletedDescription),
    },
    {
      key: "reorder",
      label: payload.translate("periodSummaryReorderLabel", payload.pageText.periodSummaryReorderLabel),
      value: formatAdminStatsCount(payload.reorderCount, countSuffix),
      description: payload.translate("periodSummaryReorderDescription", payload.pageText.periodSummaryReorderDescription),
    },
    {
      key: "defect",
      label: payload.translate("periodSummaryDefectLabel", payload.pageText.periodSummaryDefectLabel),
      value: formatAdminStatsCount(payload.qualityIssueCount, countSuffix),
      description: payload.translate("periodSummaryDefectDescription", payload.pageText.periodSummaryDefectDescription),
    },
  ];
}

export function buildAdminStatsSectionTabs(pageText: AdminStatsPageText, translate: AdminStatsTranslator): AdminStatsSectionTab[] {
  return [
    {
      key: "production",
      label: translate("statsSectionProductionLabel", pageText.statsSectionProductionLabel),
      description: translate("statsSectionProductionDescription", pageText.statsSectionProductionDescription),
    },
    {
      key: "factory",
      label: translate("statsSectionFactoryLabel", pageText.statsSectionFactoryLabel),
      description: translate("statsSectionFactoryDescription", pageText.statsSectionFactoryDescription),
    },
    {
      key: "period",
      label: translate("statsSectionPeriodLabel", pageText.statsSectionPeriodLabel),
      description: translate("statsSectionPeriodDescription", pageText.statsSectionPeriodDescription),
    },
  ];
}

export function buildAdminStatsPeriodTopTitleMap(pageText: AdminStatsPageText, translate: AdminStatsTranslator): Record<AdminStatsPeriodTopMode, string> {
  return {
    completed: translate("periodTopCompletedTitle", pageText.periodTopCompletedTitle),
    reorder: translate("periodTopReorderTitle", pageText.reorderTopTitle),
    defect: translate("periodTopDefectTitle", pageText.periodTopDefectTitle),
  };
}

export function buildAdminStatsPeriodTopEmptyMap(pageText: AdminStatsPageText, translate: AdminStatsTranslator): Record<AdminStatsPeriodTopMode, string> {
  return {
    completed: translate("periodTopCompletedEmpty", pageText.periodTopCompletedEmpty),
    reorder: translate("periodTopReorderEmpty", pageText.reorderEmpty),
    defect: translate("periodTopDefectEmpty", pageText.periodTopDefectEmpty),
  };
}

export function buildAdminStatsPeriodTopBasisMap(pageText: AdminStatsPageText, translate: AdminStatsTranslator): Record<AdminStatsPeriodTopMode, string> {
  return {
    completed: translate("periodTopCompletedBasis", pageText.periodTopCompletedBasis),
    reorder: translate("periodTopReorderBasis", pageText.periodTopReorderBasis),
    defect: translate("periodTopDefectBasis", pageText.periodTopDefectBasis),
  };
}

export function buildAdminStatsPeriodTopSuffixMap(pageText: AdminStatsPageText, translate: AdminStatsTranslator): Record<AdminStatsPeriodTopMode, string> {
  return {
    completed: translate("quantityCountSuffix", "pcs"),
    reorder: translate("reorderRoundSuffix", pageText.reorderRoundSuffix),
    defect: translate("workorderCountSuffix", pageText.workorderCountSuffix),
  };
}

export function buildAdminFactoryMetricTooltip(
  item: {
    label: string;
    productionCount: number;
    dueDelayCount: number;
    dueDateTargetCount: number;
    qualityIssueCount: number;
    qualityTargetCount: number;
    dueDelayExamples?: string[];
    qualityIssueExamples?: string[];
  },
  pageText: AdminStatsPageText,
  translate: AdminStatsTranslator,
) {
  const dueExamples = item.dueDelayExamples?.slice(0, 3) ?? [];
  const qualityExamples = item.qualityIssueExamples?.slice(0, 3) ?? [];
  const countSuffix = translate("workorderCountSuffix", pageText.workorderCountSuffix);
  const lines = [
    translate("factoryTooltipProduction", pageText.factoryTooltipProduction).replace("{label}", item.label).replace("{count}", formatAdminStatsCount(item.productionCount, countSuffix)),
    translate("factoryTooltipDelay", pageText.factoryTooltipDelay).replace("{count}", formatAdminStatsCount(item.dueDelayCount, countSuffix)).replace("{target}", formatAdminStatsCount(item.dueDateTargetCount, countSuffix)),
    dueExamples.length > 0
      ? translate("factoryTooltipDelayExamples", pageText.factoryTooltipDelayExamples).replace("{items}", dueExamples.join(", "))
      : translate("factoryTooltipDelayNone", pageText.factoryTooltipDelayNone),
    translate("factoryTooltipQuality", pageText.factoryTooltipQuality).replace("{count}", formatAdminStatsCount(item.qualityIssueCount, countSuffix)).replace("{target}", formatAdminStatsCount(item.qualityTargetCount, countSuffix)),
    qualityExamples.length > 0
      ? translate("factoryTooltipQualityExamples", pageText.factoryTooltipQualityExamples).replace("{items}", qualityExamples.join(", "))
      : translate("factoryTooltipQualityNone", pageText.factoryTooltipQualityNone),
  ];
  return lines.join("\n");
}

export function normalizeAdminStatsPageSection(value: string | string[] | undefined): AdminStatsSectionKey {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "factory" || rawValue === "period") return rawValue;
  return "production";
}

export function normalizeAdminPeriodTopMode(value: string | string[] | undefined): AdminStatsPeriodTopMode {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "completed" || rawValue === "defect") return rawValue;
  return "reorder";
}

export function buildAdminStatsRedirectUrl(params: Record<string, string | string[] | undefined> | undefined) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
      return;
    }
    if (typeof value === "string") search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `/admin/stats?${queryString}` : "/admin/stats";
}
