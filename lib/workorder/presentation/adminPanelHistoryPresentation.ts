import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { HISTORY_FILTER_OPTIONS } from "@/lib/constants/workflow";
import { getI18n } from "@/lib/i18n";
import type { HistoryFilter } from "@/types/workflow";
import type { HistoryDetailLine, HistoryLog } from "@/types/workorder";

const i18n = getI18n();
const ui = i18n.common.ui;

export type AdminPanelHistoryFilterOptionViewModel = {
  value: HistoryFilter;
  label: string;
  className: string;
};

export type AdminPanelHistoryDetailLineViewModel = {
  key: string;
  label: string | null;
  value: string;
};

export type AdminPanelHistoryPreviewItemViewModel = {
  id: string;
  action: string;
  actionToneClass: string;
  time: string;
  summary: string;
  hasDetails: boolean;
  detailToggleLabel: string | null;
  transition: HistoryLog["transition"];
  detailLines: AdminPanelHistoryDetailLineViewModel[];
};

export type AdminPanelHistorySectionViewModel = {
  title: string;
  summaryText: string;
  countText: string;
  filterOptions: AdminPanelHistoryFilterOptionViewModel[];
  items: HistoryLog[];
  emptyText: string;
};

function buildDetailLineViewModel(itemId: string, detailLines: HistoryDetailLine[] | undefined): AdminPanelHistoryDetailLineViewModel[] {
  return (detailLines ?? []).map((detail, index) => ({
    key: `${itemId}-detail-${index}`,
    label: detail.label ?? null,
    value: detail.value,
  }));
}

export function buildAdminPanelHistoryPreviewItemViewModel(item: HistoryLog, open: boolean): AdminPanelHistoryPreviewItemViewModel {
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return {
    id: item.id,
    action: item.action,
    actionToneClass: HISTORY_TONE_CLASS[item.tone],
    time: item.time,
    summary: item.summary,
    hasDetails,
    detailToggleLabel: hasDetails ? (open ? ui.common.collapse : ui.common.detail) : null,
    transition: item.transition,
    detailLines: buildDetailLineViewModel(item.id, item.detailLines),
  };
}

export function buildAdminPanelHistorySectionViewModel(
  historyLogs: HistoryLog[],
  historyFilter: HistoryFilter,
): AdminPanelHistorySectionViewModel {
  return {
    title: ui.modal.adminPanel.historyTitle,
    summaryText: ui.modal.adminPanel.historySummaryFormat,
    countText: `${historyLogs.length}${ui.modal.adminPanel.countSuffix}`,
    filterOptions: HISTORY_FILTER_OPTIONS.map(([value, label]) => ({
      value,
      label,
      className: historyFilter === value ? HISTORY_FILTER_BUTTON_CLASS.active : HISTORY_FILTER_BUTTON_CLASS.inactive,
    })),
    items: historyLogs,
    emptyText: i18n.workorder.presentation.inventoryLog.empty,
  };
}
