import "server-only";

import { getAdminCompanyId } from "@/lib/admin/settings/companyScope";
import { ADMIN_WORKORDER_FLOW_BUCKETS } from "@/lib/constants/adminStats";
import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import { getI18n } from "@/lib/i18n";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";

import {
  ADMIN_DASHBOARD_PERIOD_OPTIONS,
  type AdminDashboardPeriod,
  type AdminDashboardQueueId,
  type AdminDashboardTaskPriorityKey,
  type AdminDashboardTaskStatusKey,
  type AdminDashboardTodayTask,
  type AdminOperationalDashboardSnapshot,
  type AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";

export { ADMIN_DASHBOARD_PERIOD_OPTIONS };

const adminOpsText = getI18n().admin.operationsDashboard;
const adminStatsText = getI18n().admin.statsUi;

const ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS = [
  { labelKey: "working", statuses: ["draft", "rejected"] },
  { labelKey: "reviewWaiting", statuses: ["review_requested"] },
  { labelKey: "inboundWaiting", statuses: ["inspection", "review_completed"] },
  { labelKey: "completed", statuses: ["completed"] },
] as const;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const ADMIN_DASHBOARD_QUEUE_IDS: readonly AdminDashboardQueueId[] = ["reviewWaiting", "orderWaiting", "inspectionWaiting", "inboundDelayed"] as const;

function createEmptyQueueTasks(): Record<AdminDashboardQueueId, AdminDashboardTodayTask[]> {
  return {
    reviewWaiting: [],
    orderWaiting: [],
    inspectionWaiting: [],
    inboundDelayed: [],
  };
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getPeriodStart(period: AdminDashboardPeriod, now: Date): Date {
  const today = startOfToday(now);
  if (period === "today") return today;
  if (period === "week") {
    const date = new Date(today);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset);
    return date;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const normalized = value.includes("T") ? value : value.replace(/\./g, "-").replace(/\//g, "-");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDueDateAtStartOfDay(value: unknown, now: Date): Date | null {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;

  const fullDateMatch = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (fullDateMatch) {
    return new Date(Number(fullDateMatch[1]), Number(fullDateMatch[2]) - 1, Number(fullDateMatch[3]));
  }

  const monthDayMatch = text.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (monthDayMatch) {
    return new Date(now.getFullYear(), Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]));
  }

  return parseDate(text);
}

function isWithinPeriod(value: unknown, period: AdminDashboardPeriod, now: Date): boolean {
  const date = parseDate(value);
  if (!date) return false;
  return date >= getPeriodStart(period, now) && date <= now;
}

function countByStatuses(rows: WorkorderRow[], statuses: readonly string[], period: AdminDashboardPeriod, now: Date): number {
  return rows.filter((row) => statuses.includes(row.status ?? "") && isWithinPeriod(row.created_at, period, now)).length;
}

function formatDueLabel(value: unknown, now: Date): string {
  const dueDate = parseDueDateAtStartOfDay(value, now);
  const today = startOfToday(now);
  if (!dueDate) return adminOpsText.todayTasks.duePending;
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / ONE_DAY_MS);
  if (diffDays < 0) return adminOpsText.todayTasks.overdue;
  if (diffDays === 0) return adminOpsText.todayTasks.dueToday;
  if (diffDays === 1) return adminOpsText.todayTasks.dueTomorrow;
  return adminOpsText.todayTasks.dueAfter.replace("{days}", String(diffDays));
}

function getStatusKey(status: string | null): AdminDashboardTaskStatusKey {
  if (status === "review_requested") return "reviewRequested";
  if (status === "inspection") return "inspection";
  if (status === "review_completed") return "reviewCompleted";
  if (status === "rejected") return "rejected";
  return "draft";
}

function getStatusLabel(status: string | null): string {
  return adminOpsText.todayTasks.status[getStatusKey(status)];
}

function getPriorityKey(status: string | null): AdminDashboardTaskPriorityKey {
  if (status === "review_requested") return "review";
  if (status === "inspection") return "inspection";
  return "order";
}

