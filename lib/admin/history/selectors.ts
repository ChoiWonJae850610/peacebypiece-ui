import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { getI18n } from "@/lib/i18n";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import type { RoleType } from "@/types/permission";
import type { HistoryLog } from "@/types/workorder";
import type { AdminHistoryDateFilter, AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

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


export type AdminHistorySelectOption = {
  value: string;
  label: string;
};

export const ADMIN_HISTORY_DATE_FILTER_OPTIONS: { value: AdminHistoryDateFilter; label: string }[] = [
  { value: "all", label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week", label: "최근 7일" },
  { value: "month", label: "최근 30일" },
];

function parseAdminHistoryDate(value: string): Date | null {
  const normalized = value.replace(/\./g, "-").replace(/\s+/g, "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function matchesAdminHistoryDateFilter(item: AdminHistoryEvent, dateFilter: AdminHistoryDateFilter, now = new Date()) {
  if (dateFilter === "all") return true;

  const occurredAt = parseAdminHistoryDate(item.occurredAt);
  if (!occurredAt) return true;

  const diff = now.getTime() - occurredAt.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (dateFilter === "today") return occurredAt.toDateString() === now.toDateString();
  if (dateFilter === "week") return diff >= 0 && diff <= oneDay * 7;
  if (dateFilter === "month") return diff >= 0 && diff <= oneDay * 30;

  return true;
}

export function selectAdminHistoryUserOptions(items: AdminHistoryEvent[]): AdminHistorySelectOption[] {
  const users = Array.from(new Set(items.map((item) => item.actorName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  return [{ value: "all", label: "전체 사용자" }, ...users.map((user) => ({ value: user, label: user }))];
}

export function filterAdminHistoryPageEvents(payload: {
  items: AdminHistoryEvent[];
  searchQuery: string;
  dateFilter: AdminHistoryDateFilter;
  userFilter: string;
}) {
  return payload.items.filter((item) => {
    if (!matchesAdminHistorySearch(item, payload.searchQuery)) return false;
    if (!matchesAdminHistoryDateFilter(item, payload.dateFilter)) return false;
    if (payload.userFilter !== "all" && item.actorName !== payload.userFilter) return false;
    return true;
  });
}
