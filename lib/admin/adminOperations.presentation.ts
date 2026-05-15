import type {
  AdminDashboardQueueId,
  AdminDashboardTaskDueKey,
  AdminDashboardTodayTask,
  AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";

export const ADMIN_DASHBOARD_DEFAULT_QUEUE_ID: AdminDashboardQueueId = "reviewWaiting";

export const ADMIN_DASHBOARD_QUEUE_ORDER: readonly AdminDashboardQueueId[] = [
  "reviewWaiting",
  "orderWaiting",
  "inspectionWaiting",
  "inboundDelayed",
] as const;

type AdminDashboardTranslator = (key: string, fallback: string) => string;

export function formatAdminDashboardCount(count: number, t: AdminDashboardTranslator): string {
  const unit = t("operationsDashboard.countSuffix", "건");
  return unit === "건" ? `${count}${unit}` : `${count} ${unit}`;
}

export function formatAdminDashboardQuantity(task: AdminDashboardTodayTask, t: AdminDashboardTranslator): string {
  if (typeof task.quantityCount !== "number") {
    return t("operationsDashboard.todayTasks.quantityPending", task.quantityLabel);
  }

  return t("operationsDashboard.todayTasks.quantityValue", task.quantityLabel).replace("{count}", String(task.quantityCount));
}

export function formatAdminDashboardDue(task: AdminDashboardTodayTask, t: AdminDashboardTranslator): string {
  const dueKey: AdminDashboardTaskDueKey = task.dueKey;

  if (dueKey === "pending") return t("operationsDashboard.todayTasks.duePending", task.dueLabel);
  if (dueKey === "overdue") return t("operationsDashboard.todayTasks.overdue", task.dueLabel);
  if (dueKey === "today") return t("operationsDashboard.todayTasks.dueToday", task.dueLabel);
  if (dueKey === "tomorrow") return t("operationsDashboard.todayTasks.dueTomorrow", task.dueLabel);

  return t("operationsDashboard.todayTasks.dueAfter", task.dueLabel).replace("{days}", String(task.dueDays ?? 0));
}

export function selectAdminDashboardQueueTasks(
  snapshot: AdminOperationalDashboardSnapshots["today"],
  selectedQueueId: AdminDashboardQueueId,
): AdminDashboardTodayTask[] {
  return snapshot.queueTasks?.[selectedQueueId] ?? snapshot.todayTasks;
}