function getPriorityLabel(status: string | null): string {
  return adminOpsText.todayTasks.priority[getPriorityKey(status)];
}

function emptySnapshot(period: AdminDashboardPeriod, sourceState: AdminOperationalDashboardSnapshot["sourceState"]): AdminOperationalDashboardSnapshot {
  return {
    period,
    statusFlow: ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({ id: bucket.labelKey, label: adminStatsText.flowBuckets[bucket.labelKey], value: 0 })),
    statusDistribution: ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS.map((bucket) => ({ id: bucket.labelKey, label: adminOpsText.statusDistribution[bucket.labelKey], value: 0 })),
    insights: [
      { id: "reviewWaiting", label: adminOpsText.insights.reviewWaiting, value: "0", description: adminOpsText.insights.reviewWaitingDescription },
      { id: "orderWaiting", label: adminOpsText.insights.orderWaiting, value: "0", description: adminOpsText.insights.orderWaitingDescription },
      { id: "inspectionWaiting", label: adminOpsText.insights.inspectionWaiting, value: "0", description: adminOpsText.insights.inspectionWaitingDescription },
      { id: "inboundDelayed", label: adminOpsText.insights.inboundDelayed, value: "0", description: adminOpsText.insights.inboundDelayedDescription },
    ],
    todayTasks: [],
    queueTasks: createEmptyQueueTasks(),
    sourceState,
  };
}

type WorkorderRow = DbQueryResultRow & {
  id: string;
  title: string;
  status: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

type OrderDueRow = DbQueryResultRow & {
  spec_sheet_id: string | null;
  due_date: string | Date | null;
  factory_name: string | null;
  quantity: number | string | null;
};

type AttachmentSummaryRow = DbQueryResultRow & {
  order_id: string | null;
  attachment_count: number | string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  thumbnail_key: string | null;
  storage_key: string | null;
};


function createAttachmentPreviewUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleanValue = String(value).trim();
  if (!cleanValue) return null;
  if (cleanValue.startsWith("/") || cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
    return cleanValue;
  }
  return createAttachmentFileProxyUrl(cleanValue);
}

function parseQuantityCount(value: unknown): number | null {
  const quantity = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return quantity;
}

function formatQuantityLabel(value: unknown): string {
  const quantity = parseQuantityCount(value);
  if (quantity === null) return adminOpsText.todayTasks.quantityPending;
  return adminOpsText.todayTasks.quantityValue.replace("{count}", String(quantity));
}

function formatUpdatedLabel(value: unknown, now: Date): string {
  const date = parseDate(value);
  if (!date) return adminOpsText.todayTasks.updatedPending;
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return adminOpsText.todayTasks.updatedMinutes.replace("{minutes}", String(Math.max(1, diffMinutes)));
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return adminOpsText.todayTasks.updatedHours.replace("{hours}", String(diffHours));
  const diffDays = Math.floor(diffHours / 24);
  return adminOpsText.todayTasks.updatedDays.replace("{days}", String(diffDays));
}

function isInboundDelayed(row: OrderDueRow, workorderStatusById: Map<string, string>, selectedPeriodStart: Date, now: Date): boolean {
  if (!row.spec_sheet_id) return false;
  const status = workorderStatusById.get(row.spec_sheet_id);
  if (status !== "inspection") return false;
  const dueDate = parseDueDateAtStartOfDay(row.due_date, now);
  if (!dueDate) return false;
  const delayedAt = new Date(dueDate.getTime() + ONE_DAY_MS);
  return delayedAt <= now && dueDate >= selectedPeriodStart;
}

function sortTasksByUpdatedAt(tasks: Array<AdminDashboardTodayTask & { updatedAt: number }>): AdminDashboardTodayTask[] {
  return tasks
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8)
    .map(({ updatedAt, ...task }) => task);
}

