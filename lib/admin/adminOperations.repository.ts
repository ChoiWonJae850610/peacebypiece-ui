import "server-only";

import { getAdminCompanyId } from "@/lib/admin/settings/companyScope";
import { ADMIN_WORKORDER_FLOW_BUCKETS } from "@/lib/constants/adminStats";
import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";

import {
  ADMIN_DASHBOARD_PERIOD_OPTIONS,
  type AdminDashboardPeriod,
  type AdminOperationalDashboardSnapshot,
  type AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";

export { ADMIN_DASHBOARD_PERIOD_OPTIONS };

const ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS = [
  { label: "작업중", statuses: ["draft", "rejected"] },
  { label: "검토대기", statuses: ["review_requested"] },
  { label: "입고대기", statuses: ["inspection", "review_completed"] },
  { label: "완료", statuses: ["completed"] },
] as const;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

function emptySnapshot(period: AdminDashboardPeriod, sourceState: AdminOperationalDashboardSnapshot["sourceState"]): AdminOperationalDashboardSnapshot {
  return {
    period,
    statusFlow: ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({ label: bucket.label, value: 0 })),
    statusDistribution: ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS.map((bucket) => ({ label: bucket.label, value: 0 })),
    insights: [
      { label: "오늘 생성", value: "0", description: "선택 기간에 새로 등록된 작업지시서" },
      { label: "검토 지연", value: "0", description: "검토요청 후 24시간이 지난 작업지시서" },
      { label: "입고 지연", value: "0", description: "납기일 0시 기준 24시간이 지난 입고대기 작업지시서" },
    ],
    sourceState,
  };
}

type WorkorderRow = DbQueryResultRow & {
  id: string;
  status: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

type OrderDueRow = DbQueryResultRow & {
  spec_sheet_id: string | null;
  due_date: string | Date | null;
};

function buildSnapshot(period: AdminDashboardPeriod, workorders: WorkorderRow[], orders: OrderDueRow[], now = new Date()): AdminOperationalDashboardSnapshot {
  const workorderStatusById = new Map(workorders.map((row) => [row.id, row.status ?? ""]));
  const todayStart = startOfToday(now);
  const reviewDelayCutoff = new Date(now.getTime() - ONE_DAY_MS);
  const selectedPeriodStart = getPeriodStart(period, now);

  const reviewDelayedCount = workorders.filter((row) => {
    const updatedAt = parseDate(row.updated_at);
    return row.status === "review_requested" && Boolean(updatedAt) && updatedAt! <= reviewDelayCutoff && updatedAt! >= selectedPeriodStart;
  }).length;

  const inboundDelayedCount = orders.filter((row) => {
    if (!row.spec_sheet_id) return false;
    const status = workorderStatusById.get(row.spec_sheet_id);
    if (status !== "inspection") return false;
    const dueDate = parseDueDateAtStartOfDay(row.due_date, now);
    if (!dueDate) return false;
    const delayedAt = new Date(dueDate.getTime() + ONE_DAY_MS);
    return delayedAt <= now && dueDate >= selectedPeriodStart;
  }).length;

  const createdCount = workorders.filter((row) => {
    const createdAt = parseDate(row.created_at);
    return Boolean(createdAt) && createdAt! >= (period === "today" ? todayStart : selectedPeriodStart) && createdAt! <= now;
  }).length;

  return {
    period,
    statusFlow: ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({
      label: bucket.label,
      value: countByStatuses(workorders, bucket.statuses, period, now),
    })),
    statusDistribution: ADMIN_DASHBOARD_STATUS_DISTRIBUTION_BUCKETS.map((bucket) => ({
      label: bucket.label,
      value: countByStatuses(workorders, bucket.statuses, period, now),
    })),
    insights: [
      { label: period === "today" ? "오늘 생성" : "기간 내 생성", value: String(createdCount), description: "선택 기간에 새로 등록된 작업지시서" },
      { label: "검토 지연", value: String(reviewDelayedCount), description: "검토요청 후 24시간이 지난 작업지시서" },
      { label: "입고 지연", value: String(inboundDelayedCount), description: "납기일 0시 기준 24시간이 지난 입고대기 작업지시서" },
    ],
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
    const [workordersResult, ordersResult] = await Promise.all([
      queryDb<WorkorderRow>(
        `SELECT id, status, created_at, updated_at
           FROM spec_sheets
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
      queryDb<OrderDueRow>(
        `SELECT spec_sheet_id, due_date
           FROM orders
          WHERE company_id = $1
            AND deleted_at IS NULL
            AND COALESCE(is_active, true) = true`,
        [companyId],
      ),
    ]);

    return {
      today: buildSnapshot("today", workordersResult.rows, ordersResult.rows),
      week: buildSnapshot("week", workordersResult.rows, ordersResult.rows),
      month: buildSnapshot("month", workordersResult.rows, ordersResult.rows),
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
