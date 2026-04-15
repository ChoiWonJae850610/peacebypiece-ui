import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { HISTORY_FILTER_OPTIONS } from "@/lib/constants/workflow";
import { getI18n } from "@/lib/i18n";
import type { HistoryFilter } from "@/types/workflow";
import type { HistoryDetailLine, HistoryLog } from "@/types/workorder";

const i18n = getI18n();
const adminI18n = i18n.admin;
const commonUi = i18n.common.ui;

export type AdminHistoryFilterOptionViewModel = {
  value: HistoryFilter;
  label: string;
  className: string;
};

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
  transition: HistoryLog["transition"];
  detailLines: AdminHistoryDetailLineViewModel[];
};

export type AdminHistorySectionViewModel = {
  title: string;
  summaryText: string;
  countText: string;
  filterOptions: AdminHistoryFilterOptionViewModel[];
  items: HistoryLog[];
  emptyText: string;
};

function buildDetailLineViewModel(itemId: string, detailLines: HistoryDetailLine[] | undefined): AdminHistoryDetailLineViewModel[] {
  return (detailLines ?? []).map((detail, index) => ({
    key: `${itemId}-detail-${index}`,
    label: detail.label ?? null,
    value: detail.value,
  }));
}

export function buildAdminHistoryItemViewModel(item: HistoryLog, open: boolean): AdminHistoryItemViewModel {
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return {
    id: item.id,
    action: item.action,
    actionToneClass: HISTORY_TONE_CLASS[item.tone],
    time: item.time,
    summary: item.summary,
    hasDetails,
    detailToggleLabel: hasDetails ? (open ? commonUi.common.collapse : commonUi.common.detail) : null,
    transition: item.transition,
    detailLines: buildDetailLineViewModel(item.id, item.detailLines),
  };
}

export function buildAdminHistorySectionViewModel(
  historyLogs: HistoryLog[],
  historyFilter: HistoryFilter,
): AdminHistorySectionViewModel {
  return {
    title: adminI18n.historySection.title,
    summaryText: adminI18n.historySection.summary,
    countText: `${historyLogs.length}${adminI18n.historySection.countSuffix}`,
    filterOptions: HISTORY_FILTER_OPTIONS.map(([value, label]) => ({
      value,
      label,
      className: historyFilter === value ? HISTORY_FILTER_BUTTON_CLASS.active : HISTORY_FILTER_BUTTON_CLASS.inactive,
    })),
    items: historyLogs,
    emptyText: i18n.workorder.presentation.inventoryLog.empty,
  };
}
