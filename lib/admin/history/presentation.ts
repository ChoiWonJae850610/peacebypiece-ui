import { getI18n } from "@/lib/i18n";
import { getAdminHistoryToneClass, selectAdminHistoryFilterOptions } from "@/lib/admin/history/selectors";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

const i18n = getI18n();
const adminI18n = i18n.admin;
const commonUi = i18n.common.ui;
type AdminI18n = ReturnType<typeof getI18n>["admin"];

export type AdminHistoryDetailLineViewModel = {
  key: string;
  label: string | null;
  value: string;
};

export type AdminHistoryItemViewModel = {
  id: string;
  action: string;
  actionToneClass: string;
  time: string;
  summary: string;
  hasDetails: boolean;
  detailToggleLabel: string | null;
  transition: AdminHistoryEvent["transition"];
  detailLines: AdminHistoryDetailLineViewModel[];
};

export type AdminHistorySectionViewModel = {
  title: string;
  summaryText: string;
  countText: string;
  filterOptions: ReturnType<typeof selectAdminHistoryFilterOptions>;
  items: AdminHistoryEvent[];
  emptyText: string;
};

function displayHistoryAction(action: string, translations: AdminI18n): string {
  const actionMap = translations.historyPage.actions as Record<string, string> | undefined;
  return actionMap?.[action] ?? action;
}

function displayHistoryStatus(value: string, translations: AdminI18n): string {
  const statusMap = translations.historyPage.status as Record<string, string> | undefined;
  return statusMap?.[value] ?? value;
}

function displayHistorySummary(summary: string, translations: AdminI18n): string {
  let result = summary;
  const actionMap = translations.historyPage.actions as Record<string, string> | undefined;
  Object.entries(actionMap ?? {}).forEach(([code, label]) => {
    result = result.replaceAll(code, label);
  });
  const statusMap = translations.historyPage.status as Record<string, string> | undefined;
  Object.entries(statusMap ?? {}).forEach(([code, label]) => {
    result = result.replaceAll(code, label);
  });
  return result;
}

function buildDetailLineViewModel(itemId: string, detailLines: AdminHistoryEvent["detailLines"], translations: AdminI18n): AdminHistoryDetailLineViewModel[] {
  return (detailLines ?? []).map((detail, index) => ({
    key: `${itemId}-detail-${index}`,
    label: detail.label ?? null,
    value: displayHistorySummary(detail.value, translations),
  }));
}

function buildTransitionViewModel(item: AdminHistoryEvent, translations: AdminI18n): AdminHistoryEvent["transition"] {
  if (!item.transition) return item.transition;
  return {
    from: displayHistoryStatus(item.transition.from, translations),
    to: displayHistoryStatus(item.transition.to, translations),
  };
}

export function buildAdminHistoryItemViewModel(item: AdminHistoryEvent, open: boolean, translations: AdminI18n = adminI18n): AdminHistoryItemViewModel {
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return {
    id: item.id,
    action: displayHistoryAction(item.action, translations),
    actionToneClass: getAdminHistoryToneClass(item.tone),
    time: item.occurredAt,
    summary: displayHistorySummary(item.summary, translations),
    hasDetails,
    detailToggleLabel: hasDetails ? (open ? commonUi.common.collapse : commonUi.common.detail) : null,
    transition: buildTransitionViewModel(item, translations),
    detailLines: buildDetailLineViewModel(item.id, item.detailLines, translations),
  };
}

export function buildAdminHistorySectionViewModel(historyLogs: AdminHistoryEvent[], historyFilter: AdminHistoryFilter): AdminHistorySectionViewModel {
  return {
    title: adminI18n.historySection.title,
    summaryText: adminI18n.historySection.summary,
    countText: `${historyLogs.length}${adminI18n.historySection.countSuffix}`,
    filterOptions: selectAdminHistoryFilterOptions(historyFilter),
    items: historyLogs,
    emptyText: i18n.workorder.presentation.inventoryLog.empty,
  };
}
