import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";
import type { HistoryLog } from "@/types/workorder";

export const defaultHistoryText = getI18n(DEFAULT_LOCALE).workorder.history;
export type HistoryText = typeof defaultHistoryText;
export type DetailLine = NonNullable<HistoryLog["detailLines"]>[number];

export function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function withActor(summary: string, user: string, text: HistoryText) {
  return `${summary}${text.actorSeparator}${user}`;
}

function buildHistorySummary(payload: {
  action: string;
  user: string;
  text: HistoryText;
  transition?: HistoryLog["transition"];
  detailLines?: HistoryLog["detailLines"];
}) {
  if (payload.transition) {
    return withActor(
      `${payload.action}: ${payload.transition.from}${payload.text.transitionArrow}${payload.transition.to}`,
      payload.user,
      payload.text,
    );
  }

  const firstDetail = payload.detailLines?.find((detail) => detail.value.trim())?.value?.trim();
  if (firstDetail) {
    const compact = firstDetail.length > 42 ? `${firstDetail.slice(0, 42)}…` : firstDetail;
    return withActor(`${payload.action}: ${compact}`, payload.user, payload.text);
  }

  return withActor(payload.action, payload.user, payload.text);
}

export function nowLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}-${date} ${hour}:${minute}`;
}

export function createHistoryLog(payload: {
  action: string;
  message: string;
  summary?: string;
  user: string;
  workOrderId: string;
  category: HistoryLog["category"];
  tone: HistoryLog["tone"];
  detailLines?: HistoryLog["detailLines"];
  transition?: HistoryLog["transition"];
  text?: HistoryText;
}): HistoryLog {
  const text = payload.text ?? defaultHistoryText;
  return {
    id: `${payload.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId: payload.workOrderId,
    category: payload.category,
    action: payload.action,
    message: payload.message,
    user: payload.user,
    time: nowLabel(),
    tone: payload.tone,
    summary: payload.summary ?? buildHistorySummary({ ...payload, text }),
    detailLines: payload.detailLines,
    transition: payload.transition ?? null,
  };
}
