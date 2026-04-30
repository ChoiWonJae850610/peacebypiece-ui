import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { ADMIN_HISTORY_DATE_MS, ADMIN_HISTORY_USER_ALL_OPTION } from "@/lib/constants/adminHistory";
export { ADMIN_HISTORY_DATE_FILTER_OPTIONS } from "@/lib/constants/adminHistory";
import { getI18n } from "@/lib/i18n";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import type { RoleType } from "@/types/permission";
import type { HistoryLog } from "@/types/workorder";
import type { AdminHistoryDateFilter, AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

const i18n = getI18n();
const defaultAdminText = i18n.admin;

export type AdminHistoryFilterOption = {
  value: AdminHistoryFilter;
  label: string;
  className: string;
};

function toAdminHistoryTimestamp(value: string): AdminHistoryEvent["timestamp"] {
  return {
    iso: value,
    display: value,
  };
}

const ADMIN_HISTORY_ALLOWED_ACTIONS = new Set([
  "WORKORDER_CREATED",
  "STATUS_CHANGED",
  "FILE_UPLOADED",
  "FILE_DELETED",
  "PARTNER_CREATED",
  "PARTNER_UPDATED",
  "PARTNER_DELETED",
]);

const ADMIN_HISTORY_SYSTEM_TARGETS = new Set(["settings", "system", "debug"]);

function normalizeAdminHistoryAction(value: string): string {
  return value.trim().toUpperCase();
}

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
    actor: {
      id: null,
      name: item.user || "system",
    },
    target: {
      type: "workorder",
      id: item.workOrderId || null,
      label: item.workOrderId || null,
    },
    timestamp: toAdminHistoryTimestamp(item.time),
    detailLines: item.detailLines,
    transition: item.transition,
  };
}

export function dedupeAdminHistoryEvents<T extends { id: string }>(items: T[]): T[] {
  const seenIds = new Set<string>();
  return items.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });
}

export function isAdminHistoryDisplayable(item: AdminHistoryEvent): boolean {
  const actorName = (item.actor.name || item.actorName || "").toLowerCase();
  const action = normalizeAdminHistoryAction(item.action);
  const targetType = String(item.target.type || "").toLowerCase();

  if (!ADMIN_HISTORY_ALLOWED_ACTIONS.has(action)) return false;
  if (ADMIN_HISTORY_SYSTEM_TARGETS.has(targetType)) return false;
  if (actorName === "system" && (targetType === "settings" || action === "SETTINGS_CHANGED")) return false;

  return true;
}

export function selectAdminHistoryEventsByCategory(items: AdminHistoryEvent[], historyFilter: AdminHistoryFilter): AdminHistoryEvent[] {
  return dedupeAdminHistoryEvents(items)
    .filter(isAdminHistoryDisplayable)
    .filter((item) => historyFilter === "all" || item.category === historyFilter);
}

export function filterAdminHistoryEvents(historyLogs: HistoryLog[], historyFilter: AdminHistoryFilter, currentRoles: RoleType[]): AdminHistoryEvent[] {
  return selectAdminHistoryEventsByCategory(
    dedupeAdminHistoryEvents(filterHistoryLogs(historyLogs, true, historyFilter, currentRoles).map(toAdminHistoryEvent)),
    historyFilter,
  );
}

export function selectAdminHistoryFilterOptions(
  historyFilter: AdminHistoryFilter,
  translations: typeof defaultAdminText = defaultAdminText,
): AdminHistoryFilterOption[] {
  const filterLabels = translations.historyPage.filters ?? defaultAdminText.historyPage.filters;
  const filterOptions: readonly [AdminHistoryFilter, string][] = [
    ["all", filterLabels.all],
    ["work", filterLabels.work],
    ["inventory", filterLabels.inventory],
    ["attachment", filterLabels.attachment],
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
    item.actor.name,
    item.actor.email ?? "",
    item.actorName,
    item.target.type,
    item.timestamp.display,
    item.occurredAt,
    item.summary,
    item.transition?.from,
    item.transition?.to,
    ...(item.detailLines ?? []).flatMap((detail) => {
      const label = (detail.label ?? "").toLowerCase();
      if (label.endsWith("id") || label.includes("company") || label.includes("raw") || label.includes("target") || label.includes("user") || label === "id") return [];
      return [detail.label ?? "", detail.value];
    }),
  ];

  return haystacks.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export type AdminHistorySelectOption = {
  value: string;
  label: string;
};

function parseAdminHistoryDate(value: string): Date | null {
  const normalized = value.replace(/\./g, "-").replace(/\s+/g, "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function matchesAdminHistoryDateFilter(item: AdminHistoryEvent, dateFilter: AdminHistoryDateFilter, now = new Date()) {
  if (dateFilter === "all") return true;

  const occurredAt = parseAdminHistoryDate(item.timestamp.iso || item.occurredAt);
  if (!occurredAt) return true;

  const diff = now.getTime() - occurredAt.getTime();
  if (dateFilter === "today") return occurredAt.toDateString() === now.toDateString();
  if (dateFilter === "week") return diff >= 0 && diff <= ADMIN_HISTORY_DATE_MS * 7;
  if (dateFilter === "month") return diff >= 0 && diff <= ADMIN_HISTORY_DATE_MS * 30;

  return true;
}

export function selectAdminHistoryUserOptions(items: AdminHistoryEvent[]): AdminHistorySelectOption[] {
  const users = Array.from(new Set(items.filter(isAdminHistoryDisplayable).map((item) => item.actor.name || item.actorName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  return [ADMIN_HISTORY_USER_ALL_OPTION, ...users.map((user) => ({ value: user, label: user }))];
}

export function filterAdminHistoryPageEvents(payload: {
  items: AdminHistoryEvent[];
  searchQuery: string;
  dateFilter: AdminHistoryDateFilter;
  userFilter: string;
}) {
  return payload.items.filter((item) => {
    if (!isAdminHistoryDisplayable(item)) return false;
    if (!matchesAdminHistorySearch(item, payload.searchQuery)) return false;
    if (!matchesAdminHistoryDateFilter(item, payload.dateFilter)) return false;
    if (payload.userFilter !== "all" && (item.actor.name || item.actorName) !== payload.userFilter) return false;
    return true;
  });
}
