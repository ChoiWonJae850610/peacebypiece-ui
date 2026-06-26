"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  WaflStorageUsageMeter,
  getWaflButtonClassName,
} from "@/components/common/ui";
import {
  WaflSurface,
  WaflSurfaceButton,
} from "@/components/common/ui/WaflSurface";
import {
  ADMIN_DASHBOARD_DEFAULT_QUEUE_ID,
  ADMIN_DASHBOARD_QUEUE_ORDER,
  formatAdminDashboardCount,
  formatAdminDashboardDue,
  formatAdminDashboardQuantity,
  selectAdminDashboardQueueTasks,
} from "@/lib/admin/adminOperations.presentation";
import type {
  AdminDashboardQueueId,
  AdminDashboardTodayTask,
  AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";
import type { AdminDashboardPlanStorageSummary } from "@/lib/admin/dashboard/adminPlanStorageSummary.types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type Props = {
  snapshots: AdminOperationalDashboardSnapshots;
  planStorageSummary?: AdminDashboardPlanStorageSummary | null;
};

function queueTitle(
  queueId: AdminDashboardQueueId,
  fallback: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  return t(`operationsDashboard.queues.${queueId}.title`, fallback);
}

function taskTone(task: AdminDashboardTodayTask): "danger" | "warning" | "neutral" {
  if (task.dueKey === "overdue") return "danger";
  if (task.dueKey === "today" || task.priorityKey === "review") return "warning";
  return "neutral";
}

function storageBadgeTone(
  tone: AdminDashboardPlanStorageSummary["storageStatusTone"],
): "success" | "warning" | "danger" {
  if (tone === "danger") return "danger";
  if (tone === "caution") return "warning";
  return "success";
}

