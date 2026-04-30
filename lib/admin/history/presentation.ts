import { getI18n } from "@/lib/i18n";
import { getAdminHistoryToneClass, selectAdminHistoryFilterOptions } from "@/lib/admin/history/selectors";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

const i18n = getI18n();
const adminI18n = i18n.admin;
const commonUi = i18n.common.ui;
type AdminI18n = ReturnType<typeof getI18n>["admin"];

const HIDDEN_DETAIL_LABELS = new Set([
  "companyId",
  "company_id",
  "partnerId",
  "partner_id",
  "rawAction",
  "raw_action",
  "actionType",
  "action_type",
  "targetId",
  "target_id",
  "targetType",
  "target_type",
  "userId",
  "user_id",
  "workOrderId",
  "work_order_id",
  "attachmentId",
  "attachment_id",
  "fileId",
  "file_id",
  "id",
  "uuid",
  "metadata",
  "debug",
  "payload",
  "updatedSection",
  "updated_section",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
]);

const DISPLAY_DETAIL_LABELS = new Set([
  "status",
  "from",
  "to",
  "actor",
  "user",
  "role",
  "target",
  "fileName",
  "file_name",
  "partnerName",
  "partner_name",
  "source",
  "type",
  "memo",
  "message",
  "name",
  "title",
  "quantity",
  "reason",
]);

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
  filterOptions: ReturnType<typeof selectAdminHistoryFilterOptions>;
  items: AdminHistoryEvent[];
  emptyText: string;
};

function normalizeHistoryToken(value: string): string {
  return value.trim().replace(/[\s-]+/g, "_").toLowerCase();
}

function displayHistoryAction(action: string, translations: AdminI18n): string {
  const actionMap = translations.historyPage.actions as Record<string, string> | undefined;
  return actionMap?.[action] ?? actionMap?.[action.toUpperCase()] ?? action;
}

function displayHistoryStatus(value: string, translations: AdminI18n): string {
  const statusMap = translations.historyPage.status as Record<string, string> | undefined;
  return statusMap?.[value] ?? statusMap?.[normalizeHistoryToken(value)] ?? value;
}

function displayHistoryTargetType(value: string, translations: AdminI18n): string {
  const targetTypeMap = translations.historyPage.targetTypes as Record<string, string> | undefined;
  return targetTypeMap?.[value] ?? targetTypeMap?.[normalizeHistoryToken(value)] ?? value;
}

function isDisplayableHistoryDetailLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  const normalized = normalizeHistoryToken(label);
  if (HIDDEN_DETAIL_LABELS.has(label) || HIDDEN_DETAIL_LABELS.has(normalized)) return false;
  return DISPLAY_DETAIL_LABELS.has(label) || DISPLAY_DETAIL_LABELS.has(normalized);
}

function displayHistoryDetailLabel(label: string | null | undefined, translations: AdminI18n): string | null {
  if (!isDisplayableHistoryDetailLabel(label)) return null;
  const labelMap = translations.historyPage.detailLabels as Record<string, string> | undefined;
  return labelMap?.[label] ?? labelMap?.[normalizeHistoryToken(label)] ?? label;
}

function isTechnicalHistoryValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (/^(company|partner|workorder|attachment|file|user)[-_][a-z0-9_-]+$/i.test(trimmed)) return true;
  if (trimmed === "[object Object]") return true;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) return true;
  return false;
}

function displayHistoryValue(value: string, translations: AdminI18n): string {
  let result = value;
  const actionMap = translations.historyPage.actions as Record<string, string> | undefined;
  Object.entries(actionMap ?? {}).forEach(([code, label]) => {
    result = result.replaceAll(code, label);
  });
  const statusMap = translations.historyPage.status as Record<string, string> | undefined;
  Object.entries(statusMap ?? {}).forEach(([code, label]) => {
    result = result.replaceAll(code, label);
  });
  const targetTypeMap = translations.historyPage.targetTypes as Record<string, string> | undefined;
  Object.entries(targetTypeMap ?? {}).forEach(([code, label]) => {
    result = result.replaceAll(code, label);
  });
  return result.replaceAll("system", translations.historyPage.systemActor ?? "system");
}

function buildAdminHistorySummary(item: AdminHistoryEvent, translations: AdminI18n): string {
  const summaries = translations.historyPage.summaries as Record<string, string> | undefined;
  const actionSummary = summaries?.[item.action] ?? summaries?.[item.action.toUpperCase()];
  if (actionSummary) return actionSummary;

  if (item.transition) {
    return `${displayHistoryStatus(item.transition.from, translations)} → ${displayHistoryStatus(item.transition.to, translations)}`;
  }

  if (item.summary && !isTechnicalHistoryValue(item.summary)) return displayHistoryValue(item.summary, translations);
  if (item.message && !isTechnicalHistoryValue(item.message)) return displayHistoryValue(item.message, translations);

  return displayHistoryTargetType(item.target.type, translations);
}

function buildDetailLineViewModel(itemId: string, detailLines: AdminHistoryEvent["detailLines"], translations: AdminI18n): AdminHistoryDetailLineViewModel[] {
  return (detailLines ?? []).flatMap((detail, index) => {
    const label = displayHistoryDetailLabel(detail.label, translations);
    if (!label) return [];

    const value = displayHistoryValue(detail.value, translations);
    if (isTechnicalHistoryValue(value)) return [];

    return [{
      key: `${itemId}-detail-${index}`,
      label,
      value,
    }];
  });
}

function buildTransitionViewModel(item: AdminHistoryEvent, translations: AdminI18n): AdminHistoryEvent["transition"] {
  if (!item.transition) return item.transition;
  return {
    from: displayHistoryStatus(item.transition.from, translations),
    to: displayHistoryStatus(item.transition.to, translations),
  };
}

export function buildAdminHistoryItemViewModel(item: AdminHistoryEvent, open: boolean, translations: AdminI18n = adminI18n): AdminHistoryItemViewModel {
  const detailLines = buildDetailLineViewModel(item.id, item.detailLines, translations);
  const transition = buildTransitionViewModel(item, translations);
  const hasDetails = Boolean(transition || detailLines.length > 0);

  return {
    id: item.id,
    action: displayHistoryAction(item.action, translations),
    actionToneClass: getAdminHistoryToneClass(item.tone),
    time: item.occurredAt,
    summary: buildAdminHistorySummary(item, translations),
    hasDetails,
    detailToggleLabel: hasDetails ? (open ? commonUi.common.collapse : commonUi.common.detail) : null,
    transition,
    detailLines,
  };
}

export function buildAdminHistorySectionViewModel(
  historyLogs: AdminHistoryEvent[],
  historyFilter: AdminHistoryFilter,
  translations: AdminI18n = adminI18n,
): AdminHistorySectionViewModel {
  return {
    title: translations.historySection.title,
    summaryText: translations.historySection.summary,
    filterOptions: selectAdminHistoryFilterOptions(historyFilter, translations),
    items: historyLogs,
    emptyText: i18n.workorder.presentation.inventoryLog.empty,
  };
}
