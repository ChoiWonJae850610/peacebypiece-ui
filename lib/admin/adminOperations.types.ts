export type AdminDashboardPeriod = "today" | "week" | "month";

export type AdminDashboardPeriodOption = {
  value: AdminDashboardPeriod;
  label: string;
};

export type AdminDashboardPoint = {
  id: string;
  label: string;
  value: number;
};

export type AdminDashboardQueueId =
  | "reviewWaiting"
  | "orderWaiting"
  | "inspectionWaiting"
  | "inboundDelayed";

export type AdminDashboardTaskStatusKey =
  | "reviewRequested"
  | "inspection"
  | "reviewCompleted"
  | "rejected"
  | "draft";

export type AdminDashboardTaskPriorityKey = "review" | "inspection" | "order";

export type AdminDashboardTaskDueKey =
  | "pending"
  | "overdue"
  | "today"
  | "tomorrow"
  | "after";

export type AdminDashboardInsight = {
  id: AdminDashboardQueueId;
  label: string;
  value: string;
  description: string;
};

export type AdminDashboardTodayTask = {
  id: string;
  title: string;
  statusLabel: string;
  statusKey: AdminDashboardTaskStatusKey;
  dueLabel: string;
  dueKey: AdminDashboardTaskDueKey;
  dueDays: number | null;
  priorityLabel: string;
  priorityKey: AdminDashboardTaskPriorityKey;
  factoryName: string;
  quantityLabel: string;
  quantityCount: number | null;
  attachmentCount: number;
  thumbnailUrl: string | null;
  previewUrls: string[];
  updatedLabel: string;
  actionHref: string;
};

export type AdminOperationalDashboardSnapshot = {
  period: AdminDashboardPeriod;
  statusFlow: AdminDashboardPoint[];
  statusDistribution: AdminDashboardPoint[];
  insights: AdminDashboardInsight[];
  todayTasks: AdminDashboardTodayTask[];
  queueTasks: Record<AdminDashboardQueueId, AdminDashboardTodayTask[]>;
  sourceState: "db" | "not_configured" | "error";
};

export type AdminOperationalDashboardSnapshots = Record<
  AdminDashboardPeriod,
  AdminOperationalDashboardSnapshot
>;

export const ADMIN_DASHBOARD_PERIOD_OPTIONS: AdminDashboardPeriodOption[] = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번주" },
  { value: "month", label: "이번달" },
];