function buildSnapshot(period: AdminDashboardPeriod, workorders: WorkorderRow[], orders: OrderDueRow[], attachments: AttachmentSummaryRow[], now = new Date()): AdminOperationalDashboardSnapshot {
  const workorderStatusById = new Map(workorders.map((row) => [row.id, row.status ?? ""]));
  const orderDueByWorkorderId = new Map(orders.map((row) => [row.spec_sheet_id ?? "", row.due_date]));
  const orderFactoryByWorkorderId = new Map(orders.map((row) => [row.spec_sheet_id ?? "", row.factory_name]));
  const orderQuantityByWorkorderId = new Map(orders.map((row) => [row.spec_sheet_id ?? "", row.quantity]));
  const attachmentByWorkorderId = new Map(attachments.map((row) => [row.order_id ?? "", row]));
  const selectedPeriodStart = getPeriodStart(period, now);

  const delayedWorkorderIds = new Set(
    orders
      .filter((row) => isInboundDelayed(row, workorderStatusById, selectedPeriodStart, now))
      .map((row) => row.spec_sheet_id)
      .filter((id): id is string => Boolean(id)),
  );

  const reviewWaitingCount = workorders.filter((row) => row.status === "review_requested").length;
  const orderWaitingCount = workorders.filter((row) => row.status === "review_completed").length;
  const inspectionWaitingCount = workorders.filter((row) => row.status === "inspection").length;
  const inboundDelayedCount = delayedWorkorderIds.size;

  const buildTask = (row: WorkorderRow): AdminDashboardTodayTask & { updatedAt: number } => {
    const attachment = attachmentByWorkorderId.get(row.id);
    return {
      id: row.id,
      title: row.title,
      statusLabel: getStatusLabel(row.status),
      statusKey: getStatusKey(row.status),
      dueLabel: formatDueLabel(orderDueByWorkorderId.get(row.id), now),
      priorityLabel: getPriorityLabel(row.status),
      priorityKey: getPriorityKey(row.status),
      factoryName: orderFactoryByWorkorderId.get(row.id) || adminOpsText.todayTasks.factoryPending,
      quantityLabel: formatQuantityLabel(orderQuantityByWorkorderId.get(row.id)),
      quantityCount: parseQuantityCount(orderQuantityByWorkorderId.get(row.id)),
      attachmentCount: Number(attachment?.attachment_count ?? 0),
      thumbnailUrl: createAttachmentPreviewUrl(attachment?.thumbnail_url)
        ?? createAttachmentPreviewUrl(attachment?.preview_url)
        ?? createAttachmentPreviewUrl(attachment?.thumbnail_key)
        ?? createAttachmentPreviewUrl(attachment?.storage_key),
      updatedLabel: formatUpdatedLabel(row.updated_at, now),
      actionHref: `/worker?workOrderId=${encodeURIComponent(row.id)}`,
      updatedAt: parseDate(row.updated_at)?.getTime() ?? 0,
    };
  };

  const queueSourceTasks: Record<AdminDashboardQueueId, Array<AdminDashboardTodayTask & { updatedAt: number }>> = {
    reviewWaiting: [],
    orderWaiting: [],
    inspectionWaiting: [],
    inboundDelayed: [],
  };

  for (const row of workorders) {
    if (row.status === "review_requested") queueSourceTasks.reviewWaiting.push(buildTask(row));
    if (row.status === "review_completed") queueSourceTasks.orderWaiting.push(buildTask(row));
    if (row.status === "inspection") {
      const task = buildTask(row);
      queueSourceTasks.inspectionWaiting.push(task);
      if (delayedWorkorderIds.has(row.id)) queueSourceTasks.inboundDelayed.push(task);
    }
  }

  const queueTasks = ADMIN_DASHBOARD_QUEUE_IDS.reduce<Record<AdminDashboardQueueId, AdminDashboardTodayTask[]>>((acc, queueId) => {
    acc[queueId] = sortTasksByUpdatedAt(queueSourceTasks[queueId]);
    return acc;
  }, createEmptyQueueTasks());

  const todayTasks = queueTasks.reviewWaiting;

  return {
    period,
    statusFlow: ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({
      id: bucket.labelKey,
      label: adminStatsText.flowBuckets[bucket.labelKey],
      value: countByStatuses(workorders, bucket.statuses, period, now),
    })),
    statusDistribution: ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS.map((bucket) => ({
      id: bucket.labelKey,
      label: adminOpsText.statusDistribution[bucket.labelKey],
      value: countByStatuses(workorders, bucket.statuses, period, now),
    })),
    insights: [
      { id: "reviewWaiting", label: adminOpsText.insights.reviewWaiting, value: String(reviewWaitingCount), description: adminOpsText.insights.reviewWaitingDescription },
      { id: "orderWaiting", label: adminOpsText.insights.orderWaiting, value: String(orderWaitingCount), description: adminOpsText.insights.orderWaitingDescription },
      { id: "inspectionWaiting", label: adminOpsText.insights.inspectionWaiting, value: String(inspectionWaitingCount), description: adminOpsText.insights.inspectionWaitingDescription },
      { id: "inboundDelayed", label: adminOpsText.insights.inboundDelayed, value: String(inboundDelayedCount), description: adminOpsText.insights.inboundDelayedDescription },
    ],
    todayTasks,
    queueTasks,
    sourceState: "db",
  };
}