export default function AdminOperationsDashboard({
  snapshots,
  planStorageSummary,
}: Props) {
  const t = useAdminTranslation();
  const snapshot = snapshots.today;
  const [selectedQueueId, setSelectedQueueId] = useState<AdminDashboardQueueId>(
    ADMIN_DASHBOARD_DEFAULT_QUEUE_ID,
  );
  const insights = useMemo(
    () => new Map(snapshot.insights.map((item) => [item.id, item])),
    [snapshot.insights],
  );
  const selectedTasks = useMemo(
    () => selectAdminDashboardQueueTasks(snapshot, selectedQueueId),
    [snapshot, selectedQueueId],
  );
  const selectedInsight = insights.get(selectedQueueId);

  if (snapshot.sourceState === "error") {
    return (
      <AdminEmptyState
        tone="danger"
        title={t(
          "operationsDashboard.errorTitle",
          "업무 현황을 불러오지 못했습니다.",
        )}
        description={t(
          "operationsDashboard.errorDescription",
          "잠시 후 다시 시도하거나 데이터 연결 상태를 확인해 주세요.",
        )}
      />
    );
  }

  return (
    <WaflSurface
      as="section"
      component="admin-operations-dashboard"
      className="overflow-hidden"
    >
      {planStorageSummary ? (
        <div className="border-b border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.34fr)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase pbp-text-subtle">
                  {t("operationsDashboard.planStorage.eyebrow", "Plan and storage")}
                </p>
                <AdminStatusBadge tone="neutral" size="xs">
                  {planStorageSummary.sourceLabel}
                </AdminStatusBadge>
                <AdminStatusBadge
                  tone={storageBadgeTone(planStorageSummary.storageStatusTone)}
                  size="xs"
                >
                  {planStorageSummary.storageStatusLabel}
                </AdminStatusBadge>
              </div>
              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold pbp-text-primary">
                    {planStorageSummary.planLabel}
                    <span className="ml-2 text-sm font-medium pbp-text-muted">
                      {planStorageSummary.statusLabel}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm pbp-text-muted">
                    {t(
                      "operationsDashboard.planStorage.description",
                      "실제 DB 기준 저장공간 사용량과 구성원 한도를 함께 확인합니다.",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={getWaflButtonClassName({
                      size: "sm",
                      variant: "secondary",
                    })}
                    href={planStorageSummary.storageHref}
                  >
                    {t("operationsDashboard.planStorage.storageLink", "파일 보기")}
                  </Link>
                  <Link
                    className={getWaflButtonClassName({
                      size: "sm",
                      variant: "secondary",
                    })}
                    href={planStorageSummary.subscriptionHref}
                  >
                    {t("operationsDashboard.planStorage.subscriptionLink", "구독 관리")}
                  </Link>
                </div>
              </div>

              <WaflStorageUsageMeter
                compact
                className="mt-4"
                percent={planStorageSummary.storageUsagePercent}
                usedLabel={planStorageSummary.storageUsedLabel}
                limitLabel={planStorageSummary.storageLimitLabel}
                statusLabel={planStorageSummary.storageStatusLabel}
                tone={planStorageSummary.storageStatusTone}
                details={[
                  {
                    label: t("operationsDashboard.planStorage.activeFiles", "사용 중 파일"),
                    value: planStorageSummary.activeStorageLabel,
                  },
                  {
                    label: t("operationsDashboard.planStorage.trashFiles", "휴지통"),
                    value: planStorageSummary.trashStorageLabel,
                    description: planStorageSummary.includeTrashInUsage
                      ? t("operationsDashboard.planStorage.included", "포함")
                      : t("operationsDashboard.planStorage.excluded", "제외"),
                  },
                  {
                    label: t("operationsDashboard.planStorage.members", "구성원"),
                    value: planStorageSummary.memberUsageLabel,
                    description: planStorageSummary.memberStatusLabel,
                    tone:
                      planStorageSummary.memberStatusTone === "caution"
                        ? "caution"
                        : "normal",
                  },
                ]}
              />
            </div>

            <div className="grid content-start gap-2 sm:grid-cols-3 xl:grid-cols-1">
              <WaflSurface component="admin-plan-policy-card" tone="surface" className="px-3 py-2.5">
                <p className="text-xs font-semibold pbp-text-subtle">
                  {t("operationsDashboard.planStorage.policySource", "정책 기준")}
                </p>
                <p className="mt-1 text-sm font-semibold pbp-text-primary">
                  {planStorageSummary.policySourceLabel}
                </p>
              </WaflSurface>
              <WaflSurface component="admin-plan-member-card" tone="surface" className="px-3 py-2.5 sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold pbp-text-subtle">
                    {t("operationsDashboard.planStorage.memberStatus", "구성원 상태")}
                  </p>
                  <AdminStatusBadge
                    tone={
                      planStorageSummary.memberStatusTone === "caution"
                        ? "warning"
                        : "success"
                    }
                    size="xs"
                  >
                    {planStorageSummary.memberStatusLabel}
                  </AdminStatusBadge>
                </div>
                <p className="mt-1 text-sm font-semibold pbp-text-primary">
                  {planStorageSummary.memberUsageLabel}
                </p>
              </WaflSurface>
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-b border-[var(--pbp-border)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
              {t("operationsDashboard.todayEyebrow", "Today")}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight pbp-text-primary">
              {t("operationsDashboard.todayTitle", "처리가 필요한 항목")}
            </h2>
            <p className="mt-1 text-sm pbp-text-muted">
              {t(
                "operationsDashboard.todayDescription",
                "작업지시서 검토와 발주 흐름을 한 화면에서 확인합니다.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={getWaflButtonClassName({ size: "sm", variant: "secondary" })}
              href="/workspace/workorders"
            >
              {t("operationsDashboard.actions.workorders", "작업지시서")}
            </Link>
            <Link
              className={getWaflButtonClassName({ size: "sm", variant: "secondary" })}
              href="/workspace/material-orders"
            >
              {t("operationsDashboard.actions.materialOrders", "원단/부자재 발주")}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_DASHBOARD_QUEUE_ORDER.map((queueId) => {
            const item = insights.get(queueId);
            if (!item) return null;
            const active = queueId === selectedQueueId;
            return (
              <WaflSurfaceButton
                key={queueId}
                component="admin-dashboard-queue-card"
                selected={active}
                type="button"
                onClick={() => setSelectedQueueId(queueId)}
                aria-pressed={active}
                className="min-h-0 p-3 text-left sm:p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold pbp-text-primary">
                    {item.label}
                  </span>
                  <strong className="text-2xl tracking-tight pbp-text-primary">
                    {item.value}
                  </strong>
                </div>
                <p className="mt-1 line-clamp-1 text-xs pbp-text-muted">
                  {item.description}
                </p>
              </WaflSurfaceButton>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold pbp-text-primary">
              {queueTitle(selectedQueueId, selectedInsight?.label ?? "대기 목록", t)}
            </h3>
            <p className="mt-0.5 text-xs pbp-text-muted">
              {formatAdminDashboardCount(selectedTasks.length, t)}
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-[var(--pbp-brand-primary)]"
            href="/workspace/workorders"
          >
            {t("operationsDashboard.actions.viewAll", "전체 보기")}
          </Link>
        </div>

        {selectedTasks.length === 0 ? (
          <AdminEmptyState
            className="mt-3"
            title={t("operationsDashboard.emptyTitle", "현재 처리할 항목이 없습니다.")}
            description={t(
              "operationsDashboard.emptyDescription",
              "새 작업이나 검토 요청이 생기면 이 영역에 표시됩니다.",
            )}
          />
        ) : (
          <div className="mt-3 divide-y divide-[var(--pbp-border)] overflow-hidden rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]">
            {selectedTasks.slice(0, 8).map((task) => (
              <Link
                key={task.id}
                href={task.actionHref}
                className="grid gap-2 px-3 py-3 transition hover:bg-[var(--pbp-surface-soft)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold pbp-text-primary">
                      {task.title}
                    </span>
                    {task.dueKey === "overdue" || task.dueKey === "today" ? (
                      <AdminStatusBadge tone={taskTone(task)}>
                        {formatAdminDashboardDue(task, t)}
                      </AdminStatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs pbp-text-muted">
                    <span>{task.statusLabel}</span>
                    <span>{task.factoryName}</span>
                    <span>{formatAdminDashboardQuantity(task, t)}</span>
                    {task.dueKey !== "overdue" && task.dueKey !== "today" ? (
                      <span>{formatAdminDashboardDue(task, t)}</span>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--pbp-brand-primary)]">
                  {t("operationsDashboard.actions.open", "열기")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </WaflSurface>
  );
}
