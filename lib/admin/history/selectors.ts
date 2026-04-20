import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { getI18n } from "@/lib/i18n";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import type { RoleType } from "@/types/permission";
import type { HistoryLog } from "@/types/workorder";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

const i18n = getI18n();
const presentation = i18n.workorder.presentation;

export type AdminHistoryFilterOption = {
  value: AdminHistoryFilter;
  label: string;
  className: string;
};

export function toAdminHistoryEvent(item: HistoryLog): AdminHistoryEvent {
  return {
    id: item.id,
    workOrderId: item.workOrderId,
    category: item.category,
    action: item.action,
    message: item.message,
    actorName: item.user,
    occurredAt: item.time,
    tone: item.tone,
    summary: item.summary,
    detailLines: item.detailLines,
    transition: item.transition,
  };
}

export function filterAdminHistoryEvents(historyLogs: HistoryLog[], historyFilter: AdminHistoryFilter, currentRoles: RoleType[]): AdminHistoryEvent[] {
  const seenIds = new Set<string>();

  return filterHistoryLogs(historyLogs, true, historyFilter, currentRoles)
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    })
    .map(toAdminHistoryEvent);
}

export function selectAdminHistoryFilterOptions(historyFilter: AdminHistoryFilter): AdminHistoryFilterOption[] {
  const filterOptions: readonly [AdminHistoryFilter, string][] = [
    ["all", presentation.historyFilters.all],
    ["work", presentation.historyFilters.work],
    ["inventory", presentation.historyFilters.inventory],
    ["attachment", presentation.historyFilters.attachment],
  ] as const;

  return filterOptions.map(([value, label]) => ({
    value,
    label,
    className: historyFilter === value ? HISTORY_FILTER_BUTTON_CLASS.active : HISTORY_FILTER_BUTTON_CLASS.inactive,
  }));
}

export function getAdminHistoryToneClass(tone: AdminHistoryEvent["tone"]) {
  return HISTORY_TONE_CLASS[tone];
}

export function matchesAdminHistorySearch(item: AdminHistoryEvent, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const haystacks = [
    item.action,
    item.message,
    item.actorName,
    item.occurredAt,
    item.summary,
    item.transition?.from,
    item.transition?.to,
    ...(item.detailLines ?? []).flatMap((detail) => [detail.label ?? "", detail.value]),
  ];

  return haystacks.some((value) => value?.toLowerCase().includes(normalizedQuery));
}