export async function getAdminOperationalDashboardSnapshots(): Promise<AdminOperationalDashboardSnapshots> {
  if (!isDatabaseConfigured()) {
    return {
      today: emptySnapshot("today", "not_configured"),
      week: emptySnapshot("week", "not_configured"),
      month: emptySnapshot("month", "not_configured"),
    };
  }

  try {
    const companyId = getAdminCompanyId();
    const [workordersResult, ordersResult, attachmentsResult] = await Promise.all([
      queryDb<WorkorderRow>(
        `SELECT id, title, status, created_at, updated_at
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
      queryDb<OrderDueRow>(
        `SELECT spec_sheet_id, due_date, factory_name, quantity
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
      queryDb<AttachmentSummaryRow>(
        `SELECT order_id,
                COUNT(*) AS attachment_count,
                (ARRAY_AGG(NULLIF(thumbnail_url, '') ORDER BY is_primary DESC, (type = 'design') DESC, created_at ASC)
                  FILTER (WHERE thumbnail_url IS NOT NULL AND thumbnail_url <> ''))[1] AS thumbnail_url,
                (ARRAY_AGG(NULLIF(preview_url, '') ORDER BY is_primary DESC, (type = 'design') DESC, created_at ASC)
                  FILTER (WHERE preview_url IS NOT NULL AND preview_url <> ''))[1] AS preview_url,
                (ARRAY_AGG(NULLIF(thumbnail_key, '') ORDER BY is_primary DESC, (type = 'design') DESC, created_at ASC)
                  FILTER (WHERE thumbnail_key IS NOT NULL AND thumbnail_key <> ''))[1] AS thumbnail_key,
                (ARRAY_AGG(NULLIF(storage_key, '') ORDER BY is_primary DESC, (type = 'design') DESC, created_at ASC)
                  FILTER (WHERE storage_key IS NOT NULL AND storage_key <> ''))[1] AS storage_key
           FROM attachments
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true
          GROUP BY order_id`,
        [companyId],
      ),
    ]);

    return {
      today: buildSnapshot("today", workordersResult.rows, ordersResult.rows, attachmentsResult.rows),
      week: buildSnapshot("week", workordersResult.rows, ordersResult.rows, attachmentsResult.rows),
      month: buildSnapshot("month", workordersResult.rows, ordersResult.rows, attachmentsResult.rows),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin-dashboard] failed to load operational dashboard", error);
    }
    return {
      today: emptySnapshot("today", "error"),
      week: emptySnapshot("week", "error"),
      month: emptySnapshot("month", "error"),
    };
  }
}
