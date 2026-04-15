import { getI18n } from "@/lib/i18n";
import { getAdminHistoryToneClass, selectAdminHistoryFilterOptions } from "@/lib/admin/history/selectors";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

const i18n = getI18n();
const adminI18n = i18n.admin;
const commonUi = i18n.common.ui;

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

function buildDetailLineViewModel(itemId: string, detailLines: AdminHistoryEvent["detailLines"]): AdminHistoryDetailLineViewModel[] {
  return (detailLines ?? []).map((detail, index) => ({
    key: `${itemId}-detail-${index}`,
    label: detail.label ?? null,
    value: detail.value,
  }));
}

export function buildAdminHistoryItemViewModel(item: AdminHistoryEvent, open: boolean): AdminHistoryItemViewModel {
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return {
    id: item.id,
    action: item.action,
    actionToneClass: getAdminHistoryToneClass(item.tone),
    time: item.occurredAt,
    summary: item.summary,
    hasDetails,
    detailToggleLabel: hasDetails ? (open ? commonUi.common.collapse : commonUi.common.detail) : null,
    transition: item.transition,
    detailLines: buildDetailLineViewModel(item.id, item.detailLines),
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
