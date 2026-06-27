"use client";

export const WORKORDER_ATTACHMENT_REFRESH_EVENT = "wafl:workorder-attachments-refresh";
const WORKORDER_ATTACHMENT_REFRESH_STORAGE_KEY = "wafl:workorder-attachments-refresh";

export type WorkOrderAttachmentRefreshDetail = {
  workOrderIds: string[];
  source: "storage-trash-restore" | "attachment-upload" | "attachment-delete" | "manual";
  reason?: string;
  issuedAt: number;
};

function normalizeWorkOrderIds(workOrderIds: string[]): string[] {
  return Array.from(
    new Set(
      workOrderIds
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export function createWorkOrderAttachmentRefreshDetail(input: {
  workOrderIds: string[];
  source: WorkOrderAttachmentRefreshDetail["source"];
  reason?: string;
}): WorkOrderAttachmentRefreshDetail | null {
  const workOrderIds = normalizeWorkOrderIds(input.workOrderIds);
  if (workOrderIds.length === 0) return null;

  return {
    workOrderIds,
    source: input.source,
    reason: input.reason,
    issuedAt: Date.now(),
  };
}

export function notifyWorkOrderAttachmentRefresh(input: {
  workOrderIds: string[];
  source: WorkOrderAttachmentRefreshDetail["source"];
  reason?: string;
}): void {
  if (typeof window === "undefined") return;

  const detail = createWorkOrderAttachmentRefreshDetail(input);
  if (!detail) return;

  window.dispatchEvent(new CustomEvent<WorkOrderAttachmentRefreshDetail>(WORKORDER_ATTACHMENT_REFRESH_EVENT, { detail }));

  try {
    window.localStorage.setItem(WORKORDER_ATTACHMENT_REFRESH_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // Cross-tab refresh is best-effort; same-tab CustomEvent already fired.
  }
}

export function readWorkOrderAttachmentRefreshDetail(value: unknown): WorkOrderAttachmentRefreshDetail | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Partial<WorkOrderAttachmentRefreshDetail>;
    if (!Array.isArray(parsed.workOrderIds)) return null;
    const workOrderIds = normalizeWorkOrderIds(parsed.workOrderIds.filter((id): id is string => typeof id === "string"));
    if (workOrderIds.length === 0) return null;

    return {
      workOrderIds,
      source: parsed.source ?? "manual",
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      issuedAt: typeof parsed.issuedAt === "number" ? parsed.issuedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function isWorkOrderAttachmentRefreshStorageKey(key: string | null): boolean {
  return key === WORKORDER_ATTACHMENT_REFRESH_STORAGE_KEY;
}
